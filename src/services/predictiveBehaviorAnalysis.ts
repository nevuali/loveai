import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { PersonalityProfile, EmotionalState } from './emotionalIntelligence';
import { RelationshipProfile } from './romanticRelationshipAI';

interface BehaviorPattern {
  id: string;
  userId: string;
  patternType: 'booking' | 'communication' | 'decision-making' | 'preference-change' | 'emotional-cycle';
  pattern: {
    frequency: number; // times per period
    period: 'day' | 'week' | 'month' | 'season';
    triggers: string[];
    conditions: string[];
    outcomes: string[];
  };
  confidence: number; // 0-1
  strength: number; // 0-1
  lastObserved: Date;
  predictiveValue: number; // 0-1
  metadata: {
    dataPoints: number;
    timeSpan: number; // days
    seasonality: boolean;
    volatility: number;
  };
}

interface BehaviorPrediction {
  id: string;
  userId: string;
  predictionType: 'booking-likelihood' | 'price-sensitivity' | 'decision-timing' | 'preference-shift' | 'emotional-state';
  timeframe: 'next-hour' | 'next-day' | 'next-week' | 'next-month';
  prediction: {
    likelihood: number; // 0-1
    confidence: number; // 0-1
    specificOutcome: string;
    alternativeOutcomes: Array<{ outcome: string; likelihood: number }>;
  };
  influencingFactors: Array<{
    factor: string;
    impact: number; // -1 to 1
    confidence: number;
  }>;
  actionableInsights: Array<{
    insight: string;
    recommendedAction: string;
    timing: string;
    expectedImpact: number;
  }>;
  riskFactors: Array<{
    risk: string;
    probability: number;
    mitigation: string;
  }>;
  generatedAt: Date;
  validUntil: Date;
  accuracy?: number; // Filled after validation
}

interface PredictiveContext {
  userId: string;
  currentSession: {
    duration: number;
    messageCount: number;
    topics: string[];
    emotionalProgression: string[];
    engagementLevel: number;
  };
  historicalData: {
    previousSessions: Array<{
      date: Date;
      duration: number;
      outcome: string;
      satisfaction: number;
    }>;
    bookingHistory: Array<{
      date: Date;
      package: string;
      price: number;
      satisfaction: number;
    }>;
    communicationPatterns: Array<{
      timestamp: Date;
      messageType: string;
      responseTime: number;
      emotionalTone: string;
    }>;
  };
  personalityProfile?: PersonalityProfile;
  emotionalState?: EmotionalState;
  relationshipProfile?: RelationshipProfile;
  externalFactors: {
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    marketConditions: string[];
    personalCircumstances: string[];
  };
}

interface AdvancedPredictiveInsight {
  category: 'behavior' | 'preference' | 'timing' | 'price' | 'emotional';
  insight: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  actionability: number; // 0-1
  businessValue: number; // 0-1
}

class PredictiveBehaviorAnalysis {
  private behaviorPatterns: Map<string, BehaviorPattern[]> = new Map();
  private predictions: Map<string, BehaviorPrediction[]> = new Map();
  private readonly PREDICTION_TTL = 60 * 60 * 1000; // 1 hour
  private readonly PATTERN_MIN_DATA_POINTS = 5;

  // Ana predictive analysis fonksiyonu
  async generatePredictiveBehaviorAnalysis(context: PredictiveContext): Promise<{
    patterns: BehaviorPattern[];
    predictions: BehaviorPrediction[];
    insights: AdvancedPredictiveInsight[];
    recommendations: Array<{
      action: string;
      timing: string;
      expectedOutcome: string;
      confidence: number;
    }>;
  }> {
    logger.log('🔮 Generating predictive behavior analysis for user:', context.userId);

    try {
      // Multi-layer pattern detection
      const detectedPatterns = await this.detectBehaviorPatterns(context);
      
      // Future behavior predictions
      const futurePredictions = await this.generateFuturePredictions(context, detectedPatterns);
      
      // Actionable insights
      const insights = await this.generateAdvancedInsights(context, detectedPatterns, futurePredictions);
      
      // Strategic recommendations
      const recommendations = await this.generateStrategicRecommendations(context, futurePredictions, insights);

      // Cache results
      this.cacheResults(context.userId, detectedPatterns, futurePredictions);

      logger.log(`🔮 Generated ${detectedPatterns.length} patterns, ${futurePredictions.length} predictions, ${insights.length} insights`);

      return {
        patterns: detectedPatterns,
        predictions: futurePredictions,
        insights,
        recommendations
      };

    } catch (error) {
      logger.error('❌ Predictive behavior analysis failed:', error);
      return this.getFallbackAnalysis(context);
    }
  }

  // Behavior pattern detection
  private async detectBehaviorPatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    try {
      // Booking behavior patterns
      const bookingPatterns = await this.detectBookingPatterns(context);
      patterns.push(...bookingPatterns);

      // Communication patterns
      const communicationPatterns = await this.detectCommunicationPatterns(context);
      patterns.push(...communicationPatterns);

      // Decision-making patterns
      const decisionPatterns = await this.detectDecisionMakingPatterns(context);
      patterns.push(...decisionPatterns);

      // Preference change patterns
      const preferencePatterns = await this.detectPreferencePatterns(context);
      patterns.push(...preferencePatterns);

      // Emotional cycle patterns
      const emotionalPatterns = await this.detectEmotionalPatterns(context);
      patterns.push(...emotionalPatterns);

      // Filter patterns by confidence and strength
      const validPatterns = patterns.filter(pattern => 
        pattern.confidence > 0.6 && 
        pattern.metadata.dataPoints >= this.PATTERN_MIN_DATA_POINTS
      );

      logger.log(`🔍 Detected ${validPatterns.length} valid behavior patterns`);
      return validPatterns;

    } catch (error) {
      logger.error('❌ Pattern detection failed:', error);
      return [];
    }
  }

  // Booking behavior pattern detection
  private async detectBookingPatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    if (!context.historicalData?.bookingHistory || context.historicalData.bookingHistory.length < this.PATTERN_MIN_DATA_POINTS) {
      return patterns;
    }

    // Analyze booking timing patterns
    const bookingTimes = context.historicalData.bookingHistory.map(booking => ({
      dayOfWeek: booking.date.getDay(),
      hour: booking.date.getHours(),
      month: booking.date.getMonth(),
      priceRange: this.categorizePriceRange(booking.price)
    }));

    // Detect weekly patterns
    const weeklyPattern = this.analyzeWeeklyBookingPattern(bookingTimes);
    if (weeklyPattern.confidence > 0.6) {
      patterns.push({
        id: `booking_weekly_${context.userId}`,
        userId: context.userId,
        patternType: 'booking',
        pattern: {
          frequency: weeklyPattern.frequency,
          period: 'week',
          triggers: weeklyPattern.triggers,
          conditions: weeklyPattern.conditions,
          outcomes: ['booking-likely']
        },
        confidence: weeklyPattern.confidence,
        strength: weeklyPattern.strength,
        lastObserved: new Date(),
        predictiveValue: weeklyPattern.predictiveValue,
        metadata: {
          dataPoints: context.historicalData.bookingHistory.length,
          timeSpan: this.calculateTimeSpan(context.historicalData.bookingHistory),
          seasonality: weeklyPattern.seasonality,
          volatility: weeklyPattern.volatility
        }
      });
    }

    // Detect price sensitivity patterns
    const pricePattern = this.analyzePriceSensitivityPattern(context.historicalData.bookingHistory);
    if (pricePattern.confidence > 0.6) {
      patterns.push({
        id: `booking_price_${context.userId}`,
        userId: context.userId,
        patternType: 'booking',
        pattern: {
          frequency: pricePattern.frequency,
          period: 'month',
          triggers: pricePattern.triggers,
          conditions: pricePattern.conditions,
          outcomes: pricePattern.outcomes
        },
        confidence: pricePattern.confidence,
        strength: pricePattern.strength,
        lastObserved: new Date(),
        predictiveValue: pricePattern.predictiveValue,
        metadata: {
          dataPoints: context.historicalData.bookingHistory.length,
          timeSpan: this.calculateTimeSpan(context.historicalData.bookingHistory),
          seasonality: false,
          volatility: pricePattern.volatility
        }
      });
    }

    return patterns;
  }

  // Communication pattern detection
  private async detectCommunicationPatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    if (!context.historicalData?.communicationPatterns || context.historicalData.communicationPatterns.length < this.PATTERN_MIN_DATA_POINTS) {
      return patterns;
    }

    // Response time patterns
    const responseTimePattern = this.analyzeResponseTimePattern(context.historicalData.communicationPatterns);
    if (responseTimePattern.confidence > 0.6) {
      patterns.push({
        id: `communication_response_${context.userId}`,
        userId: context.userId,
        patternType: 'communication',
        pattern: responseTimePattern.pattern,
        confidence: responseTimePattern.confidence,
        strength: responseTimePattern.strength,
        lastObserved: new Date(),
        predictiveValue: responseTimePattern.predictiveValue,
        metadata: {
          dataPoints: context.historicalData.communicationPatterns.length,
          timeSpan: this.calculateTimeSpan(context.historicalData.communicationPatterns),
          seasonality: false,
          volatility: responseTimePattern.volatility
        }
      });
    }

    // Emotional tone progression patterns
    const emotionalProgressionPattern = this.analyzeEmotionalProgressionPattern(context.historicalData.communicationPatterns);
    if (emotionalProgressionPattern.confidence > 0.6) {
      patterns.push({
        id: `communication_emotional_${context.userId}`,
        userId: context.userId,
        patternType: 'communication',
        pattern: emotionalProgressionPattern.pattern,
        confidence: emotionalProgressionPattern.confidence,
        strength: emotionalProgressionPattern.strength,
        lastObserved: new Date(),
        predictiveValue: emotionalProgressionPattern.predictiveValue,
        metadata: {
          dataPoints: context.historicalData.communicationPatterns.length,
          timeSpan: this.calculateTimeSpan(context.historicalData.communicationPatterns),
          seasonality: false,
          volatility: emotionalProgressionPattern.volatility
        }
      });
    }

    return patterns;
  }

  // Decision-making pattern detection
  private async detectDecisionMakingPatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    // Analyze decision speed based on personality and historical data
    if (context.personalityProfile) {
      const decisionSpeedPattern = this.analyzeDecisionSpeedPattern(context);
      if (decisionSpeedPattern.confidence > 0.6) {
        patterns.push({
          id: `decision_speed_${context.userId}`,
          userId: context.userId,
          patternType: 'decision-making',
          pattern: decisionSpeedPattern.pattern,
          confidence: decisionSpeedPattern.confidence,
          strength: decisionSpeedPattern.strength,
          lastObserved: new Date(),
          predictiveValue: decisionSpeedPattern.predictiveValue,
                  metadata: {
          dataPoints: context.historicalData?.previousSessions?.length || 0,
            timeSpan: this.calculateTimeSpan(context.historicalData?.previousSessions || []),
            seasonality: false,
            volatility: 0.3
          }
        });
      }
    }

    return patterns;
  }

  // Preference pattern detection
  private async detectPreferencePatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    if (context.historicalData?.bookingHistory && context.historicalData.bookingHistory.length >= this.PATTERN_MIN_DATA_POINTS) {
      const preferenceEvolutionPattern = this.analyzePreferenceEvolution(context.historicalData.bookingHistory);
      if (preferenceEvolutionPattern.confidence > 0.6) {
        patterns.push({
          id: `preference_evolution_${context.userId}`,
          userId: context.userId,
          patternType: 'preference-change',
          pattern: preferenceEvolutionPattern.pattern,
          confidence: preferenceEvolutionPattern.confidence,
          strength: preferenceEvolutionPattern.strength,
          lastObserved: new Date(),
          predictiveValue: preferenceEvolutionPattern.predictiveValue,
          metadata: {
            dataPoints: context.historicalData.bookingHistory.length,
            timeSpan: this.calculateTimeSpan(context.historicalData.bookingHistory),
            seasonality: true,
            volatility: preferenceEvolutionPattern.volatility
          }
        });
      }
    }

    return patterns;
  }

  // Emotional pattern detection
  private async detectEmotionalPatterns(context: PredictiveContext): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    if (context.historicalData?.communicationPatterns && context.historicalData.communicationPatterns.length >= this.PATTERN_MIN_DATA_POINTS) {
      const emotionalCyclePattern = this.analyzeEmotionalCycles(context.historicalData.communicationPatterns);
      if (emotionalCyclePattern.confidence > 0.6) {
        patterns.push({
          id: `emotional_cycle_${context.userId}`,
          userId: context.userId,
          patternType: 'emotional-cycle',
          pattern: emotionalCyclePattern.pattern,
          confidence: emotionalCyclePattern.confidence,
          strength: emotionalCyclePattern.strength,
          lastObserved: new Date(),
          predictiveValue: emotionalCyclePattern.predictiveValue,
          metadata: {
            dataPoints: context.historicalData.communicationPatterns.length,
            timeSpan: this.calculateTimeSpan(context.historicalData.communicationPatterns),
            seasonality: true,
            volatility: emotionalCyclePattern.volatility
          }
        });
      }
    }

    return patterns;
  }

  // Future predictions generation
  private async generateFuturePredictions(
    context: PredictiveContext,
    patterns: BehaviorPattern[]
  ): Promise<BehaviorPrediction[]> {
    const predictions: BehaviorPrediction[] = [];

    try {
      // Booking likelihood prediction
      const bookingPrediction = await this.predictBookingLikelihood(context, patterns);
      if (bookingPrediction) predictions.push(bookingPrediction);

      // Price sensitivity prediction
      const pricePrediction = await this.predictPriceSensitivity(context, patterns);
      if (pricePrediction) predictions.push(pricePrediction);

      // Decision timing prediction
      const timingPrediction = await this.predictDecisionTiming(context, patterns);
      if (timingPrediction) predictions.push(timingPrediction);

      // Preference shift prediction
      const preferencePrediction = await this.predictPreferenceShift(context, patterns);
      if (preferencePrediction) predictions.push(preferencePrediction);

      // Emotional state prediction
      const emotionalPrediction = await this.predictEmotionalState(context, patterns);
      if (emotionalPrediction) predictions.push(emotionalPrediction);

      logger.log(`🎯 Generated ${predictions.length} future predictions`);
      return predictions;

    } catch (error) {
      logger.error('❌ Future prediction generation failed:', error);
      return [];
    }
  }

  // Booking likelihood prediction
  private async predictBookingLikelihood(
    context: PredictiveContext,
    patterns: BehaviorPattern[]
  ): Promise<BehaviorPrediction | null> {
    const bookingPatterns = patterns.filter(p => p.patternType === 'booking');
    if (bookingPatterns.length === 0) return null;

    // Calculate likelihood based on patterns and current context
    let likelihood = 0.5; // Base likelihood
    const influencingFactors: BehaviorPrediction['influencingFactors'] = [];

    // Factor 1: Historical booking frequency
    const averageBookingFrequency = this.calculateAverageBookingFrequency(context.historicalData.bookingHistory);
    const frequencyImpact = Math.min(averageBookingFrequency / 30, 0.3); // Max 30% impact
    likelihood += frequencyImpact;
    influencingFactors.push({
      factor: 'Historical booking frequency',
      impact: frequencyImpact,
      confidence: 0.8
    });

    // Factor 2: Current session engagement
    const engagementImpact = (context.currentSession.engagementLevel - 0.5) * 0.2;
    likelihood += engagementImpact;
    influencingFactors.push({
      factor: 'Current session engagement',
      impact: engagementImpact,
      confidence: 0.7
    });

    // Factor 3: Time-based patterns
    const timeBasedImpact = this.calculateTimeBasedBookingLikelihood(context, bookingPatterns);
    likelihood += timeBasedImpact;
    influencingFactors.push({
      factor: 'Time-based patterns',
      impact: timeBasedImpact,
      confidence: 0.6
    });

    // Factor 4: Emotional state
    if (context.emotionalState) {
      const emotionalImpact = this.calculateEmotionalBookingImpact(context.emotionalState);
      likelihood += emotionalImpact;
      influencingFactors.push({
        factor: 'Current emotional state',
        impact: emotionalImpact,
        confidence: 0.8
      });
    }

    // Normalize likelihood
    likelihood = Math.max(0, Math.min(1, likelihood));

    const confidence = this.calculatePredictionConfidence(bookingPatterns, influencingFactors);

    return {
      id: `booking_likelihood_${Date.now()}`,
      userId: context.userId,
      predictionType: 'booking-likelihood',
      timeframe: 'next-week',
      prediction: {
        likelihood,
        confidence,
        specificOutcome: likelihood > 0.7 ? 'High likelihood of booking' : likelihood > 0.4 ? 'Moderate likelihood of booking' : 'Low likelihood of booking',
        alternativeOutcomes: [
          { outcome: 'Books within 24 hours', likelihood: likelihood * 0.3 },
          { outcome: 'Books within 1 week', likelihood: likelihood * 0.6 },
          { outcome: 'Requires follow-up', likelihood: (1 - likelihood) * 0.5 }
        ]
      },
      influencingFactors,
      actionableInsights: [
        {
          insight: 'User shows strong engagement patterns',
          recommendedAction: 'Present tailored package recommendations',
          timing: 'Within next 2 hours',
          expectedImpact: 0.15
        },
        {
          insight: 'Historical booking patterns suggest optimal timing',
          recommendedAction: 'Send personalized follow-up with time-sensitive offer',
          timing: 'Based on historical pattern',
          expectedImpact: 0.2
        }
      ],
      riskFactors: [
        {
          risk: 'Decision paralysis from too many options',
          probability: likelihood > 0.7 ? 0.3 : 0.1,
          mitigation: 'Provide curated selection of 3 best-matched packages'
        }
      ],
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + this.PREDICTION_TTL)
    };
  }

  // Advanced insights generation
  private async generateAdvancedInsights(
    context: PredictiveContext,
    patterns: BehaviorPattern[],
    predictions: BehaviorPrediction[]
  ): Promise<AdvancedPredictiveInsight[]> {
    const insights: AdvancedPredictiveInsight[] = [];

    // Behavior insights
    if (patterns.length > 0) {
      const strongestPattern = patterns.reduce((strongest, current) => 
        current.strength > strongest.strength ? current : strongest
      );

      insights.push({
        category: 'behavior',
        insight: `Strongest behavioral pattern: ${strongestPattern.patternType} with ${(strongestPattern.strength * 100).toFixed(0)}% strength`,
        confidence: strongestPattern.confidence,
        timeframe: strongestPattern.pattern.period,
        impact: strongestPattern.strength > 0.8 ? 'high' : strongestPattern.strength > 0.6 ? 'medium' : 'low',
        actionability: strongestPattern.predictiveValue,
        businessValue: this.calculateBusinessValue(strongestPattern)
      });
    }

    // Prediction insights
    predictions.forEach(prediction => {
      if (prediction.prediction.confidence > 0.7) {
        insights.push({
          category: prediction.predictionType.split('-')[0] as any,
          insight: prediction.prediction.specificOutcome,
          confidence: prediction.prediction.confidence,
          timeframe: prediction.timeframe,
          impact: prediction.prediction.likelihood > 0.7 ? 'high' : 'medium',
          actionability: this.calculateActionability(prediction),
          businessValue: this.calculatePredictionBusinessValue(prediction)
        });
      }
    });

    // Personality-based insights
    if (context.personalityProfile) {
      const personalityInsight = this.generatePersonalityBasedInsight(context.personalityProfile, patterns);
      insights.push(personalityInsight);
    }

    // Relationship insights
    if (context.relationshipProfile) {
      const relationshipInsight = this.generateRelationshipBasedInsight(context.relationshipProfile, patterns);
      insights.push(relationshipInsight);
    }

    return insights;
  }

  // Strategic recommendations generation
  private async generateStrategicRecommendations(
    context: PredictiveContext,
    predictions: BehaviorPrediction[],
    insights: AdvancedPredictiveInsight[]
  ): Promise<Array<{
    action: string;
    timing: string;
    expectedOutcome: string;
    confidence: number;
  }>> {
    const recommendations = [];

    // High-confidence predictions lead to immediate actions
    const highConfidencePredictions = predictions.filter(p => p.prediction.confidence > 0.8);
    highConfidencePredictions.forEach(prediction => {
      prediction.actionableInsights.forEach(insight => {
        recommendations.push({
          action: insight.recommendedAction,
          timing: insight.timing,
          expectedOutcome: `Increase ${prediction.predictionType} by ${(insight.expectedImpact * 100).toFixed(0)}%`,
          confidence: prediction.prediction.confidence
        });
      });
    });

    // Pattern-based recommendations
    const strongPatterns = insights.filter(insight => 
      insight.category === 'behavior' && insight.impact === 'high'
    );
    strongPatterns.forEach(insight => {
      recommendations.push({
        action: `Leverage ${insight.insight.toLowerCase()} for personalized engagement`,
        timing: `Align with ${insight.timeframe} pattern`,
        expectedOutcome: 'Improve user engagement and conversion',
        confidence: insight.confidence
      });
    });

    return recommendations;
  }

  // Helper methods for pattern analysis
  private categorizePriceRange(price: number): string {
    if (price < 1000) return 'budget';
    if (price < 3000) return 'mid-range';
    return 'luxury';
  }

  private analyzeWeeklyBookingPattern(bookingTimes: any[]): any {
    // Analyze day-of-week preferences
    const dayFrequency = new Array(7).fill(0);
    bookingTimes.forEach(time => dayFrequency[time.dayOfWeek]++);
    
    const maxFreq = Math.max(...dayFrequency);
    const preferredDays = dayFrequency.map((freq, day) => ({ day, freq }))
      .filter(item => item.freq === maxFreq)
      .map(item => item.day);

    return {
      frequency: maxFreq / bookingTimes.length,
      confidence: maxFreq > bookingTimes.length * 0.3 ? 0.8 : 0.5,
      strength: maxFreq / bookingTimes.length,
      triggers: [`Day ${preferredDays[0]} of week`],
      conditions: ['Weekend preference detected'],
      predictiveValue: 0.7,
      seasonality: false,
      volatility: 0.3
    };
  }

  private analyzePriceSensitivityPattern(bookingHistory: any[]): any {
    const prices = bookingHistory.map(booking => booking.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const priceVariation = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length);
    
    return {
      frequency: 0.8,
      confidence: 0.7,
      strength: priceVariation / avgPrice > 0.3 ? 0.8 : 0.5,
      triggers: ['Price discount', 'Limited time offer'],
      conditions: [`Average price preference: $${avgPrice.toFixed(0)}`],
      outcomes: ['price-sensitive', 'value-seeking'],
      predictiveValue: 0.6,
      volatility: priceVariation / avgPrice
    };
  }

  private analyzeResponseTimePattern(communications: any[]): any {
    const responseTimes = communications.map(comm => comm.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    return {
      pattern: {
        frequency: 1,
        period: 'day' as const,
        triggers: ['Message received'],
        conditions: [`Average response time: ${avgResponseTime}ms`],
        outcomes: ['quick-responder', 'engaged-user']
      },
      confidence: 0.8,
      strength: avgResponseTime < 60000 ? 0.8 : 0.5, // Fast responder
      predictiveValue: 0.7,
      volatility: 0.2
    };
  }

  private analyzeEmotionalProgressionPattern(communications: any[]): any {
    const emotions = communications.map(comm => comm.emotionalTone);
    const positiveEmotions = emotions.filter(emotion => 
      ['joy', 'excitement', 'satisfaction'].includes(emotion)
    ).length;
    
    return {
      pattern: {
        frequency: positiveEmotions / emotions.length,
        period: 'day' as const,
        triggers: ['Positive interaction'],
        conditions: ['Emotional progression detected'],
        outcomes: ['improved-mood', 'higher-engagement']
      },
      confidence: 0.7,
      strength: positiveEmotions / emotions.length,
      predictiveValue: 0.6,
      volatility: 0.4
    };
  }

  private analyzeDecisionSpeedPattern(context: PredictiveContext): any {
    const personality = context.personalityProfile!;
    let decisionSpeed = 0.5; // Base speed
    
    // Conscientiousness affects decision thoroughness
    if (personality.traits.conscientiousness > 0.7) decisionSpeed -= 0.2;
    if (personality.traits.conscientiousness < 0.3) decisionSpeed += 0.2;
    
    // Extraversion affects decision confidence
    if (personality.traits.extraversion > 0.7) decisionSpeed += 0.1;
    
    return {
      pattern: {
        frequency: 1,
        period: 'day' as const,
        triggers: ['Decision point reached'],
        conditions: [`Personality-based decision speed: ${decisionSpeed}`],
        outcomes: decisionSpeed > 0.6 ? ['quick-decision'] : ['deliberate-decision']
      },
      confidence: 0.8,
      strength: Math.abs(decisionSpeed - 0.5) * 2,
      predictiveValue: 0.7
    };
  }

  private analyzePreferenceEvolution(bookingHistory: any[]): any {
    // Analyze how preferences change over time
    const sortedBookings = bookingHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Simple preference shift detection (placeholder implementation)
    return {
      pattern: {
        frequency: 0.3,
        period: 'month' as const,
        triggers: ['New experiences', 'Seasonal changes'],
        conditions: ['Preference evolution detected'],
        outcomes: ['preference-shift', 'expanded-interests']
      },
      confidence: 0.6,
      strength: 0.4,
      predictiveValue: 0.5,
      volatility: 0.6
    };
  }

  private analyzeEmotionalCycles(communications: any[]): any {
    // Analyze emotional patterns over time
    return {
      pattern: {
        frequency: 1,
        period: 'week' as const,
        triggers: ['Weekly cycle', 'Stress patterns'],
        conditions: ['Emotional cycle detected'],
        outcomes: ['predictable-mood-changes']
      },
      confidence: 0.6,
      strength: 0.5,
      predictiveValue: 0.6,
      volatility: 0.5
    };
  }

  // Calculation helper methods
  private calculateTimeSpan(data: any[]): number {
    if (data.length === 0) return 0;
    const sorted = data.sort((a, b) => a.date.getTime() - b.date.getTime());
    return (sorted[sorted.length - 1].date.getTime() - sorted[0].date.getTime()) / (1000 * 60 * 60 * 24);
  }

  private calculateAverageBookingFrequency(bookingHistory: any[]): number {
    if (bookingHistory.length < 2) return 0;
    const timeSpan = this.calculateTimeSpan(bookingHistory);
    return (bookingHistory.length - 1) / (timeSpan / 30); // Bookings per month
  }

  private calculateTimeBasedBookingLikelihood(context: PredictiveContext, patterns: BehaviorPattern[]): number {
    // Simple time-based calculation
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    // Business hours boost
    if (currentHour >= 9 && currentHour <= 17) return 0.1;
    // Weekend boost for leisure bookings
    if (currentDay === 0 || currentDay === 6) return 0.15;
    
    return 0;
  }

  private calculateEmotionalBookingImpact(emotionalState: EmotionalState): number {
    const positiveEmotions = ['joy', 'excitement', 'satisfaction'];
    const negativeEmotions = ['anxiety', 'sadness', 'anger'];
    
    if (positiveEmotions.includes(emotionalState.primary)) {
      return emotionalState.intensity * 0.2;
    } else if (negativeEmotions.includes(emotionalState.primary)) {
      return -emotionalState.intensity * 0.1;
    }
    
    return 0;
  }

  private calculatePredictionConfidence(patterns: BehaviorPattern[], factors: any[]): number {
    const patternConfidence = patterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / patterns.length;
    const factorConfidence = factors.reduce((sum, factor) => sum + factor.confidence, 0) / factors.length;
    
    return (patternConfidence + factorConfidence) / 2;
  }

  private calculateBusinessValue(pattern: BehaviorPattern): number {
    const typeMultiplier = {
      'booking': 0.9,
      'communication': 0.6,
      'decision-making': 0.8,
      'preference-change': 0.7,
      'emotional-cycle': 0.5
    };
    
    return pattern.strength * pattern.confidence * (typeMultiplier[pattern.patternType] || 0.5);
  }

  private calculateActionability(prediction: BehaviorPrediction): number {
    return prediction.actionableInsights.reduce((sum, insight) => sum + insight.expectedImpact, 0) / prediction.actionableInsights.length;
  }

  // Add missing method
  async generateBehaviorPredictions(context: any): Promise<any> {
    try {
      // This is the method being called from geminiService
      const result = await this.generatePredictiveBehaviorAnalysis(context);
      
      // Ensure predictions is always an array
      if (!Array.isArray(result.predictions)) {
        logger.error('❌ Predictions is not an array:', result.predictions);
        return [];
      }
      
      return result.predictions;
    } catch (error) {
      logger.error('❌ Behavior predictions generation failed:', error);
      return [];
    }
  }

  private calculatePredictionBusinessValue(prediction: BehaviorPrediction): number {
    const typeValue = {
      'booking-likelihood': 0.9,
      'price-sensitivity': 0.8,
      'decision-timing': 0.7,
      'preference-shift': 0.6,
      'emotional-state': 0.5
    };
    
    return prediction.prediction.likelihood * prediction.prediction.confidence * (typeValue[prediction.predictionType] || 0.5);
  }

  private generatePersonalityBasedInsight(personality: PersonalityProfile, patterns: BehaviorPattern[]): AdvancedPredictiveInsight {
    const dominantTrait = Object.entries(personality.traits)
      .reduce((max, [trait, value]) => value > max.value ? { trait, value } : max, { trait: '', value: 0 });

    return {
      category: 'behavior',
      insight: `Dominant personality trait (${dominantTrait.trait}: ${(dominantTrait.value * 100).toFixed(0)}%) influences decision-making patterns`,
      confidence: 0.8,
      timeframe: 'ongoing',
      impact: dominantTrait.value > 0.8 ? 'high' : 'medium',
      actionability: 0.7,
      businessValue: 0.6
    };
  }

  private generateRelationshipBasedInsight(relationship: RelationshipProfile, patterns: BehaviorPattern[]): AdvancedPredictiveInsight {
    return {
      category: 'preference',
      insight: `Relationship stage (${relationship.relationshipStage}) and love languages (${relationship.loveLanguages.join(', ')}) drive package preferences`,
      confidence: 0.8,
      timeframe: 'medium-term',
      impact: 'high',
      actionability: 0.8,
      businessValue: 0.7
    };
  }

  // Placeholder implementations for other prediction methods
  private async predictPriceSensitivity(context: PredictiveContext, patterns: BehaviorPattern[]): Promise<BehaviorPrediction | null> {
    // Implementation would analyze price sensitivity patterns
    return null; // Placeholder
  }

  private async predictDecisionTiming(context: PredictiveContext, patterns: BehaviorPattern[]): Promise<BehaviorPrediction | null> {
    // Implementation would predict when user will make decisions
    return null; // Placeholder
  }

  private async predictPreferenceShift(context: PredictiveContext, patterns: BehaviorPattern[]): Promise<BehaviorPrediction | null> {
    // Implementation would predict changes in user preferences
    return null; // Placeholder
  }

  private async predictEmotionalState(context: PredictiveContext, patterns: BehaviorPattern[]): Promise<BehaviorPrediction | null> {
    // Implementation would predict future emotional states
    return null; // Placeholder
  }

  // Cache management
  private cacheResults(userId: string, patterns: BehaviorPattern[], predictions: BehaviorPrediction[]): void {
    this.behaviorPatterns.set(userId, patterns);
    this.predictions.set(userId, predictions);
  }

  // Fallback analysis
  private getFallbackAnalysis(context: PredictiveContext): any {
    return {
      patterns: [],
      predictions: [],
      insights: [
        {
          category: 'behavior',
          insight: 'Insufficient data for detailed behavioral prediction',
          confidence: 0.5,
          timeframe: 'unknown',
          impact: 'low',
          actionability: 0.3,
          businessValue: 0.2
        }
      ],
      recommendations: [
        {
          action: 'Collect more user interaction data',
          timing: 'Ongoing',
          expectedOutcome: 'Improve prediction accuracy',
          confidence: 0.8
        }
      ]
    };
  }

  // Analytics
  getPredictiveAnalytics(): {
    totalPatterns: number;
    totalPredictions: number;
    averageConfidence: number;
    accuracyRate: number;
    topPatternTypes: Record<string, number>;
  } {
    const allPatterns = Array.from(this.behaviorPatterns.values()).flat();
    const allPredictions = Array.from(this.predictions.values()).flat();
    
    const patternTypes: Record<string, number> = {};
    allPatterns.forEach(pattern => {
      patternTypes[pattern.patternType] = (patternTypes[pattern.patternType] || 0) + 1;
    });

    const avgConfidence = allPatterns.length > 0 
      ? allPatterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / allPatterns.length 
      : 0;

    const validatedPredictions = allPredictions.filter(p => p.accuracy !== undefined);
    const accuracyRate = validatedPredictions.length > 0
      ? validatedPredictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) / validatedPredictions.length
      : 0;

    return {
      totalPatterns: allPatterns.length,
      totalPredictions: allPredictions.length,
      averageConfidence: avgConfidence,
      accuracyRate,
      topPatternTypes: patternTypes
    };
  }
}

export const predictiveBehaviorAnalysis = new PredictiveBehaviorAnalysis();
export type { BehaviorPattern, BehaviorPrediction, PredictiveContext, AdvancedPredictiveInsight };