import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type PlanType = 'free' | 'pro' | 'pro_bride';

export interface UserSubscription {
  userId: string;
  planType: PlanType;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  messageQuota: number;
  messagesUsed: number;
  quotaResetTime?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanLimits {
  messagesPerPeriod: number;
  resetPeriodHours: number;
  hasUnlimitedMessages: boolean;
  hasAdvancedAI: boolean;
  hasPrioritySupport: boolean;
  hasWeddingPlanning: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    messagesPerPeriod: 20,
    resetPeriodHours: 6,
    hasUnlimitedMessages: false,
    hasAdvancedAI: false,
    hasPrioritySupport: false,
    hasWeddingPlanning: false,
  },
  pro: {
    messagesPerPeriod: -1, // unlimited
    resetPeriodHours: 0,
    hasUnlimitedMessages: true,
    hasAdvancedAI: true,
    hasPrioritySupport: true,
    hasWeddingPlanning: false,
  },
  pro_bride: {
    messagesPerPeriod: -1, // unlimited
    resetPeriodHours: 0,
    hasUnlimitedMessages: true,
    hasAdvancedAI: true,
    hasPrioritySupport: true,
    hasWeddingPlanning: true,
  },
};

class SubscriptionService {
  // In-memory fallback storage for when Firestore is inaccessible
  private memoryStorage: Map<string, UserSubscription> = new Map();
  
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
      
      if (!subscriptionDoc.exists()) {
        // Create default free subscription
        const defaultSubscription: UserSubscription = {
          userId,
          planType: 'free',
          isActive: true,
          startDate: new Date(),
          messageQuota: PLAN_LIMITS.free.messagesPerPeriod,
          messagesUsed: 0,
          quotaResetTime: this.getNextResetTime('free'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const now = new Date();
        const resetTime = this.getNextResetTime('free');
        
        try {
          await setDoc(doc(db, 'subscriptions', userId), {
            ...defaultSubscription,
            startDate: now,
            quotaResetTime: resetTime,
            createdAt: now,
            updatedAt: now,
          });
        } catch (firestoreError) {
          console.warn('⚠️ Could not save to Firestore, using memory-only subscription:', firestoreError);
          // Return memory-only subscription if Firestore fails
        }
        
        return defaultSubscription;
      }
      
      const data = subscriptionDoc.data();
      return {
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        quotaResetTime: data.quotaResetTime?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserSubscription;
    } catch (error) {
      console.warn('⚠️ Firestore access denied, using fallback subscription:', error);
      
      // Fallback: Return a memory-only free subscription
      return {
        userId,
        planType: 'free',
        isActive: true,
        startDate: new Date(),
        messageQuota: PLAN_LIMITS.free.messagesPerPeriod,
        messagesUsed: 0,
        quotaResetTime: this.getNextResetTime('free'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Check if user can send a message
   */
  async canSendMessage(userId: string): Promise<{ canSend: boolean; reason?: string; resetTime?: Date }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const limits = PLAN_LIMITS[subscription.planType];
      
      console.log('🔍 Checking message permission:', {
        planType: subscription.planType,
        messagesUsed: subscription.messagesUsed,
        messageQuota: subscription.messageQuota,
        hasUnlimitedMessages: limits.hasUnlimitedMessages,
        quotaResetTime: subscription.quotaResetTime
      });
      
      // Pro plans have unlimited messages
      if (limits.hasUnlimitedMessages) {
        return { canSend: true };
      }
      
      // Check if quota needs reset
      const now = new Date();
      if (subscription.quotaResetTime && now >= subscription.quotaResetTime) {
        console.log('⏰ Quota expired, resetting...');
        await this.resetMessageQuota(userId);
        return { canSend: true }; // After reset, user can send
      }
      
      // Check if under limit
      if (subscription.messagesUsed < subscription.messageQuota) {
        console.log('✅ Under limit, can send message');
        return { canSend: true };
      }
      
      console.log('❌ Reached message limit');
      return {
        canSend: false,
        reason: `You've reached your ${limits.messagesPerPeriod} message limit. Quota resets every ${limits.resetPeriodHours} hours.`,
        resetTime: subscription.quotaResetTime,
      };
    } catch (error) {
      console.error('❌ Error checking message permission:', error);
      // Allow sending on error to prevent blocking users
      return { canSend: true };
    }
  }

  /**
   * Record a message usage
   */
  async recordMessageUsage(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const limits = PLAN_LIMITS[subscription.planType];
      
      // Don't track usage for unlimited plans
      if (limits.hasUnlimitedMessages) {
        console.log('🔓 Unlimited plan, not tracking usage');
        return;
      }
      
      console.log('📝 Recording message usage:', {
        before: subscription.messagesUsed,
        after: subscription.messagesUsed + 1,
        quota: subscription.messageQuota
      });
      
      try {
        await updateDoc(doc(db, 'subscriptions', userId), {
          messagesUsed: subscription.messagesUsed + 1,
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreError) {
        console.warn('⚠️ Could not update Firestore, message usage not persisted:', firestoreError);
        // In memory-only mode, we can't persist usage, but we can still track in session
      }
    } catch (error) {
      console.error('Error recording message usage:', error);
    }
  }

  /**
   * Reset message quota
   */
  async resetMessageQuota(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const nextResetTime = this.getNextResetTime(subscription.planType);
      
      await updateDoc(doc(db, 'subscriptions', userId), {
        messagesUsed: 0,
        quotaResetTime: nextResetTime,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error resetting message quota:', error);
    }
  }

  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(userId: string, planType: PlanType, stripeData?: any): Promise<void> {
    try {
      const updates: any = {
        planType,
        isActive: true,
        messagesUsed: 0,
        updatedAt: serverTimestamp(),
      };
      
      const limits = PLAN_LIMITS[planType];
      if (!limits.hasUnlimitedMessages) {
        updates.messageQuota = limits.messagesPerPeriod;
        updates.quotaResetTime = this.getNextResetTime(planType);
      }
      
      if (stripeData) {
        updates.stripeCustomerId = stripeData.customerId;
        updates.stripeSubscriptionId = stripeData.subscriptionId;
        updates.endDate = stripeData.endDate;
      }
      
      await updateDoc(doc(db, 'subscriptions', userId), updates);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error('Failed to upgrade subscription');
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'subscriptions', userId), {
        planType: 'free',
        isActive: true,
        messageQuota: PLAN_LIMITS.free.messagesPerPeriod,
        messagesUsed: 0,
        quotaResetTime: this.getNextResetTime('free'),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        endDate: null,
        cancelAtPeriodEnd: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Get plan features for display
   */
  getPlanFeatures(planType: PlanType): PlanLimits {
    return PLAN_LIMITS[planType];
  }

  /**
   * Get next quota reset time
   */
  private getNextResetTime(planType: PlanType): Date {
    const limits = PLAN_LIMITS[planType];
    if (limits.hasUnlimitedMessages) {
      return new Date(); // No reset needed for unlimited plans
    }
    
    const now = new Date();
    const resetTime = new Date(now.getTime() + limits.resetPeriodHours * 60 * 60 * 1000);
    return resetTime;
  }

  /**
   * Format time remaining until reset
   */
  formatTimeUntilReset(resetTime: Date): string {
    const now = new Date();
    const timeDiff = resetTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Reset available now';
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }

  /**
   * Get user's remaining messages
   */
  async getRemainingMessages(userId: string): Promise<{ remaining: number; total: number; resetTime?: Date }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const limits = PLAN_LIMITS[subscription.planType];
      
      if (limits.hasUnlimitedMessages) {
        return { remaining: -1, total: -1 }; // Unlimited
      }
      
      // Check if quota needs reset
      const now = new Date();
      if (subscription.quotaResetTime && now >= subscription.quotaResetTime) {
        await this.resetMessageQuota(userId);
        return {
          remaining: subscription.messageQuota,
          total: subscription.messageQuota,
          resetTime: this.getNextResetTime(subscription.planType),
        };
      }
      
      return {
        remaining: Math.max(0, subscription.messageQuota - subscription.messagesUsed),
        total: subscription.messageQuota,
        resetTime: subscription.quotaResetTime,
      };
    } catch (error) {
      console.error('Error getting remaining messages:', error);
      return { remaining: 0, total: 0 };
    }
  }
}

export const subscriptionService = new SubscriptionService();