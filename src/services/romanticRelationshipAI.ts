import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { PersonalityProfile, EmotionalState } from './emotionalIntelligence';

interface RelationshipProfile {
  userId: string;
  partnerUserId?: string;
  relationshipStage: 'dating' | 'engaged' | 'married' | 'long-term' | 'new-relationship';
  relationshipDuration: number; // months
  communicationStyle: 'direct' | 'indirect' | 'emotional' | 'logical' | 'playful';
  loveLanguages: Array<'words-of-affirmation' | 'acts-of-service' | 'receiving-gifts' | 'quality-time' | 'physical-touch'>;
  conflictResolutionStyle: 'avoider' | 'competitor' | 'accommodator' | 'compromiser' | 'collaborator';
  sharedInterests: string[];
  travelPreferences: {
    adventureLevel: 'low' | 'medium' | 'high';
    budgetRange: 'budget' | 'mid-range' | 'luxury';
    activityTypes: string[];
    destinationPreferences: string[];
  };
  currentChallenges: string[];
  relationshipGoals: string[];
  lastUpdated: number;
}

interface RomanticAdvice {
  category: 'communication' | 'planning' | 'intimacy' | 'conflict-resolution' | 'shared-experiences';
  title: string;
  advice: string;
  actionableSteps: string[];
  personalizedTips: string[];
  honeymoonRelevance: string;
  confidenceScore: number;
}

interface HoneymoonMatchingResult {
  compatibility: number; // 0-1
  recommendedDestinations: Array<{
    destination: string;
    compatibilityScore: number;
    reasons: string[];
    potentialChallenges: string[];
    relationshipBenefits: string[];
  }>;
  relationshipStrengtheners: string[];
  communicationTips: string[];
  conflictPreventionTips: string[];
}

class RomanticRelationshipAI {
  private relationshipCache: Map<string, RelationshipProfile> = new Map();
  private readonly RELATIONSHIP_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Ana romantik danışmanlık fonksiyonu
  async provideRomanticAdvice(
    userId: string,
    partnerUserId: string | undefined,
    query: string,
    context: {
      emotionalState?: EmotionalState;
      personalityProfile?: PersonalityProfile;
      conversationHistory?: Array<{ role: string; content: string }>;
      relationshipContext?: any;
    }
  ): Promise<RomanticAdvice[]> {
    logger.log('💕 Providing romantic relationship advice for:', { userId, query });

    try {
      // Get or create relationship profile
      const relationshipProfile = await this.getRelationshipProfile(userId, partnerUserId, context);
      
      // Analyze the query for relationship context
      const queryAnalysis = await this.analyzeRelationshipQuery(query, relationshipProfile);
      
      // Generate personalized romantic advice
      const advice = await this.generatePersonalizedAdvice(queryAnalysis, relationshipProfile, context);
      
      // Update relationship profile with new interaction
      this.updateRelationshipProfile(relationshipProfile, query, advice);
      
      return advice;

    } catch (error) {
      logger.error('❌ Romantic advice generation failed:', error);
      return this.getFallbackAdvice(query);
    }
  }

  // Honeymoon uyumluluğu analizi
  async analyzeHoneymoonCompatibility(
    userId: string,
    partnerUserId: string | undefined,
    proposedDestinations: string[],
    honeymoonPreferences: any
  ): Promise<HoneymoonMatchingResult> {
    logger.log('🌙 Analyzing honeymoon compatibility');

    try {
      const relationshipProfile = await this.getRelationshipProfile(userId, partnerUserId);
      
      const compatibilityAnalysis = await this.performCompatibilityAnalysis(
        relationshipProfile,
        proposedDestinations,
        honeymoonPreferences
      );
      
      return compatibilityAnalysis;

    } catch (error) {
      logger.error('❌ Honeymoon compatibility analysis failed:', error);
      return this.getFallbackCompatibility();
    }
  }

  // İlişki profili alma veya oluşturma
  private async getRelationshipProfile(
    userId: string,
    partnerUserId?: string,
    context?: any
  ): Promise<RelationshipProfile> {
    const cacheKey = partnerUserId ? `${userId}_${partnerUserId}` : userId;
    
    // Check cache first
    const cached = this.relationshipCache.get(cacheKey);
    if (cached && Date.now() - cached.lastUpdated < this.RELATIONSHIP_CACHE_TTL) {
      return cached;
    }

    try {
      // Call Firebase Function to get/create relationship profile
      const getRelationshipProfile = httpsCallable(functions, 'getRelationshipProfile');
      const result = await getRelationshipProfile({
        userId,
        partnerUserId,
        context: {
          emotionalState: context?.emotionalState,
          personalityProfile: context?.personalityProfile,
          relationshipContext: context?.relationshipContext
        }
      });

      const data = result.data as any;
      if (data.success) {
        const profile = data.relationshipProfile as RelationshipProfile;
        this.relationshipCache.set(cacheKey, profile);
        return profile;
      }
    } catch (error) {
      logger.error('❌ Failed to get relationship profile:', error);
    }

    // Create default relationship profile
    return this.createDefaultRelationshipProfile(userId, partnerUserId);
  }

  // Query analizi
  private async analyzeRelationshipQuery(
    query: string,
    profile: RelationshipProfile
  ): Promise<{
    category: RomanticAdvice['category'];
    emotionalTone: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    specificConcerns: string[];
    relationshipContext: string[];
  }> {
    try {
      const analyzeQuery = httpsCallable(functions, 'analyzeRelationshipQuery');
      const result = await analyzeQuery({
        query,
        relationshipProfile: profile
      });

      const data = result.data as any;
      if (data.success) {
        return data.analysis;
      }
    } catch (error) {
      logger.error('❌ Query analysis failed:', error);
    }

    // Fallback analysis
    return this.getFallbackQueryAnalysis(query);
  }

  // Kişiselleştirilmiş tavsiye oluşturma
  private async generatePersonalizedAdvice(
    queryAnalysis: any,
    profile: RelationshipProfile,
    context: any
  ): Promise<RomanticAdvice[]> {
    const advicePrompt = this.createRomanticAdvicePrompt(queryAnalysis, profile, context);
    
    try {
      const generateAdvice = httpsCallable(functions, 'generateRomanticAdvice');
      const result = await generateAdvice({
        prompt: advicePrompt,
        relationshipProfile: profile,
        queryAnalysis
      });

      const data = result.data as any;
      if (data.success && data.advice) {
        return data.advice.map((advice: any) => ({
          ...advice,
          confidenceScore: Math.max(0.7, advice.confidenceScore || 0.8)
        }));
      }
    } catch (error) {
      logger.error('❌ Advice generation failed:', error);
    }

    return this.generateFallbackAdvice(queryAnalysis, profile);
  }

  // Romantik tavsiye prompt'u oluşturma
  private createRomanticAdvicePrompt(
    queryAnalysis: any,
    profile: RelationshipProfile,
    context: any
  ): string {
    return `
You are AI LOVVE's Expert Romantic Relationship Counselor - specialized in honeymoon planning and relationship enhancement.

RELATIONSHIP PROFILE:
- Stage: ${profile.relationshipStage}
- Duration: ${profile.relationshipDuration} months
- Communication Style: ${profile.communicationStyle}
- Love Languages: ${profile.loveLanguages.join(', ')}
- Conflict Resolution: ${profile.conflictResolutionStyle}
- Shared Interests: ${profile.sharedInterests.join(', ')}
- Current Challenges: ${profile.currentChallenges.join(', ')}
- Relationship Goals: ${profile.relationshipGoals.join(', ')}

QUERY ANALYSIS:
- Category: ${queryAnalysis.category}
- Emotional Tone: ${queryAnalysis.emotionalTone}
- Urgency: ${queryAnalysis.urgencyLevel}
- Specific Concerns: ${queryAnalysis.specificConcerns?.join(', ')}

TRAVEL PREFERENCES:
- Adventure Level: ${profile.travelPreferences.adventureLevel}
- Budget Range: ${profile.travelPreferences.budgetRange}
- Activity Types: ${profile.travelPreferences.activityTypes.join(', ')}
- Preferred Destinations: ${profile.travelPreferences.destinationPreferences.join(', ')}

EMOTIONAL CONTEXT:
${context.emotionalState ? `- Current Emotion: ${context.emotionalState.primary} (intensity: ${context.emotionalState.intensity})` : '- No emotional context available'}

PROVIDE 2-3 romantic relationship advice items focusing on:

1. COMMUNICATION ENHANCEMENT:
   - How to better communicate during honeymoon planning
   - Love language integration strategies
   - Conflict prevention during travel stress

2. HONEYMOON PLANNING HARMONY:
   - Balancing different preferences and expectations
   - Creating shared experiences that strengthen the relationship
   - Managing budget and planning stress together

3. RELATIONSHIP STRENGTHENING:
   - How the honeymoon can enhance their relationship
   - Building intimacy through shared travel experiences
   - Creating lasting memories and traditions

RESPONSE FORMAT (JSON Array):
[
  {
    "category": "communication|planning|intimacy|conflict-resolution|shared-experiences",
    "title": "Specific advice title",
    "advice": "Detailed, personalized advice (100-150 words)",
    "actionableSteps": ["step1", "step2", "step3"],
    "personalizedTips": ["tip1", "tip2"],
    "honeymoonRelevance": "How this relates to their honeymoon planning",
    "confidenceScore": confidence_number_0_to_1
  }
]

IMPORTANT:
- Address their specific relationship stage and communication style
- Integrate their love languages into the advice
- Consider their travel preferences and budget
- Provide actionable, practical steps
- Focus on honeymoon planning context
- Be warm, supportive, and relationship-positive
- Avoid generic advice - make it personal to their profile
`;
  }

  // Uyumluluk analizi
  private async performCompatibilityAnalysis(
    profile: RelationshipProfile,
    destinations: string[],
    preferences: any
  ): Promise<HoneymoonMatchingResult> {
    try {
      const analyzeCompatibility = httpsCallable(functions, 'analyzeHoneymoonCompatibility');
      const result = await analyzeCompatibility({
        relationshipProfile: profile,
        proposedDestinations: destinations,
        honeymoonPreferences: preferences
      });

      const data = result.data as any;
      if (data.success) {
        return data.compatibilityResult;
      }
    } catch (error) {
      logger.error('❌ Compatibility analysis failed:', error);
    }

    return this.getFallbackCompatibility();
  }

  // Default relationship profile
  private createDefaultRelationshipProfile(userId: string, partnerUserId?: string): RelationshipProfile {
    return {
      userId,
      partnerUserId,
      relationshipStage: 'engaged',
      relationshipDuration: 12,
      communicationStyle: 'emotional',
      loveLanguages: ['quality-time', 'words-of-affirmation'],
      conflictResolutionStyle: 'compromiser',
      sharedInterests: ['travel', 'food', 'culture'],
      travelPreferences: {
        adventureLevel: 'medium',
        budgetRange: 'mid-range',
        activityTypes: ['sightseeing', 'dining', 'relaxation'],
        destinationPreferences: ['beach', 'cultural-cities']
      },
      currentChallenges: ['planning-stress', 'budget-decisions'],
      relationshipGoals: ['better-communication', 'shared-experiences'],
      lastUpdated: Date.now()
    };
  }

  // Fallback query analysis
  private getFallbackQueryAnalysis(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    let category: RomanticAdvice['category'] = 'planning';
    if (lowerQuery.includes('communication') || lowerQuery.includes('talk')) category = 'communication';
    else if (lowerQuery.includes('conflict') || lowerQuery.includes('fight')) category = 'conflict-resolution';
    else if (lowerQuery.includes('intimate') || lowerQuery.includes('romance')) category = 'intimacy';
    else if (lowerQuery.includes('experience') || lowerQuery.includes('activity')) category = 'shared-experiences';

    return {
      category,
      emotionalTone: 'hopeful',
      urgencyLevel: 'medium' as const,
      specificConcerns: ['honeymoon-planning'],
      relationshipContext: ['travel-planning']
    };
  }

  // Fallback advice generation
  private generateFallbackAdvice(queryAnalysis: any, profile: RelationshipProfile): RomanticAdvice[] {
    return [
      {
        category: 'communication',
        title: 'Open Communication During Planning',
        advice: `During your honeymoon planning, maintain open dialogue about your expectations and preferences. Given your ${profile.communicationStyle} communication style, focus on expressing your needs clearly while listening to your partner's desires.`,
        actionableSteps: [
          'Schedule regular planning sessions',
          'Share your travel dreams openly',
          'Create a shared vision board'
        ],
        personalizedTips: [
          `Use your ${profile.loveLanguages[0]} love language during discussions`,
          'Take breaks if planning becomes stressful'
        ],
        honeymoonRelevance: 'Good communication sets the foundation for a harmonious honeymoon experience',
        confidenceScore: 0.8
      },
      {
        category: 'planning',
        title: 'Balanced Decision Making',
        advice: `As a ${profile.conflictResolutionStyle}, focus on finding solutions that honor both your preferences. Create a balanced itinerary that includes activities you both enjoy.`,
        actionableSteps: [
          'List individual priorities',
          'Find compromise solutions',
          'Plan surprise elements for each other'
        ],
        personalizedTips: [
          'Balance adventure and relaxation',
          'Consider your budget preferences'
        ],
        honeymoonRelevance: 'Collaborative planning creates excitement and anticipation for your honeymoon',
        confidenceScore: 0.75
      }
    ];
  }

  // Fallback compatibility
  private getFallbackCompatibility(): HoneymoonMatchingResult {
    return {
      compatibility: 0.8,
      recommendedDestinations: [
        {
          destination: 'Santorini, Greece',
          compatibilityScore: 0.9,
          reasons: ['Romantic atmosphere', 'Beautiful sunsets', 'Intimate settings'],
          potentialChallenges: ['Crowded in peak season'],
          relationshipBenefits: ['Creates romantic memories', 'Beautiful photo opportunities']
        }
      ],
      relationshipStrengtheners: [
        'Plan activities together',
        'Try new experiences as a couple',
        'Create shared memories'
      ],
      communicationTips: [
        'Discuss expectations beforehand',
        'Be flexible with plans',
        'Focus on enjoying each other\'s company'
      ],
      conflictPreventionTips: [
        'Plan downtime together',
        'Have backup plans',
        'Communicate needs clearly'
      ]
    };
  }

  // Fallback advice
  private getFallbackAdvice(query: string): RomanticAdvice[] {
    return [
      {
        category: 'communication',
        title: 'Strengthen Your Connection',
        advice: 'Focus on open communication and shared experiences during your honeymoon planning. This is a special time to grow closer together.',
        actionableSteps: ['Talk openly about expectations', 'Plan together', 'Be patient with each other'],
        personalizedTips: ['Use active listening', 'Express appreciation'],
        honeymoonRelevance: 'Good communication enhances your honeymoon experience',
        confidenceScore: 0.7
      }
    ];
  }

  // Profile güncelleme
  private updateRelationshipProfile(
    profile: RelationshipProfile,
    query: string,
    advice: RomanticAdvice[]
  ): void {
    profile.lastUpdated = Date.now();
    
    // Update cache
    const cacheKey = profile.partnerUserId ? `${profile.userId}_${profile.partnerUserId}` : profile.userId;
    this.relationshipCache.set(cacheKey, profile);
  }

  // Analytics
  getRelationshipAnalytics(): {
    totalCouples: number;
    relationshipStages: Record<string, number>;
    commonChallenges: Record<string, number>;
    loveLanguageDistribution: Record<string, number>;
    adviceCategories: Record<string, number>;
  } {
    const profiles = Array.from(this.relationshipCache.values());
    
    const stages: Record<string, number> = {};
    const challenges: Record<string, number> = {};
    const loveLanguages: Record<string, number> = {};
    const adviceCategories: Record<string, number> = {};

    profiles.forEach(profile => {
      stages[profile.relationshipStage] = (stages[profile.relationshipStage] || 0) + 1;
      
      profile.currentChallenges.forEach(challenge => {
        challenges[challenge] = (challenges[challenge] || 0) + 1;
      });
      
      profile.loveLanguages.forEach(language => {
        loveLanguages[language] = (loveLanguages[language] || 0) + 1;
      });
    });

    return {
      totalCouples: profiles.length,
      relationshipStages: stages,
      commonChallenges: challenges,
      loveLanguageDistribution: loveLanguages,
      adviceCategories
    };
  }
}

export const romanticRelationshipAI = new RomanticRelationshipAI();
export type { RelationshipProfile, RomanticAdvice, HoneymoonMatchingResult };