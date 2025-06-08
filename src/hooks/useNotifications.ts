import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  pushNotificationManager, 
  showCustomNotification, 
  getNotificationSubscription,
  type PushNotificationPayload 
} from '../utils/push-notifications';

interface UseNotificationsOptions {
  enabled?: boolean;
  autoRequestPermission?: boolean;
}

interface ChatNotificationData {
  chatId: string;
  chatTitle: string;
  messagePreview: string;
  responseLength?: number;
}

interface PackageNotificationData {
  packageId: string;
  packageTitle: string;
  packageLocation: string;
  packagePrice: number;
  packageCategory: string;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { user } = useAuth();
  const { enabled = true, autoRequestPermission = false } = options;

  // Auto-request permission if enabled
  useEffect(() => {
    if (enabled && autoRequestPermission && user) {
      const subscription = getNotificationSubscription();
      if (!subscription?.enabled && pushNotificationManager.isNotificationSupported()) {
        // Small delay to avoid interrupting user flow
        setTimeout(() => {
          pushNotificationManager.enableNotifications();
        }, 3000);
      }
    }
  }, [user, enabled, autoRequestPermission]);

  /**
   * Show chat response notification
   */
  const notifyNewChatResponse = useCallback((data: ChatNotificationData) => {
    if (!enabled) return;

    const subscription = getNotificationSubscription();
    if (!subscription?.enabled || !subscription.types.chat_responses) {
      return;
    }

    // Don't show notification if document is visible (user is actively using the app)
    if (!document.hidden) {
      return;
    }

    const payload: PushNotificationPayload = {
      title: '💬 AI LOVVE Response',
      body: data.messagePreview.length > 100 
        ? data.messagePreview.substring(0, 100) + '...'
        : data.messagePreview,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: {
        type: 'chat_response',
        chatId: data.chatId,
        chatTitle: data.chatTitle,
        responseLength: data.responseLength,
        timestamp: Date.now()
      },
      tag: `chat-response-${data.chatId}`,
      requireInteraction: false,
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/icon.svg'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon.svg'
        }
      ]
    };

    showCustomNotification(payload);
  }, [enabled]);

  /**
   * Show package recommendation notification
   */
  const notifyPackageRecommendation = useCallback((packages: PackageNotificationData[]) => {
    if (!enabled || packages.length === 0) return;

    const subscription = getNotificationSubscription();
    if (!subscription?.enabled || !subscription.types.package_recommendations) {
      return;
    }

    // Don't show notification if document is visible
    if (!document.hidden) {
      return;
    }

    const firstPackage = packages[0];
    const additionalCount = packages.length - 1;

    const payload: PushNotificationPayload = {
      title: '🎯 New Honeymoon Packages',
      body: additionalCount > 0 
        ? `${firstPackage.packageTitle} and ${additionalCount} more packages found for you!`
        : `Perfect match: ${firstPackage.packageTitle} in ${firstPackage.packageLocation}`,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      image: packages[0] ? undefined : '/og-image.svg', // Could add package image
      data: {
        type: 'package_recommendation',
        packageId: firstPackage.packageId,
        packageCount: packages.length,
        packages: packages.map(p => ({
          id: p.packageId,
          title: p.packageTitle,
          location: p.packageLocation,
          price: p.packagePrice
        })),
        timestamp: Date.now()
      },
      tag: 'package-recommendations',
      requireInteraction: true, // Important recommendations should require interaction
      actions: [
        {
          action: 'view_packages',
          title: 'View Packages',
          icon: '/icons/icon.svg'
        },
        {
          action: 'save_for_later',
          title: 'Save for Later',
          icon: '/icons/icon.svg'
        }
      ]
    };

    showCustomNotification(payload);
  }, [enabled]);

  /**
   * Show system update notification
   */
  const notifySystemUpdate = useCallback((title: string, message: string, updateType: 'feature' | 'maintenance' | 'security' = 'feature') => {
    if (!enabled) return;

    const subscription = getNotificationSubscription();
    if (!subscription?.enabled || !subscription.types.system_updates) {
      return;
    }

    const icons = {
      feature: '✨',
      maintenance: '🔧',
      security: '🛡️'
    };

    const payload: PushNotificationPayload = {
      title: `${icons[updateType]} ${title}`,
      body: message,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: {
        type: 'system_update',
        updateType,
        timestamp: Date.now()
      },
      tag: `system-update-${updateType}`,
      requireInteraction: updateType === 'security', // Security updates require attention
      actions: [
        {
          action: 'view_update',
          title: 'Learn More',
          icon: '/icons/icon.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    showCustomNotification(payload);
  }, [enabled]);

  /**
   * Show promotional notification
   */
  const notifyPromotion = useCallback((title: string, message: string, promoData?: any) => {
    if (!enabled) return;

    const subscription = getNotificationSubscription();
    if (!subscription?.enabled || !subscription.types.promotional) {
      return;
    }

    const payload: PushNotificationPayload = {
      title: `🎉 ${title}`,
      body: message,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: {
        type: 'promotional',
        promoData,
        timestamp: Date.now()
      },
      tag: 'promotional-offer',
      requireInteraction: false,
      actions: [
        {
          action: 'view_offer',
          title: 'View Offer',
          icon: '/icons/icon.svg'
        },
        {
          action: 'dismiss',
          title: 'Not Now'
        }
      ]
    };

    showCustomNotification(payload);
  }, [enabled]);

  /**
   * Show reminder notification
   */
  const notifyReminder = useCallback((title: string, message: string, reminderData?: any) => {
    if (!enabled) return;

    const subscription = getNotificationSubscription();
    if (!subscription?.enabled) {
      return;
    }

    const payload: PushNotificationPayload = {
      title: `⏰ ${title}`,
      body: message,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: {
        type: 'reminder',
        reminderData,
        timestamp: Date.now()
      },
      tag: 'reminder',
      requireInteraction: true,
      actions: [
        {
          action: 'snooze',
          title: 'Remind Later',
          icon: '/icons/icon.svg'
        },
        {
          action: 'complete',
          title: 'Mark Done'
        }
      ]
    };

    showCustomNotification(payload);
  }, [enabled]);

  /**
   * Check if notifications are enabled
   */
  const isNotificationEnabled = useCallback((type?: keyof typeof subscription.types) => {
    const subscription = getNotificationSubscription();
    if (!subscription?.enabled) return false;
    
    if (type) {
      return subscription.types[type];
    }
    
    return true;
  }, []);

  /**
   * Get notification status
   */
  const getNotificationStatus = useCallback(() => {
    const subscription = getNotificationSubscription();
    return {
      supported: pushNotificationManager.isNotificationSupported(),
      enabled: subscription?.enabled || false,
      types: subscription?.types || {
        chat_responses: false,
        package_recommendations: false,
        system_updates: false,
        promotional: false
      }
    };
  }, []);

  return {
    // Notification functions
    notifyNewChatResponse,
    notifyPackageRecommendation,
    notifySystemUpdate,
    notifyPromotion,
    notifyReminder,
    
    // Status functions
    isNotificationEnabled,
    getNotificationStatus,
    
    // Manager access
    pushNotificationManager
  };
};

export type { ChatNotificationData, PackageNotificationData };