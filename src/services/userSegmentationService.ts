import { logger } from '../utils/logger';
import { DetailedUserProfile, advancedUserProfileService } from './advancedUserProfileService';

export interface SegmentCriteria {
  personality?: {
    adventurous?: { min?: number; max?: number };
    luxury?: { min?: number; max?: number };
    romantic?: { min?: number; max?: number };
    cultural?: { min?: number; max?: number };
    active?: { min?: number; max?: number };
    budget_conscious?: { min?: number; max?: number };
  };
  demographics?: {
    ageRange?: { min?: number; max?: number };
    relationshipStatus?: string[];
    locations?: string[];
    income?: string[];
  };
  behavior?: {
    engagementScore?: { min?: number; max?: number };
    messagesCount?: { min?: number; max?: number };
    conversionProbability?: { min?: number; max?: number };
    sessionCount?: { min?: number; max?: number };
  };
  travel?: {
    budgetRange?: { min?: number; max?: number };
    destinations?: string[];
    travelFrequency?: string[];
    accommodationTypes?: string[];
  };
}

export interface UserSegmentDefinition {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  color: string;
  icon: string;
  marketingTags: string[];
  recommendationStrategy: 'conservative' | 'balanced' | 'aggressive';
  priority: 'low' | 'medium' | 'high' | 'vip';
  automatedActions: {
    emailCampaigns?: string[];
    specialOffers?: string[];
    personalizedContent?: string[];
  };
}

class UserSegmentationService {
  private predefinedSegments: UserSegmentDefinition[] = [
    {
      id: 'luxury_seekers',
      name: 'Lüks Arayanlar',
      description: 'Yüksek bütçeli, lüks deneyim arayan çiftler',
      criteria: {
        personality: {
          luxury: { min: 7 }
        },
        travel: {
          budgetRange: { min: 75000 }
        },
        behavior: {
          conversionProbability: { min: 0.6 }
        }
      },
      color: 'purple',
      icon: '👑',
      marketingTags: ['premium', 'exclusive', 'vip', 'luxury'],
      recommendationStrategy: 'aggressive',
      priority: 'vip',
      automatedActions: {
        emailCampaigns: ['luxury_packages', 'vip_services'],
        specialOffers: ['premium_upgrades', 'exclusive_deals'],
        personalizedContent: ['luxury_destinations', 'premium_experiences']
      }
    },
    {
      id: 'budget_conscious',
      name: 'Bütçe Odaklı',
      description: 'Uygun fiyatlı seçenekler arayan çiftler',
      criteria: {
        personality: {
          budget_conscious: { min: 7 }
        },
        travel: {
          budgetRange: { max: 35000 }
        }
      },
      color: 'green',
      icon: '💰',
      marketingTags: ['affordable', 'value', 'budget-friendly', 'deals'],
      recommendationStrategy: 'conservative',
      priority: 'medium',
      automatedActions: {
        emailCampaigns: ['budget_packages', 'seasonal_deals'],
        specialOffers: ['early_bird_discounts', 'group_deals'],
        personalizedContent: ['budget_tips', 'value_destinations']
      }
    },
    {
      id: 'adventure_lovers',
      name: 'Macera Severler',
      description: 'Aktif ve macera dolu tatil arayan çiftler',
      criteria: {
        personality: {
          adventurous: { min: 7 },
          active: { min: 6 }
        }
      },
      color: 'orange',
      icon: '🏔️',
      marketingTags: ['adventure', 'active', 'outdoor', 'thrilling'],
      recommendationStrategy: 'balanced',
      priority: 'high',
      automatedActions: {
        emailCampaigns: ['adventure_packages', 'outdoor_activities'],
        specialOffers: ['activity_bundles', 'equipment_rentals'],
        personalizedContent: ['adventure_guides', 'extreme_sports']
      }
    },
    {
      id: 'romantic_couples',
      name: 'Romantik Çiftler',
      description: 'Romantik deneyimler arayan çiftler',
      criteria: {
        personality: {
          romantic: { min: 8 }
        },
        demographics: {
          relationshipStatus: ['engaged', 'married']
        }
      },
      color: 'pink',
      icon: '💕',
      marketingTags: ['romantic', 'intimate', 'couple', 'special'],
      recommendationStrategy: 'balanced',
      priority: 'high',
      automatedActions: {
        emailCampaigns: ['romantic_packages', 'couple_activities'],
        specialOffers: ['romantic_dinners', 'spa_couples'],
        personalizedContent: ['romantic_destinations', 'couple_tips']
      }
    },
    {
      id: 'cultural_explorers',
      name: 'Kültür Kaşifleri',
      description: 'Kültürel deneyimler arayan çiftler',
      criteria: {
        personality: {
          cultural: { min: 7 }
        }
      },
      color: 'blue',
      icon: '🏛️',
      marketingTags: ['cultural', 'historical', 'educational', 'heritage'],
      recommendationStrategy: 'balanced',
      priority: 'medium',
      automatedActions: {
        emailCampaigns: ['cultural_packages', 'heritage_tours'],
        specialOffers: ['museum_passes', 'guided_tours'],
        personalizedContent: ['cultural_insights', 'historical_sites']
      }
    },
    {
      id: 'high_engagement',
      name: 'Yüksek Katılım',
      description: 'Platform ile aktif etkileşimde bulunan kullanıcılar',
      criteria: {
        behavior: {
          engagementScore: { min: 80 },
          messagesCount: { min: 20 },
          sessionCount: { min: 5 }
        }
      },
      color: 'indigo',
      icon: '⚡',
      marketingTags: ['engaged', 'active', 'loyal', 'power-user'],
      recommendationStrategy: 'aggressive',
      priority: 'vip',
      automatedActions: {
        emailCampaigns: ['exclusive_previews', 'beta_features'],
        specialOffers: ['loyalty_rewards', 'referral_bonuses'],
        personalizedContent: ['advanced_tips', 'insider_secrets']
      }
    },
    {
      id: 'potential_churners',
      name: 'Risk Altında',
      description: 'Düşük katılım gösteren, kaybedilme riski olan kullanıcılar',
      criteria: {
        behavior: {
          engagementScore: { max: 30 }
        }
      },
      color: 'red',
      icon: '⚠️',
      marketingTags: ['at-risk', 'retention', 'win-back', 'reactivation'],
      recommendationStrategy: 'conservative',
      priority: 'high',
      automatedActions: {
        emailCampaigns: ['win_back', 'special_attention'],
        specialOffers: ['comeback_deals', 'personal_assistance'],
        personalizedContent: ['simplified_content', 'quick_wins']
      }
    },
    {
      id: 'new_users',
      name: 'Yeni Kullanıcılar',
      description: 'Son 30 gün içinde katılan yeni kullanıcılar',
      criteria: {
        behavior: {
          sessionCount: { max: 2 }
        }
      },
      color: 'cyan',
      icon: '🌟',
      marketingTags: ['new', 'onboarding', 'welcome', 'first-time'],
      recommendationStrategy: 'conservative',
      priority: 'medium',
      automatedActions: {
        emailCampaigns: ['welcome_series', 'onboarding_tips'],
        specialOffers: ['new_user_discount', 'free_consultation'],
        personalizedContent: ['getting_started', 'platform_tour']
      }
    }
  ];

  async segmentUser(user: DetailedUserProfile): Promise<string[]> {
    const userSegments: string[] = [];

    for (const segment of this.predefinedSegments) {
      if (this.matchesCriteria(user, segment.criteria)) {
        userSegments.push(segment.id);
      }
    }

    return userSegments.length > 0 ? userSegments : ['general'];
  }

  private matchesCriteria(user: DetailedUserProfile, criteria: SegmentCriteria): boolean {
    // Check personality criteria
    if (criteria.personality) {
      for (const [trait, range] of Object.entries(criteria.personality)) {
        const userValue = user.personality[trait as keyof DetailedUserProfile['personality']];
        if (range.min !== undefined && userValue < range.min) return false;
        if (range.max !== undefined && userValue > range.max) return false;
      }
    }

    // Check demographics criteria
    if (criteria.demographics) {
      if (criteria.demographics.ageRange && user.demographics.age) {
        const { min, max } = criteria.demographics.ageRange;
        if (min !== undefined && user.demographics.age < min) return false;
        if (max !== undefined && user.demographics.age > max) return false;
      }

      if (criteria.demographics.relationshipStatus && 
          !criteria.demographics.relationshipStatus.includes(user.demographics.relationshipStatus)) {
        return false;
      }

      if (criteria.demographics.locations) {
        const userLocation = user.demographics.location;
        const locationMatch = criteria.demographics.locations.some(loc => 
          userLocation.country.toLowerCase().includes(loc.toLowerCase()) ||
          userLocation.city.toLowerCase().includes(loc.toLowerCase())
        );
        if (!locationMatch) return false;
      }

      if (criteria.demographics.income && user.demographics.income &&
          !criteria.demographics.income.includes(user.demographics.income)) {
        return false;
      }
    }

    // Check behavior criteria
    if (criteria.behavior) {
      if (criteria.behavior.engagementScore) {
        const { min, max } = criteria.behavior.engagementScore;
        const score = user.analytics.engagementScore;
        if (min !== undefined && score < min) return false;
        if (max !== undefined && score > max) return false;
      }

      if (criteria.behavior.messagesCount) {
        const { min, max } = criteria.behavior.messagesCount;
        const count = user.behaviorData.interactionHistory.messages_sent;
        if (min !== undefined && count < min) return false;
        if (max !== undefined && count > max) return false;
      }

      if (criteria.behavior.conversionProbability) {
        const { min, max } = criteria.behavior.conversionProbability;
        const prob = user.analytics.conversionProbability;
        if (min !== undefined && prob < min) return false;
        if (max !== undefined && prob > max) return false;
      }

      if (criteria.behavior.sessionCount) {
        const { min, max } = criteria.behavior.sessionCount;
        const count = user.behaviorData.interactionHistory.sessions_count;
        if (min !== undefined && count < min) return false;
        if (max !== undefined && count > max) return false;
      }
    }

    // Check travel criteria
    if (criteria.travel) {
      if (criteria.travel.budgetRange) {
        const { min, max } = criteria.travel.budgetRange;
        const userBudget = user.travelPreferences.budgetRange;
        if (min !== undefined && userBudget.max < min) return false;
        if (max !== undefined && userBudget.min > max) return false;
      }

      if (criteria.travel.destinations) {
        const userDestinations = [
          ...user.travelPreferences.preferredDestinations.domestic,
          ...user.travelPreferences.preferredDestinations.international
        ];
        const destinationMatch = criteria.travel.destinations.some(dest =>
          userDestinations.some(userDest => 
            userDest.toLowerCase().includes(dest.toLowerCase())
          )
        );
        if (!destinationMatch) return false;
      }

      if (criteria.travel.travelFrequency &&
          !criteria.travel.travelFrequency.includes(user.travelPreferences.travelFrequency)) {
        return false;
      }

      if (criteria.travel.accommodationTypes) {
        const accommodationMatch = criteria.travel.accommodationTypes.some(type =>
          user.travelPreferences.accommodationType.some(userType =>
            userType.toLowerCase().includes(type.toLowerCase())
          )
        );
        if (!accommodationMatch) return false;
      }
    }

    return true;
  }

  async segmentAllUsers(): Promise<{ [segmentId: string]: DetailedUserProfile[] }> {
    try {
      const { users } = await advancedUserProfileService.getBatchUsers(undefined, 1000);
      const segmentedUsers: { [segmentId: string]: DetailedUserProfile[] } = {};

      // Initialize segments
      this.predefinedSegments.forEach(segment => {
        segmentedUsers[segment.id] = [];
      });
      segmentedUsers['general'] = [];

      for (const user of users) {
        const userSegments = await this.segmentUser(user);
        
        // Update user's analytics with primary segment
        const primarySegment = userSegments[0];
        if (user.analytics.userSegment !== primarySegment) {
          await advancedUserProfileService.updateProfileField(
            user.userId, 
            'analytics.userSegment', 
            primarySegment
          );
        }

        // Add user to all matching segments
        userSegments.forEach(segmentId => {
          if (segmentedUsers[segmentId]) {
            segmentedUsers[segmentId].push(user);
          }
        });
      }

      logger.info('User segmentation completed', { 
        totalUsers: users.length,
        segmentCounts: Object.fromEntries(
          Object.entries(segmentedUsers).map(([id, users]) => [id, users.length])
        )
      });

      return segmentedUsers;

    } catch (error) {
      logger.error('Error in user segmentation', { error });
      throw error;
    }
  }

  getSegmentDefinition(segmentId: string): UserSegmentDefinition | null {
    return this.predefinedSegments.find(segment => segment.id === segmentId) || null;
  }

  getAllSegmentDefinitions(): UserSegmentDefinition[] {
    return this.predefinedSegments;
  }

  async getSegmentInsights(segmentId: string): Promise<{
    userCount: number;
    averageEngagement: number;
    averageBudget: number;
    topDestinations: { name: string; count: number }[];
    conversionRate: number;
    retentionRate: number;
    personalityProfile: { [trait: string]: number };
  }> {
    const segmentedUsers = await this.segmentAllUsers();
    const users = segmentedUsers[segmentId] || [];

    if (users.length === 0) {
      return {
        userCount: 0,
        averageEngagement: 0,
        averageBudget: 0,
        topDestinations: [],
        conversionRate: 0,
        retentionRate: 0,
        personalityProfile: {}
      };
    }

    // Calculate insights
    const averageEngagement = users.reduce((sum, u) => sum + u.analytics.engagementScore, 0) / users.length;
    const averageBudget = users.reduce((sum, u) => sum + (u.travelPreferences.budgetRange.min + u.travelPreferences.budgetRange.max) / 2, 0) / users.length;

    // Top destinations
    const destinationCounts: { [dest: string]: number } = {};
    users.forEach(user => {
      [...user.travelPreferences.preferredDestinations.domestic,
       ...user.travelPreferences.preferredDestinations.international].forEach(dest => {
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
      });
    });

    const topDestinations = Object.entries(destinationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Conversion and retention rates
    const usersWithBookings = users.filter(u => u.behaviorData.packageInteractions.packages_booked.length > 0);
    const usersWithMultipleSessions = users.filter(u => u.behaviorData.interactionHistory.sessions_count > 1);
    
    const conversionRate = usersWithBookings.length / users.length;
    const retentionRate = usersWithMultipleSessions.length / users.length;

    // Personality profile
    const personalityTraits = Object.keys(users[0]?.personality || {}) as (keyof DetailedUserProfile['personality'])[];
    const personalityProfile: { [trait: string]: number } = {};
    
    personalityTraits.forEach(trait => {
      personalityProfile[trait] = users.reduce((sum, u) => sum + u.personality[trait], 0) / users.length;
    });

    return {
      userCount: users.length,
      averageEngagement,
      averageBudget,
      topDestinations,
      conversionRate,
      retentionRate,
      personalityProfile
    };
  }

  async recommendActionsForSegment(segmentId: string): Promise<{
    emailCampaigns: string[];
    contentRecommendations: string[];
    pricingStrategy: string;
    marketingMessages: string[];
  }> {
    const segment = this.getSegmentDefinition(segmentId);
    if (!segment) {
      return {
        emailCampaigns: [],
        contentRecommendations: [],
        pricingStrategy: 'standard',
        marketingMessages: []
      };
    }

    const insights = await this.getSegmentInsights(segmentId);

    // Generate recommendations based on segment characteristics
    const recommendations = {
      emailCampaigns: segment.automatedActions.emailCampaigns || [],
      contentRecommendations: segment.automatedActions.personalizedContent || [],
      pricingStrategy: this.getPricingStrategy(segment, insights),
      marketingMessages: this.getMarketingMessages(segment, insights)
    };

    return recommendations;
  }

  private getPricingStrategy(segment: UserSegmentDefinition, insights: any): string {
    if (segment.id === 'luxury_seekers') return 'premium_pricing';
    if (segment.id === 'budget_conscious') return 'value_pricing';
    if (insights.conversionRate > 0.7) return 'premium_pricing';
    if (insights.conversionRate < 0.3) return 'discount_pricing';
    return 'standard_pricing';
  }

  private getMarketingMessages(segment: UserSegmentDefinition, insights: any): string[] {
    const messages: string[] = [];

    if (segment.id === 'luxury_seekers') {
      messages.push('Exclusive luxury experiences await you');
      messages.push('VIP treatment for your special moments');
    } else if (segment.id === 'budget_conscious') {
      messages.push('Amazing value for unforgettable memories');
      messages.push('Best deals for budget-conscious couples');
    } else if (segment.id === 'adventure_lovers') {
      messages.push('Thrilling adventures for couples');
      messages.push('Create epic memories together');
    } else if (segment.id === 'romantic_couples') {
      messages.push('Romance redefined');
      messages.push('Intimate moments, perfect for two');
    }

    // Add engagement-based messages
    if (insights.averageEngagement > 80) {
      messages.push('Your loyalty deserves special treatment');
    } else if (insights.averageEngagement < 30) {
      messages.push('We miss you! Come back for special offers');
    }

    return messages;
  }
}

export const userSegmentationService = new UserSegmentationService();