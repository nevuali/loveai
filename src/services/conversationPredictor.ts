import { logger } from '../utils/logger';
import { semanticSearchEngine, QueryIntent } from './semanticSearch';

interface ConversationState {
  sessionId: string;
  userId?: string;
  currentPhase: 'greeting' | 'discovery' | 'exploration' | 'comparison' | 'decision' | 'booking' | 'confirmation';
  messageCount: number;
  userIntent: QueryIntent;
  collectedInfo: {
    destinations?: string[];
    budget?: string;
    travelStyle?: string;
    groupSize?: number;
    timeframe?: string;
    preferences?: string[];
    concerns?: string[];
  };
  predictedNextActions: PredictedAction[];
  conversionProbability: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  lastUpdate: number;
}

interface PredictedAction {
  type: 'proactive_suggestion' | 'follow_up_question' | 'package_recommendation' | 'booking_prompt' | 'information_request';
  content: string;
  confidence: number;
  trigger: string;
  priority: number;
}

interface ConversationFlow {
  phase: ConversationState['currentPhase'];
  expectedDuration: number; // messages
  successProbability: number;
  nextPhases: Array<{
    phase: ConversationState['currentPhase'];
    probability: number;
    triggers: string[];
  }>;
  typicalUserQuestions: string[];
  recommendedBotActions: string[];
}

class ConversationPredictor {
  private conversationStates: Map<string, ConversationState> = new Map();
  private flowPatterns: Map<string, ConversationFlow> = new Map();
  private historicalData: Array<{
    sessionId: string;
    flow: ConversationState['currentPhase'][];
    outcome: 'converted' | 'abandoned' | 'ongoing';
    duration: number;
  }> = [];

  constructor() {
    this.initializeFlowPatterns();
  }

  // Conversation flow patterns'ini initialize et
  private initializeFlowPatterns(): void {
    const flowPatterns: Array<[string, ConversationFlow]> = [
      ['greeting', {
        phase: 'greeting',
        expectedDuration: 1,
        successProbability: 0.9,
        nextPhases: [
          { phase: 'discovery', probability: 0.8, triggers: ['where', 'when', 'how', 'nerede', 'ne zaman'] },
          { phase: 'exploration', probability: 0.2, triggers: ['show', 'recommend', 'suggest', 'öner'] }
        ],
        typicalUserQuestions: [
          'Hi, I need help planning a honeymoon',
          'Merhaba, balayı planı yapıyorum',
          'Can you recommend honeymoon destinations?'
        ],
        recommendedBotActions: [
          'Welcome warmly',
          'Ask about dream destination',
          'Inquire about budget range',
          'Request travel dates'
        ]
      }],
      
      ['discovery', {
        phase: 'discovery',
        expectedDuration: 3,
        successProbability: 0.7,
        nextPhases: [
          { phase: 'exploration', probability: 0.6, triggers: ['show', 'packages', 'options', 'paket'] },
          { phase: 'comparison', probability: 0.3, triggers: ['compare', 'vs', 'difference', 'karşılaştır'] },
          { phase: 'decision', probability: 0.1, triggers: ['book', 'choose', 'decide', 'seç'] }
        ],
        typicalUserQuestions: [
          'What are the best romantic destinations?',
          'En romantik yerler nereler?',
          'I\'m looking for a tropical paradise',
          'Budget-friendly options?'
        ],
        recommendedBotActions: [
          'Ask clarifying questions',
          'Probe for preferences',
          'Present 2-3 destination categories',
          'Show package previews'
        ]
      }],
      
      ['exploration', {
        phase: 'exploration',
        expectedDuration: 4,
        successProbability: 0.8,
        nextPhases: [
          { phase: 'comparison', probability: 0.5, triggers: ['compare', 'vs', 'which', 'hangi'] },
          { phase: 'decision', probability: 0.3, triggers: ['like', 'interested', 'perfect', 'mükemmel'] },
          { phase: 'discovery', probability: 0.2, triggers: ['other', 'different', 'alternatives', 'başka'] }
        ],
        typicalUserQuestions: [
          'Tell me more about Bali packages',
          'What\'s included in this package?',
          'Bali paketleri hakkında bilgi',
          'How much does this cost?'
        ],
        recommendedBotActions: [
          'Show detailed package information',
          'Highlight unique features',
          'Present 3-4 similar options',
          'Address common concerns'
        ]
      }],
      
      ['comparison', {
        phase: 'comparison',
        expectedDuration: 3,
        successProbability: 0.85,
        nextPhases: [
          { phase: 'decision', probability: 0.7, triggers: ['prefer', 'better', 'choose', 'tercih'] },
          { phase: 'exploration', probability: 0.2, triggers: ['more info', 'details', 'daha fazla'] },
          { phase: 'booking', probability: 0.1, triggers: ['book', 'reserve', 'rezerve'] }
        ],
        typicalUserQuestions: [
          'What\'s the difference between these packages?',
          'Bu paketler arasındaki fark nedir?',
          'Which one offers better value?',
          'Bali vs Santorini for honeymoon?'
        ],
        recommendedBotActions: [
          'Create comparison table',
          'Highlight key differences',
          'Address specific concerns',
          'Recommend based on preferences'
        ]
      }],
      
      ['decision', {
        phase: 'decision',
        expectedDuration: 2,
        successProbability: 0.9,
        nextPhases: [
          { phase: 'booking', probability: 0.8, triggers: ['book', 'buy', 'purchase', 'satın al'] },
          { phase: 'comparison', probability: 0.2, triggers: ['wait', 'think', 'düşün', 'bekle'] }
        ],
        typicalUserQuestions: [
          'I think I want the Bali package',
          'Bali paketini istiyorum',
          'How do I book this?',
          'What\'s the next step?'
        ],
        recommendedBotActions: [
          'Congratulate on choice',
          'Create urgency (limited availability)',
          'Explain booking process',
          'Offer immediate assistance'
        ]
      }],
      
      ['booking', {
        phase: 'booking',
        expectedDuration: 3,
        successProbability: 0.95,
        nextPhases: [
          { phase: 'confirmation', probability: 0.9, triggers: ['confirm', 'yes', 'proceed', 'evet'] }
        ],
        typicalUserQuestions: [
          'How do I make payment?',
          'Nasıl ödeme yapacağım?',
          'Is my booking secure?',
          'When will I get confirmation?'
        ],
        recommendedBotActions: [
          'Guide through booking steps',
          'Address security concerns',
          'Explain cancellation policy',
          'Provide support contact'
        ]
      }],
      
      ['confirmation', {
        phase: 'confirmation',
        expectedDuration: 1,
        successProbability: 1.0,
        nextPhases: [],
        typicalUserQuestions: [
          'Is everything confirmed?',
          'Her şey tamam mı?',
          'When do I get my tickets?',
          'What should I do next?'
        ],
        recommendedBotActions: [
          'Confirm booking details',
          'Explain next steps',
          'Provide useful travel tips',
          'Offer additional services'
        ]
      }]
    ];

    flowPatterns.forEach(([phase, flow]) => {
      this.flowPatterns.set(phase, flow);
    });

    logger.log(`🔮 Conversation flow patterns initialized for ${flowPatterns.length} phases`);
  }

  // Konuşma durumunu güncelle ve predict et
  updateConversationState(
    sessionId: string, 
    userMessage: string, 
    botResponse: string,
    userId?: string
  ): ConversationState {
    let state = this.conversationStates.get(sessionId);
    
    if (!state) {
      // Yeni conversation state oluştur
      state = {
        sessionId,
        userId,
        currentPhase: 'greeting',
        messageCount: 0,
        userIntent: semanticSearchEngine.classifyQueryIntent(userMessage),
        collectedInfo: {},
        predictedNextActions: [],
        conversionProbability: 0.1,
        urgencyLevel: 'low',
        lastUpdate: Date.now()
      };
    }

    // Update state
    state.messageCount++;
    state.userIntent = semanticSearchEngine.classifyQueryIntent(userMessage);
    state.lastUpdate = Date.now();

    // Extract information from user message
    this.extractInformationFromMessage(state, userMessage);

    // Predict conversation phase
    state.currentPhase = this.predictConversationPhase(state, userMessage, botResponse);

    // Calculate conversion probability
    state.conversionProbability = this.calculateConversionProbability(state);

    // Determine urgency level
    state.urgencyLevel = this.determineUrgencyLevel(state, userMessage);

    // Generate next action predictions
    state.predictedNextActions = this.predictNextActions(state);

    this.conversationStates.set(sessionId, state);
    
    logger.log(`🔮 Conversation state updated: ${state.currentPhase} (conversion: ${(state.conversionProbability * 100).toFixed(1)}%)`);
    
    return state;
  }

  // Mesajdan bilgi çıkar
  private extractInformationFromMessage(state: ConversationState, message: string): void {
    const lowerMessage = message.toLowerCase();

    // Destination extraction
    const destinations = ['paris', 'bali', 'santorini', 'maldives', 'maldivler', 'kapadokya', 'antalya'];
    destinations.forEach(dest => {
      if (lowerMessage.includes(dest)) {
        state.collectedInfo.destinations = state.collectedInfo.destinations || [];
        if (!state.collectedInfo.destinations.includes(dest)) {
          state.collectedInfo.destinations.push(dest);
        }
      }
    });

    // Budget extraction
    const budgetMatch = message.match(/(\d+[k]?)\s*(euro|dolar|tl|lira|\$|€|₺)/i);
    if (budgetMatch) {
      state.collectedInfo.budget = budgetMatch[0];
    }

    // Travel style extraction
    const styles = ['luxury', 'lüks', 'budget', 'bütçe', 'romantic', 'romantik', 'adventure', 'macera'];
    styles.forEach(style => {
      if (lowerMessage.includes(style)) {
        state.collectedInfo.travelStyle = style;
      }
    });

    // Group size extraction
    const groupMatch = message.match(/(ikimiz|çift|2\s*kişi|iki kişi|tek|alone|solo)/i);
    if (groupMatch) {
      state.collectedInfo.groupSize = groupMatch[0].includes('tek') || groupMatch[0].includes('solo') ? 1 : 2;
    }

    // Timeframe extraction
    const timeMatch = message.match(/(next month|gelecek ay|this summer|bu yaz|december|aralık|january|ocak)/i);
    if (timeMatch) {
      state.collectedInfo.timeframe = timeMatch[0];
    }

    // Preferences extraction
    const preferenceKeywords = ['romantic', 'luxury', 'adventure', 'relaxing', 'cultural'];
    preferenceKeywords.forEach(pref => {
      if (lowerMessage.includes(pref)) {
        state.collectedInfo.preferences = state.collectedInfo.preferences || [];
        if (!state.collectedInfo.preferences.includes(pref)) {
          state.collectedInfo.preferences.push(pref);
        }
      }
    });

    // Concerns extraction
    const concernKeywords = ['expensive', 'pahalı', 'safe', 'güvenli', 'weather', 'hava', 'visa', 'vize'];
    concernKeywords.forEach(concern => {
      if (lowerMessage.includes(concern)) {
        state.collectedInfo.concerns = state.collectedInfo.concerns || [];
        if (!state.collectedInfo.concerns.includes(concern)) {
          state.collectedInfo.concerns.push(concern);
        }
      }
    });
  }

  // Conversation phase'i predict et
  private predictConversationPhase(
    state: ConversationState,
    userMessage: string,
    botResponse: string
  ): ConversationState['currentPhase'] {
    const lowerMessage = userMessage.toLowerCase();
    const currentFlow = this.flowPatterns.get(state.currentPhase);
    
    if (!currentFlow) return state.currentPhase;

    // Check transition triggers
    for (const nextPhase of currentFlow.nextPhases) {
      for (const trigger of nextPhase.triggers) {
        if (lowerMessage.includes(trigger)) {
          logger.log(`🎯 Phase transition: ${state.currentPhase} → ${nextPhase.phase} (trigger: ${trigger})`);
          return nextPhase.phase;
        }
      }
    }

    // Intent-based phase detection
    switch (state.userIntent.primary) {
      case 'discovery':
        if (state.currentPhase === 'greeting') return 'discovery';
        break;
      case 'comparison':
        if (['discovery', 'exploration'].includes(state.currentPhase)) return 'comparison';
        break;
      case 'booking':
        if (['decision', 'comparison'].includes(state.currentPhase)) return 'booking';
        break;
    }

    // Information completeness based transitions
    const infoScore = this.calculateInformationCompleteness(state);
    if (infoScore > 0.7 && state.currentPhase === 'discovery') {
      return 'exploration';
    }
    if (infoScore > 0.8 && state.currentPhase === 'exploration') {
      return 'comparison';
    }

    // Duration-based transitions (if staying too long in a phase)
    if (currentFlow.expectedDuration && state.messageCount > currentFlow.expectedDuration * 2) {
      if (currentFlow.nextPhases.length > 0) {
        return currentFlow.nextPhases[0].phase; // Move to most likely next phase
      }
    }

    return state.currentPhase; // No transition
  }

  // Information completeness score
  private calculateInformationCompleteness(state: ConversationState): number {
    const info = state.collectedInfo;
    let score = 0;
    const maxScore = 6;

    if (info.destinations && info.destinations.length > 0) score += 1;
    if (info.budget) score += 1;
    if (info.travelStyle) score += 1;
    if (info.groupSize) score += 1;
    if (info.timeframe) score += 1;
    if (info.preferences && info.preferences.length > 0) score += 1;

    return score / maxScore;
  }

  // Conversion probability hesapla
  private calculateConversionProbability(state: ConversationState): number {
    let probability = 0.1; // Base probability

    // Phase-based probability
    const phaseBonus = {
      'greeting': 0.1,
      'discovery': 0.2,
      'exploration': 0.4,
      'comparison': 0.6,
      'decision': 0.8,
      'booking': 0.95,
      'confirmation': 1.0
    };
    probability += phaseBonus[state.currentPhase] || 0.1;

    // Information completeness bonus
    const infoScore = this.calculateInformationCompleteness(state);
    probability += infoScore * 0.3;

    // Engagement bonus (message count)
    if (state.messageCount > 3) probability += 0.1;
    if (state.messageCount > 6) probability += 0.1;
    if (state.messageCount > 10) probability += 0.1;

    // Intent confidence bonus
    if (state.userIntent.confidence > 0.8) probability += 0.1;

    // Urgency bonus
    if (state.urgencyLevel === 'high') probability += 0.15;
    if (state.urgencyLevel === 'urgent') probability += 0.25;

    return Math.min(probability, 1.0);
  }

  // Urgency level belirle
  private determineUrgencyLevel(state: ConversationState, message: string): ConversationState['urgencyLevel'] {
    const lowerMessage = message.toLowerCase();

    // Urgent indicators
    const urgentKeywords = ['asap', 'urgent', 'acil', 'hemen', 'today', 'bugün', 'immediately'];
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    }

    // High urgency indicators
    const highKeywords = ['soon', 'quickly', 'çabuk', 'yakında', 'next week', 'gelecek hafta'];
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }

    // Medium urgency indicators
    if (state.currentPhase === 'booking' || state.currentPhase === 'decision') {
      return 'medium';
    }

    // Time-based urgency
    if (state.collectedInfo.timeframe) {
      const timeframe = state.collectedInfo.timeframe.toLowerCase();
      if (timeframe.includes('next month') || timeframe.includes('gelecek ay')) {
        return 'medium';
      }
    }

    return 'low';
  }

  // Next actions predict et
  private predictNextActions(state: ConversationState): PredictedAction[] {
    const actions: PredictedAction[] = [];
    const currentFlow = this.flowPatterns.get(state.currentPhase);
    
    if (!currentFlow) return actions;

    // Phase-specific predictions
    switch (state.currentPhase) {
      case 'greeting':
        actions.push({
          type: 'follow_up_question',
          content: 'Rüya balayı destinasyonunuz neresi?',
          confidence: 0.9,
          trigger: 'initial_engagement',
          priority: 1
        });
        break;

      case 'discovery':
        if (!state.collectedInfo.budget) {
          actions.push({
            type: 'follow_up_question',
            content: 'Balayınız için ne kadar bütçe ayırdınız?',
            confidence: 0.8,
            trigger: 'missing_budget',
            priority: 2
          });
        }
        if (!state.collectedInfo.destinations || state.collectedInfo.destinations.length === 0) {
          actions.push({
            type: 'proactive_suggestion',
            content: 'Size popüler balayı destinasyonlarımızı gösterebilirim: **SHOW_PACKAGES:cities**',
            confidence: 0.7,
            trigger: 'no_destinations',
            priority: 1
          });
        }
        break;

      case 'exploration':
        actions.push({
          type: 'package_recommendation',
          content: `${state.collectedInfo.destinations?.[0] || 'destination'} için özel paketlerimizi görmek ister misiniz?`,
          confidence: 0.8,
          trigger: 'detailed_exploration',
          priority: 1
        });
        break;

      case 'comparison':
        actions.push({
          type: 'proactive_suggestion',
          content: 'Karşılaştırma tablosu oluşturayım size en uygun seçeneği bulalım!',
          confidence: 0.9,
          trigger: 'comparison_help',
          priority: 1
        });
        break;

      case 'decision':
        actions.push({
          type: 'booking_prompt',
          content: 'Harika seçim! Bu paketi şimdi rezerve etmek ister misiniz? Sınırlı sayıda yer kaldı.',
          confidence: 0.95,
          trigger: 'decision_made',
          priority: 1
        });
        break;

      case 'booking':
        actions.push({
          type: 'information_request',
          content: 'Rezervasyon işleminiz için iletişim bilgilerinizi alabilir miyim?',
          confidence: 0.9,
          trigger: 'booking_initiated',
          priority: 1
        });
        break;
    }

    // Urgency-based actions
    if (state.urgencyLevel === 'high' || state.urgencyLevel === 'urgent') {
      actions.push({
        type: 'booking_prompt',
        content: 'Acil ihtiyacınız olduğunu anlıyorum. Size özel fiyat teklifi hazırlayabilirim!',
        confidence: 0.8,
        trigger: 'urgency_detected',
        priority: 0
      });
    }

    // Sort by priority and confidence
    return actions.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.confidence - a.confidence;
    });
  }

  // Proactive suggestion al
  getProactiveSuggestion(sessionId: string): PredictedAction | null {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    const proactiveActions = state.predictedNextActions.filter(action => 
      ['proactive_suggestion', 'follow_up_question'].includes(action.type)
    );

    return proactiveActions[0] || null;
  }

  // Conversation insights
  getConversationInsights(sessionId: string): {
    currentPhase: string;
    conversionProbability: number;
    urgencyLevel: string;
    missingInformation: string[];
    recommendedActions: string[];
    timeInPhase: number;
  } | null {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    const missingInfo: string[] = [];
    if (!state.collectedInfo.destinations?.length) missingInfo.push('destinations');
    if (!state.collectedInfo.budget) missingInfo.push('budget');
    if (!state.collectedInfo.travelStyle) missingInfo.push('travel_style');
    if (!state.collectedInfo.timeframe) missingInfo.push('timeframe');

    const recommendedActions = state.predictedNextActions
      .slice(0, 3)
      .map(action => action.content);

    return {
      currentPhase: state.currentPhase,
      conversionProbability: state.conversionProbability,
      urgencyLevel: state.urgencyLevel,
      missingInformation: missingInfo,
      recommendedActions,
      timeInPhase: state.messageCount
    };
  }

  // Analytics data
  getAnalytics(): {
    totalConversations: number;
    phaseDistribution: Record<string, number>;
    avgConversionRate: number;
    avgConversationLength: number;
  } {
    const states = Array.from(this.conversationStates.values());
    
    const phaseDistribution: Record<string, number> = {};
    let totalConversions = 0;
    let totalLength = 0;

    states.forEach(state => {
      phaseDistribution[state.currentPhase] = (phaseDistribution[state.currentPhase] || 0) + 1;
      totalConversions += state.conversionProbability;
      totalLength += state.messageCount;
    });

    return {
      totalConversations: states.length,
      phaseDistribution,
      avgConversionRate: states.length > 0 ? totalConversions / states.length : 0,
      avgConversationLength: states.length > 0 ? totalLength / states.length : 0
    };
  }
}

export const conversationPredictor = new ConversationPredictor();
export type { ConversationState, PredictedAction };