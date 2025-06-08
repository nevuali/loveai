import { logger } from '../utils/logger';
import { DetailedUserProfile, advancedUserProfileService } from './advancedUserProfileService';
import { userSegmentationService } from './userSegmentationService';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Prediction Models
export interface BookingPrediction {
  userId: string;
  bookingProbability: number; // 0-1
  predictedBookingDate: Date;
  confidence: number; // 0-1
  reasoningFactors: string[];
  recommendedActions: string[];
  predictedBudget: { min: number; max: number };
  predictedDestinations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysToChurn: number;
  riskFactors: string[];
  preventionActions: string[];
  retentionStrategies: string[];
  lastEngagementScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface PriceOptimizationPrediction {
  userId: string;
  priceElasticity: number; // -1 to 1
  optimalPriceRange: { min: number; max: number };
  discountSensitivity: number; // 0-1
  premiumWillingness: number; // 0-1
  competitivePosition: 'price_leader' | 'premium' | 'value' | 'budget';
  recommendedPricingStrategy: string;
}

export interface SeasonalBehaviorPrediction {
  userId: string;
  seasonalPatterns: {
    spring: { activity: number; bookingLikelihood: number };
    summer: { activity: number; bookingLikelihood: number };
    autumn: { activity: number; bookingLikelihood: number };
    winter: { activity: number; bookingLikelihood: number };
  };
  optimalContactTimes: string[];
  holidayBehavior: string[];
  eventTriggeredActions: string[];
}

export interface UserBehaviorInsights {
  userId: string;
  sessionPatterns: {
    preferredTimeOfDay: string[];
    averageSessionLength: number;
    devicePreference: string;
    contentEngagement: { [contentType: string]: number };
  };
  decisionMakingSpeed: 'impulsive' | 'quick' | 'moderate' | 'deliberate';
  researchBehavior: 'minimal' | 'moderate' | 'extensive' | 'obsessive';
  socialInfluence: number; // 0-1
  brandLoyalty: number; // 0-1
}

// ML Feature Engineering
interface MLFeatures {
  // Demographic features
  ageGroup: number;
  incomeLevel: number;
  locationTier: number;
  relationshipDuration: number;

  // Behavioral features
  totalSessions: number;
  averageSessionDuration: number;
  messagesPerSession: number;
  daysActive: number;
  lastActivityDays: number;

  // Engagement features
  packageViewRate: number;
  searchToViewRatio: number;
  returnVisitRate: number;
  featureUsageScore: number;

  // Preference features
  budgetFlexibility: number;
  destinationDiversity: number;
  luxuryPreference: number;
  adventurePreference: number;

  // Temporal features
  dayOfWeekActivity: number[];
  hourOfDayActivity: number[];
  seasonalActivity: number[];
  trendDirection: number;

  // Social features
  referralActivity: number;
  socialMediaEngagement: number;
  reviewParticipation: number;
}

class AIBehaviorPredictionEngine {
  
  async generateBookingPrediction(userId: string): Promise<BookingPrediction> {
    try {
      const userProfile = await advancedUserProfileService.getDetailedProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const features = await this.extractMLFeatures(userProfile);
      const historicalData = await this.getHistoricalBehavior(userId);
      
      // Advanced ML-like scoring algorithm
      const bookingProbability = this.calculateBookingProbability(features, historicalData);
      const predictedDate = this.predictBookingTimeline(features, userProfile);
      const confidence = this.calculateConfidence(features, historicalData);
      
      const prediction: BookingPrediction = {
        userId,
        bookingProbability,
        predictedBookingDate: predictedDate,
        confidence,
        reasoningFactors: this.generateReasoningFactors(features, userProfile),
        recommendedActions: this.generateBookingActions(bookingProbability, userProfile),
        predictedBudget: this.predictBudgetRange(userProfile, features),
        predictedDestinations: this.predictDestinations(userProfile, features),
        urgencyLevel: this.determineUrgencyLevel(bookingProbability, confidence)
      };

      // Save prediction for tracking
      await this.savePrediction('booking', prediction);
      
      logger.info('Booking prediction generated', { userId, probability: bookingProbability });
      return prediction;

    } catch (error) {
      logger.error('Error generating booking prediction', { userId, error });
      throw error;
    }
  }

  async generateChurnPrediction(userId: string): Promise<ChurnPrediction> {
    try {
      const userProfile = await advancedUserProfileService.getDetailedProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const features = await this.extractMLFeatures(userProfile);
      const engagementHistory = await this.getEngagementHistory(userId);
      
      const churnProbability = this.calculateChurnProbability(features, engagementHistory);
      const daysToChurn = this.predictDaysToChurn(churnProbability, features);
      const riskLevel = this.determineRiskLevel(churnProbability);
      
      const prediction: ChurnPrediction = {
        userId,
        churnProbability,
        riskLevel,
        daysToChurn,
        riskFactors: this.identifyRiskFactors(features, userProfile),
        preventionActions: this.generatePreventionActions(riskLevel, userProfile),
        retentionStrategies: this.generateRetentionStrategies(userProfile, features),
        lastEngagementScore: userProfile.analytics.engagementScore,
        trendDirection: this.calculateTrendDirection(engagementHistory)
      };

      await this.savePrediction('churn', prediction);
      
      logger.info('Churn prediction generated', { userId, riskLevel, probability: churnProbability });
      return prediction;

    } catch (error) {
      logger.error('Error generating churn prediction', { userId, error });
      throw error;
    }
  }

  async generatePriceOptimization(userId: string): Promise<PriceOptimizationPrediction> {
    try {
      const userProfile = await advancedUserProfileService.getDetailedProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const features = await this.extractMLFeatures(userProfile);
      const priceHistory = await this.getPriceInteractionHistory(userId);
      
      const priceElasticity = this.calculatePriceElasticity(features, priceHistory);
      const optimalRange = this.calculateOptimalPriceRange(userProfile, features);
      
      const prediction: PriceOptimizationPrediction = {
        userId,
        priceElasticity,
        optimalPriceRange: optimalRange,
        discountSensitivity: this.calculateDiscountSensitivity(features, userProfile),
        premiumWillingness: this.calculatePremiumWillingness(features, userProfile),
        competitivePosition: this.determineCompetitivePosition(userProfile, features),
        recommendedPricingStrategy: this.recommendPricingStrategy(userProfile, features)
      };

      await this.savePrediction('pricing', prediction);
      
      logger.info('Price optimization generated', { userId, strategy: prediction.recommendedPricingStrategy });
      return prediction;

    } catch (error) {
      logger.error('Error generating price optimization', { userId, error });
      throw error;
    }
  }

  async generateSeasonalPrediction(userId: string): Promise<SeasonalBehaviorPrediction> {
    try {
      const userProfile = await advancedUserProfileService.getDetailedProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const features = await this.extractMLFeatures(userProfile);
      const seasonalHistory = await this.getSeasonalHistory(userId);
      
      const prediction: SeasonalBehaviorPrediction = {
        userId,
        seasonalPatterns: this.calculateSeasonalPatterns(features, seasonalHistory),
        optimalContactTimes: this.determineOptimalContactTimes(features, userProfile),
        holidayBehavior: this.predictHolidayBehavior(userProfile, features),
        eventTriggeredActions: this.generateEventTriggers(userProfile, features)
      };

      await this.savePrediction('seasonal', prediction);
      return prediction;

    } catch (error) {
      logger.error('Error generating seasonal prediction', { userId, error });
      throw error;
    }
  }

  private async extractMLFeatures(profile: DetailedUserProfile): Promise<MLFeatures> {
    const behavior = profile.behaviorData;
    const demographics = profile.demographics;
    const preferences = profile.travelPreferences;

    return {
      // Demographic features
      ageGroup: this.normalizeAge(demographics.age || 30),
      incomeLevel: this.normalizeIncome(demographics.income),
      locationTier: this.getLocationTier(demographics.location),
      relationshipDuration: demographics.relationshipDuration || 12,

      // Behavioral features
      totalSessions: behavior.interactionHistory.sessions_count,
      averageSessionDuration: behavior.interactionHistory.average_session_duration,
      messagesPerSession: behavior.interactionHistory.messages_sent / Math.max(behavior.interactionHistory.sessions_count, 1),
      daysActive: this.calculateDaysActive(profile),
      lastActivityDays: this.daysSinceLastActivity(profile),

      // Engagement features
      packageViewRate: behavior.packageInteractions.packages_viewed.length / Math.max(behavior.interactionHistory.sessions_count, 1),
      searchToViewRatio: behavior.searchHistory.queries.length / Math.max(behavior.packageInteractions.packages_viewed.length, 1),
      returnVisitRate: Math.max(0, (behavior.interactionHistory.sessions_count - 1) / behavior.interactionHistory.sessions_count),
      featureUsageScore: this.calculateFeatureUsageScore(behavior),

      // Preference features
      budgetFlexibility: this.calculateBudgetFlexibility(preferences.budgetRange),
      destinationDiversity: preferences.preferredDestinations.domestic.length + preferences.preferredDestinations.international.length,
      luxuryPreference: profile.personality.luxury / 10,
      adventurePreference: profile.personality.adventurous / 10,

      // Temporal features (simplified for now)
      dayOfWeekActivity: behavior.interactionHistory.most_active_hours || Array(7).fill(0.5),
      hourOfDayActivity: Array(24).fill(0.5), // Would be calculated from real data
      seasonalActivity: Array(4).fill(0.5), // Would be calculated from real data
      trendDirection: profile.analytics.engagementScore > 50 ? 1 : -1,

      // Social features
      referralActivity: 0.5, // Would be calculated from referral data
      socialMediaEngagement: 0.5, // Would be integrated with social media APIs
      reviewParticipation: behavior.feedbackData.feedback_given / Math.max(behavior.interactionHistory.sessions_count, 1)
    };
  }

  private calculateBookingProbability(features: MLFeatures, historicalData: any): number {
    // Advanced ML-inspired scoring algorithm
    let score = 0;

    // Engagement factors (40% weight)
    score += features.packageViewRate * 0.15;
    score += (features.messagesPerSession / 10) * 0.1;
    score += (features.returnVisitRate) * 0.15;

    // Preference alignment (30% weight)
    score += features.luxuryPreference * 0.1;
    score += features.budgetFlexibility * 0.1;
    score += (features.destinationDiversity / 10) * 0.1;

    // Behavioral patterns (20% weight)
    score += Math.min(features.totalSessions / 10, 1) * 0.1;
    score += Math.max(0, 1 - features.lastActivityDays / 30) * 0.1;

    // Demographics (10% weight)
    score += (features.incomeLevel / 5) * 0.05;
    score += (features.relationshipDuration / 24) * 0.05;

    // Apply trend direction
    score *= (1 + features.trendDirection * 0.2);

    return Math.max(0, Math.min(1, score));
  }

  private calculateChurnProbability(features: MLFeatures, engagementHistory: any): number {
    let churnScore = 0;

    // Inactivity factors
    churnScore += features.lastActivityDays / 30 * 0.3;
    churnScore += (1 - features.returnVisitRate) * 0.2;
    
    // Engagement decline
    if (features.trendDirection < 0) {
      churnScore += 0.25;
    }
    
    // Low engagement signals
    if (features.messagesPerSession < 2) churnScore += 0.1;
    if (features.packageViewRate < 0.5) churnScore += 0.1;
    if (features.featureUsageScore < 0.3) churnScore += 0.05;

    return Math.max(0, Math.min(1, churnScore));
  }

  private predictBookingTimeline(features: MLFeatures, profile: DetailedUserProfile): Date {
    // Base prediction: higher engagement = sooner booking
    let daysUntilBooking = 30; // Default

    // Adjust based on engagement
    if (features.packageViewRate > 2) daysUntilBooking -= 10;
    if (features.messagesPerSession > 5) daysUntilBooking -= 7;
    if (profile.analytics.conversionProbability > 0.7) daysUntilBooking -= 10;

    // Adjust based on urgency signals
    if (profile.specialPreferences.special_occasions.length > 0) daysUntilBooking -= 5;
    
    // Adjust based on decision making speed
    const decisionSpeed = this.getDecisionMakingSpeed(features);
    if (decisionSpeed === 'impulsive') daysUntilBooking *= 0.3;
    else if (decisionSpeed === 'quick') daysUntilBooking *= 0.6;
    else if (decisionSpeed === 'deliberate') daysUntilBooking *= 1.5;

    daysUntilBooking = Math.max(1, Math.min(90, daysUntilBooking));
    
    return new Date(Date.now() + daysUntilBooking * 24 * 60 * 60 * 1000);
  }

  private generateReasoningFactors(features: MLFeatures, profile: DetailedUserProfile): string[] {
    const factors: string[] = [];

    if (features.packageViewRate > 1.5) {
      factors.push('Yüksek paket görüntüleme oranı');
    }
    if (features.messagesPerSession > 5) {
      factors.push('Aktif sohbet katılımı');
    }
    if (profile.analytics.conversionProbability > 0.6) {
      factors.push('Yüksek dönüşüm olasılığı');
    }
    if (profile.personality.romantic > 7) {
      factors.push('Güçlü romantik eğilim');
    }
    if (features.budgetFlexibility > 0.7) {
      factors.push('Esnek bütçe yaklaşımı');
    }
    if (features.lastActivityDays < 3) {
      factors.push('Yakın zamandaki aktif kullanım');
    }

    return factors;
  }

  private generateBookingActions(probability: number, profile: DetailedUserProfile): string[] {
    const actions: string[] = [];

    if (probability > 0.8) {
      actions.push('Acil özel teklif gönder');
      actions.push('Kişisel danışman ata');
      actions.push('Rezervasyon süreci için destek sağla');
    } else if (probability > 0.6) {
      actions.push('Targeted email kampanyası başlat');
      actions.push('Sınırlı zamanlı indirim sun');
      actions.push('Video call konsultasyon öner');
    } else if (probability > 0.4) {
      actions.push('Kişiselleştirilmiş içerik gönder');
      actions.push('Sosyal proof (referanslar) paylaş');
      actions.push('FAQ ve ipuçları sun');
    } else {
      actions.push('Eğitici içerik paylaş');
      actions.push('Trust building odaklı mesajlar');
      actions.push('Düşük baskılı bilgilendirme');
    }

    return actions;
  }

  // Utility methods
  private normalizeAge(age: number): number {
    return Math.min(5, Math.floor((age - 18) / 10));
  }

  private normalizeIncome(income?: string): number {
    const incomeMap = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
    return incomeMap[income as keyof typeof incomeMap] || 2;
  }

  private getLocationTier(location: any): number {
    // Simplified location scoring
    const majorCities = ['istanbul', 'ankara', 'izmir'];
    return majorCities.includes(location.city.toLowerCase()) ? 3 : 2;
  }

  private calculateDaysActive(profile: DetailedUserProfile): number {
    return Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000));
  }

  private daysSinceLastActivity(profile: DetailedUserProfile): number {
    return Math.floor((Date.now() - profile.lastLoginAt) / (24 * 60 * 60 * 1000));
  }

  private calculateFeatureUsageScore(behavior: any): number {
    let score = 0;
    if (behavior.searchHistory.queries.length > 0) score += 0.2;
    if (behavior.packageInteractions.packages_viewed.length > 0) score += 0.3;
    if (behavior.packageInteractions.packages_liked.length > 0) score += 0.2;
    if (behavior.feedbackData.feedback_given > 0) score += 0.3;
    return score;
  }

  private calculateBudgetFlexibility(budgetRange: any): number {
    const range = budgetRange.max - budgetRange.min;
    return Math.min(1, range / 50000); // Normalize to 50K range
  }

  private getDecisionMakingSpeed(features: MLFeatures): 'impulsive' | 'quick' | 'moderate' | 'deliberate' {
    if (features.messagesPerSession > 8) return 'impulsive';
    if (features.messagesPerSession > 5) return 'quick';
    if (features.messagesPerSession > 2) return 'moderate';
    return 'deliberate';
  }

  private determineUrgencyLevel(probability: number, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    const score = probability * confidence;
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  // Additional helper methods for other predictions...
  private calculateConfidence(features: MLFeatures, historicalData: any): number {
    // Simple confidence calculation based on data quality
    let confidence = 0.5;
    
    if (features.totalSessions > 5) confidence += 0.2;
    if (features.packageViewRate > 1) confidence += 0.1;
    if (features.lastActivityDays < 7) confidence += 0.2;
    
    return Math.min(1, confidence);
  }

  private predictBudgetRange(profile: DetailedUserProfile, features: MLFeatures): { min: number; max: number } {
    const currentBudget = profile.travelPreferences.budgetRange;
    const flexibility = features.budgetFlexibility;
    
    return {
      min: Math.floor(currentBudget.min * (1 - flexibility * 0.2)),
      max: Math.floor(currentBudget.max * (1 + flexibility * 0.3))
    };
  }

  private predictDestinations(profile: DetailedUserProfile, features: MLFeatures): string[] {
    // Simple prediction based on current preferences and personality
    const destinations = [
      ...profile.travelPreferences.preferredDestinations.domestic,
      ...profile.travelPreferences.preferredDestinations.international
    ];
    
    // Add personality-based suggestions
    if (profile.personality.luxury > 7) {
      destinations.push('Dubai', 'Maldivler', 'Paris');
    }
    if (profile.personality.adventurous > 7) {
      destinations.push('Nepal', 'Yeni Zelanda', 'Costa Rica');
    }
    
    return [...new Set(destinations)].slice(0, 5);
  }

  // Data storage methods
  private async savePrediction(type: string, prediction: any): Promise<void> {
    try {
      const predictionRef = doc(db, 'predictions', `${prediction.userId}_${type}_${Date.now()}`);
      await setDoc(predictionRef, {
        ...prediction,
        type,
        createdAt: Date.now(),
        version: '1.0'
      });
    } catch (error) {
      logger.error('Error saving prediction', { type, error });
    }
  }

  // Placeholder methods for historical data (would be implemented with real data)
  private async getHistoricalBehavior(userId: string): Promise<any> {
    return {}; // Would fetch from historical behavior collection
  }

  private async getEngagementHistory(userId: string): Promise<any> {
    return {}; // Would fetch engagement history
  }

  private async getPriceInteractionHistory(userId: string): Promise<any> {
    return {}; // Would fetch price interaction history
  }

  private async getSeasonalHistory(userId: string): Promise<any> {
    return {}; // Would fetch seasonal activity history
  }

  // Additional prediction methods (simplified implementations)
  private calculatePriceElasticity(features: MLFeatures, priceHistory: any): number {
    return features.budgetFlexibility * 0.8 - 0.4; // -0.4 to 0.4 range
  }

  private calculateOptimalPriceRange(profile: DetailedUserProfile, features: MLFeatures): { min: number; max: number } {
    const base = profile.travelPreferences.budgetRange;
    const premium = profile.personality.luxury / 10;
    
    return {
      min: Math.floor(base.min * (1 + premium * 0.1)),
      max: Math.floor(base.max * (1 + premium * 0.2))
    };
  }

  private calculateDiscountSensitivity(features: MLFeatures, profile: DetailedUserProfile): number {
    return Math.max(0, 1 - profile.personality.luxury / 10);
  }

  private calculatePremiumWillingness(features: MLFeatures, profile: DetailedUserProfile): number {
    return profile.personality.luxury / 10;
  }

  private determineCompetitivePosition(profile: DetailedUserProfile, features: MLFeatures): 'price_leader' | 'premium' | 'value' | 'budget' {
    if (profile.personality.luxury > 7) return 'premium';
    if (profile.personality.budget_conscious > 7) return 'budget';
    if (features.budgetFlexibility > 0.7) return 'value';
    return 'price_leader';
  }

  private recommendPricingStrategy(profile: DetailedUserProfile, features: MLFeatures): string {
    const position = this.determineCompetitivePosition(profile, features);
    const strategies = {
      'premium': 'Lüks paketlerde premium fiyatlandırma',
      'budget': 'Değer odaklı rekabetçi fiyatlandırma',
      'value': 'Orta segment değer propozisyonu',
      'price_leader': 'Pazar lideri agresif fiyatlandırma'
    };
    return strategies[position];
  }

  // Churn prediction helper methods
  private identifyRiskFactors(features: MLFeatures, profile: DetailedUserProfile): string[] {
    const factors: string[] = [];
    
    if (features.lastActivityDays > 14) factors.push('Uzun süreli inaktivlik');
    if (features.messagesPerSession < 2) factors.push('Düşük etkileşim');
    if (features.packageViewRate < 0.5) factors.push('Az paket ilgisi');
    if (profile.analytics.engagementScore < 30) factors.push('Düşük katılım skoru');
    
    return factors;
  }

  private generatePreventionActions(riskLevel: string, profile: DetailedUserProfile): string[] {
    const actions: string[] = [];
    
    if (riskLevel === 'critical') {
      actions.push('Acil müdahale - kişisel arama');
      actions.push('Özel indirim teklifi');
      actions.push('VIP müşteri hizmetleri');
    } else if (riskLevel === 'high') {
      actions.push('Kişiselleştirilmiş email serisi');
      actions.push('Geri kazanma kampanyası');
      actions.push('Ankete davet');
    } else {
      actions.push('Engagement artırıcı içerik');
      actions.push('Düzenli check-in mesajları');
    }
    
    return actions;
  }

  private generateRetentionStrategies(profile: DetailedUserProfile, features: MLFeatures): string[] {
    const strategies: string[] = [];
    
    if (profile.personality.luxury > 6) {
      strategies.push('Lüks segment odaklı özel deneyimler');
    }
    if (features.budgetFlexibility < 0.3) {
      strategies.push('Bütçe dostu seçenekler vurgula');
    }
    if (profile.personality.social > 6) {
      strategies.push('Topluluk etkinlikleri ve sosyal özellikler');
    }
    
    return strategies;
  }

  private calculateTrendDirection(engagementHistory: any): 'improving' | 'stable' | 'declining' {
    // Would analyze historical engagement data
    return 'stable'; // Simplified
  }

  private determineRiskLevel(churnProbability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (churnProbability > 0.8) return 'critical';
    if (churnProbability > 0.6) return 'high';
    if (churnProbability > 0.4) return 'medium';
    return 'low';
  }

  private predictDaysToChurn(churnProbability: number, features: MLFeatures): number {
    const baseDays = 60;
    return Math.floor(baseDays * (1 - churnProbability));
  }

  // Seasonal prediction methods
  private calculateSeasonalPatterns(features: MLFeatures, seasonalHistory: any): any {
    // Would analyze historical seasonal data
    return {
      spring: { activity: 0.8, bookingLikelihood: 0.7 },
      summer: { activity: 0.9, bookingLikelihood: 0.8 },
      autumn: { activity: 0.6, bookingLikelihood: 0.5 },
      winter: { activity: 0.4, bookingLikelihood: 0.3 }
    };
  }

  private determineOptimalContactTimes(features: MLFeatures, profile: DetailedUserProfile): string[] {
    // Based on user's active hours and engagement patterns
    return ['19:00-21:00', 'Weekend mornings'];
  }

  private predictHolidayBehavior(profile: DetailedUserProfile, features: MLFeatures): string[] {
    const behaviors: string[] = [];
    
    if (profile.personality.romantic > 7) {
      behaviors.push('Valentines Day booking spike');
    }
    if (features.budgetFlexibility > 0.6) {
      behaviors.push('Holiday premium pricing acceptance');
    }
    
    return behaviors;
  }

  private generateEventTriggers(profile: DetailedUserProfile, features: MLFeatures): string[] {
    const triggers: string[] = [];
    
    triggers.push('Anniversary reminder campaigns');
    triggers.push('Seasonal destination promotions');
    if (profile.personality.spontaneous > 6) {
      triggers.push('Last-minute deal alerts');
    }
    
    return triggers;
  }

  // Public API methods for getting predictions
  async getAllPredictions(userId: string): Promise<{
    booking: BookingPrediction;
    churn: ChurnPrediction;
    pricing: PriceOptimizationPrediction;
    seasonal: SeasonalBehaviorPrediction;
  }> {
    try {
      const [booking, churn, pricing, seasonal] = await Promise.all([
        this.generateBookingPrediction(userId),
        this.generateChurnPrediction(userId),
        this.generatePriceOptimization(userId),
        this.generateSeasonalPrediction(userId)
      ]);

      return { booking, churn, pricing, seasonal };
    } catch (error) {
      logger.error('Error generating all predictions', { userId, error });
      throw error;
    }
  }

  async getBulkPredictions(userIds: string[], predictionType: 'booking' | 'churn' | 'pricing' | 'seasonal'): Promise<any[]> {
    const predictions = [];
    
    for (const userId of userIds) {
      try {
        let prediction;
        switch (predictionType) {
          case 'booking':
            prediction = await this.generateBookingPrediction(userId);
            break;
          case 'churn':
            prediction = await this.generateChurnPrediction(userId);
            break;
          case 'pricing':
            prediction = await this.generatePriceOptimization(userId);
            break;
          case 'seasonal':
            prediction = await this.generateSeasonalPrediction(userId);
            break;
        }
        predictions.push(prediction);
      } catch (error) {
        logger.error('Error in bulk prediction', { userId, predictionType, error });
        // Continue with other users
      }
    }
    
    return predictions;
  }
}

export const aiBehaviorPredictionEngine = new AIBehaviorPredictionEngine();