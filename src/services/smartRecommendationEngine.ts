import { logger } from '../utils/logger';
import { intelligentCacheSystem } from './intelligentCacheSystem';

interface UserProfile {
  userId: string;
  preferences: {
    destinations: string[];
    budgetRange: { min: number; max: number };
    travelStyle: string[];
    accommodationType: string[];
    activities: string[];
    seasonPreference: string[];
    groupSize: number;
    duration: { min: number; max: number }; // days
  };
  behavior: {
    searchPatterns: string[];
    clickedPackages: string[];
    bookingHistory: string[];
    averageSessionDuration: number;
    responsePreference: 'quick' | 'detailed' | 'visual';
    priceInteractionRate: number;
  };
  analytics: {
    conversionScore: number; // 0-1
    engagementLevel: 'low' | 'medium' | 'high';
    satisfactionRate: number;
    lastActivity: number;
    totalInteractions: number;
  };
}

interface PackageScore {
  packageId: string;
  score: number;
  reasons: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  personalizedPrice?: number;
  recommendationContext: string;
}

interface SmartRecommendation {
  packages: PackageScore[];
  strategy: 'conservative' | 'balanced' | 'aggressive';
  timing: 'immediate' | 'delayed' | 'proactive';
  personalizationFactors: string[];
  analyticsData: {
    userSegment: string;
    conversionProbability: number;
    recommendationQuality: number;
  };
}

interface RecommendationAnalytics {
  totalRecommendations: number;
  conversionRate: number;
  clickThroughRate: number;
  avgRecommendationScore: number;
  topPerformingPackages: Array<{ packageId: string; successRate: number }>;
  userSegmentPerformance: Map<string, { count: number; conversionRate: number }>;
}

class SmartRecommendationEngine {
  private userProfiles = new Map<string, UserProfile>();
  private packageDatabase = new Map<string, any>(); // Package data
  private recommendationHistory = new Map<string, SmartRecommendation[]>();
  private analytics: RecommendationAnalytics = {
    totalRecommendations: 0,
    conversionRate: 0,
    clickThroughRate: 0,
    avgRecommendationScore: 0,
    topPerformingPackages: [],
    userSegmentPerformance: new Map()
  };

  constructor() {
    this.initializePackageDatabase();
  }

  // Paket veritabanını başlat
  private initializePackageDatabase(): void {
    const packages = [
      {
        id: 'romantic-bali',
        name: 'Romantic Bali Retreat',
        destination: 'bali',
        price: 3500,
        duration: 10,
        type: 'luxury',
        activities: ['spa', 'beach', 'cultural'],
        season: ['spring', 'summer'],
        groupSize: 2,
        features: ['private-villa', 'ocean-view', 'couples-massage']
      },
      {
        id: 'paris-luxury',
        name: 'Parisian Love Affair', 
        destination: 'paris',
        price: 4200,
        duration: 7,
        type: 'luxury',
        activities: ['cultural', 'romantic', 'culinary'],
        season: ['spring', 'fall'],
        groupSize: 2,
        features: ['luxury-hotel', 'eiffel-tower-view', 'champagne']
      },
      {
        id: 'santorini-sunset',
        name: 'Santorini Sunset Dream',
        destination: 'santorini',
        price: 4800,
        duration: 8,
        type: 'luxury',
        activities: ['romantic', 'beach', 'sunset'],
        season: ['spring', 'summer', 'fall'],
        groupSize: 2,
        features: ['infinity-pool', 'mediterranean-view', 'private-suite']
      },
      {
        id: 'antalya-beach',
        name: 'Antalya Beach Paradise',
        destination: 'antalya',
        price: 2800,
        duration: 7,
        type: 'beach',
        activities: ['beach', 'water-sports', 'relaxation'],
        season: ['spring', 'summer'],
        groupSize: 2,
        features: ['all-inclusive', 'beach-access', 'spa']
      },
      {
        id: 'cappadocia-adventure',
        name: 'Cappadocia Adventure',
        destination: 'kapadokya',
        price: 3200,
        duration: 5,
        type: 'adventure',
        activities: ['hot-air-balloon', 'cultural', 'adventure'],
        season: ['spring', 'fall'],
        groupSize: 2,
        features: ['balloon-ride', 'cave-hotel', 'hiking']
      }
    ];

    packages.forEach(pkg => {
      this.packageDatabase.set(pkg.id, pkg);
    });

    logger.log('📦 Package database initialized with', packages.length, 'packages');
  }

  // Kullanıcı profili güncelle
  updateUserProfile(userId: string, interactionData: {
    query?: string;
    clickedPackage?: string;
    booking?: string;
    sessionDuration?: number;
    feedback?: 'positive' | 'negative';
  }): void {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = this.createDefaultProfile(userId);
    }

    // Interaction data'ya göre profili güncelle
    if (interactionData.query) {
      this.updatePreferencesFromQuery(profile, interactionData.query);
    }

    if (interactionData.clickedPackage) {
      profile.behavior.clickedPackages.push(interactionData.clickedPackage);
      profile.behavior.clickedPackages = profile.behavior.clickedPackages.slice(-20); // Son 20'yi tut
    }

    if (interactionData.booking) {
      profile.behavior.bookingHistory.push(interactionData.booking);
      profile.analytics.conversionScore = Math.min(1, profile.analytics.conversionScore + 0.1);
    }

    if (interactionData.sessionDuration) {
      profile.behavior.averageSessionDuration = 
        (profile.behavior.averageSessionDuration + interactionData.sessionDuration) / 2;
    }

    if (interactionData.feedback === 'positive') {
      profile.analytics.satisfactionRate = Math.min(1, profile.analytics.satisfactionRate + 0.05);
    } else if (interactionData.feedback === 'negative') {
      profile.analytics.satisfactionRate = Math.max(0, profile.analytics.satisfactionRate - 0.05);
    }

    profile.analytics.totalInteractions++;
    profile.analytics.lastActivity = Date.now();

    // Engagement level güncelle
    this.updateEngagementLevel(profile);

    this.userProfiles.set(userId, profile);
    logger.log(`👤 User profile updated for ${userId}`);
  }

  // Varsayılan profil oluştur
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        destinations: [],
        budgetRange: { min: 1000, max: 10000 },
        travelStyle: [],
        accommodationType: [],
        activities: [],
        seasonPreference: [],
        groupSize: 2,
        duration: { min: 5, max: 14 }
      },
      behavior: {
        searchPatterns: [],
        clickedPackages: [],
        bookingHistory: [],
        averageSessionDuration: 300000, // 5 min default
        responsePreference: 'detailed',
        priceInteractionRate: 0.5
      },
      analytics: {
        conversionScore: 0.1,
        engagementLevel: 'medium',
        satisfactionRate: 0.8,
        lastActivity: Date.now(),
        totalInteractions: 0
      }
    };
  }

  // Query'den tercihleri öğren
  private updatePreferencesFromQuery(profile: UserProfile, query: string): void {
    const queryLower = query.toLowerCase();
    
    // Destination preferences
    const destinations = ['paris', 'bali', 'santorini', 'antalya', 'kapadokya', 'maldives'];
    destinations.forEach(dest => {
      if (queryLower.includes(dest) && !profile.preferences.destinations.includes(dest)) {
        profile.preferences.destinations.push(dest);
      }
    });

    // Travel style
    const styles = ['luxury', 'romantic', 'adventure', 'cultural', 'beach'];
    styles.forEach(style => {
      if (queryLower.includes(style) && !profile.preferences.travelStyle.includes(style)) {
        profile.preferences.travelStyle.push(style);
      }
    });

    // Activities
    const activities = ['spa', 'diving', 'hiking', 'cultural', 'romantic', 'adventure'];
    activities.forEach(activity => {
      if (queryLower.includes(activity) && !profile.preferences.activities.includes(activity)) {
        profile.preferences.activities.push(activity);
      }
    });

    // Budget clues
    if (queryLower.includes('budget') || queryLower.includes('ucuz') || queryLower.includes('ekonomik')) {
      profile.preferences.budgetRange.max = Math.min(profile.preferences.budgetRange.max, 3000);
    } else if (queryLower.includes('luxury') || queryLower.includes('lüks') || queryLower.includes('premium')) {
      profile.preferences.budgetRange.min = Math.max(profile.preferences.budgetRange.min, 3000);
    }

    // Duration clues
    if (queryLower.includes('kısa') || queryLower.includes('short') || queryLower.includes('weekend')) {
      profile.preferences.duration.max = Math.min(profile.preferences.duration.max, 5);
    } else if (queryLower.includes('long') || queryLower.includes('uzun') || queryLower.includes('extended')) {
      profile.preferences.duration.min = Math.max(profile.preferences.duration.min, 10);
    }

    // Response preference
    if (queryLower.includes('hızlı') || queryLower.includes('quick') || queryLower.includes('fast')) {
      profile.behavior.responsePreference = 'quick';
    } else if (queryLower.includes('detay') || queryLower.includes('detailed') || queryLower.includes('comprehensive')) {
      profile.behavior.responsePreference = 'detailed';
    }
  }

  // Engagement level güncelle
  private updateEngagementLevel(profile: UserProfile): void {
    const factors = [
      profile.analytics.totalInteractions / 50, // Max 50 interaction = 1.0
      profile.analytics.satisfactionRate,
      profile.behavior.clickedPackages.length / 10, // Max 10 clicks = 1.0
      profile.behavior.bookingHistory.length / 3, // Max 3 bookings = 1.0
      Math.min(1, profile.behavior.averageSessionDuration / 600000) // Max 10 min = 1.0
    ];

    const avgScore = factors.reduce((sum, factor) => sum + Math.min(1, factor), 0) / factors.length;

    if (avgScore > 0.7) profile.analytics.engagementLevel = 'high';
    else if (avgScore > 0.4) profile.analytics.engagementLevel = 'medium';
    else profile.analytics.engagementLevel = 'low';
  }

  // Akıllı öneri oluştur
  generateSmartRecommendations(
    userId: string, 
    query: string, 
    context: {
      conversationPhase?: string;
      urgencyLevel?: string;
      currentPackages?: string[];
    } = {}
  ): SmartRecommendation {
    const profile = this.userProfiles.get(userId);
    const userBehavior = intelligentCacheSystem.getUserBehavior(userId);

    // Paket skorları hesapla
    const packageScores = this.calculatePackageScores(profile, query, context);

    // Strateji belirle
    const strategy = this.determineRecommendationStrategy(profile, context);

    // Timing belirle
    const timing = this.determineRecommendationTiming(profile, context);

    // Personalization factors
    const personalizationFactors = this.getPersonalizationFactors(profile, userBehavior);

    // Analytics data
    const analyticsData = this.generateAnalyticsData(profile, packageScores);

    const recommendation: SmartRecommendation = {
      packages: packageScores.slice(0, strategy === 'aggressive' ? 5 : strategy === 'balanced' ? 3 : 2),
      strategy,
      timing,
      personalizationFactors,
      analyticsData
    };

    // Recommendation history'e ekle
    const history = this.recommendationHistory.get(userId) || [];
    history.push(recommendation);
    this.recommendationHistory.set(userId, history.slice(-10)); // Son 10'u tut

    this.analytics.totalRecommendations++;
    
    logger.log(`🎯 Smart recommendations generated for ${userId}: ${recommendation.packages.length} packages, strategy: ${strategy}`);
    
    return recommendation;
  }

  // Paket skorları hesapla
  private calculatePackageScores(profile: UserProfile | undefined, query: string, context: any): PackageScore[] {
    const scores: PackageScore[] = [];
    const queryLower = query.toLowerCase();

    for (const [packageId, packageData] of this.packageDatabase) {
      let score = 0;
      const reasons: string[] = [];

      // Base score
      score += 0.1;

      // Destination match
      if (profile?.preferences.destinations.includes(packageData.destination)) {
        score += 0.3;
        reasons.push(`Favori destinasyon: ${packageData.destination}`);
      } else if (queryLower.includes(packageData.destination)) {
        score += 0.25;
        reasons.push(`Query'de belirtilen destinasyon: ${packageData.destination}`);
      }

      // Budget compatibility
      if (profile) {
        const budgetMin = profile.preferences.budgetRange.min;
        const budgetMax = profile.preferences.budgetRange.max;
        if (packageData.price >= budgetMin && packageData.price <= budgetMax) {
          score += 0.2;
          reasons.push('Bütçenize uygun');
        } else if (packageData.price < budgetMax * 1.2) { // 20% tolerance
          score += 0.1;
          reasons.push('Bütçenize yakın');
        }
      }

      // Travel style match
      if (profile?.preferences.travelStyle.includes(packageData.type)) {
        score += 0.2;
        reasons.push(`Seyahat tarzınız: ${packageData.type}`);
      }

      // Activities match
      const activityMatches = packageData.activities.filter((activity: string) => 
        profile?.preferences.activities.includes(activity) || queryLower.includes(activity)
      );
      if (activityMatches.length > 0) {
        score += 0.15 * activityMatches.length;
        reasons.push(`İlgi alanlarınız: ${activityMatches.join(', ')}`);
      }

      // Duration compatibility
      if (profile) {
        const durationMin = profile.preferences.duration.min;
        const durationMax = profile.preferences.duration.max;
        if (packageData.duration >= durationMin && packageData.duration <= durationMax) {
          score += 0.1;
          reasons.push('İdeal süre');
        }
      }

      // Previous interaction bonus
      if (profile?.behavior.clickedPackages.includes(packageId)) {
        score += 0.15;
        reasons.push('Daha önce ilginizi çekti');
      }

      // Popularity bonus (simulated)
      const popularPackages = ['romantic-bali', 'paris-luxury', 'santorini-sunset'];
      if (popularPackages.includes(packageId)) {
        score += 0.05;
        reasons.push('Popüler seçim');
      }

      // Query specific keywords
      if (queryLower.includes('honeymoon') || queryLower.includes('balayı')) {
        if (packageData.activities.includes('romantic')) {
          score += 0.2;
          reasons.push('Balayı için ideal');
        }
      }

      // Urgency level adjustment
      let urgencyLevel: 'low' | 'medium' | 'high' = 'low';
      if (context.urgencyLevel === 'high' || queryLower.includes('urgent') || queryLower.includes('acil')) {
        urgencyLevel = 'high';
        score += 0.1; // Boost for immediate availability
      }

      // Ensure score is between 0 and 1
      score = Math.min(1, Math.max(0, score));

      if (score > 0.2) { // Minimum threshold
        scores.push({
          packageId,
          score,
          reasons,
          urgencyLevel,
          recommendationContext: this.generateRecommendationContext(packageData, profile)
        });
      }
    }

    // Sort by score
    return scores.sort((a, b) => b.score - a.score);
  }

  // Recommendation strategy belirle
  private determineRecommendationStrategy(profile: UserProfile | undefined, context: any): 'conservative' | 'balanced' | 'aggressive' {
    if (!profile) return 'balanced';

    // High engagement = aggressive
    if (profile.analytics.engagementLevel === 'high' && profile.analytics.conversionScore > 0.3) {
      return 'aggressive';
    }

    // Low engagement = conservative
    if (profile.analytics.engagementLevel === 'low' || profile.analytics.satisfactionRate < 0.6) {
      return 'conservative';
    }

    // Context-based adjustments
    if (context.conversationPhase === 'decision' || context.urgencyLevel === 'high') {
      return 'aggressive';
    }

    return 'balanced';
  }

  // Recommendation timing belirle
  private determineRecommendationTiming(profile: UserProfile | undefined, context: any): 'immediate' | 'delayed' | 'proactive' {
    if (!profile) return 'immediate';

    // User'ın response preference'ına göre
    if (profile.behavior.responsePreference === 'quick') {
      return 'immediate';
    }

    // Conversation phase'e göre
    if (context.conversationPhase === 'greeting' || context.conversationPhase === 'discovery') {
      return 'delayed';
    }

    // High engagement users için proactive
    if (profile.analytics.engagementLevel === 'high' && profile.analytics.totalInteractions > 10) {
      return 'proactive';
    }

    return 'immediate';
  }

  // Personalization factors al
  private getPersonalizationFactors(profile: UserProfile | undefined, userBehavior: any): string[] {
    const factors: string[] = [];

    if (profile) {
      if (profile.preferences.destinations.length > 0) {
        factors.push(`Favori destinasyonlar: ${profile.preferences.destinations.slice(0, 2).join(', ')}`);
      }
      if (profile.preferences.travelStyle.length > 0) {
        factors.push(`Seyahat tarzı: ${profile.preferences.travelStyle.join(', ')}`);
      }
      factors.push(`Engagement level: ${profile.analytics.engagementLevel}`);
      factors.push(`Budget range: $${profile.preferences.budgetRange.min}-${profile.preferences.budgetRange.max}`);
    }

    if (userBehavior) {
      if (userBehavior.frequentTopics.length > 0) {
        factors.push(`Sık konular: ${userBehavior.frequentTopics.slice(0, 2).join(', ')}`);
      }
    }

    return factors;
  }

  // Analytics data oluştur
  private generateAnalyticsData(profile: UserProfile | undefined, packageScores: PackageScore[]): {
    userSegment: string;
    conversionProbability: number;
    recommendationQuality: number;
  } {
    let userSegment = 'standard';
    let conversionProbability = 0.1;
    let recommendationQuality = 0.5;

    if (profile) {
      // User segment
      if (profile.analytics.engagementLevel === 'high' && profile.behavior.bookingHistory.length > 0) {
        userSegment = 'premium';
        conversionProbability = 0.4;
      } else if (profile.analytics.engagementLevel === 'medium') {
        userSegment = 'engaged';
        conversionProbability = 0.2;
      } else {
        userSegment = 'browser';
        conversionProbability = 0.05;
      }

      // Recommendation quality based on personalization depth
      const personalizationDepth = [
        profile.preferences.destinations.length > 0,
        profile.preferences.travelStyle.length > 0,
        profile.behavior.clickedPackages.length > 0,
        profile.analytics.totalInteractions > 5
      ].filter(Boolean).length;

      recommendationQuality = Math.min(1, 0.3 + (personalizationDepth * 0.175)); // Max 1.0
    }

    // Package scores quality
    if (packageScores.length > 0) {
      const avgScore = packageScores.reduce((sum, p) => sum + p.score, 0) / packageScores.length;
      recommendationQuality = (recommendationQuality + avgScore) / 2;
    }

    return {
      userSegment,
      conversionProbability,
      recommendationQuality
    };
  }

  // Recommendation context oluştur
  private generateRecommendationContext(packageData: any, profile: UserProfile | undefined): string {
    const contexts = [];

    if (profile?.preferences.destinations.includes(packageData.destination)) {
      contexts.push('favori destinasyonunuz');
    }

    if (profile?.preferences.travelStyle.includes(packageData.type)) {
      contexts.push('seyahat tarzınıza uygun');
    }

    if (packageData.price <= (profile?.preferences.budgetRange.max || 5000)) {
      contexts.push('bütçenize uygun');
    }

    return contexts.length > 0 ? contexts.join(', ') : 'özel seçim';
  }

  // Recommendation feedback'i kaydet
  recordRecommendationFeedback(
    userId: string, 
    packageId: string, 
    action: 'click' | 'booking' | 'ignore',
    feedback?: 'positive' | 'negative'
  ): void {
    this.updateUserProfile(userId, {
      clickedPackage: action === 'click' ? packageId : undefined,
      booking: action === 'booking' ? packageId : undefined,
      feedback
    });

    // Analytics güncelle
    if (action === 'click') {
      this.analytics.clickThroughRate = 
        (this.analytics.clickThroughRate * this.analytics.totalRecommendations + 1) / 
        (this.analytics.totalRecommendations + 1);
    }

    if (action === 'booking') {
      this.analytics.conversionRate = 
        (this.analytics.conversionRate * this.analytics.totalRecommendations + 1) / 
        (this.analytics.totalRecommendations + 1);
    }

    logger.log(`📊 Recommendation feedback recorded: ${userId} -> ${packageId} (${action})`);
  }

  // Analytics al
  getRecommendationAnalytics(): RecommendationAnalytics {
    return { ...this.analytics };
  }

  // User profile al
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  // Recommendation history al
  getRecommendationHistory(userId: string): SmartRecommendation[] {
    return this.recommendationHistory.get(userId) || [];
  }
}

export const smartRecommendationEngine = new SmartRecommendationEngine();