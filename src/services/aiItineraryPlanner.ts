import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { PersonalityProfile, EmotionalState } from './emotionalIntelligence';
import { RelationshipProfile } from './romanticRelationshipAI';

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  mood: 'romantic' | 'adventure' | 'relaxing' | 'cultural' | 'exciting';
  activities: ItineraryActivity[];
  meals: ItineraryMeal[];
  accommodation: {
    name: string;
    type: 'hotel' | 'resort' | 'villa' | 'boutique';
    specialFeatures: string[];
    romantixIndex: number; // 0-1
  };
  budget: {
    estimated: number;
    breakdown: Record<string, number>;
  };
  weatherConsiderations: string[];
  relationshipFocus: string[];
  personalityAlignment: string[];
}

interface ItineraryActivity {
  id: string;
  name: string;
  type: 'sightseeing' | 'adventure' | 'romantic' | 'cultural' | 'relaxation' | 'dining' | 'shopping';
  duration: number; // minutes
  startTime: string;
  endTime: string;
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
    address: string;
  };
  description: string;
  personalizedReason: string;
  emotionalBenefit: string;
  relationshipValue: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  cost: {
    estimated: number;
    currency: string;
    includes: string[];
  };
  bookingRequired: boolean;
  alternatives: string[];
  weatherDependency: 'none' | 'low' | 'medium' | 'high';
  crowdLevel: 'low' | 'medium' | 'high';
  intimacyLevel: 'private' | 'semi-private' | 'public';
  photoOpportunities: string[];
  memoryPotential: number; // 0-1
}

interface ItineraryMeal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  cuisine: string;
  style: 'casual' | 'fine-dining' | 'street-food' | 'romantic' | 'local-experience';
  estimatedCost: number;
  location: string;
  specialFeatures: string[];
  dietaryOptions: string[];
  romantizIndex: number; // 0-1
  personalizedNote: string;
}

interface SmartItinerary {
  id: string;
  title: string;
  destination: string;
  duration: number; // days
  totalBudget: {
    estimated: number;
    breakdown: {
      accommodation: number;
      activities: number;
      meals: number;
      transportation: number;
      miscellaneous: number;
    };
  };
  personalityAlignment: number; // 0-1
  relationshipCompatibility: number; // 0-1
  emotionalJourney: {
    startMood: string;
    targetMood: string;
    moodProgression: string[];
  };
  seasonalOptimization: {
    bestTiming: string[];
    weatherAdvantages: string[];
    seasonalActivities: string[];
  };
  days: ItineraryDay[];
  emergencyPlans: {
    badWeather: ItineraryActivity[];
    budgetCuts: string[];
    timeConstraints: string[];
  };
  sustainabilityScore: number; // 0-1
  uniquenessScore: number; // 0-1
  instagrammability: number; // 0-1
  aiInsights: string[];
  generationMetadata: {
    createdAt: Date;
    personalityFactors: string[];
    emotionalFactors: string[];
    relationshipFactors: string[];
    confidenceScore: number;
  };
}

interface ItineraryGenerationContext {
  userId: string;
  partnerUserId?: string;
  destination: string;
  duration: number;
  budget?: { min: number; max: number };
  travelDates?: { start: Date; end: Date };
  personalityProfile?: PersonalityProfile;
  emotionalState?: EmotionalState;
  relationshipProfile?: RelationshipProfile;
  preferences: {
    pace: 'slow' | 'moderate' | 'fast';
    activityTypes: string[];
    mealPreferences: string[];
    accommodationStyle: string[];
    interests: string[];
    avoidances: string[];
  };
  specialRequests?: string[];
  previousTrips?: string[];
  celebrationReason?: string;
}

class AIItineraryPlanner {
  private itineraryCache: Map<string, SmartItinerary> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  // Ana akıllı itinerary generation
  async generateSmartItinerary(context: ItineraryGenerationContext): Promise<SmartItinerary> {
    logger.log('🎨 Generating AI-powered smart itinerary for:', context.destination);

    try {
      // Cache kontrol
      const cacheKey = this.generateCacheKey(context);
      const cached = this.getCachedItinerary(cacheKey);
      if (cached) {
        logger.log('✅ Using cached smart itinerary');
        return cached;
      }

      // Multi-layer itinerary analysis
      const analysisResults = await Promise.all([
        this.analyzeDestinationIntelligence(context),
        this.analyzePersonalityItineraryPreferences(context),
        this.analyzeRelationshipItineraryNeeds(context),
        this.analyzeEmotionalJourneyMapping(context),
        this.analyzeSeasonalOptimization(context)
      ]);

      const [destIntel, personalityPrefs, relationshipNeeds, emotionalJourney, seasonalOpt] = analysisResults;

      // Generate day-by-day intelligent itinerary
      const days = await this.generateIntelligentDays(context, {
        destIntel,
        personalityPrefs,
        relationshipNeeds,
        emotionalJourney,
        seasonalOpt
      });

      // Create comprehensive itinerary
      const smartItinerary = await this.assembleSmartItinerary(context, days, {
        destIntel,
        personalityPrefs,
        relationshipNeeds,
        emotionalJourney,
        seasonalOpt
      });

      // Cache results
      this.setCachedItinerary(cacheKey, smartItinerary);

      logger.log(`✨ Generated smart itinerary with ${days.length} days, personality alignment: ${(smartItinerary.personalityAlignment * 100).toFixed(0)}%`);
      return smartItinerary;

    } catch (error) {
      logger.error('❌ Smart itinerary generation failed:', error);
      return this.getFallbackItinerary(context);
    }
  }

  // Destination intelligence analysis
  private async analyzeDestinationIntelligence(context: ItineraryGenerationContext): Promise<any> {
    const intelligencePrompt = `
    Analyze ${context.destination} for comprehensive itinerary planning:
    
    DESTINATION: ${context.destination}
    DURATION: ${context.duration} days
    BUDGET RANGE: ${context.budget ? `$${context.budget.min}-${context.budget.max}` : 'Flexible'}
    TRAVEL STYLE: ${context.preferences.pace} pace
    
    Provide detailed intelligence on:
    1. Must-see attractions with timing optimization
    2. Hidden gems and local secrets
    3. Seasonal considerations and weather patterns
    4. Cultural nuances and local customs
    5. Transportation options and logistics
    6. Best neighborhoods for different activities
    7. Price ranges and budget optimization tips
    8. Safety considerations and local advice
    9. Romantic spots and couple-friendly venues
    10. Unique experiences unavailable elsewhere
    
    Focus on creating unforgettable, personalized experiences.
    `;

    try {
      const analyzeDestination = httpsCallable(functions, 'analyzeDestinationIntelligence');
      const result = await analyzeDestination({
        prompt: intelligencePrompt,
        destination: context.destination,
        context
      });

      const data = result.data as any;
      return data.success ? data.intelligence : this.getFallbackDestinationIntel(context);
    } catch (error) {
      logger.error('❌ Destination intelligence analysis failed:', error);
      return this.getFallbackDestinationIntel(context);
    }
  }

  // Personality-based itinerary preferences
  private async analyzePersonalityItineraryPreferences(context: ItineraryGenerationContext): Promise<any> {
    if (!context.personalityProfile) return { preferences: [], insights: [] };

    const personalityPrefs = {
      insights: [
        `Communication style: ${context.personalityProfile.communicationStyle}`,
        `Decision making: ${context.personalityProfile.decisionMaking}`,
        `Risk tolerance: ${context.personalityProfile.riskTolerance}`
      ],
      preferences: this.generatePersonalityBasedPreferences(context.personalityProfile),
      paceRecommendation: this.getPersonalityBasedPace(context.personalityProfile),
      activityStyle: this.getPersonalityBasedActivityStyle(context.personalityProfile),
      socialLevel: this.getPersonalityBasedSocialLevel(context.personalityProfile)
    };

    return personalityPrefs;
  }

  // Relationship-based itinerary needs
  private async analyzeRelationshipItineraryNeeds(context: ItineraryGenerationContext): Promise<any> {
    if (!context.relationshipProfile) return { needs: [], insights: [] };

    const relationshipNeeds = {
      insights: [
        `Relationship stage: ${context.relationshipProfile.relationshipStage}`,
        `Love languages: ${context.relationshipProfile.loveLanguages.join(', ')}`,
        `Communication style: ${context.relationshipProfile.communicationStyle}`
      ],
      bonding: this.getRelationshipBondingActivities(context.relationshipProfile),
      intimacy: this.getRelationshipIntimacyNeeds(context.relationshipProfile),
      communication: this.getRelationshipCommunicationActivities(context.relationshipProfile),
      conflictPrevention: this.getRelationshipConflictPrevention(context.relationshipProfile)
    };

    return relationshipNeeds;
  }

  // Emotional journey mapping
  private async analyzeEmotionalJourneyMapping(context: ItineraryGenerationContext): Promise<any> {
    if (!context.emotionalState) return { journey: [], insights: [] };

    const emotionalJourney = {
      currentState: context.emotionalState.primary,
      targetState: this.getTargetEmotionalState(context.emotionalState, context.celebrationReason),
      progression: this.mapEmotionalProgression(context.emotionalState, context.duration),
      therapeuticActivities: this.getTherapeuticActivities(context.emotionalState),
      moodBoostingExperiences: this.getMoodBoostingExperiences(context.emotionalState)
    };

    return emotionalJourney;
  }

  // Seasonal optimization analysis
  private async analyzeSeasonalOptimization(context: ItineraryGenerationContext): Promise<any> {
    const season = context.travelDates ? this.determineSeason(context.travelDates.start) : 'unknown';
    
    const seasonalOpt = {
      season,
      advantages: this.getSeasonalAdvantages(context.destination, season),
      activities: this.getSeasonalActivities(context.destination, season),
      timing: this.getOptimalTimingAdvice(context.destination, season),
      clothing: this.getSeasonalClothingAdvice(context.destination, season),
      pricing: this.getSeasonalPricingInsights(context.destination, season)
    };

    return seasonalOpt;
  }

  // Generate intelligent days
  private async generateIntelligentDays(
    context: ItineraryGenerationContext,
    insights: any
  ): Promise<ItineraryDay[]> {
    const days: ItineraryDay[] = [];
    
    for (let dayNum = 1; dayNum <= context.duration; dayNum++) {
      const dayTheme = this.getDayTheme(dayNum, context.duration, insights);
      const dayMood = this.getDayMood(dayNum, insights.emotionalJourney);
      
      const day = await this.generateSingleDay(dayNum, dayTheme, dayMood, context, insights);
      days.push(day);
    }

    return days;
  }

  // Generate single intelligent day
  private async generateSingleDay(
    dayNum: number,
    theme: string,
    mood: string,
    context: ItineraryGenerationContext,
    insights: any
  ): Promise<ItineraryDay> {
    const date = context.travelDates 
      ? new Date(context.travelDates.start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : `Day ${dayNum}`;

    // Generate activities based on theme, mood, and insights
    const activities = await this.generateDayActivities(theme, mood, context, insights);
    const meals = await this.generateDayMeals(theme, mood, context, insights);
    const accommodation = this.generateDayAccommodation(context, insights);

    return {
      day: dayNum,
      date,
      theme,
      mood: mood as any,
      activities,
      meals,
      accommodation,
      budget: this.calculateDayBudget(activities, meals, accommodation),
      weatherConsiderations: this.getWeatherConsiderations(context.destination, date),
      relationshipFocus: this.getDayRelationshipFocus(dayNum, insights.relationshipNeeds),
      personalityAlignment: this.getDayPersonalityAlignment(activities, insights.personalityPrefs)
    };
  }

  // Helper methods for activity generation
  private async generateDayActivities(
    theme: string,
    mood: string,
    context: ItineraryGenerationContext,
    insights: any
  ): Promise<ItineraryActivity[]> {
    const activities: ItineraryActivity[] = [];
    
    // Morning activity (9-12)
    activities.push(this.createMorningActivity(theme, mood, context, insights));
    
    // Afternoon activity (14-17)
    activities.push(this.createAfternoonActivity(theme, mood, context, insights));
    
    // Evening activity (19-22)
    activities.push(this.createEveningActivity(theme, mood, context, insights));

    return activities;
  }

  private createMorningActivity(theme: string, mood: string, context: ItineraryGenerationContext, insights: any): ItineraryActivity {
    const baseActivity = {
      id: `morning-${Date.now()}`,
      startTime: '09:00',
      endTime: '12:00',
      duration: 180,
      difficulty: 'easy' as const,
      crowdLevel: 'low' as const,
      intimacyLevel: 'semi-private' as const,
      weatherDependency: 'medium' as const,
      bookingRequired: false,
      memoryPotential: 0.7
    };

    if (theme === 'romantic' && mood === 'relaxing') {
      return {
        ...baseActivity,
        name: 'Couples Spa Morning',
        type: 'relaxation',
        location: { name: `Luxury Spa in ${context.destination}`, address: 'Central location' },
        description: 'Start your day with a rejuvenating couples massage and spa treatments',
        personalizedReason: 'Perfect for intimate bonding and relaxation',
        emotionalBenefit: 'Reduces stress and enhances connection',
        relationshipValue: 'Creates shared moments of tranquility',
        cost: { estimated: 200, currency: 'USD', includes: ['Couples massage', 'Spa access', 'Refreshments'] },
        alternatives: ['Beach walk', 'Hotel breakfast in bed'],
        photoOpportunities: ['Spa setting', 'Relaxed couple moments']
      };
    }

    // Default morning activity
    return {
      ...baseActivity,
      name: 'Local Market Exploration',
      type: 'cultural',
      location: { name: `Local Market in ${context.destination}`, address: 'City center' },
      description: 'Explore local culture through authentic market experiences',
      personalizedReason: 'Great for cultural immersion and interaction',
      emotionalBenefit: 'Stimulates curiosity and shared discovery',
      relationshipValue: 'Encourages teamwork and shared experiences',
      cost: { estimated: 50, currency: 'USD', includes: ['Market entry', 'Local snacks', 'Souvenirs'] },
      alternatives: ['Museum visit', 'Walking tour'],
      photoOpportunities: ['Local culture', 'Authentic moments']
    };
  }

  private createAfternoonActivity(theme: string, mood: string, context: ItineraryGenerationContext, insights: any): ItineraryActivity {
    // Implementation for afternoon activities...
    return this.createMorningActivity(theme, mood, context, insights); // Placeholder
  }

  private createEveningActivity(theme: string, mood: string, context: ItineraryGenerationContext, insights: any): ItineraryActivity {
    // Implementation for evening activities...
    return this.createMorningActivity(theme, mood, context, insights); // Placeholder
  }

  // Helper methods
  private generatePersonalityBasedPreferences(profile: PersonalityProfile): string[] {
    const prefs = [];
    
    if (profile.traits.openness > 0.7) prefs.push('unique-experiences', 'cultural-immersion');
    if (profile.traits.extraversion > 0.7) prefs.push('social-activities', 'group-experiences');
    if (profile.traits.conscientiousness > 0.7) prefs.push('well-planned-activities', 'reliable-bookings');
    
    return prefs;
  }

  private getPersonalityBasedPace(profile: PersonalityProfile): string {
    if (profile.traits.conscientiousness > 0.7) return 'structured';
    if (profile.traits.openness > 0.7) return 'flexible';
    return 'moderate';
  }

  private getPersonalityBasedActivityStyle(profile: PersonalityProfile): string {
    if (profile.traits.extraversion > 0.7) return 'social';
    if (profile.traits.openness > 0.7) return 'exploratory';
    return 'intimate';
  }

  private getPersonalityBasedSocialLevel(profile: PersonalityProfile): string {
    if (profile.traits.extraversion > 0.7) return 'high';
    if (profile.traits.extraversion < 0.3) return 'low';
    return 'medium';
  }

  private getRelationshipBondingActivities(profile: RelationshipProfile): string[] {
    const activities = [];
    
    if (profile.loveLanguages.includes('quality-time')) {
      activities.push('private-dining', 'couples-activities', 'uninterrupted-experiences');
    }
    if (profile.loveLanguages.includes('physical-touch')) {
      activities.push('couples-spa', 'dancing', 'close-contact-activities');
    }
    
    return activities;
  }

  private getRelationshipIntimacyNeeds(profile: RelationshipProfile): string[] {
    const needs = [];
    
    if (profile.relationshipStage === 'new-relationship') {
      needs.push('getting-to-know', 'conversation-starters', 'shared-discoveries');
    } else if (profile.relationshipStage === 'married') {
      needs.push('rekindling-romance', 'new-shared-experiences', 'quality-time');
    }
    
    return needs;
  }

  private getRelationshipCommunicationActivities(profile: RelationshipProfile): string[] {
    return ['meaningful-conversations', 'shared-reflections', 'collaborative-activities'];
  }

  private getRelationshipConflictPrevention(profile: RelationshipProfile): string[] {
    const prevention = [];
    
    if (profile.conflictResolutionStyle === 'avoider') {
      prevention.push('low-stress-activities', 'flexible-timing', 'backup-plans');
    } else if (profile.conflictResolutionStyle === 'competitor') {
      prevention.push('clear-expectations', 'defined-roles', 'structured-activities');
    }
    
    return prevention;
  }

  // More helper methods...
  private getTargetEmotionalState(current: EmotionalState, celebration?: string): string {
    if (celebration === 'honeymoon') return 'blissful';
    if (current.primary === 'anxiety') return 'calm';
    if (current.primary === 'sadness') return 'joy';
    return 'content';
  }

  private mapEmotionalProgression(current: EmotionalState, duration: number): string[] {
    const progression = [current.primary];
    const target = this.getTargetEmotionalState(current);
    
    // Simple progression logic
    for (let i = 1; i < duration; i++) {
      if (i === Math.floor(duration / 2)) progression.push('transitional');
      if (i === duration - 1) progression.push(target);
      else progression.push('improving');
    }
    
    return progression;
  }

  private getTherapeuticActivities(state: EmotionalState): string[] {
    const activities = [];
    
    if (state.primary === 'anxiety') activities.push('meditation', 'nature-walks', 'spa-treatments');
    if (state.primary === 'sadness') activities.push('uplifting-experiences', 'social-activities', 'achievement-activities');
    
    return activities;
  }

  private getMoodBoostingExperiences(state: EmotionalState): string[] {
    return ['scenic-views', 'accomplishment-activities', 'surprise-elements', 'comfort-experiences'];
  }

  private determineSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getSeasonalAdvantages(destination: string, season: string): string[] {
    // This would be a comprehensive database lookup in reality
    return [`Better weather for ${season}`, `Seasonal activities available`, `Lower crowds`];
  }

  private getSeasonalActivities(destination: string, season: string): string[] {
    return [`${season} festivals`, `Seasonal cuisine`, `Weather-appropriate activities`];
  }

  private getOptimalTimingAdvice(destination: string, season: string): string[] {
    return ['Best times for outdoor activities', 'Avoiding peak crowds', 'Weather windows'];
  }

  private getSeasonalClothingAdvice(destination: string, season: string): string[] {
    return [`${season} appropriate clothing`, 'Layer recommendations', 'Special equipment needed'];
  }

  private getSeasonalPricingInsights(destination: string, season: string): string[] {
    return ['Peak vs off-peak pricing', 'Seasonal discounts available', 'Best booking timing'];
  }

  private getDayTheme(dayNum: number, totalDays: number, insights: any): string {
    if (dayNum === 1) return 'arrival-exploration';
    if (dayNum === totalDays) return 'farewell-memorable';
    if (dayNum === Math.ceil(totalDays / 2)) return 'romantic-peak';
    return ['cultural', 'adventure', 'relaxation'][dayNum % 3];
  }

  private getDayMood(dayNum: number, emotionalJourney: any): string {
    return emotionalJourney.progression[dayNum - 1] || 'content';
  }

  // Cache and utility methods
  private generateCacheKey(context: ItineraryGenerationContext): string {
    const keyData = {
      destination: context.destination,
      duration: context.duration,
      userId: context.userId,
      preferences: JSON.stringify(context.preferences)
    };
    return `itinerary_${JSON.stringify(keyData).hashCode()}`;
  }

  private getCachedItinerary(key: string): SmartItinerary | null {
    const cached = this.itineraryCache.get(key);
    if (cached) {
      const age = Date.now() - cached.generationMetadata.createdAt.getTime();
      if (age < this.CACHE_TTL) return cached;
    }
    return null;
  }

  private setCachedItinerary(key: string, itinerary: SmartItinerary): void {
    this.itineraryCache.set(key, itinerary);
    
    // Cache cleanup
    if (this.itineraryCache.size > 50) {
      const entries = Array.from(this.itineraryCache.entries());
      entries.slice(0, 25).forEach(([key]) => this.itineraryCache.delete(key));
    }
  }

  private async generateDayMeals(theme: string, mood: string, context: ItineraryGenerationContext, insights: any): Promise<ItineraryMeal[]> {
    return [
      {
        type: 'breakfast',
        name: 'Local Breakfast Experience',
        cuisine: 'Local',
        style: 'local-experience',
        estimatedCost: 30,
        location: 'Hotel/Local cafe',
        specialFeatures: ['Fresh ingredients', 'Local specialties'],
        dietaryOptions: ['Vegetarian options available'],
        romantixIndex: 0.7,
        personalizedNote: 'Start your day with authentic local flavors'
      },
      {
        type: 'lunch',
        name: 'Scenic Lunch',
        cuisine: 'International',
        style: 'casual',
        estimatedCost: 50,
        location: 'Restaurant with view',
        specialFeatures: ['Great views', 'Photo opportunities'],
        dietaryOptions: ['Various options'],
        romantixIndex: 0.8,
        personalizedNote: 'Perfect for midday relaxation and conversation'
      },
      {
        type: 'dinner',
        name: 'Romantic Dinner',
        cuisine: 'Fine dining',
        style: 'romantic',
        estimatedCost: 120,
        location: 'Premium restaurant',
        specialFeatures: ['Intimate setting', 'Premium service'],
        dietaryOptions: ['Custom menu available'],
        romantixIndex: 0.95,
        personalizedNote: 'A magical evening to remember'
      }
    ];
  }

  private generateDayAccommodation(context: ItineraryGenerationContext, insights: any): ItineraryDay['accommodation'] {
    return {
      name: `Premium Hotel in ${context.destination}`,
      type: 'hotel',
      specialFeatures: ['Romantic setting', 'Great service', 'Luxury amenities'],
      romantixIndex: 0.9
    };
  }

  private calculateDayBudget(activities: ItineraryActivity[], meals: ItineraryMeal[], accommodation: any): ItineraryDay['budget'] {
    const activityCost = activities.reduce((sum, activity) => sum + activity.cost.estimated, 0);
    const mealCost = meals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
    const accommodationCost = 200; // Base accommodation cost
    
    return {
      estimated: activityCost + mealCost + accommodationCost,
      breakdown: {
        activities: activityCost,
        meals: mealCost,
        accommodation: accommodationCost,
        transportation: 50,
        miscellaneous: 30
      }
    };
  }

  private getWeatherConsiderations(destination: string, date: string): string[] {
    return ['Check weather forecast', 'Pack accordingly', 'Have indoor alternatives'];
  }

  private getDayRelationshipFocus(dayNum: number, relationshipNeeds: any): string[] {
    return relationshipNeeds.bonding || ['quality-time', 'shared-experiences'];
  }

  private getDayPersonalityAlignment(activities: ItineraryActivity[], personalityPrefs: any): string[] {
    return personalityPrefs.preferences || ['well-matched', 'personality-aligned'];
  }

  private async assembleSmartItinerary(
    context: ItineraryGenerationContext,
    days: ItineraryDay[],
    insights: any
  ): Promise<SmartItinerary> {
    const totalBudget = days.reduce((sum, day) => sum + day.budget.estimated, 0);
    
    return {
      id: `itinerary_${Date.now()}`,
      title: `AI-Crafted ${context.destination} Experience`,
      destination: context.destination,
      duration: context.duration,
      totalBudget: {
        estimated: totalBudget,
        breakdown: {
          accommodation: days.reduce((sum, day) => sum + day.budget.breakdown.accommodation, 0),
          activities: days.reduce((sum, day) => sum + day.budget.breakdown.activities, 0),
          meals: days.reduce((sum, day) => sum + day.budget.breakdown.meals, 0),
          transportation: days.reduce((sum, day) => sum + day.budget.breakdown.transportation, 0),
          miscellaneous: days.reduce((sum, day) => sum + day.budget.breakdown.miscellaneous, 0)
        }
      },
      personalityAlignment: insights.personalityPrefs ? 0.9 : 0.7,
      relationshipCompatibility: insights.relationshipNeeds ? 0.9 : 0.7,
      emotionalJourney: {
        startMood: context.emotionalState?.primary || 'neutral',
        targetMood: insights.emotionalJourney?.targetState || 'happy',
        moodProgression: insights.emotionalJourney?.progression || ['improving']
      },
      seasonalOptimization: {
        bestTiming: insights.seasonalOpt?.timing || ['Anytime'],
        weatherAdvantages: insights.seasonalOpt?.advantages || ['Good weather'],
        seasonalActivities: insights.seasonalOpt?.activities || ['Year-round activities']
      },
      days,
      emergencyPlans: {
        badWeather: days[0]?.activities.filter(a => a.weatherDependency === 'none') || [],
        budgetCuts: ['Reduce dining expenses', 'Choose free activities'],
        timeConstraints: ['Prioritize must-see attractions', 'Use efficient transportation']
      },
      sustainabilityScore: 0.7,
      uniquenessScore: 0.8,
      instagrammability: 0.9,
      aiInsights: [
        'Optimized for your personality type',
        'Relationship-strengthening activities included',
        'Perfect balance of adventure and relaxation',
        'Local experiences prioritized'
      ],
      generationMetadata: {
        createdAt: new Date(),
        personalityFactors: insights.personalityPrefs?.insights || [],
        emotionalFactors: insights.emotionalJourney ? [insights.emotionalJourney.currentState] : [],
        relationshipFactors: insights.relationshipNeeds?.insights || [],
        confidenceScore: 0.9
      }
    };
  }

  private getFallbackDestinationIntel(context: ItineraryGenerationContext): any {
    return {
      attractions: [`Top attractions in ${context.destination}`],
      insights: ['Popular destination with many options'],
      recommendations: ['Great for couples', 'Suitable for honeymoons']
    };
  }

  private getFallbackItinerary(context: ItineraryGenerationContext): SmartItinerary {
    const fallbackDay: ItineraryDay = {
      day: 1,
      date: 'Day 1',
      theme: 'exploration',
      mood: 'exciting',
      activities: [
        {
          id: 'fallback-1',
          name: 'City Exploration',
          type: 'sightseeing',
          duration: 180,
          startTime: '10:00',
          endTime: '13:00',
          location: { name: context.destination, address: 'City center' },
          description: 'Explore the main attractions',
          personalizedReason: 'Great introduction to the destination',
          emotionalBenefit: 'Exciting discovery',
          relationshipValue: 'Shared exploration',
          difficulty: 'easy',
          cost: { estimated: 50, currency: 'USD', includes: ['Entry fees'] },
          bookingRequired: false,
          alternatives: ['Walking tour'],
          weatherDependency: 'medium',
          crowdLevel: 'medium',
          intimacyLevel: 'public',
          photoOpportunities: ['Landmarks'],
          memoryPotential: 0.8
        }
      ],
      meals: [
        {
          type: 'dinner',
          name: 'Local Restaurant',
          cuisine: 'Local',
          style: 'casual',
          estimatedCost: 60,
          location: 'City center',
          specialFeatures: ['Local cuisine'],
          dietaryOptions: ['Various'],
          romantixIndex: 0.7,
          personalizedNote: 'Taste the local flavors'
        }
      ],
      accommodation: {
        name: `Hotel in ${context.destination}`,
        type: 'hotel',
        specialFeatures: ['Comfortable', 'Well-located'],
        romantixIndex: 0.7
      },
      budget: {
        estimated: 200,
        breakdown: { activities: 50, meals: 60, accommodation: 90, transportation: 0, miscellaneous: 0 }
      },
      weatherConsiderations: ['Standard weather precautions'],
      relationshipFocus: ['quality-time'],
      personalityAlignment: ['general-appeal']
    };

    return {
      id: `fallback_${Date.now()}`,
      title: `${context.destination} Experience`,
      destination: context.destination,
      duration: context.duration,
      totalBudget: {
        estimated: 200 * context.duration,
        breakdown: {
          accommodation: 90 * context.duration,
          activities: 50 * context.duration,
          meals: 60 * context.duration,
          transportation: 0,
          miscellaneous: 0
        }
      },
      personalityAlignment: 0.6,
      relationshipCompatibility: 0.6,
      emotionalJourney: {
        startMood: 'neutral',
        targetMood: 'happy',
        moodProgression: ['improving']
      },
      seasonalOptimization: {
        bestTiming: ['Flexible'],
        weatherAdvantages: ['Generally good'],
        seasonalActivities: ['Year-round options']
      },
      days: Array(context.duration).fill(null).map((_, i) => ({
        ...fallbackDay,
        day: i + 1,
        date: `Day ${i + 1}`
      })),
      emergencyPlans: {
        badWeather: [fallbackDay.activities[0]],
        budgetCuts: ['Choose budget options'],
        timeConstraints: ['Focus on essentials']
      },
      sustainabilityScore: 0.5,
      uniquenessScore: 0.5,
      instagrammability: 0.6,
      aiInsights: ['Basic itinerary structure', 'Suitable for general travelers'],
      generationMetadata: {
        createdAt: new Date(),
        personalityFactors: [],
        emotionalFactors: [],
        relationshipFactors: [],
        confidenceScore: 0.6
      }
    };
  }

  // Analytics
  getItineraryAnalytics(): {
    totalGenerated: number;
    averagePersonalityAlignment: number;
    averageRelationshipCompatibility: number;
    popularDestinations: Record<string, number>;
    averageDuration: number;
  } {
    const itineraries = Array.from(this.itineraryCache.values());
    
    const destinations: Record<string, number> = {};
    let totalPersonality = 0;
    let totalRelationship = 0;
    let totalDuration = 0;

    itineraries.forEach(itinerary => {
      destinations[itinerary.destination] = (destinations[itinerary.destination] || 0) + 1;
      totalPersonality += itinerary.personalityAlignment;
      totalRelationship += itinerary.relationshipCompatibility;
      totalDuration += itinerary.duration;
    });

    return {
      totalGenerated: itineraries.length,
      averagePersonalityAlignment: itineraries.length > 0 ? totalPersonality / itineraries.length : 0,
      averageRelationshipCompatibility: itineraries.length > 0 ? totalRelationship / itineraries.length : 0,
      popularDestinations: destinations,
      averageDuration: itineraries.length > 0 ? totalDuration / itineraries.length : 0
    };
  }
}

export const aiItineraryPlanner = new AIItineraryPlanner();
export type { SmartItinerary, ItineraryGenerationContext, ItineraryDay, ItineraryActivity };