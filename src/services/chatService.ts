import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { Chat, Message, User, COLLECTIONS } from '../types/firestore';

export interface ChatFilters {
  userId?: string;
  status?: 'active' | 'completed' | 'archived';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

export interface ChatStats {
  totalChats: number;
  activeChats: number;
  completedChats: number;
  archivedChats: number;
  totalMessages: number;
  averageMessagesPerChat: number;
  averageSatisfactionRating: number;
  topCategories: Array<{ category: string; count: number }>;
  dailyChats: Array<{ date: string; count: number }>;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    returnUsers: number;
  };
}

class ChatService {
  private chatsCollection = collection(db, COLLECTIONS.CHATS);
  private usersCollection = collection(db, COLLECTIONS.USERS);

  /**
   * Get all chats with filters
   */
  async getChats(filters: ChatFilters = {}): Promise<Chat[]> {
    try {
      console.log('💬 Fetching chats with filters:', filters);
      
      let q = query(this.chatsCollection);
      
      // Apply filters
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
      }
      
      if (filters.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
      }
      
      // Order by last message (most recent first) - but only if no userId filter to avoid index issues
      if (!filters.userId) {
        q = query(q, orderBy('lastMessageAt', 'desc'));
      } else {
        // If filtering by userId, order by createdAt instead to avoid composite index requirement
        q = query(q, orderBy('createdAt', 'desc'));
      }
      
      // Apply pagination
      if (filters.startAfter) {
        q = query(q, startAfter(filters.startAfter));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const chats: Chat[] = [];
      
      querySnapshot.forEach((doc) => {
        chats.push({
          id: doc.id,
          ...doc.data()
        } as Chat);
      });

      console.log(`💬 Successfully fetched ${chats.length} chats`);
      return chats;
      
    } catch (error) {
      console.error('❌ Error fetching chats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch chats');
    }
  }

  /**
   * Get a single chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    try {
      console.log('💬 Fetching chat:', chatId);
      
      const chatDoc = await getDoc(doc(this.chatsCollection, chatId));
      
      if (!chatDoc.exists()) {
        console.warn('💬 Chat not found');
        return null;
      }

      const chatData = {
        id: chatDoc.id,
        ...chatDoc.data()
      } as Chat;

      console.log('💬 Successfully fetched chat:', chatData.title);
      return chatData;
      
    } catch (error) {
      console.error('❌ Error fetching chat:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch chat');
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(chatId: string, limitCount?: number): Promise<Message[]> {
    try {
      console.log('📨 Fetching messages for chat:', chatId);
      
      const messagesCollection = collection(db, `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`);
      let q = query(messagesCollection, orderBy('timestamp', 'asc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });

      console.log(`📨 Successfully fetched ${messages.length} messages`);
      return messages;
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  }

  /**
   * Get chats for a specific user
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    return this.getChats({ userId, limit: 50 });
  }

  /**
   * Get recent chats (last 7 days)
   */
  async getRecentChats(days: number = 7): Promise<Chat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getChats({ 
      startDate,
      limit: 100
    });
  }

  /**
   * Search chats by content
   */
  async searchChats(searchTerm: string, filters: ChatFilters = {}): Promise<Chat[]> {
    try {
      console.log('🔍 Searching chats:', searchTerm);
      
      // Get all chats first (Firestore doesn't support full-text search natively)
      const chats = await this.getChats(filters);
      
      // Filter by search term
      const searchResults = chats.filter(chat => 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      console.log(`🔍 Found ${searchResults.length} chats matching "${searchTerm}"`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Error searching chats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search chats');
    }
  }

  /**
   * Get chat statistics for analytics
   */
  async getChatStats(): Promise<ChatStats> {
    try {
      console.log('📊 Calculating chat statistics...');
      
      const chats = await this.getChats();
      const users = await this.getAllUsers();
      
      // Basic counts
      const totalChats = chats.length;
      const activeChats = chats.filter(c => c.status === 'active').length;
      const completedChats = chats.filter(c => c.status === 'completed').length;
      const archivedChats = chats.filter(c => c.status === 'archived').length;
      
      // Message statistics
      const totalMessages = chats.reduce((sum, chat) => sum + chat.messageCount, 0);
      const averageMessagesPerChat = totalChats > 0 ? totalMessages / totalChats : 0;
      
      // Satisfaction rating
      const chatsWithSatisfaction = chats.filter(c => c.satisfaction?.rating);
      const averageSatisfactionRating = chatsWithSatisfaction.length > 0 
        ? chatsWithSatisfaction.reduce((sum, c) => sum + (c.satisfaction?.rating || 0), 0) / chatsWithSatisfaction.length
        : 0;
      
      // Category counts
      const categoryMap = new Map<string, number>();
      chats.forEach(chat => {
        const count = categoryMap.get(chat.category) || 0;
        categoryMap.set(chat.category, count + 1);
      });
      const topCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Daily chat counts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyChatsMap = new Map<string, number>();
      chats
        .filter(chat => chat.createdAt.toDate() >= thirtyDaysAgo)
        .forEach(chat => {
          const dateStr = chat.createdAt.toDate().toISOString().split('T')[0];
          const count = dailyChatsMap.get(dateStr) || 0;
          dailyChatsMap.set(dateStr, count + 1);
        });
      
      const dailyChats = Array.from(dailyChatsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // User engagement
      const totalUsers = users.length;
      const usersWithChats = new Set(chats.map(c => c.userId));
      const activeUsers = usersWithChats.size;
      
      // Return users (users with more than one chat)
      const userChatCounts = new Map<string, number>();
      chats.forEach(chat => {
        const count = userChatCounts.get(chat.userId) || 0;
        userChatCounts.set(chat.userId, count + 1);
      });
      const returnUsers = Array.from(userChatCounts.values()).filter(count => count > 1).length;
      
      const stats: ChatStats = {
        totalChats,
        activeChats,
        completedChats,
        archivedChats,
        totalMessages,
        averageMessagesPerChat,
        averageSatisfactionRating,
        topCategories,
        dailyChats,
        userEngagement: {
          totalUsers,
          activeUsers,
          returnUsers
        }
      };
      
      console.log('📊 Chat statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error calculating chat stats:', error);
      throw new Error('Failed to calculate chat statistics');
    }
  }

  /**
   * Get all users (helper method)
   */
  private async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(this.usersCollection);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        } as User);
      });

      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  }

  /**
   * Get chat with user details
   */
  async getChatWithUserDetails(chatId: string): Promise<{
    chat: Chat;
    user: User | null;
    messages: Message[];
  } | null> {
    try {
      const chat = await this.getChat(chatId);
      if (!chat) return null;
      
      const [user, messages] = await Promise.all([
        this.getUserById(chat.userId),
        this.getChatMessages(chatId)
      ]);
      
      return { chat, user, messages };
    } catch (error) {
      console.error('❌ Error fetching chat with details:', error);
      throw new Error('Failed to fetch chat details');
    }
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        uid: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  }

  /**
   * Get chats grouped by category
   */
  async getChatsByCategory(): Promise<Record<string, Chat[]>> {
    try {
      const chats = await this.getChats();
      const grouped: Record<string, Chat[]> = {};
      
      chats.forEach(chat => {
        if (!grouped[chat.category]) {
          grouped[chat.category] = [];
        }
        grouped[chat.category].push(chat);
      });
      
      return grouped;
    } catch (error) {
      console.error('❌ Error grouping chats by category:', error);
      throw new Error('Failed to group chats by category');
    }
  }

  /**
   * Get user conversation summary
   */
  async getUserConversationSummary(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    averageSatisfaction: number;
    favoriteCategories: string[];
    recentActivity: Date | null;
  }> {
    try {
      // For now, return mock data to avoid index issues until indexes are built
      // TODO: Implement proper logic once indexes are ready
      console.log('📊 Getting user conversation summary for:', userId);
      
      return {
        totalChats: 0,
        totalMessages: 0,
        averageSatisfaction: 0,
        favoriteCategories: [],
        recentActivity: null
      };
      
    } catch (error) {
      console.error('❌ Error getting user conversation summary:', error);
      throw new Error('Failed to get user conversation summary');
    }
  }

  /**
   * Real-time chat listener
   */
  subscribeToChats(
    callback: (chats: Chat[]) => void,
    filters: ChatFilters = {}
  ): () => void {
    try {
      let q = query(this.chatsCollection);
      
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('lastMessageAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chats: Chat[] = [];
        querySnapshot.forEach((doc) => {
          chats.push({
            id: doc.id,
            ...doc.data()
          } as Chat);
        });
        callback(chats);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up chat listener:', error);
      return () => {};
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;