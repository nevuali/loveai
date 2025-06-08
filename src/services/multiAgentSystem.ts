import { logger } from '../utils/logger';
import { semanticSearchEngine, QueryIntent } from './semanticSearch';
import { conversationPredictor, ConversationState } from './conversationPredictor';
import { emotionalIntelligenceEngine, EmotionalState, PersonalityProfile } from './emotionalIntelligence';
import { realTimeDataService } from './realTimeDataService';
import { aiLearningEngine } from './aiLearningEngine';

interface AgentRole {
  id: string;
  name: string;
  expertise: string[];
  priority: number;
  isActive: boolean;
  confidence: number;
}

interface AgentDecision {
  agentId: string;
  decision: 'handle' | 'assist' | 'delegate' | 'escalate';
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

interface TaskDistribution {
  primaryAgent: string;
  assistingAgents: string[];
  taskComplexity: 'simple' | 'moderate' | 'complex' | 'expert_required';
  coordinationStrategy: 'sequential' | 'parallel' | 'hierarchical';
  expectedQuality: number;
}

interface AgentResponse {
  agentId: string;
  content: string;
  confidence: number;
  supportingData: any;
  recommendations: string[];
  requiresHumanReview: boolean;
}

class MultiAgentSystem {
  private agents: Map<string, AgentRole> = new Map();
  private taskHistory: Array<{
    sessionId: string;
    userQuery: string;
    distribution: TaskDistribution;
    responses: AgentResponse[];
    finalResponse: string;
    userSatisfaction?: number;
    timestamp: number;
  }> = [];

  constructor() {
    this.initializeAgents();
  }

  // Initialize specialized AI agents
  private initializeAgents(): void {
    const agentDefinitions: AgentRole[] = [
      {
        id: 'destination_expert',
        name: 'Destination Expert Agent',
        expertise: ['destinations', 'travel_advice', 'cultural_insights', 'weather', 'local_events'],
        priority: 1,
        isActive: true,
        confidence: 0.9
      },
      {
        id: 'package_curator',
        name: 'Package Curator Agent', 
        expertise: ['package_selection', 'pricing', 'comparisons', 'customization', 'availability'],
        priority: 2,
        isActive: true,
        confidence: 0.85
      },
      {
        id: 'booking_specialist',
        name: 'Booking Specialist Agent',
        expertise: ['reservations', 'payments', 'policies', 'modifications', 'confirmations'],
        priority: 3,
        isActive: true,
        confidence: 0.8
      },
      {
        id: 'romance_concierge',
        name: 'Romance Concierge Agent',
        expertise: ['romantic_experiences', 'special_occasions', 'surprises', 'luxury_services'],
        priority: 2,
        isActive: true,
        confidence: 0.88
      },
      {
        id: 'logistics_coordinator',
        name: 'Logistics Coordinator Agent',
        expertise: ['transportation', 'schedules', 'documentation', 'practical_tips', 'troubleshooting'],
        priority: 4,
        isActive: true,
        confidence: 0.75
      },
      {
        id: 'customer_experience',
        name: 'Customer Experience Agent',
        expertise: ['communication', 'sentiment_analysis', 'problem_resolution', 'feedback_handling'],
        priority: 1,
        isActive: true,
        confidence: 0.92
      },
      {
        id: 'data_analyst',
        name: 'Data Analyst Agent',
        expertise: ['market_research', 'trend_analysis', 'personalization', 'predictions', 'optimization'],
        priority: 5,
        isActive: true,
        confidence: 0.82
      }
    ];

    agentDefinitions.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    logger.log(`🤖 Multi-Agent System initialized with ${agentDefinitions.length} specialized agents`);
  }

  // Coordinate multi-agent response
  async coordinateResponse(
    userQuery: string,
    sessionId: string,
    conversationState?: ConversationState,
    emotionalState?: EmotionalState,
    personalityProfile?: PersonalityProfile,
    userId?: string
  ): Promise<{
    response: string;
    agentContributions: AgentResponse[];
    coordination: TaskDistribution;
    systemInsights: {
      taskComplexity: string;
      agentsInvolved: number;
      coordinationTime: number;
      qualityScore: number;
    };
  }> {
    const startTime = Date.now();
    logger.log(`🎭 Multi-Agent coordination started for query: ${userQuery.substring(0, 50)}...`);

    // 1. Analyze query and determine task distribution
    const taskDistribution = await this.analyzeAndDistributeTasks(
      userQuery,
      conversationState,
      emotionalState,
      personalityProfile
    );

    // 2. Execute coordinated agent responses
    const agentResponses = await this.executeCoordinatedResponse(
      userQuery,
      taskDistribution,
      {
        sessionId,
        conversationState,
        emotionalState,
        personalityProfile,
        userId
      }
    );

    // 3. Synthesize final response
    const finalResponse = await this.synthesizeFinalResponse(
      userQuery,
      agentResponses,
      taskDistribution,
      emotionalState,
      personalityProfile
    );

    const coordinationTime = Date.now() - startTime;
    const qualityScore = this.calculateResponseQuality(agentResponses, taskDistribution);

    // 4. Record task for learning
    this.recordTaskExecution({
      sessionId,
      userQuery,
      distribution: taskDistribution,
      responses: agentResponses,
      finalResponse,
      timestamp: Date.now()
    });

    const systemInsights = {
      taskComplexity: taskDistribution.taskComplexity,
      agentsInvolved: agentResponses.length,
      coordinationTime,
      qualityScore
    };

    logger.log(`✨ Multi-Agent coordination completed in ${coordinationTime}ms with ${agentResponses.length} agents (quality: ${qualityScore.toFixed(2)})`);

    return {
      response: finalResponse,
      agentContributions: agentResponses,
      coordination: taskDistribution,
      systemInsights
    };
  }

  // Analyze query and distribute tasks among agents
  private async analyzeAndDistributeTasks(
    query: string,
    conversationState?: ConversationState,
    emotionalState?: EmotionalState,
    personalityProfile?: PersonalityProfile
  ): Promise<TaskDistribution> {
    // Get semantic intent
    const queryIntent = semanticSearchEngine.classifyQueryIntent(query);
    
    // Determine task complexity
    const complexity = this.assessTaskComplexity(query, queryIntent, conversationState);
    
    // Generate agent decisions
    const agentDecisions = this.generateAgentDecisions(query, queryIntent, conversationState, emotionalState);
    
    // Select primary agent based on expertise match and confidence
    const primaryAgent = this.selectPrimaryAgent(agentDecisions, queryIntent);
    
    // Select assisting agents
    const assistingAgents = this.selectAssistingAgents(agentDecisions, primaryAgent, complexity);
    
    // Determine coordination strategy
    const coordinationStrategy = this.determineCoordinationStrategy(complexity, agentDecisions.length);

    return {
      primaryAgent,
      assistingAgents,
      taskComplexity: complexity,
      coordinationStrategy,
      expectedQuality: this.estimateResponseQuality(primaryAgent, assistingAgents, complexity)
    };
  }

  // Generate decisions from all relevant agents
  private generateAgentDecisions(
    query: string,
    intent: QueryIntent,
    conversationState?: ConversationState,
    emotionalState?: EmotionalState
  ): AgentDecision[] {
    const decisions: AgentDecision[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [agentId, agent] of this.agents) {
      if (!agent.isActive) continue;

      let confidence = 0;
      let decision: AgentDecision['decision'] = 'assist';
      const reasoning: string[] = [];
      const suggestedActions: string[] = [];

      // Analyze expertise match
      const expertiseMatch = this.calculateExpertiseMatch(agent.expertise, query, intent);
      confidence += expertiseMatch * 0.4;

      // Agent-specific decision logic
      switch (agentId) {
        case 'destination_expert':
          if (intent.entities.destinations.length > 0 || /nere|where|destination|country|city/.test(lowerQuery)) {
            confidence += 0.4;
            decision = 'handle';
            reasoning.push('Query contains destination-related keywords');
            suggestedActions.push('Provide destination recommendations', 'Share cultural insights');
          }
          break;

        case 'package_curator':
          if (intent.primary === 'comparison' || /paket|package|price|fiyat|compare/.test(lowerQuery)) {
            confidence += 0.4;
            decision = 'handle';
            reasoning.push('Query involves package selection or comparison');
            suggestedActions.push('Show relevant packages', 'Compare options');
          }
          break;

        case 'booking_specialist':
          if (intent.primary === 'booking' || conversationState?.currentPhase === 'booking') {
            confidence += 0.5;
            decision = 'handle';
            reasoning.push('Booking-related query or conversation phase');
            suggestedActions.push('Guide booking process', 'Handle reservations');
          }
          break;

        case 'romance_concierge':
          if (/romantic|honeymoon|balayı|couple|anniversary/.test(lowerQuery)) {
            confidence += 0.3;
            decision = 'assist';
            reasoning.push('Romantic context detected');
            suggestedActions.push('Add romantic touches', 'Suggest special experiences');
          }
          break;

        case 'customer_experience':
          if (emotionalState && ['anxiety', 'disappointment', 'confusion'].includes(emotionalState.primary)) {
            confidence += 0.5;
            decision = 'handle';
            reasoning.push(`Customer showing ${emotionalState.primary} - needs experience management`);
            suggestedActions.push('Address emotional needs', 'Provide reassurance');
          } else {
            confidence += 0.2;
            decision = 'assist';
            reasoning.push('Always assist with customer experience');
            suggestedActions.push('Ensure positive tone', 'Monitor satisfaction');
          }
          break;

        case 'logistics_coordinator':
          if (/visa|transport|flight|hotel|when|schedule|plan/.test(lowerQuery)) {
            confidence += 0.3;
            decision = 'assist';
            reasoning.push('Logistics-related elements detected');
            suggestedActions.push('Provide practical information', 'Address logistics concerns');
          }
          break;

        case 'data_analyst':
          if (conversationState && conversationState.messageCount > 5) {
            confidence += 0.2;
            decision = 'assist';
            reasoning.push('Extended conversation - data insights valuable');
            suggestedActions.push('Analyze patterns', 'Provide personalized insights');
          }
          break;
      }

      // Adjust confidence based on conversation context
      if (conversationState) {
        confidence += this.getContextualConfidenceBoost(agentId, conversationState) * 0.2;
      }

      // Determine complexity estimate
      const estimatedComplexity = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';

      decisions.push({
        agentId,
        decision,
        confidence: Math.min(confidence, 1.0),
        reasoning: reasoning.join(', '),
        suggestedActions,
        estimatedComplexity
      });
    }

    return decisions.sort((a, b) => b.confidence - a.confidence);
  }

  // Calculate expertise match score
  private calculateExpertiseMatch(expertise: string[], query: string, intent: QueryIntent): number {
    const lowerQuery = query.toLowerCase();
    let matchScore = 0;

    // Direct keyword matching
    expertise.forEach(area => {
      const keywords = this.getExpertiseKeywords(area);
      const matches = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
      matchScore += matches / keywords.length;
    });

    // Intent-based matching
    if (expertise.includes('destinations') && intent.entities.destinations.length > 0) {
      matchScore += 0.3;
    }
    if (expertise.includes('package_selection') && intent.primary === 'comparison') {
      matchScore += 0.3;
    }
    if (expertise.includes('reservations') && intent.primary === 'booking') {
      matchScore += 0.4;
    }

    return Math.min(matchScore / expertise.length, 1.0);
  }

  // Get keywords for each expertise area
  private getExpertiseKeywords(area: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'destinations': ['destination', 'place', 'country', 'city', 'where', 'nere'],
      'package_selection': ['package', 'paket', 'option', 'choose', 'select'],
      'pricing': ['price', 'cost', 'budget', 'fiyat', 'bütçe'],
      'reservations': ['book', 'reserve', 'booking', 'rezervasyon'],
      'romantic_experiences': ['romantic', 'honeymoon', 'couple', 'romantik', 'balayı'],
      'transportation': ['flight', 'transport', 'uçak', 'ulaşım'],
      'communication': ['help', 'support', 'problem', 'yardım']
    };

    return keywordMap[area] || [];
  }

  // Get contextual confidence boost based on conversation state
  private getContextualConfidenceBoost(agentId: string, state: ConversationState): number {
    switch (state.currentPhase) {
      case 'greeting':
        return agentId === 'customer_experience' ? 0.3 : 0;
      case 'discovery':
        return agentId === 'destination_expert' ? 0.4 : 0;
      case 'exploration':
        return agentId === 'package_curator' ? 0.4 : 0;
      case 'comparison':
        return ['package_curator', 'data_analyst'].includes(agentId) ? 0.3 : 0;
      case 'decision':
        return ['package_curator', 'romance_concierge'].includes(agentId) ? 0.3 : 0;
      case 'booking':
        return agentId === 'booking_specialist' ? 0.5 : 0;
      case 'confirmation':
        return ['booking_specialist', 'customer_experience'].includes(agentId) ? 0.3 : 0;
      default:
        return 0;
    }
  }

  // Execute coordinated response from selected agents
  private async executeCoordinatedResponse(
    query: string,
    distribution: TaskDistribution,
    context: {
      sessionId: string;
      conversationState?: ConversationState;
      emotionalState?: EmotionalState;
      personalityProfile?: PersonalityProfile;
      userId?: string;
    }
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    const allAgents = [distribution.primaryAgent, ...distribution.assistingAgents];

    for (const agentId of allAgents) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      try {
        const response = await this.executeAgentResponse(agentId, query, context, distribution);
        if (response) {
          responses.push(response);
        }
      } catch (error) {
        logger.error(`❌ Agent ${agentId} failed:`, error);
      }
    }

    return responses;
  }

  // Execute individual agent response
  private async executeAgentResponse(
    agentId: string,
    query: string,
    context: any,
    distribution: TaskDistribution
  ): Promise<AgentResponse | null> {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const isPrimary = agentId === distribution.primaryAgent;
    let content = '';
    let confidence = agent.confidence;
    const supportingData: any = {};
    const recommendations: string[] = [];
    let requiresHumanReview = false;

    // Agent-specific response generation
    switch (agentId) {
      case 'destination_expert':
        const destinationResponse = await this.generateDestinationExpertResponse(query, context);
        content = destinationResponse.content;
        confidence *= destinationResponse.confidence;
        supportingData.destinations = destinationResponse.destinations;
        recommendations.push(...destinationResponse.recommendations);
        break;

      case 'package_curator':
        const packageResponse = await this.generatePackageCuratorResponse(query, context);
        content = packageResponse.content;
        confidence *= packageResponse.confidence;
        supportingData.packages = packageResponse.packages;
        recommendations.push(...packageResponse.recommendations);
        break;

      case 'customer_experience':
        const experienceResponse = this.generateCustomerExperienceResponse(query, context);
        content = experienceResponse.content;
        confidence *= experienceResponse.confidence;
        supportingData.tone = experienceResponse.tone;
        recommendations.push(...experienceResponse.recommendations);
        break;

      case 'romance_concierge':
        const romanceResponse = this.generateRomanceConciergeResponse(query, context);
        content = romanceResponse.content;
        confidence *= romanceResponse.confidence;
        supportingData.romanticElements = romanceResponse.elements;
        recommendations.push(...romanceResponse.recommendations);
        break;

      case 'data_analyst':
        const analysisResponse = await this.generateDataAnalystResponse(query, context);
        content = analysisResponse.content;
        confidence *= analysisResponse.confidence;
        supportingData.insights = analysisResponse.insights;
        recommendations.push(...analysisResponse.recommendations);
        break;

      default:
        // Generic agent response
        content = this.generateGenericAgentResponse(agentId, query, context);
        confidence *= 0.7;
        break;
    }

    // Check if human review is needed
    if (confidence < 0.6 || distribution.taskComplexity === 'expert_required') {
      requiresHumanReview = true;
    }

    return {
      agentId,
      content,
      confidence,
      supportingData,
      recommendations,
      requiresHumanReview
    };
  }

  // Agent-specific response generators
  private async generateDestinationExpertResponse(query: string, context: any): Promise<any> {
    const queryIntent = semanticSearchEngine.classifyQueryIntent(query);
    let content = '';
    let confidence = 0.8;
    const destinations: string[] = [];
    const recommendations: string[] = [];

    if (queryIntent.entities.destinations.length > 0) {
      const destination = queryIntent.entities.destinations[0];
      destinations.push(destination);
      
      // Get real-time data if available
      try {
        const realTimeData = await realTimeDataService.getComprehensiveTravelData(destination);
        content += `${destination} için güncel bilgiler: Hava durumu ${realTimeData.weather.current.temperature}°C, ${realTimeData.weather.current.condition}. `;
        
        if (realTimeData.events.events.length > 0) {
          content += `Yaklaşan etkinlikler: ${realTimeData.events.events[0].name}. `;
        }
        
        confidence += 0.1;
      } catch (error) {
        logger.error('Real-time data fetch failed for destination expert');
      }
      
      recommendations.push(`${destination} için özel paketlerimizi inceleyin`);
      recommendations.push('Yerel kültür ve etkinlikler hakkında detaylı bilgi');
    } else {
      content = 'Popüler balayı destinasyonları arasında Santorini, Bali, Paris ve Maldivler bulunuyor. ';
      recommendations.push('Hayalinizdeki destinasyon türü hakkında daha fazla bilgi verin');
    }

    return { content, confidence, destinations, recommendations };
  }

  private async generatePackageCuratorResponse(query: string, context: any): Promise<any> {
    let content = '';
    let confidence = 0.8;
    const packages: string[] = [];
    const recommendations: string[] = [];

    // Analyze for package-related intent
    if (/paket|package|option|seçenek/.test(query.toLowerCase())) {
      content = 'Size özel seçilmiş balayı paketlerimizi sunabilirim. ';
      packages.push('Luxury Romance Package', 'Adventure Couples Package', 'Cultural Discovery Package');
      recommendations.push('Bütçenizi belirterek daha uygun seçenekler görebilirsiniz');
      recommendations.push('Paket karşılaştırması yaparak en iyi seçimi bulabilirsiniz');
    }

    return { content, confidence, packages, recommendations };
  }

  private generateCustomerExperienceResponse(query: string, context: any): any {
    let content = '';
    let confidence = 0.9;
    let tone = 'supportive';
    const recommendations: string[] = [];

    if (context.emotionalState) {
      const emotion = context.emotionalState.primary;
      
      switch (emotion) {
        case 'anxiety':
          content = 'Endişelerinizi anlıyorum ve size yardımcı olmak için buradayım. ';
          tone = 'reassuring';
          recommendations.push('Adım adım rehberlik sağlayın');
          recommendations.push('Güvenlik ve garanti konularını vurgulayın');
          break;
        case 'excitement':
          content = 'Heyecanınızı paylaşıyorum! ';
          tone = 'enthusiastic';
          recommendations.push('Enerjilerini destekleyin');
          recommendations.push('Özel deneyimleri vurgulayın');
          break;
        case 'confusion':
          content = 'Size açıklığa kavuşturmanızda yardımcı olayım. ';
          tone = 'informative';
          recommendations.push('Basit ve anlaşılır açıklamalar yapın');
          recommendations.push('Adım adım süreç bilgisi verin');
          break;
      }
    }

    return { content, confidence, tone, recommendations };
  }

  private generateRomanceConciergeResponse(query: string, context: any): any {
    let content = '';
    let confidence = 0.8;
    const elements: string[] = [];
    const recommendations: string[] = [];

    if (/romantic|honeymoon|balayı|couple/.test(query.toLowerCase())) {
      content = 'Rüya balayınız için özel romantik dokunuşlar ekleyebilirim. ';
      elements.push('Sunset dinners', 'Couples spa', 'Private villa', 'Rose petals');
      recommendations.push('Özel günler için sürpriz planları');
      recommendations.push('Unutulmaz romantik deneyimler');
      confidence += 0.1;
    }

    return { content, confidence, elements, recommendations };
  }

  private async generateDataAnalystResponse(query: string, context: any): Promise<any> {
    let content = '';
    let confidence = 0.7;
    const insights: any = {};
    const recommendations: string[] = [];

    if (context.userId && context.conversationState) {
      // Get user learning insights
      const userInsights = aiLearningEngine.getUserInsights(context.userId);
      
      if (userInsights) {
        insights.preferences = userInsights.learnedPreferences;
        insights.patterns = userInsights.behaviorPatterns;
        
        content = 'Tercihlerinizi analiz ederek size özel öneriler sunabilirim. ';
        recommendations.push('Kişiselleştirilmiş önerileri değerlendirin');
        confidence += 0.1;
      }
    }

    return { content, confidence, insights, recommendations };
  }

  private generateGenericAgentResponse(agentId: string, query: string, context: any): string {
    const agent = this.agents.get(agentId);
    if (!agent) return '';
    
    return `${agent.name} olarak size yardımcı olmaya hazırım. `;
  }

  // Synthesize final response from all agent contributions
  private async synthesizeFinalResponse(
    query: string,
    agentResponses: AgentResponse[],
    distribution: TaskDistribution,
    emotionalState?: EmotionalState,
    personalityProfile?: PersonalityProfile
  ): Promise<string> {
    if (agentResponses.length === 0) {
      return 'Üzgünüm, şu anda size yardımcı olamıyorum. Lütfen daha sonra tekrar deneyin.';
    }

    // Get primary agent response
    const primaryResponse = agentResponses.find(r => r.agentId === distribution.primaryAgent);
    
    if (!primaryResponse) {
      return agentResponses[0].content;
    }

    let finalResponse = primaryResponse.content;

    // Add supporting content from assisting agents
    const assistingResponses = agentResponses.filter(r => r.agentId !== distribution.primaryAgent);
    
    assistingResponses.forEach(response => {
      if (response.content && response.confidence > 0.6) {
        // Only add non-redundant content
        if (!finalResponse.includes(response.content.substring(0, 20))) {
          finalResponse += response.content;
        }
      }
    });

    // Add package triggers if suggested
    const hasPackageTrigger = agentResponses.some(r => 
      r.recommendations.some(rec => rec.includes('paket') || rec.includes('package'))
    );
    
    if (hasPackageTrigger && !finalResponse.includes('SHOW_PACKAGES')) {
      finalResponse += '\n\n**SHOW_PACKAGES:romantic**';
    }

    // Add emotional touches based on customer experience agent
    const experienceAgent = agentResponses.find(r => r.agentId === 'customer_experience');
    if (experienceAgent && emotionalState) {
      switch (emotionalState.primary) {
        case 'excitement':
          finalResponse += '\n\nHeyecanınızı paylaşıyorum! ✨';
          break;
        case 'anxiety':
          finalResponse += '\n\nSize her adımda yardımcı olacağım. 💕';
          break;
      }
    }

    // Add romance touches
    const romanceAgent = agentResponses.find(r => r.agentId === 'romance_concierge');
    if (romanceAgent && romanceAgent.confidence > 0.7) {
      if (!finalResponse.includes('💕') && !finalResponse.includes('✨')) {
        finalResponse += '\n\nRomantiğin en güzel halini yaşamaya hazır mısınız? 💕';
      }
    }

    return finalResponse.trim();
  }

  // Helper methods for task distribution
  private assessTaskComplexity(
    query: string,
    intent: QueryIntent,
    conversationState?: ConversationState
  ): TaskDistribution['taskComplexity'] {
    let complexityScore = 0;

    // Query length and structure
    if (query.length > 100) complexityScore += 1;
    if (query.split(' ').length > 15) complexityScore += 1;

    // Intent complexity
    if (intent.confidence < 0.6) complexityScore += 2;
    if (intent.entities.destinations.length > 2) complexityScore += 1;

    // Conversation context
    if (conversationState) {
      if (conversationState.currentPhase === 'booking') complexityScore += 2;
      if (conversationState.messageCount > 10) complexityScore += 1;
      if (Object.keys(conversationState.collectedInfo).length > 4) complexityScore += 1;
    }

    if (complexityScore >= 5) return 'expert_required';
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 1) return 'moderate';
    return 'simple';
  }

  private selectPrimaryAgent(decisions: AgentDecision[], intent: QueryIntent): string {
    // Filter agents that want to handle the task
    const handleDecisions = decisions.filter(d => d.decision === 'handle');
    
    if (handleDecisions.length > 0) {
      return handleDecisions[0].agentId; // Highest confidence handler
    }

    // Fallback to highest confidence agent
    return decisions[0]?.agentId || 'customer_experience';
  }

  private selectAssistingAgents(
    decisions: AgentDecision[],
    primaryAgent: string,
    complexity: TaskDistribution['taskComplexity']
  ): string[] {
    const assistingCount = complexity === 'expert_required' ? 4 : complexity === 'complex' ? 3 : 2;
    
    return decisions
      .filter(d => d.agentId !== primaryAgent && d.confidence > 0.3)
      .slice(0, assistingCount)
      .map(d => d.agentId);
  }

  private determineCoordinationStrategy(
    complexity: TaskDistribution['taskComplexity'],
    agentCount: number
  ): TaskDistribution['coordinationStrategy'] {
    if (complexity === 'expert_required') return 'hierarchical';
    if (agentCount > 3) return 'parallel';
    return 'sequential';
  }

  private estimateResponseQuality(
    primaryAgent: string,
    assistingAgents: string[],
    complexity: TaskDistribution['taskComplexity']
  ): number {
    const primaryAgentData = this.agents.get(primaryAgent);
    const baseQuality = primaryAgentData?.confidence || 0.7;
    
    // Boost for assisting agents
    const assistingBoost = assistingAgents.length * 0.05;
    
    // Complexity penalty
    const complexityPenalty = {
      'simple': 0,
      'moderate': -0.05,
      'complex': -0.1,
      'expert_required': -0.15
    }[complexity];

    return Math.max(0.5, Math.min(1.0, baseQuality + assistingBoost + complexityPenalty));
  }

  private calculateResponseQuality(
    responses: AgentResponse[],
    distribution: TaskDistribution
  ): number {
    if (responses.length === 0) return 0;

    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const expectedQuality = distribution.expectedQuality;
    
    return (avgConfidence + expectedQuality) / 2;
  }

  // Record task execution for learning
  private recordTaskExecution(task: any): void {
    this.taskHistory.push(task);
    
    // Keep only last 100 tasks
    if (this.taskHistory.length > 100) {
      this.taskHistory.shift();
    }
  }

  // Analytics and insights
  getSystemAnalytics(): {
    totalTasks: number;
    avgAgentsPerTask: number;
    complexityDistribution: Record<string, number>;
    agentPerformance: Record<string, { usage: number; avgConfidence: number }>;
    coordinationEfficiency: number;
  } {
    const agentPerformance: Record<string, { usage: number; avgConfidence: number }> = {};
    const complexityDistribution: Record<string, number> = {};
    let totalAgents = 0;

    this.taskHistory.forEach(task => {
      // Track complexity
      complexityDistribution[task.distribution.taskComplexity] = 
        (complexityDistribution[task.distribution.taskComplexity] || 0) + 1;

      // Track agent performance
      task.responses.forEach(response => {
        if (!agentPerformance[response.agentId]) {
          agentPerformance[response.agentId] = { usage: 0, avgConfidence: 0 };
        }
        agentPerformance[response.agentId].usage++;
        agentPerformance[response.agentId].avgConfidence += response.confidence;
        totalAgents++;
      });
    });

    // Calculate averages
    Object.keys(agentPerformance).forEach(agentId => {
      const perf = agentPerformance[agentId];
      perf.avgConfidence = perf.avgConfidence / perf.usage;
    });

    const avgAgentsPerTask = this.taskHistory.length > 0 ? totalAgents / this.taskHistory.length : 0;
    const coordinationEfficiency = this.calculateCoordinationEfficiency();

    return {
      totalTasks: this.taskHistory.length,
      avgAgentsPerTask,
      complexityDistribution,
      agentPerformance,
      coordinationEfficiency
    };
  }

  private calculateCoordinationEfficiency(): number {
    if (this.taskHistory.length === 0) return 0;

    const successfulTasks = this.taskHistory.filter(task => 
      task.responses.some(r => r.confidence > 0.7)
    ).length;

    return successfulTasks / this.taskHistory.length;
  }

  // Get agent status
  getAgentStatus(): Record<string, { isActive: boolean; confidence: number; expertise: string[] }> {
    const status: Record<string, any> = {};
    
    this.agents.forEach((agent, id) => {
      status[id] = {
        isActive: agent.isActive,
        confidence: agent.confidence,
        expertise: agent.expertise
      };
    });

    return status;
  }

  // Update agent configuration
  updateAgentConfig(agentId: string, updates: Partial<AgentRole>): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    Object.assign(agent, updates);
    this.agents.set(agentId, agent);
    
    logger.log(`🔧 Agent ${agentId} configuration updated`);
    return true;
  }
}

export const multiAgentSystem = new MultiAgentSystem();
export type { AgentRole, AgentDecision, TaskDistribution, AgentResponse };