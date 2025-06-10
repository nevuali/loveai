import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { PersonalityProfile, EmotionalState } from './emotionalIntelligence';

interface PersonalityBasedResponse {
  tone: 'formal' | 'casual' | 'enthusiastic' | 'gentle' | 'professional' | 'playful';
  structure: 'detailed' | 'concise' | 'storytelling' | 'bullet-points' | 'conversational';
  vocabulary: 'simple' | 'sophisticated' | 'romantic' | 'technical' | 'emotional';
  examples: 'many' | 'few' | 'visual' | 'experiential' | 'practical';
  decisionSupport: 'analytical' | 'intuitive' | 'social-proof' | 'expert-recommendation';
}

interface PersonalizedPromptTemplate {
  systemInstruction: string;
  responseGuidelines: string;
  communicationStyle: string;
  contentStrategy: string;
  toneInstructions: string;
}

interface UserPersonalityModel {
  userId: string;
  personalityType: 'INTJ' | 'ENFP' | 'ISFJ' | 'ESTP' | 'INFP' | 'ENTJ' | 'ISFP' | 'ENTP';
  communicationPreferences: PersonalityBasedResponse;
  emotionalTriggers: string[];
  motivationFactors: string[];
  decisionMakingStyle: 'quick' | 'deliberate' | 'consensus' | 'expert-guided';
  responseHistory: Array<{
    prompt: string;
    response: string;
    satisfaction: number;
    timestamp: number;
  }>;
  lastUpdated: number;
}

class PersonalityBasedAI {
  private personalityCache: Map<string, UserPersonalityModel> = new Map();
  private readonly PERSONALITY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Ana personality-based prompt generation
  async generatePersonalizedPrompt(
    userId: string,
    basePrompt: string,
    conversationContext: {
      emotionalState?: EmotionalState;
      personalityProfile?: PersonalityProfile;
      messageHistory?: Array<{ role: string; content: string }>;
      currentTopic?: string;
      urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent';
    }
  ): Promise<PersonalizedPromptTemplate> {
    logger.log('🧠 Generating personality-based prompt for user:', userId);

    try {
      // Get or create user personality model
      const personalityModel = await this.getUserPersonalityModel(userId, conversationContext);
      
      // Generate personalized prompt template
      const template = await this.createPersonalizedTemplate(personalityModel, basePrompt, conversationContext);
      
      // Update personality model with new interaction
      this.updatePersonalityModel(personalityModel, conversationContext);
      
      return template;

    } catch (error) {
      logger.error('❌ Personality-based prompt generation failed:', error);
      return this.getFallbackTemplate(basePrompt);
    }
  }

  // Get or create user personality model
  private async getUserPersonalityModel(
    userId: string,
    context: any
  ): Promise<UserPersonalityModel> {
    // Check cache first
    const cached = this.personalityCache.get(userId);
    if (cached && Date.now() - cached.lastUpdated < this.PERSONALITY_CACHE_TTL) {
      return cached;
    }

    try {
      // Call Firebase Function to get/create personality model
      const getPersonalityModel = httpsCallable(functions, 'getUserPersonalityModel');
      const result = await getPersonalityModel({
        userId,
        context: {
          emotionalState: context.emotionalState,
          personalityProfile: context.personalityProfile,
          messageHistory: context.messageHistory?.slice(-10) // Last 10 messages
        }
      });

      const data = result.data as any;
      if (data.success) {
        const model = data.personalityModel as UserPersonalityModel;
        this.personalityCache.set(userId, model);
        return model;
      }
    } catch (error) {
      logger.error('❌ Failed to get personality model:', error);
    }

    // Create default personality model
    return this.createDefaultPersonalityModel(userId, context);
  }

  // Create personalized prompt template
  private async createPersonalizedTemplate(
    personalityModel: UserPersonalityModel,
    basePrompt: string,
    context: any
  ): Promise<PersonalizedPromptTemplate> {
    // Handle undefined personalityModel
    if (!personalityModel) {
      return this.getFallbackTemplate(basePrompt);
    }
    
    const { personalityType, communicationPreferences, motivationFactors, decisionMakingStyle } = personalityModel;

    // MBTI-based customization
    const personalityCustomization = this.getMBTICustomization(personalityType);
    
    // Communication style customization
    const communicationCustomization = this.getCommunicationCustomization(communicationPreferences);
    
    // Decision-making customization
    const decisionCustomization = this.getDecisionMakingCustomization(decisionMakingStyle);

    // Build personalized system instruction
    let systemInstruction = basePrompt + '\n\nPERSONALITY-BASED CUSTOMIZATION:\n';
    
    // MBTI-specific instructions
    systemInstruction += `\nMBTI TYPE: ${personalityType}`;
    systemInstruction += `\n${personalityCustomization.instructions}`;
    
    // Communication style
    systemInstruction += `\nCOMMUNICATION STYLE:`;
    systemInstruction += `\n- Tone: ${communicationPreferences.tone}`;
    systemInstruction += `\n- Structure: ${communicationPreferences.structure}`;
    systemInstruction += `\n- Vocabulary: ${communicationPreferences.vocabulary}`;
    systemInstruction += `\n- Examples: ${communicationPreferences.examples}`;
    
    // Motivation factors
    if (motivationFactors.length > 0) {
      systemInstruction += `\nMOTIVATION FACTORS: ${motivationFactors.join(', ')}`;
      systemInstruction += `\n- Address these motivation factors in your response`;
      systemInstruction += `\n- Use language that resonates with these motivators`;
    }
    
    // Decision making support
    systemInstruction += `\nDECISION SUPPORT: ${communicationPreferences.decisionSupport}`;
    systemInstruction += `\n${decisionCustomization.guidance}`;
    
    // Emotional state adaptation
    if (context.emotionalState) {
      systemInstruction += `\nEMOTIONAL ADAPTATION:`;
      systemInstruction += `\n- Current emotion: ${context.emotionalState.primary}`;
      systemInstruction += `\n- ${this.getEmotionalAdaptation(context.emotionalState, personalityType)}`;
    }
    
    // Urgency adaptation
    if (context.urgencyLevel) {
      systemInstruction += `\nURGENCY ADAPTATION:`;
      systemInstruction += `\n- Level: ${context.urgencyLevel}`;
      systemInstruction += `\n- ${this.getUrgencyAdaptation(context.urgencyLevel, personalityType)}`;
    }

    return {
      systemInstruction,
      responseGuidelines: communicationCustomization.guidelines,
      communicationStyle: communicationCustomization.style,
      contentStrategy: personalityCustomization.contentStrategy,
      toneInstructions: communicationCustomization.toneInstructions
    };
  }

  // MBTI-based customization
  private getMBTICustomization(type: string): { instructions: string; contentStrategy: string } {
    const customizations = {
      'INTJ': {
        instructions: 'Focus on strategic, long-term thinking. Provide comprehensive analysis and efficiency-focused solutions. Use logical frameworks and systematic approaches.',
        contentStrategy: 'Analytical, future-focused, comprehensive planning'
      },
      'ENFP': {
        instructions: 'Be enthusiastic and inspiring. Emphasize possibilities and personal growth. Use storytelling and emotional connections.',
        contentStrategy: 'Inspirational, possibility-focused, emotionally engaging'
      },
      'ISFJ': {
        instructions: 'Be warm and supportive. Focus on practical details and traditional approaches. Show care for personal needs and comfort.',
        contentStrategy: 'Caring, detail-oriented, tradition-respecting'
      },
      'ESTP': {
        instructions: 'Be direct and action-oriented. Focus on immediate solutions and practical results. Use concrete examples and quick wins.',
        contentStrategy: 'Action-oriented, practical, immediate-focused'
      },
      'INFP': {
        instructions: 'Be authentic and value-driven. Focus on personal meaning and emotional significance. Respect individual uniqueness.',
        contentStrategy: 'Values-based, personally meaningful, authentic'
      },
      'ENTJ': {
        instructions: 'Be confident and goal-oriented. Focus on efficiency and results. Provide clear leadership and strategic direction.',
        contentStrategy: 'Leadership-focused, results-oriented, strategic'
      },
      'ISFP': {
        instructions: 'Be gentle and respectful. Focus on aesthetic beauty and personal values. Allow space for individual choice.',
        contentStrategy: 'Gentle, aesthetically-aware, choice-respecting'
      },
      'ENTP': {
        instructions: 'Be innovative and intellectually stimulating. Focus on possibilities and creative solutions. Challenge assumptions.',
        contentStrategy: 'Innovation-focused, intellectually engaging, possibility-exploring'
      }
    };

    return customizations[type as keyof typeof customizations] || customizations['ENFP'];
  }

  // Communication customization
  private getCommunicationCustomization(prefs: PersonalityBasedResponse): {
    guidelines: string;
    style: string;
    toneInstructions: string;
  } {
    const toneInstructions = {
      'formal': 'Use professional, respectful language. Maintain courtesy and proper structure.',
      'casual': 'Use friendly, relaxed language. Be conversational and approachable.',
      'enthusiastic': 'Use energetic, exciting language. Show passion and enthusiasm.',
      'gentle': 'Use soft, caring language. Be compassionate and understanding.',
      'professional': 'Use expert, knowledgeable language. Demonstrate competence and reliability.',
      'playful': 'Use fun, light-hearted language. Include humor and creative expressions.'
    };

    const structureGuidelines = {
      'detailed': 'Provide comprehensive, thorough explanations with multiple perspectives.',
      'concise': 'Keep responses brief and to the point. Focus on key information only.',
      'storytelling': 'Use narrative structure with examples and scenarios.',
      'bullet-points': 'Organize information in clear, scannable lists.',
      'conversational': 'Use natural dialogue flow with questions and engagement.'
    };

    return {
      guidelines: structureGuidelines[prefs.structure],
      style: `${prefs.tone} tone with ${prefs.structure} structure`,
      toneInstructions: toneInstructions[prefs.tone]
    };
  }

  // Decision making customization
  private getDecisionMakingCustomization(style: string): { guidance: string } {
    const guidance = {
      'quick': 'Provide clear recommendations with confidence. Focus on key benefits and quick decision points.',
      'deliberate': 'Offer comprehensive analysis with pros/cons. Allow time for consideration and provide follow-up resources.',
      'consensus': 'Include multiple perspectives and social validation. Mention what others have chosen.',
      'expert-guided': 'Provide authoritative recommendations with expert backing and detailed rationale.'
    };

    return { guidance: guidance[style as keyof typeof guidance] || guidance['expert-guided'] };
  }

  // Emotional adaptation
  private getEmotionalAdaptation(emotion: EmotionalState, personalityType: string): string {
    const adaptations = {
      'anxiety': {
        'INTJ': 'Provide structured solutions and logical reassurance.',
        'ENFP': 'Offer emotional support and positive possibilities.',
        'ISFJ': 'Give gentle reassurance and practical comfort.',
        'default': 'Address concerns with patience and understanding.'
      },
      'excitement': {
        'ESTP': 'Match the energy and focus on immediate action.',
        'ENFP': 'Amplify the enthusiasm and explore possibilities.',
        'ENTJ': 'Channel excitement toward goal achievement.',
        'default': 'Share in the excitement while maintaining helpful focus.'
      },
      'confusion': {
        'INTJ': 'Provide clear frameworks and logical organization.',
        'ISFJ': 'Offer step-by-step guidance and support.',
        'ENTP': 'Explore different angles and creative solutions.',
        'default': 'Clarify confusion with patient explanation.'
      }
    };

    const emotionAdaptations = adaptations[emotion.primary as keyof typeof adaptations];
    return emotionAdaptations?.[personalityType as keyof typeof emotionAdaptations] || 
           emotionAdaptations?.['default'] || 
           'Adapt response to emotional state';
  }

  // Urgency adaptation
  private getUrgencyAdaptation(urgency: string, personalityType: string): string {
    const adaptations = {
      'urgent': {
        'ESTP': 'Provide immediate, actionable solutions.',
        'ENTJ': 'Give direct, efficient recommendations.',
        'ISFJ': 'Offer quick but thorough assistance.',
        'default': 'Prioritize immediate needs while ensuring quality.'
      },
      'high': {
        'INTJ': 'Focus on strategic quick wins.',
        'ENFP': 'Balance urgency with enthusiasm.',
        'default': 'Address urgency while maintaining helpfulness.'
      },
      'low': {
        'INFP': 'Explore deeper meanings and personal fit.',
        'ISFP': 'Allow time for personal reflection.',
        'default': 'Provide comprehensive, thoughtful guidance.'
      }
    };

    const urgencyAdaptations = adaptations[urgency as keyof typeof adaptations];
    return urgencyAdaptations?.[personalityType as keyof typeof urgencyAdaptations] || 
           urgencyAdaptations?.['default'] || 
           'Adapt to urgency level appropriately';
  }

  // Default personality model
  private createDefaultPersonalityModel(userId: string, context: any): UserPersonalityModel {
    return {
      userId,
      personalityType: 'ENFP', // Default to enthusiastic helper
      communicationPreferences: {
        tone: 'enthusiastic',
        structure: 'conversational',
        vocabulary: 'romantic',
        examples: 'visual',
        decisionSupport: 'expert-recommendation'
      },
      emotionalTriggers: ['uncertainty', 'time-pressure'],
      motivationFactors: ['romance', 'adventure', 'luxury'],
      decisionMakingStyle: 'expert-guided',
      responseHistory: [],
      lastUpdated: Date.now()
    };
  }

  // Update personality model with new interaction
  private updatePersonalityModel(model: UserPersonalityModel | undefined, context: any): void {
    if (!model) return;
    model.lastUpdated = Date.now();
    
    // Add to response history if available
    if (context.lastInteraction) {
      model.responseHistory.push({
        prompt: context.lastInteraction.prompt,
        response: context.lastInteraction.response,
        satisfaction: context.lastInteraction.satisfaction || 0.5,
        timestamp: Date.now()
      });
      
      // Keep only last 50 interactions
      if (model.responseHistory.length > 50) {
        model.responseHistory = model.responseHistory.slice(-50);
      }
    }
  }

  // Fallback template
  private getFallbackTemplate(basePrompt: string): PersonalizedPromptTemplate {
    return {
      systemInstruction: basePrompt + '\n\nUse warm, enthusiastic tone with comprehensive but engaging responses.',
      responseGuidelines: 'Be helpful, warm, and engaging',
      communicationStyle: 'enthusiastic and conversational',
      contentStrategy: 'emotionally engaging with practical value',
      toneInstructions: 'Use enthusiastic tone with romantic vocabulary'
    };
  }

  // Analytics
  getPersonalityAnalytics(): {
    totalUsers: number;
    personalityDistribution: Record<string, number>;
    commonCommunicationPreferences: Record<string, number>;
    averageSatisfaction: number;
  } {
    const users = Array.from(this.personalityCache.values());
    
    const personalityDist: Record<string, number> = {};
    const commPrefs: Record<string, number> = {};
    let totalSatisfaction = 0;
    let totalRatings = 0;

    users.forEach(user => {
      personalityDist[user.personalityType] = (personalityDist[user.personalityType] || 0) + 1;
      commPrefs[user.communicationPreferences.tone] = (commPrefs[user.communicationPreferences.tone] || 0) + 1;
      
      user.responseHistory.forEach(response => {
        totalSatisfaction += response.satisfaction;
        totalRatings++;
      });
    });

    return {
      totalUsers: users.length,
      personalityDistribution: personalityDist,
      commonCommunicationPreferences: commPrefs,
      averageSatisfaction: totalRatings > 0 ? totalSatisfaction / totalRatings : 0
    };
  }

  // Fallback template when personality model is undefined
  private getFallbackTemplate(basePrompt: string): PersonalizedPromptTemplate {
    return {
      systemInstruction: basePrompt,
      responseGuidelines: 'Respond helpfully and naturally',
      communicationStyle: 'warm',
      contentStrategy: 'informative',
      toneInstructions: 'Be friendly and professional'
    };
  }

  // Clear cache
  clearPersonalityCache(): void {
    this.personalityCache.clear();
    logger.log('🗑️ Personality cache cleared');
  }
}

export const personalityBasedAI = new PersonalityBasedAI();
export type { PersonalityBasedResponse, PersonalizedPromptTemplate, UserPersonalityModel };