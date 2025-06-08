import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, COLLECTIONS } from '../types/firestore';
import { chatService } from './chatService';

export interface UserFilters {
  role?: 'user' | 'premium' | 'admin';
  status?: 'active' | 'suspended' | 'pending';
  isAdmin?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  averageSpentPerUser: number;
  topLocations: Array<{ location: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
}

class UserService {
  private usersCollection = collection(db, COLLECTIONS.USERS);

  /**
   * Get all users with filters
   */
  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    try {
      console.log('👥 Fetching users with filters:', filters);
      
      let q = query(this.usersCollection);
      
      // Apply filters
      if (filters.role) {
        q = query(q, where('role', '==', filters.role));
      }
      
      if (filters.isAdmin !== undefined) {
        q = query(q, where('isAdmin', '==', filters.isAdmin));
      }
      
      if (filters.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
      }
      
      if (filters.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
      }
      
      // Order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        } as User);
      });

      // Enrich with conversation data
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const conversationSummary = await chatService.getUserConversationSummary(user.uid);
          return {
            ...user,
            stats: {
              ...user.stats,
              totalChats: conversationSummary.totalChats,
              totalMessages: conversationSummary.totalMessages,
              averageSatisfaction: conversationSummary.averageSatisfaction,
              favoriteCategories: conversationSummary.favoriteCategories,
              lastActivity: conversationSummary.recentActivity
            }
          };
        })
      );

      console.log(`👥 Successfully fetched ${enrichedUsers.length} users`);
      return enrichedUsers;
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  /**
   * Get a single user by ID
   */
  async getUser(uid: string): Promise<User | null> {
    try {
      console.log('👤 Fetching user:', uid);
      
      const userDoc = await getDoc(doc(this.usersCollection, uid));
      
      if (!userDoc.exists()) {
        console.warn('👤 User not found');
        return null;
      }

      const userData = {
        uid: userDoc.id,
        ...userDoc.data()
      } as User;

      // Enrich with conversation data
      const conversationSummary = await chatService.getUserConversationSummary(uid);
      const enrichedUser = {
        ...userData,
        stats: {
          ...userData.stats,
          totalChats: conversationSummary.totalChats,
          totalMessages: conversationSummary.totalMessages,
          averageSatisfaction: conversationSummary.averageSatisfaction,
          favoriteCategories: conversationSummary.favoriteCategories,
          lastActivity: conversationSummary.recentActivity
        }
      };

      console.log('👤 Successfully fetched user:', enrichedUser.displayName);
      return enrichedUser;
      
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUser(uid: string, userData: Partial<User>): Promise<void> {
    try {
      console.log('📝 Creating/updating user:', uid);
      
      const userRef = doc(this.usersCollection, uid);
      const existingUser = await getDoc(userRef);
      
      if (existingUser.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
        console.log('✅ User updated successfully');
      } else {
        // Create new user
        const newUser: Omit<User, 'uid'> = {
          email: userData.email || '',
          displayName: userData.displayName || '',
          photoURL: userData.photoURL,
          role: userData.role || 'user',
          isAdmin: userData.isAdmin || false,
          permissions: userData.permissions || [],
          profileData: {
            preferences: {
              language: 'en',
              theme: 'auto',
              notifications: {
                email: true,
                push: true,
                sms: false
              }
            },
            ...userData.profileData
          },
          subscription: {
            type: 'free',
            features: [],
            ...userData.subscription
          },
          stats: {
            totalChats: 0,
            totalMessages: 0,
            totalBookings: 0,
            totalSpent: 0,
            favoriteCategories: [],
            ...userData.stats
          },
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          ...userData
        };
        
        await setDoc(userRef, newUser);
        console.log('✅ User created successfully');
      }
      
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create/update user');
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(uid: string, role: 'user' | 'premium' | 'admin', permissions: string[] = []): Promise<void> {
    try {
      console.log(`🔄 Updating user ${uid} role to:`, role);
      
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        role,
        isAdmin: role === 'admin',
        permissions: role === 'admin' ? [
          'packages:read', 'packages:write', 'packages:delete',
          'users:read', 'users:write', 'users:delete',
          'analytics:read', 'chats:read'
        ] : permissions,
        updatedAt: serverTimestamp()
      });

      console.log('✅ User role updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user role');
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(uid: string, status: 'active' | 'suspended' | 'pending'): Promise<void> {
    try {
      console.log(`🔄 Updating user ${uid} status to:`, status);
      
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp()
      });

      console.log('✅ User status updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      console.log('🗑️ Deleting user:', uid);
      
      const userRef = doc(this.usersCollection, uid);
      await deleteDoc(userRef);

      console.log('✅ User deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(updates: Array<{uid: string, data: Partial<User>}>): Promise<void> {
    try {
      console.log(`👥 Bulk updating ${updates.length} users...`);
      
      const batch = writeBatch(db);
      
      updates.forEach(({uid, data}) => {
        const userRef = doc(this.usersCollection, uid);
        batch.update(userRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log('✅ Bulk update completed');
      
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk update users');
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, filters: UserFilters = {}): Promise<User[]> {
    try {
      console.log('🔍 Searching users:', searchTerm);
      
      // Get all users first (Firestore doesn't support full-text search natively)
      const users = await this.getUsers(filters);
      
      // Filter by search term
      const searchResults = users.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.profileData?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.profileData?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      console.log(`🔍 Found ${searchResults.length} users matching "${searchTerm}"`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search users');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      console.log('📊 Calculating user statistics...');
      
      const users = await this.getUsers();
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.role !== 'suspended').length;
      const premiumUsers = users.filter(u => u.role === 'premium').length;
      const adminUsers = users.filter(u => u.role === 'admin').length;
      
      // New users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newUsersThisMonth = users.filter(u => 
        u.createdAt.toDate() >= thisMonth
      ).length;
      
      // Revenue calculations
      const totalRevenue = users.reduce((sum, user) => sum + (user.stats?.totalSpent || 0), 0);
      const averageSpentPerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
      
      // Top locations
      const locationMap = new Map<string, number>();
      users.forEach(user => {
        const location = user.profileData?.location;
        if (location) {
          const count = locationMap.get(location) || 0;
          locationMap.set(location, count + 1);
        }
      });
      const topLocations = Array.from(locationMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // User growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyUsersMap = new Map<string, number>();
      users
        .filter(user => user.createdAt.toDate() >= thirtyDaysAgo)
        .forEach(user => {
          const dateStr = user.createdAt.toDate().toISOString().split('T')[0];
          const count = dailyUsersMap.get(dateStr) || 0;
          dailyUsersMap.set(dateStr, count + 1);
        });
      
      const userGrowth = Array.from(dailyUsersMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const stats: UserStats = {
        totalUsers,
        activeUsers,
        premiumUsers,
        adminUsers,
        newUsersThisMonth,
        totalRevenue,
        averageSpentPerUser,
        topLocations,
        userGrowth
      };
      
      console.log('📊 User statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error calculating user stats:', error);
      throw new Error('Failed to calculate user statistics');
    }
  }

  /**
   * Get users with most activity
   */
  async getMostActiveUsers(limit: number = 10): Promise<User[]> {
    try {
      const users = await this.getUsers();
      
      return users
        .sort((a, b) => {
          const aActivity = (a.stats?.totalChats || 0) + (a.stats?.totalMessages || 0);
          const bActivity = (b.stats?.totalChats || 0) + (b.stats?.totalMessages || 0);
          return bActivity - aActivity;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting most active users:', error);
      return [];
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: 'user' | 'premium' | 'admin'): Promise<User[]> {
    return this.getUsers({ role });
  }

  /**
   * Get new users (last N days)
   */
  async getNewUsers(days: number = 7): Promise<User[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getUsers({ startDate });
  }

  /**
   * Update user subscription
   */
  async updateUserSubscription(
    uid: string, 
    subscription: {
      type: 'free' | 'premium';
      startDate?: Date;
      endDate?: Date;
      features: string[];
    }
  ): Promise<void> {
    try {
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        subscription: {
          ...subscription,
          startDate: subscription.startDate ? Timestamp.fromDate(subscription.startDate) : undefined,
          endDate: subscription.endDate ? Timestamp.fromDate(subscription.endDate) : undefined
        },
        role: subscription.type === 'premium' ? 'premium' : 'user',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User subscription updated');
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      throw new Error('Failed to update user subscription');
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;