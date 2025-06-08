import { logger } from '../utils/logger';
import { smartRecommendationEngine } from './smartRecommendationEngine';
import { realTimeDataService } from './realTimeDataService';
import { intelligentCacheSystem } from './intelligentCacheSystem';

interface PricingFactor {
  name: string;
  weight: number; // 0-1
  currentValue: number;
  impact: 'positive' | 'negative';
  description: string;
}

interface DynamicPrice {
  packageId: string;
  basePrice: number;
  currentPrice: number;
  adjustmentPercentage: number;
  factors: PricingFactor[];
  validUntil: number;
  confidence: number;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

interface UserPricingProfile {
  userId: string;
  priceElasticity: number; // 0-1 (0 = very price sensitive, 1 = not sensitive)
  budgetRange: { min: number; max: number };
  conversionProbability: number;
  averageSessionValue: number;
  priceInteractionHistory: Array<{
    price: number;
    response: 'interested' | 'abandoned' | 'converted';
    timestamp: number;
  }>;
  segmentProfile: {
    segment: 'budget' | 'mid_range' | 'luxury' | 'premium';
    willingnessToPay: number;
    timeFlexibility: number;
    loyaltyScore: number;
  };
}

interface MarketCondition {
  destination: string;
  seasonality: number; // 0-1
  demand: number; // 0-1
  competition: number; // 0-1
  events: Array<{ name: string; impact: number; date: Date }>;
  weatherImpact: number; // -1 to 1
  economicFactors: {
    exchangeRate: number;
    localInflation: number;
    travelIndex: number;
  };
}

interface PricingStrategy {
  id: string;
  name: string;
  description: string;
  targetSegment: string[];
  rules: Array<{
    condition: string;
    action: 'increase' | 'decrease' | 'maintain';
    percentage: number;
    maxAdjustment: number;
  }>;
  active: boolean;
}

interface PricingAnalytics {
  totalPriceQueries: number;
  conversionByPriceRange: Map<string, { queries: number; conversions: number }>;
  averageAcceptedPrice: number;
  priceElasticityBySegment: Map<string, number>;
  revenueOptimization: {
    currentRevenue: number;
    optimizedRevenue: number;
    potentialGain: number;
  };
  bestPerformingStrategies: Array<{ strategyId: string; performance: number }>;
}

class DynamicPricingEngine {
  private userProfiles = new Map<string, UserPricingProfile>();
  private marketConditions = new Map<string, MarketCondition>();
  private pricingStrategies = new Map<string, PricingStrategy>();
  private priceCache = new Map<string, DynamicPrice>();
  private analytics: PricingAnalytics = {
    totalPriceQueries: 0,
    conversionByPriceRange: new Map(),
    averageAcceptedPrice: 0,
    priceElasticityBySegment: new Map(),
    revenueOptimization: {
      currentRevenue: 0,
      optimizedRevenue: 0,
      potentialGain: 0
    },
    bestPerformingStrategies: []
  };

  constructor() {
    this.initializePricingStrategies();
    this.startMarketMonitoring();
  }

  // Pricing strategies başlat
  private initializePricingStrategies(): void {
    const strategies: PricingStrategy[] = [
      {
        id: 'early_bird_discount',
        name: 'Early Bird İndirimi',
        description: 'Erken rezervasyon için indirim',
        targetSegment: ['budget', 'mid_range'],
        rules: [
          {
            condition: 'booking_days_ahead > 60',
            action: 'decrease',
            percentage: 15,
            maxAdjustment: 20
          }
        ],
        active: true
      },
      {
        id: 'last_minute_premium',
        name: 'Son Dakika Premium',
        description: 'Son dakika rezervasyonlar için premium fiyat',
        targetSegment: ['luxury', 'premium'],
        rules: [
          {
            condition: 'booking_days_ahead < 14',
            action: 'increase',
            percentage: 25,
            maxAdjustment: 40
          }
        ],
        active: true
      },
      {
        id: 'high_demand_surge',
        name: 'Yoğun Talep Artışı',
        description: 'Yüksek talep dönemlerinde fiyat artışı',
        targetSegment: ['mid_range', 'luxury', 'premium'],
        rules: [
          {
            condition: 'demand > 0.8',
            action: 'increase',
            percentage: 20,
            maxAdjustment: 35
          }
        ],
        active: true
      },
      {
        id: 'weather_bonus',
        name: 'Hava Durumu Bonusu',
        description: 'İdeal hava koşullarında fiyat ayarlaması',
        targetSegment: ['all'],
        rules: [
          {
            condition: 'weather_score > 0.8',
            action: 'increase',
            percentage: 10,
            maxAdjustment: 15
          }
        ],
        active: true
      },
      {
        id: 'loyalty_discount',
        name: 'Sadakat İndirimi',
        description: 'Sadık müşteriler için özel indirim',
        targetSegment: ['returning'],
        rules: [
          {
            condition: 'loyalty_score > 0.7',
            action: 'decrease',
            percentage: 12,
            maxAdjustment: 18
          }
        ],
        active: true
      },
      {
        id: 'conversion_optimization',
        name: 'Dönüşüm Optimizasyonu',
        description: 'Düşük dönüşüm oranlarında fiyat ayarlaması',
        targetSegment: ['all'],
        rules: [
          {
            condition: 'conversion_probability < 0.3',
            action: 'decrease',
            percentage: 8,
            maxAdjustment: 15
          }
        ],
        active: true
      }
    ];

    strategies.forEach(strategy => {
      this.pricingStrategies.set(strategy.id, strategy);
    });

    logger.log('💰 Pricing strategies initialized:', strategies.length);
  }

  // Market monitoring başlat
  private startMarketMonitoring(): void {
    // Her 2 saatte market conditions güncelle
    setInterval(() => {
      this.updateMarketConditions();
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Her 15 dakikada price cache temizle
    setInterval(() => {
      this.cleanPriceCache();
    }, 15 * 60 * 1000); // 15 minutes

    logger.log('💰 Market monitoring started');
  }

  // Kullanıcı için dynamic price hesapla
  async calculateDynamicPrice(
    packageId: string,
    userId?: string,
    context: {
      basePrice: number;
      destination: string;
      travelDate?: Date;
      bookingDate?: Date;
    } = { basePrice: 3500, destination: 'bali' }
  ): Promise<DynamicPrice> {
    this.analytics.totalPriceQueries++;

    // Cache kontrolü
    const cacheKey = `${packageId}_${userId}_${context.destination}`;
    const cachedPrice = this.priceCache.get(cacheKey);
    if (cachedPrice && cachedPrice.validUntil > Date.now()) {
      logger.log(`💰 Price cache hit for ${packageId}`);
      return cachedPrice;
    }

    // User pricing profile al veya oluştur
    const userProfile = userId ? await this.getUserPricingProfile(userId) : null;

    // Market conditions al
    const marketCondition = await this.getMarketConditions(context.destination);

    // Pricing factors hesapla
    const factors = await this.calculatePricingFactors(context, userProfile, marketCondition);

    // Base price adjustment
    let adjustmentPercentage = 0;
    let confidence = 0.8;
    const reasons: string[] = [];

    // Apply pricing strategies
    for (const strategy of this.pricingStrategies.values()) {
      if (!strategy.active) continue;

      const strategyAdjustment = this.applyPricingStrategy(
        strategy, 
        context, 
        userProfile, 
        marketCondition, 
        factors
      );

      if (strategyAdjustment.applied) {
        adjustmentPercentage += strategyAdjustment.percentage;
        reasons.push(strategyAdjustment.reason);
        confidence = Math.min(confidence + 0.1, 1.0);
      }
    }

    // Factor-based adjustments
    for (const factor of factors) {
      const factorImpact = factor.weight * factor.currentValue;
      if (factor.impact === 'positive') {
        adjustmentPercentage += factorImpact * 10; // Max 10% per factor
      } else {
        adjustmentPercentage -= factorImpact * 10;
      }
    }

    // Clamp adjustment percentage
    adjustmentPercentage = Math.max(-50, Math.min(50, adjustmentPercentage));

    // Calculate final price
    const currentPrice = context.basePrice * (1 + adjustmentPercentage / 100);
    
    // Determine urgency level
    const urgencyLevel = this.calculateUrgencyLevel(adjustmentPercentage, factors, marketCondition);

    const dynamicPrice: DynamicPrice = {
      packageId,
      basePrice: context.basePrice,
      currentPrice: Math.round(currentPrice),
      adjustmentPercentage,
      factors,
      validUntil: Date.now() + (30 * 60 * 1000), // 30 minutes
      confidence,
      reason: reasons.length > 0 ? reasons.join(', ') : 'Standard pricing',
      urgencyLevel
    };

    // Cache'e ekle
    this.priceCache.set(cacheKey, dynamicPrice);

    // Analytics güncelle
    this.updatePricingAnalytics(dynamicPrice, userProfile);

    logger.log(`💰 Dynamic price calculated for ${packageId}: ${currentPrice} USD (${adjustmentPercentage.toFixed(1)}%)`);

    return dynamicPrice;
  }

  // User pricing profile al
  private async getUserPricingProfile(userId: string): Promise<UserPricingProfile> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = await this.createUserPricingProfile(userId);
      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  // User pricing profile oluştur
  private async createUserPricingProfile(userId: string): Promise<UserPricingProfile> {
    // Get user data from recommendation engine
    const userRecommendationProfile = smartRecommendationEngine.getUserProfile(userId);
    const userBehavior = intelligentCacheSystem.getUserBehavior(userId);

    // Calculate price elasticity based on behavior
    let priceElasticity = 0.5; // Default
    if (userRecommendationProfile) {
      const engagementLevel = userRecommendationProfile.analytics.engagementLevel;
      if (engagementLevel === 'high') priceElasticity = 0.7; // Less price sensitive
      else if (engagementLevel === 'low') priceElasticity = 0.3; // More price sensitive
    }

    // Determine segment
    let segment: 'budget' | 'mid_range' | 'luxury' | 'premium' = 'mid_range';
    let budgetRange = { min: 1000, max: 5000 };

    if (userRecommendationProfile?.preferences.budgetRange) {
      const userBudget = userRecommendationProfile.preferences.budgetRange;
      if (userBudget.max <= 2500) {
        segment = 'budget';
        budgetRange = { min: 1000, max: 2500 };
      } else if (userBudget.max <= 5000) {
        segment = 'mid_range';
        budgetRange = { min: 2500, max: 5000 };
      } else if (userBudget.max <= 8000) {
        segment = 'luxury';
        budgetRange = { min: 5000, max: 8000 };
      } else {
        segment = 'premium';
        budgetRange = { min: 8000, max: 20000 };
      }
    }

    const profile: UserPricingProfile = {
      userId,
      priceElasticity,
      budgetRange,
      conversionProbability: userRecommendationProfile?.analytics.conversionScore || 0.1,
      averageSessionValue: 0,
      priceInteractionHistory: [],
      segmentProfile: {
        segment,
        willingnessToPay: priceElasticity * 100,
        timeFlexibility: userBehavior?.satisfactionRate || 0.5,
        loyaltyScore: userRecommendationProfile?.analytics.satisfactionRate || 0.3
      }
    };

    logger.log(`💰 User pricing profile created for ${userId}: ${segment} segment`);
    return profile;
  }

  // Market conditions al
  private async getMarketConditions(destination: string): Promise<MarketCondition> {
    let condition = this.marketConditions.get(destination);

    if (!condition) {
      condition = await this.fetchMarketConditions(destination);
      this.marketConditions.set(destination, condition);
    }

    return condition;
  }

  // Market conditions fetch et
  private async fetchMarketConditions(destination: string): Promise<MarketCondition> {
    try {
      // Real-time data'dan market bilgilerini al
      const realTimeData = await realTimeDataService.getComprehensiveTravelData(destination);

      let seasonality = 0.5; // Default
      let demand = 0.5; // Default
      let weatherImpact = 0; // Neutral

      // Weather impact hesapla
      if (realTimeData?.weather?.current) {
        const temp = realTimeData.weather.current.temperature;
        const condition = realTimeData.weather.current.condition.toLowerCase();
        
        if (temp >= 20 && temp <= 30 && condition.includes('sunny')) {
          weatherImpact = 0.3; // Positive
        } else if (temp < 10 || temp > 35 || condition.includes('rain')) {
          weatherImpact = -0.2; // Negative
        }
      }

      // Events impact
      const events = realTimeData?.events?.events.map(event => ({
        name: event.name,
        impact: event.impact === 'high' ? 0.2 : event.impact === 'medium' ? 0.1 : 0.05,
        date: new Date(event.date)
      })) || [];

      // Seasonality hesapla (basit implementasyon)
      const currentMonth = new Date().getMonth();
      const peakMonths = [5, 6, 7, 8]; // June, July, August, September
      seasonality = peakMonths.includes(currentMonth) ? 0.8 : 0.4;

      // Demand simulation (gerçekte booking data'sından gelecek)
      demand = 0.3 + (Math.random() * 0.4); // 0.3-0.7 range

      return {
        destination,
        seasonality,
        demand,
        competition: 0.6, // Simulated
        events,
        weatherImpact,
        economicFactors: {
          exchangeRate: realTimeData?.currency?.rates?.USD || 1,
          localInflation: 0.05, // 5% simulated
          travelIndex: 0.7 // Simulated travel confidence index
        }
      };
    } catch (error) {
      logger.error('❌ Market conditions fetch failed:', error);
      
      // Fallback values
      return {
        destination,
        seasonality: 0.5,
        demand: 0.5,
        competition: 0.6,
        events: [],
        weatherImpact: 0,
        economicFactors: {
          exchangeRate: 1,
          localInflation: 0.05,
          travelIndex: 0.7
        }
      };
    }
  }

  // Pricing factors hesapla
  private async calculatePricingFactors(
    context: any,
    userProfile: UserPricingProfile | null,
    marketCondition: MarketCondition
  ): Promise<PricingFactor[]> {
    const factors: PricingFactor[] = [];

    // Seasonality factor
    factors.push({
      name: 'Seasonality',
      weight: 0.2,
      currentValue: marketCondition.seasonality,
      impact: 'positive',
      description: 'Seasonal demand impact'
    });

    // Market demand factor
    factors.push({
      name: 'Market Demand',
      weight: 0.25,
      currentValue: marketCondition.demand,
      impact: 'positive',
      description: 'Current market demand level'
    });

    // Weather factor
    if (marketCondition.weatherImpact !== 0) {
      factors.push({
        name: 'Weather Conditions',
        weight: 0.15,
        currentValue: Math.abs(marketCondition.weatherImpact),
        impact: marketCondition.weatherImpact > 0 ? 'positive' : 'negative',
        description: 'Weather impact on destination attractiveness'
      });
    }

    // Events factor
    if (marketCondition.events.length > 0) {
      const totalEventImpact = marketCondition.events.reduce((sum, event) => sum + event.impact, 0);
      factors.push({
        name: 'Local Events',
        weight: 0.1,
        currentValue: totalEventImpact,
        impact: 'positive',
        description: 'Impact of local events and festivals'
      });
    }

    // User conversion probability factor
    if (userProfile) {
      factors.push({
        name: 'User Conversion Likelihood',
        weight: 0.15,
        currentValue: userProfile.conversionProbability,
        impact: userProfile.conversionProbability > 0.5 ? 'positive' : 'negative',
        description: 'User likelihood to convert based on history'
      });

      // User price sensitivity factor
      factors.push({
        name: 'Price Sensitivity',
        weight: 0.1,
        currentValue: 1 - userProfile.priceElasticity,
        impact: 'negative',
        description: 'User sensitivity to price changes'
      });
    }

    // Booking timing factor
    if (context.travelDate && context.bookingDate) {
      const daysAhead = Math.floor((context.travelDate.getTime() - context.bookingDate.getTime()) / (24 * 60 * 60 * 1000));
      let timingValue = 0.5;
      
      if (daysAhead > 90) timingValue = 0.3; // Early booking discount
      else if (daysAhead < 14) timingValue = 0.8; // Last minute premium
      else if (daysAhead < 30) timingValue = 0.6; // Short notice
      
      factors.push({
        name: 'Booking Timing',
        weight: 0.15,
        currentValue: timingValue,
        impact: daysAhead > 60 ? 'negative' : 'positive',
        description: 'Impact of booking timing on price'
      });
    }

    return factors;
  }

  // Pricing strategy uygula
  private applyPricingStrategy(
    strategy: PricingStrategy,
    context: any,
    userProfile: UserPricingProfile | null,
    marketCondition: MarketCondition,
    factors: PricingFactor[]
  ): { applied: boolean; percentage: number; reason: string } {
    
    // Check if strategy applies to user segment
    if (userProfile && !strategy.targetSegment.includes('all') && 
        !strategy.targetSegment.includes(userProfile.segmentProfile.segment)) {
      return { applied: false, percentage: 0, reason: '' };
    }

    for (const rule of strategy.rules) {
      const conditionMet = this.evaluateCondition(rule.condition, context, userProfile, marketCondition, factors);
      
      if (conditionMet) {
        const percentage = rule.action === 'increase' ? rule.percentage : -rule.percentage;
        return {
          applied: true,
          percentage: Math.min(Math.abs(percentage), rule.maxAdjustment) * (percentage < 0 ? -1 : 1),
          reason: strategy.name
        };
      }
    }

    return { applied: false, percentage: 0, reason: '' };
  }

  // Condition değerlendir
  private evaluateCondition(
    condition: string,
    context: any,
    userProfile: UserPricingProfile | null,
    marketCondition: MarketCondition,
    factors: PricingFactor[]
  ): boolean {
    // Simplified condition evaluation
    if (condition.includes('booking_days_ahead')) {
      if (!context.travelDate || !context.bookingDate) return false;
      const daysAhead = Math.floor((context.travelDate.getTime() - context.bookingDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (condition.includes('> 60')) return daysAhead > 60;
      if (condition.includes('< 14')) return daysAhead < 14;
    }

    if (condition.includes('demand')) {
      if (condition.includes('> 0.8')) return marketCondition.demand > 0.8;
      if (condition.includes('< 0.3')) return marketCondition.demand < 0.3;
    }

    if (condition.includes('weather_score')) {
      if (condition.includes('> 0.8')) return marketCondition.weatherImpact > 0.2;
    }

    if (condition.includes('loyalty_score') && userProfile) {
      if (condition.includes('> 0.7')) return userProfile.segmentProfile.loyaltyScore > 0.7;
    }

    if (condition.includes('conversion_probability') && userProfile) {
      if (condition.includes('< 0.3')) return userProfile.conversionProbability < 0.3;
    }

    return false;
  }

  // Urgency level hesapla
  private calculateUrgencyLevel(
    adjustmentPercentage: number,
    factors: PricingFactor[],
    marketCondition: MarketCondition
  ): 'low' | 'medium' | 'high' | 'urgent' {
    let urgencyScore = 0;

    // Price increase adds urgency
    if (adjustmentPercentage > 0) {
      urgencyScore += adjustmentPercentage / 10; // 10% = 1 point
    }

    // High demand adds urgency
    if (marketCondition.demand > 0.7) {
      urgencyScore += 2;
    }

    // Events add urgency
    if (marketCondition.events.length > 0) {
      urgencyScore += marketCondition.events.length;
    }

    // Weather impact
    if (marketCondition.weatherImpact > 0.2) {
      urgencyScore += 1;
    }

    if (urgencyScore >= 6) return 'urgent';
    if (urgencyScore >= 4) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
  }

  // Price interaction kaydet
  recordPriceInteraction(
    userId: string,
    packageId: string,
    price: number,
    response: 'interested' | 'abandoned' | 'converted'
  ): void {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;

    userProfile.priceInteractionHistory.push({
      price,
      response,
      timestamp: Date.now()
    });

    // Keep last 50 interactions
    if (userProfile.priceInteractionHistory.length > 50) {
      userProfile.priceInteractionHistory.shift();
    }

    // Update conversion probability
    const recentInteractions = userProfile.priceInteractionHistory.slice(-10);
    const conversions = recentInteractions.filter(i => i.response === 'converted').length;
    userProfile.conversionProbability = conversions / recentInteractions.length;

    // Update price elasticity based on interactions
    this.updatePriceElasticity(userProfile);

    // Update analytics
    this.recordConversionByPriceRange(price, response === 'converted');

    logger.log(`💰 Price interaction recorded: ${response} at ${price} USD for user ${userId}`);
  }

  // Price elasticity güncelle
  private updatePriceElasticity(userProfile: UserPricingProfile): void {
    if (userProfile.priceInteractionHistory.length < 5) return;

    const recentHistory = userProfile.priceInteractionHistory.slice(-10);
    let priceSum = 0;
    let conversionSum = 0;

    recentHistory.forEach(interaction => {
      priceSum += interaction.price;
      conversionSum += interaction.response === 'converted' ? 1 : 0;
    });

    const avgPrice = priceSum / recentHistory.length;
    const conversionRate = conversionSum / recentHistory.length;

    // High conversion at high prices = low price sensitivity
    if (avgPrice > userProfile.budgetRange.max * 0.8 && conversionRate > 0.3) {
      userProfile.priceElasticity = Math.min(1, userProfile.priceElasticity + 0.1);
    }
    // Low conversion at low prices = high price sensitivity  
    else if (avgPrice < userProfile.budgetRange.max * 0.6 && conversionRate < 0.2) {
      userProfile.priceElasticity = Math.max(0, userProfile.priceElasticity - 0.1);
    }
  }

  // Conversion by price range kaydet
  private recordConversionByPriceRange(price: number, converted: boolean): void {
    let priceRange = '';
    
    if (price < 2000) priceRange = 'under_2k';
    else if (price < 3500) priceRange = '2k_3.5k';
    else if (price < 5000) priceRange = '3.5k_5k';
    else if (price < 7500) priceRange = '5k_7.5k';
    else priceRange = 'over_7.5k';

    const current = this.analytics.conversionByPriceRange.get(priceRange) || { queries: 0, conversions: 0 };
    current.queries++;
    if (converted) current.conversions++;
    
    this.analytics.conversionByPriceRange.set(priceRange, current);
  }

  // Analytics güncelle
  private updatePricingAnalytics(dynamicPrice: DynamicPrice, userProfile: UserPricingProfile | null): void {
    // Average accepted price hesapla
    this.analytics.averageAcceptedPrice = 
      (this.analytics.averageAcceptedPrice + dynamicPrice.currentPrice) / 2;

    // Price elasticity by segment
    if (userProfile) {
      const segment = userProfile.segmentProfile.segment;
      const currentElasticity = this.analytics.priceElasticityBySegment.get(segment) || 0;
      this.analytics.priceElasticityBySegment.set(segment, 
        (currentElasticity + userProfile.priceElasticity) / 2);
    }
  }

  // Market conditions güncelle
  private async updateMarketConditions(): Promise<void> {
    logger.log('💰 Updating market conditions...');
    
    for (const destination of this.marketConditions.keys()) {
      try {
        const updatedConditions = await this.fetchMarketConditions(destination);
        this.marketConditions.set(destination, updatedConditions);
      } catch (error) {
        logger.error(`❌ Failed to update market conditions for ${destination}:`, error);
      }
    }
  }

  // Price cache temizle
  private cleanPriceCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, price] of this.priceCache) {
      if (price.validUntil < now) {
        this.priceCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.log(`💰 Cleaned ${cleaned} expired prices from cache`);
    }
  }

  // Price optimization recommendations al
  getPriceOptimizationRecommendations(packageId: string): {
    currentPerformance: {
      averagePrice: number;
      conversionRate: number;
      revenue: number;
    };
    recommendations: Array<{
      strategy: string;
      expectedImpact: number;
      reason: string;
    }>;
  } {
    // Calculate current performance
    const conversions = Array.from(this.analytics.conversionByPriceRange.values());
    const totalQueries = conversions.reduce((sum, c) => sum + c.queries, 0);
    const totalConversions = conversions.reduce((sum, c) => sum + c.conversions, 0);
    
    const conversionRate = totalQueries > 0 ? totalConversions / totalQueries : 0;
    const revenue = totalConversions * this.analytics.averageAcceptedPrice;

    // Generate recommendations
    const recommendations = [];

    if (conversionRate < 0.15) {
      recommendations.push({
        strategy: 'Reduce prices for price-sensitive segments',
        expectedImpact: 0.25,
        reason: 'Low conversion rate indicates price resistance'
      });
    }

    if (conversionRate > 0.4) {
      recommendations.push({
        strategy: 'Increase prices to maximize revenue',
        expectedImpact: 0.15,
        reason: 'High conversion rate suggests willingness to pay more'
      });
    }

    recommendations.push({
      strategy: 'Implement time-based pricing',
      expectedImpact: 0.12,
      reason: 'Early bird and last-minute pricing can optimize revenue'
    });

    return {
      currentPerformance: {
        averagePrice: this.analytics.averageAcceptedPrice,
        conversionRate,
        revenue
      },
      recommendations
    };
  }

  // Public getters
  getPricingAnalytics(): PricingAnalytics {
    return { ...this.analytics };
  }

  getUserPricingProfilePublic(userId: string): UserPricingProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  getMarketCondition(destination: string): MarketCondition | null {
    return this.marketConditions.get(destination) || null;
  }

  getPricingStrategies(): PricingStrategy[] {
    return Array.from(this.pricingStrategies.values());
  }

  // Strategy management
  updatePricingStrategy(strategyId: string, updates: Partial<PricingStrategy>): boolean {
    const strategy = this.pricingStrategies.get(strategyId);
    if (!strategy) return false;

    Object.assign(strategy, updates);
    this.pricingStrategies.set(strategyId, strategy);
    
    logger.log(`💰 Pricing strategy updated: ${strategyId}`);
    return true;
  }

  togglePricingStrategy(strategyId: string, active: boolean): boolean {
    const strategy = this.pricingStrategies.get(strategyId);
    if (!strategy) return false;

    strategy.active = active;
    this.pricingStrategies.set(strategyId, strategy);
    
    logger.log(`💰 Pricing strategy ${active ? 'activated' : 'deactivated'}: ${strategyId}`);
    return true;
  }
}

export const dynamicPricingEngine = new DynamicPricingEngine();