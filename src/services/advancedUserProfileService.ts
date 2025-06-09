import { logger } from '../utils/logger';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Gelişmiş kullanıcı profil veri yapısı
export interface DetailedUserProfile {
  // Temel Bilgiler
  userId: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastUpdated: number;
  lastLoginAt: number;
  profileImageUrl?: string;
  
  // Demografik Bilgiler  
  demographics: {
    age?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location: {
      country: string;
      city: string;
      region?: string;
    };
    relationshipStatus: 'single' | 'dating' | 'engaged' | 'married' | 'other';
    relationshipDuration?: number; // months
    occupation?: string;
    income?: 'low' | 'medium' | 'high' | 'very_high';
    education?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'other';
    languages: string[];
  };

  // Kişilik Profili (0-10 skalası)
  personality: {
    adventurous: number;        // Macera seven
    luxury: number;             // Lüks seven
    cultural: number;           // Kültür meraklısı
    romantic: number;           // Romantik
    active: number;             // Aktif
    social: number;             // Sosyal
    budget_conscious: number;   // Bütçe bilincli
    spontaneous: number;        // Spontane
    family_oriented: number;    // Aile odaklı
    photography: number;        // Fotoğraf meraklısı
    food_lover: number;         // Yemek aşığı
    nature_lover: number;       // Doğa sever
  };

  // Seyahat Tercihleri
  travelPreferences: {
    preferredDestinations: {
      domestic: string[];
      international: string[];
      dream_destinations: string[];
    };
    budgetRange: {
      min: number;
      max: number;
      currency: string;
    };
    travelFrequency: 'rarely' | 'yearly' | 'bi_yearly' | 'quarterly' | 'monthly';
    tripDuration: {
      preferred_min: number;
      preferred_max: number;
      longest_taken: number;
    };
    accommodationType: string[];
    transportPreference: string[];
    seasonPreference: string[];
    groupSize: {
      preferred: number;
      max_comfortable: number;
    };
  };

  // İlgi Alanları ve Aktiviteler
  interests: {
    activities: string[];
    hobbies: string[];
    sports: string[];
    cuisine_types: string[];
    music_genres: string[];
    entertainment_types: string[];
    shopping_interests: string[];
    wellness_activities: string[];
  };

  // Özel Tercihler
  specialPreferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    accessibility_needs: string[];
    religious_considerations: string[];
    special_occasions: string[];
    celebration_preferences: string[];
  };

  // Davranışsal Veriler
  behaviorData: {
    searchHistory: {
      queries: string[];
      destinations_searched: string[];
      packages_viewed: string[];
      last_searches: { query: string; timestamp: number; }[];
    };
    interactionHistory: {
      messages_sent: number;
      sessions_count: number;
      average_session_duration: number;
      most_active_hours: number[];
      preferred_chat_length: 'short' | 'medium' | 'long';
    };
    packageInteractions: {
      packages_liked: string[];
      packages_saved: string[];
      packages_booked: string[];
      price_sensitivity: number; // 0-10
      booking_urgency: 'low' | 'medium' | 'high';
    };
    feedbackData: {
      satisfaction_scores: number[];
      feedback_given: number;
      improvement_suggestions: string[];
      feature_requests: string[];
    };
  };

  // Analitik ve Puanlar
  analytics: {
    profileCompleteness: number; // 0-100
    engagementScore: number; // 0-100
    conversionProbability: number; // 0-1
    lifetimeValue: number;
    userSegment: string;
    personalityType: string;
    riskScore: number; // 0-10 (churn risk)
    satisfactionLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  };

  // AI Öğrenme Verileri
  aiLearning: {
    responsePreferences: {
      tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
      detail_level: 'brief' | 'moderate' | 'detailed';
      language_style: 'simple' | 'technical' | 'creative';
    };
    recommendationHistory: {
      successful_recommendations: string[];
      rejected_recommendations: string[];
      recommendation_accuracy: number;
    };
    learningProgress: {
      topics_mastered: string[];
      confusion_points: string[];
      learning_speed: 'slow' | 'moderate' | 'fast';
    };
  };

  // Meta Data
  metadata: {
    dataSource: 'wizard' | 'chat' | 'import' | 'admin';
    profileVersion: string;
    lastAnalyzedAt: number;
    gdprConsent: boolean;
    marketingConsent: boolean;
    dataRetentionUntil: number;
    exportRequested: boolean;
    anonymized: boolean;
  };
}

// Kullanıcı segmentasyonu için tipler
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    personality?: Partial<Record<keyof DetailedUserProfile['personality'], { min?: number; max?: number }>>;
    demographics?: any;
    behavior?: any;
  };
  userCount: number;
  averageValue: number;
  marketingTags: string[];
}

export interface ProfileAnalytics {
  totalUsers: number;
  segments: UserSegment[];
  topDestinations: { name: string; count: number; percentage: number }[];
  budgetDistribution: { range: string; count: number; percentage: number }[];
  personalityInsights: { trait: string; average: number; distribution: number[] }[];
  engagementMetrics: {
    averageSessionDuration: number;
    averageMessagesPerSession: number;
    retentionRate: number;
    conversionRate: number;
  };
  trends: {
    newUsers: { date: string; count: number }[];
    popularFeatures: { feature: string; usage: number }[];
    satisfactionTrend: { date: string; score: number }[];
  };
}

class AdvancedUserProfileService {
  
  async saveDetailedProfile(profile: DetailedUserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'detailedUserProfiles', profile.userId);
      await setDoc(userRef, {
        ...profile,
        lastUpdated: Date.now(),
        metadata: {
          ...profile.metadata,
          profileVersion: '2.0',
          lastAnalyzedAt: Date.now()
        }
      }, { merge: true });
      
      logger.info('Detailed profile saved successfully', { userId: profile.userId });
    } catch (error) {
      logger.error('Error saving detailed profile', { userId: profile.userId, error });
      throw error;
    }
  }

  async getDetailedProfile(userId: string): Promise<DetailedUserProfile | null> {
    try {
      const userRef = doc(db, 'detailedUserProfiles', userId);
      const doc_snap = await getDoc(userRef);
      
      if (doc_snap.exists()) {
        return doc_snap.data() as DetailedUserProfile;
      }
      return null;
    } catch (error) {
      logger.error('Error getting detailed profile', { userId, error });
      return null;
    }
  }

  async updateProfileField(userId: string, field: string, value: any): Promise<void> {
    try {
      const userRef = doc(db, 'detailedUserProfiles', userId);
      await updateDoc(userRef, {
        [field]: value,
        lastUpdated: Date.now()
      });
      
      logger.info('Profile field updated', { userId, field });
    } catch (error) {
      logger.error('Error updating profile field', { userId, field, error });
      throw error;
    }
  }

  async getUsersBySegment(segment: string, limitCount: number = 50): Promise<DetailedUserProfile[]> {
    try {
      const usersRef = collection(db, 'detailedUserProfiles');
      const q = query(
        usersRef,
        where('analytics.userSegment', '==', segment),
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as DetailedUserProfile);
    } catch (error) {
      logger.error('Error getting users by segment', { segment, error });
      return [];
    }
  }

  async searchUsers(filters: {
    personality?: Partial<DetailedUserProfile['personality']>;
    demographics?: Partial<DetailedUserProfile['demographics']>;
    budgetRange?: { min?: number; max?: number };
    locations?: string[];
    segments?: string[];
  }): Promise<DetailedUserProfile[]> {
    try {
      const usersRef = collection(db, 'detailedUserProfiles');
      const q = query(usersRef, orderBy('lastUpdated', 'desc'), limit(100));

      // Firebase'de complex queries zor olduğu için client-side filtering yapacağız
      const querySnapshot = await getDocs(q);
      let users = querySnapshot.docs.map(doc => doc.data() as DetailedUserProfile);

      // Apply filters
      if (filters.personality) {
        users = users.filter(user => {
          return Object.entries(filters.personality!).every(([trait, value]) => {
            const userValue = user.personality[trait as keyof DetailedUserProfile['personality']];
            return userValue >= (value as number) - 1 && userValue <= (value as number) + 1;
          });
        });
      }

      if (filters.budgetRange) {
        users = users.filter(user => {
          const userBudget = user.travelPreferences.budgetRange;
          return (!filters.budgetRange!.min || userBudget.max >= filters.budgetRange!.min) &&
                 (!filters.budgetRange!.max || userBudget.min <= filters.budgetRange!.max);
        });
      }

      if (filters.locations) {
        users = users.filter(user => 
          filters.locations!.includes(user.demographics.location.country) ||
          filters.locations!.includes(user.demographics.location.city)
        );
      }

      if (filters.segments) {
        users = users.filter(user => 
          filters.segments!.includes(user.analytics.userSegment)
        );
      }

      return users;
    } catch (error) {
      logger.error('Error searching users', { filters, error });
      return [];
    }
  }

  async generateProfileAnalytics(): Promise<ProfileAnalytics> {
    try {
      const usersRef = collection(db, 'detailedUserProfiles');
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => doc.data() as DetailedUserProfile);

      // Calculate analytics
      const totalUsers = users.length;
      
      // If no users, return empty analytics
      if (totalUsers === 0) {
        return {
          totalUsers: 0,
          segments: [],
          topDestinations: [],
          budgetDistribution: [],
          personalityInsights: [],
          engagementMetrics: {
            averageSessionDuration: 0,
            averageMessagesPerSession: 0,
            retentionRate: 0,
            conversionRate: 0
          },
          trends: {
            newUsers: [],
            popularFeatures: [],
            satisfactionTrend: []
          }
        };
      }
      
      // Segment distribution
      const segmentCounts: Record<string, number> = {};
      users.forEach(user => {
        const segment = user.analytics?.userSegment || 'unknown';
        segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
      });

      const segments: UserSegment[] = Object.entries(segmentCounts).map(([name, count]) => {
        const segmentUsers = users.filter(u => (u.analytics?.userSegment || 'unknown') === name);
        const avgValue = segmentUsers.length > 0 
          ? segmentUsers.reduce((sum, u) => sum + (u.analytics?.lifetimeValue || 0), 0) / segmentUsers.length
          : 0;
        
        return {
          id: name,
          name,
          description: `${name} segment`,
          criteria: {},
          userCount: count,
          averageValue: avgValue,
          marketingTags: []
        };
      });

      // Top destinations - safely handle missing data
      const destinationCounts: Record<string, number> = {};
      users.forEach(user => {
        const domestic = user.travelPreferences?.preferredDestinations?.domestic || [];
        const international = user.travelPreferences?.preferredDestinations?.international || [];
        [...domestic, ...international].forEach(dest => {
          if (dest) {
            destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
          }
        });
      });

      const topDestinations = Object.entries(destinationCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Budget distribution - safely handle missing data
      const budgetRanges = [
        { range: '0-25K', min: 0, max: 25000 },
        { range: '25K-50K', min: 25000, max: 50000 },
        { range: '50K-100K', min: 50000, max: 100000 },
        { range: '100K+', min: 100000, max: Infinity }
      ];

      const budgetDistribution = budgetRanges.map(range => {
        const count = users.filter(user => {
          const budgetMin = user.travelPreferences?.budgetRange?.min || 0;
          const budgetMax = user.travelPreferences?.budgetRange?.max || 0;
          return budgetMin >= range.min && budgetMax <= range.max;
        }).length;
        
        return {
          range: range.range,
          count,
          percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
        };
      });

      // Personality insights - safely handle missing data
      const firstUser = users[0];
      const personalityTraits = firstUser?.personality ? Object.keys(firstUser.personality) as (keyof DetailedUserProfile['personality'])[] : [];
      
      const personalityInsights = personalityTraits.map(trait => {
        const values = users
          .map(user => user.personality?.[trait] || 0)
          .filter(val => val > 0); // Filter out missing values
        
        const average = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        
        // Distribution in bins
        const distribution = Array(10).fill(0);
        values.forEach(val => {
          const bin = Math.min(Math.floor(val), 9);
          distribution[bin]++;
        });

        return { trait, average, distribution };
      });

      // Engagement metrics - safely handle missing data
      const validSessionDurations = users
        .map(u => u.behaviorData?.interactionHistory?.average_session_duration || 0)
        .filter(d => d > 0);
      
      const validMessageCounts = users
        .map(u => u.behaviorData?.interactionHistory?.messages_sent || 0)
        .filter(c => c > 0);

      const usersWithMultipleSessions = users.filter(u => 
        (u.behaviorData?.interactionHistory?.sessions_count || 0) > 1
      ).length;

      const usersWithBookings = users.filter(u => 
        (u.behaviorData?.packageInteractions?.packages_booked?.length || 0) > 0
      ).length;

      const engagementMetrics = {
        averageSessionDuration: validSessionDurations.length > 0 
          ? validSessionDurations.reduce((sum, d) => sum + d, 0) / validSessionDurations.length 
          : 0,
        averageMessagesPerSession: validMessageCounts.length > 0 
          ? validMessageCounts.reduce((sum, c) => sum + c, 0) / validMessageCounts.length 
          : 0,
        retentionRate: totalUsers > 0 ? usersWithMultipleSessions / totalUsers : 0,
        conversionRate: totalUsers > 0 ? usersWithBookings / totalUsers : 0
      };

      // Trends (simplified for now)
      const trends = {
        newUsers: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(totalUsers / 7) // Distribute users across last 7 days
        })).reverse(),
        popularFeatures: [
          { 
            feature: 'Profile Analysis', 
            usage: users.filter(u => (u.analytics?.profileCompleteness || 0) > 70).length 
          },
          { 
            feature: 'Package Browser', 
            usage: users.filter(u => (u.behaviorData?.packageInteractions?.packages_liked?.length || 0) > 0).length 
          },
          { 
            feature: 'Chat Assistant', 
            usage: users.filter(u => (u.behaviorData?.interactionHistory?.messages_sent || 0) > 5).length 
          }
        ],
        satisfactionTrend: Array.from({ length: 6 }, (_, i) => ({
          date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          score: 4.0 + Math.random() * 1.0 // 4.0-5.0 range
        })).reverse()
      };

      return {
        totalUsers,
        segments,
        topDestinations,
        budgetDistribution,
        personalityInsights,
        engagementMetrics,
        trends
      };

    } catch (error) {
      logger.error('Error generating profile analytics', { error });
      
      // Return empty analytics on error instead of throwing
      return {
        totalUsers: 0,
        segments: [],
        topDestinations: [],
        budgetDistribution: [],
        personalityInsights: [],
        engagementMetrics: {
          averageSessionDuration: 0,
          averageMessagesPerSession: 0,
          retentionRate: 0,
          conversionRate: 0
        },
        trends: {
          newUsers: [],
          popularFeatures: [],
          satisfactionTrend: []
        }
      };
    }
  }

  async exportUserData(userId: string): Promise<DetailedUserProfile | null> {
    try {
      const profile = await this.getDetailedProfile(userId);
      if (profile) {
        // Mark as exported for GDPR compliance
        await this.updateProfileField(userId, 'metadata.exportRequested', true);
        logger.info('User data exported', { userId });
      }
      return profile;
    } catch (error) {
      logger.error('Error exporting user data', { userId, error });
      return null;
    }
  }

  async anonymizeUser(userId: string): Promise<void> {
    try {
      const profile = await this.getDetailedProfile(userId);
      if (profile) {
        // Anonymize sensitive data
        const anonymizedProfile = {
          ...profile,
          email: `anonymous_${Date.now()}@example.com`,
          displayName: 'Anonymous User',
          demographics: {
            ...profile.demographics,
            location: { country: 'Unknown', city: 'Unknown' }
          },
          metadata: {
            ...profile.metadata,
            anonymized: true,
            lastAnalyzedAt: Date.now()
          }
        };
        
        await this.saveDetailedProfile(anonymizedProfile);
        logger.info('User data anonymized', { userId });
      }
    } catch (error) {
      logger.error('Error anonymizing user data', { userId, error });
      throw error;
    }
  }

  // Batch operations for admin
  async getBatchUsers(lastDoc?: DocumentSnapshot, limitCount: number = 50): Promise<{
    users: DetailedUserProfile[];
    lastDoc: DocumentSnapshot | null;
  }> {
    try {
      const usersRef = collection(db, 'detailedUserProfiles');
      let q = query(usersRef, orderBy('lastUpdated', 'desc'), limit(limitCount));
      
      if (lastDoc) {
        q = query(usersRef, orderBy('lastUpdated', 'desc'), startAfter(lastDoc), limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => doc.data() as DetailedUserProfile);
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { users, lastDoc: newLastDoc };
    } catch (error) {
      logger.error('Error getting batch users', { error });
      return { users: [], lastDoc: null };
    }
  }
}

export const advancedUserProfileService = new AdvancedUserProfileService();