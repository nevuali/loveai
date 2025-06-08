import { logger } from '../utils/logger';
import { ConversationState } from './conversationPredictor';
import { EmotionalState, PersonalityProfile } from './emotionalIntelligence';
import { VisionAnalysis } from './geminiVision';

interface InstructionContext {
  conversationPhase: ConversationState['currentPhase'];
  messageCount: number;
  emotionalState?: EmotionalState;
  personalityProfile?: PersonalityProfile;
  visionAnalysis?: VisionAnalysis;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  userIntent: 'discovery' | 'comparison' | 'booking' | 'information' | 'support';
  collectedInfo: any;
  detectedLanguage: string;
  conversionProbability: number;
  realTimeData?: any;
}

interface DynamicInstruction {
  id: string;
  name: string;
  priority: number;
  conditions: string[];
  instructionTemplate: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

interface InstructionSet {
  baseInstruction: string;
  enhancedInstructions: DynamicInstruction[];
  totalLength: number;
  optimizationLevel: 'basic' | 'standard' | 'advanced' | 'expert';
}

class DynamicInstructionsEngine {
  private instructionTemplates: Map<string, DynamicInstruction> = new Map();
  private instructionHistory: Array<{
    sessionId: string;
    context: InstructionContext;
    generatedInstructions: InstructionSet;
    effectiveness: number;
    timestamp: number;
  }> = [];

  constructor() {
    this.initializeInstructionTemplates();
  }

  // Initialize all dynamic instruction templates
  private initializeInstructionTemplates(): void {
    const templates: DynamicInstruction[] = [
      // Conversation Phase Based Instructions
      {
        id: 'greeting_optimization',
        name: 'Greeting Phase Optimization',
        priority: 1,
        conditions: ['conversationPhase == greeting'],
        instructionTemplate: `
GREETING PHASE ENHANCEMENT:
- Create immediate emotional connection with warm, personalized welcome
- Ask 1-2 strategic discovery questions about dream destination and timing
- Set romantic, magical tone with sophisticated language
- Use phrases like "Let's create your perfect love story" or "Your dream honeymoon awaits"
- Include subtle urgency: "I'm excited to help you plan something truly special"
- End with specific question about their vision: "What kind of magical experience are you imagining?"
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'discovery_deepdive',
        name: 'Discovery Phase Deep Analysis',
        priority: 1,
        conditions: ['conversationPhase == discovery'],
        instructionTemplate: `
DISCOVERY PHASE MASTERY:
- Ask progressively deeper questions to understand their true desires
- Probe for emotional motivations: "What feeling do you want your honeymoon to evoke?"
- Uncover practical needs: budget sensitivity, travel style, must-haves vs nice-to-haves
- Use assumption-based questions: "I sense you might prefer..." to guide conversation
- Create 2-3 destination categories rather than overwhelming with options
- Build anticipation: "I have some incredible ideas brewing for you..."
- Collected so far: {collectedInfo}
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'exploration_showcase',
        name: 'Exploration Phase Package Showcase',
        priority: 1,
        conditions: ['conversationPhase == exploration'],
        instructionTemplate: `
EXPLORATION PHASE EXCELLENCE:
- Present 2-3 carefully curated options that match their discovered preferences
- Use storytelling: paint vivid pictures of their experience
- Include specific details: "Imagine waking up in your overwater villa as the sun..."
- Address potential concerns proactively
- Create comparison points: "This option offers X while that provides Y"
- Use scarcity and social proof: "This is our most popular choice for couples who..."
- Include package triggers strategically based on their interests
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'comparison_facilitation',
        name: 'Comparison Phase Decision Support',
        priority: 1,
        conditions: ['conversationPhase == comparison'],
        instructionTemplate: `
COMPARISON PHASE GUIDANCE:
- Create clear, side-by-side comparisons focusing on their key criteria
- Help them weigh emotional vs practical factors
- Use decision-making frameworks: "For romance, X wins, but for adventure, Y excels"
- Address the "what if we choose wrong" fear with reassurance
- Highlight unique benefits of each option without overwhelming
- Guide them toward their heart's choice: "Which option makes you feel more excited?"
- Offer personalized recommendations based on their personality profile
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'decision_confidence',
        name: 'Decision Phase Confidence Building',
        priority: 1,
        conditions: ['conversationPhase == decision'],
        instructionTemplate: `
DECISION PHASE MOMENTUM:
- Congratulate their excellent choice with genuine enthusiasm
- Reinforce their decision with specific benefits they'll enjoy
- Create gentle urgency: "Perfect timing! This package has limited availability"
- Address last-minute doubts with reassurance and social proof
- Guide them smoothly toward booking: "Shall we secure this magical experience?"
- Use visualization: "I can already see you two creating unforgettable memories"
- Prepare them for next steps without overwhelming
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'booking_support',
        name: 'Booking Phase Professional Support',
        priority: 1,
        conditions: ['conversationPhase == booking'],
        instructionTemplate: `
BOOKING PHASE PROFESSIONALISM:
- Take complete ownership of the booking process
- Explain each step clearly and why it's necessary
- Address security and payment concerns proactively
- Provide clear timeline expectations
- Offer immediate support: "I'm here for any questions during this process"
- Use professional, confident language that builds trust
- Confirm details multiple times to avoid errors
- Celebrate their commitment to their dream honeymoon
        `,
        parameters: {},
        isActive: true
      },

      // Emotional State Based Instructions
      {
        id: 'anxiety_management',
        name: 'Anxiety Response Optimization',
        priority: 2,
        conditions: ['emotionalState.primary == anxiety'],
        instructionTemplate: `
ANXIETY RESPONSE PROTOCOL:
- Use calming, reassuring language throughout
- Provide concrete facts and guarantees to build confidence
- Break complex information into simple, digestible steps
- Avoid mentioning risks, problems, or complications
- Emphasize safety, security, and support at every step
- Use phrases like "completely taken care of," "fully guaranteed," "stress-free"
- Offer immediate support: "I'm here to handle every detail for you"
- Focus on the positive outcomes and peace of mind they'll have
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'excitement_amplification',
        name: 'Excitement Energy Matching',
        priority: 2,
        conditions: ['emotionalState.primary == excitement'],
        instructionTemplate: `
EXCITEMENT AMPLIFICATION:
- Match their energy with enthusiastic language and exclamation marks!
- Build on their excitement with vivid, sensory descriptions
- Use dynamic action words: "amazing," "incredible," "breathtaking"
- Share their enthusiasm: "I'm getting excited just thinking about your adventure!"
- Create momentum: "This is going to be absolutely magical!"
- Paint detailed pictures of the experiences they'll have
- Use rapid-fire benefits to maintain their high energy
- Encourage their adventurous spirit and bold choices
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'confusion_clarity',
        name: 'Confusion Resolution Strategy',
        priority: 2,
        conditions: ['emotionalState.primary == confusion'],
        instructionTemplate: `
CONFUSION CLARITY PROTOCOL:
- Use simple, clear language without jargon or complexity
- Break down information into numbered steps or bullet points
- Ask specific clarifying questions to understand their confusion
- Provide concrete examples rather than abstract concepts
- Repeat key information in different ways to ensure understanding
- Use analogies and comparisons they can easily relate to
- Offer to explain anything multiple times: "Let me clarify that..."
- Check for understanding before moving forward
        `,
        parameters: {},
        isActive: true
      },

      // Personality Based Instructions
      {
        id: 'direct_communicator',
        name: 'Direct Communication Style',
        priority: 3,
        conditions: ['personalityProfile.communicationStyle == direct'],
        instructionTemplate: `
DIRECT COMMUNICATION OPTIMIZATION:
- Get straight to the point without excessive pleasantries
- Use clear, declarative statements: "Here's exactly what I recommend..."
- Provide bottom-line information upfront
- Skip flowery language in favor of concrete facts and benefits
- Structure responses logically: Problem → Solution → Action
- Respect their time with efficient communication
- Ask direct questions that lead to clear answers
- Present options with clear pros/cons comparisons
        `,
        parameters: {},
        isActive: true
      },

      {
        id: 'analytical_approach',
        name: 'Analytical Decision Making Support',
        priority: 3,
        conditions: ['personalityProfile.decisionMaking == research_driven'],
        instructionTemplate: `
ANALYTICAL DECISION SUPPORT:
- Provide detailed comparisons with specific data points
- Include factual information: ratings, reviews, statistics
- Break down costs and value propositions clearly
- Offer multiple options for thorough evaluation
- Provide research-backed recommendations with reasoning
- Include pros/cons lists for major decisions
- Reference credible sources and expert opinions
- Allow time for consideration: "Take your time to review these options"
        `,
        parameters: {},
        isActive: true
      },

      // Urgency Based Instructions
      {
        id: 'high_urgency_response',
        name: 'High Urgency Immediate Action',
        priority: 1,
        conditions: ['urgencyLevel == high', 'urgencyLevel == urgent'],
        instructionTemplate: `
HIGH URGENCY RESPONSE:
- Acknowledge their timeline immediately: "I understand you need this quickly"
- Prioritize immediate actionable solutions
- Offer expedited service options
- Create clear, fast-track processes
- Provide direct contact information for immediate support
- Use decisive language: "Let's get this sorted right away"
- Skip lengthy explanations in favor of quick solutions
- Offer to handle details personally: "I'll take care of this for you immediately"
        `,
        parameters: {},
        isActive: true
      },

      // Vision Analysis Based Instructions
      {
        id: 'vision_aesthetic_matching',
        name: 'Visual Aesthetic Matching',
        priority: 2,
        conditions: ['visionAnalysis != null'],
        instructionTemplate: `
VISUAL AESTHETIC INTEGRATION:
- Reference their shared image to create personal connection
- Match your language to the visual mood they showed: {visionAnalysis.mood}
- Recommend destinations that mirror their visual preferences
- Use descriptive language that evokes the scene they shared
- Incorporate the color palette and atmosphere they're drawn to
- Connect their visual taste to specific packages and experiences
- Show you truly understand their aesthetic: "I can see you're drawn to {visionAnalysis.sceneType} beauty"
        `,
        parameters: {},
        isActive: true
      },

      // Language Optimization
      {
        id: 'turkish_cultural_context',
        name: 'Turkish Cultural Context Enhancement',
        priority: 2,
        conditions: ['detectedLanguage == tr'],
        instructionTemplate: `
TURKISH CULTURAL CONTEXT:
- Use culturally appropriate romantic expressions: "aşkın en güzel hali," "rüya gibi anlar"
- Reference Turkish honeymoon traditions and expectations
- Consider Turkish travel preferences and cultural comfort zones
- Use formal/informal address appropriately based on conversation tone
- Include Turkish romantic phrases naturally in context
- Consider Turkish holiday periods and cultural events
- Adapt recommendations to Turkish couples' typical preferences
        `,
        parameters: {},
        isActive: true
      }
    ];

    templates.forEach(template => {
      this.instructionTemplates.set(template.id, template);
    });

    logger.log(`🧠 Dynamic Instructions Engine initialized with ${templates.length} instruction templates`);
  }

  // Generate optimized system instructions based on context
  generateOptimizedInstructions(
    baseInstruction: string,
    context: InstructionContext,
    sessionId: string
  ): InstructionSet {
    const startTime = Date.now();
    logger.log(`🧠 Generating dynamic instructions for phase: ${context.conversationPhase}`);

    // Evaluate which instructions should be active
    const activeInstructions = this.evaluateInstructionConditions(context);
    
    // Sort by priority and select most relevant
    const selectedInstructions = this.selectOptimalInstructions(activeInstructions, context);

    // Generate the enhanced instruction set
    const instructionSet = this.buildInstructionSet(baseInstruction, selectedInstructions, context);

    // Record for analytics and learning
    this.recordInstructionGeneration(sessionId, context, instructionSet);

    const generationTime = Date.now() - startTime;
    logger.log(`✨ Dynamic instructions generated in ${generationTime}ms with ${selectedInstructions.length} enhancements`);

    return instructionSet;
  }

  // Evaluate which instructions meet their conditions
  private evaluateInstructionConditions(context: InstructionContext): DynamicInstruction[] {
    const activeInstructions: DynamicInstruction[] = [];

    for (const [id, instruction] of this.instructionTemplates) {
      if (!instruction.isActive) continue;

      const meetsConditions = instruction.conditions.every(condition => 
        this.evaluateCondition(condition, context)
      );

      if (meetsConditions) {
        activeInstructions.push(instruction);
      }
    }

    return activeInstructions;
  }

  // Evaluate individual condition
  private evaluateCondition(condition: string, context: InstructionContext): boolean {
    try {
      // Parse condition (simple equality checks for now)
      if (condition.includes('conversationPhase ==')) {
        const phase = condition.split('==')[1].trim();
        return context.conversationPhase === phase;
      }

      if (condition.includes('emotionalState.primary ==')) {
        const emotion = condition.split('==')[1].trim();
        return context.emotionalState?.primary === emotion;
      }

      if (condition.includes('personalityProfile.communicationStyle ==')) {
        const style = condition.split('==')[1].trim();
        return context.personalityProfile?.communicationStyle === style;
      }

      if (condition.includes('personalityProfile.decisionMaking ==')) {
        const making = condition.split('==')[1].trim();
        return context.personalityProfile?.decisionMaking === making;
      }

      if (condition.includes('urgencyLevel ==')) {
        const urgency = condition.split('==')[1].trim();
        return context.urgencyLevel === urgency;
      }

      if (condition.includes('detectedLanguage ==')) {
        const language = condition.split('==')[1].trim();
        return context.detectedLanguage === language;
      }

      if (condition === 'visionAnalysis != null') {
        return context.visionAnalysis !== undefined && context.visionAnalysis !== null;
      }

      // Advanced conditions
      if (condition.includes('messageCount >')) {
        const count = parseInt(condition.split('>')[1].trim());
        return context.messageCount > count;
      }

      if (condition.includes('conversionProbability >')) {
        const prob = parseFloat(condition.split('>')[1].trim());
        return context.conversionProbability > prob;
      }

      return false;
    } catch (error) {
      logger.error(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  // Select optimal instructions based on priority and context
  private selectOptimalInstructions(
    instructions: DynamicInstruction[],
    context: InstructionContext
  ): DynamicInstruction[] {
    // Sort by priority (lower number = higher priority)
    const sorted = instructions.sort((a, b) => a.priority - b.priority);

    // Select based on optimization level
    const optimizationLevel = this.determineOptimizationLevel(context);
    
    let maxInstructions: number;
    switch (optimizationLevel) {
      case 'expert': maxInstructions = 8; break;
      case 'advanced': maxInstructions = 6; break;
      case 'standard': maxInstructions = 4; break;
      default: maxInstructions = 2; break;
    }

    return sorted.slice(0, maxInstructions);
  }

  // Determine optimization level based on context
  private determineOptimizationLevel(context: InstructionContext): InstructionSet['optimizationLevel'] {
    let score = 0;

    // High-value conversation factors
    if (context.conversionProbability > 0.7) score += 2;
    if (context.messageCount > 5) score += 1;
    if (context.urgencyLevel === 'high' || context.urgencyLevel === 'urgent') score += 2;
    if (context.emotionalState && context.emotionalState.confidence > 0.8) score += 1;
    if (context.visionAnalysis && context.visionAnalysis.confidenceScore > 80) score += 1;
    if (['comparison', 'decision', 'booking'].includes(context.conversationPhase)) score += 2;

    if (score >= 6) return 'expert';
    if (score >= 4) return 'advanced';
    if (score >= 2) return 'standard';
    return 'basic';
  }

  // Build the final instruction set
  private buildInstructionSet(
    baseInstruction: string,
    selectedInstructions: DynamicInstruction[],
    context: InstructionContext
  ): InstructionSet {
    let enhancedInstruction = baseInstruction;

    // Add dynamic enhancements
    selectedInstructions.forEach(instruction => {
      enhancedInstruction += '\n\n' + this.processInstructionTemplate(instruction, context);
    });

    // Add context-specific optimization
    enhancedInstruction += this.generateContextSpecificOptimization(context);

    return {
      baseInstruction,
      enhancedInstructions: selectedInstructions,
      totalLength: enhancedInstruction.length,
      optimizationLevel: this.determineOptimizationLevel(context)
    };
  }

  // Process instruction template with context variables
  private processInstructionTemplate(instruction: DynamicInstruction, context: InstructionContext): string {
    let processed = instruction.instructionTemplate;

    // Replace template variables
    processed = processed.replace(/{collectedInfo}/g, JSON.stringify(context.collectedInfo));
    processed = processed.replace(/{conversationPhase}/g, context.conversationPhase);
    processed = processed.replace(/{messageCount}/g, context.messageCount.toString());

    if (context.emotionalState) {
      processed = processed.replace(/{emotionalState\.primary}/g, context.emotionalState.primary);
      processed = processed.replace(/{emotionalState\.intensity}/g, context.emotionalState.intensity.toFixed(2));
    }

    if (context.visionAnalysis) {
      processed = processed.replace(/{visionAnalysis\.mood}/g, context.visionAnalysis.mood);
      processed = processed.replace(/{visionAnalysis\.sceneType}/g, context.visionAnalysis.sceneType);
      processed = processed.replace(/{visionAnalysis\.confidenceScore}/g, context.visionAnalysis.confidenceScore.toString());
    }

    return processed;
  }

  // Generate context-specific optimization
  private generateContextSpecificOptimization(context: InstructionContext): string {
    let optimization = '\n\nCONTEXT-SPECIFIC OPTIMIZATION:';

    // Conversation-specific guidance
    optimization += `\n- Current conversation phase: ${context.conversationPhase}`;
    optimization += `\n- Message count: ${context.messageCount} (${context.messageCount > 10 ? 'extended conversation - maintain engagement' : 'early stage - build rapport'})`;
    optimization += `\n- Conversion probability: ${(context.conversionProbability * 100).toFixed(1)}% (${context.conversionProbability > 0.6 ? 'high potential - guide toward decision' : 'building interest - focus on value'})`;

    // Urgency guidance
    if (context.urgencyLevel === 'urgent' || context.urgencyLevel === 'high') {
      optimization += `\n- URGENT TIMING: User has ${context.urgencyLevel} urgency. Prioritize speed and immediate solutions.`;
    }

    // Emotional context
    if (context.emotionalState) {
      optimization += `\n- Emotional state: ${context.emotionalState.primary} (${context.emotionalState.intensity > 0.7 ? 'strong' : 'moderate'} intensity)`;
    }

    // Language and cultural context
    if (context.detectedLanguage === 'tr') {
      optimization += `\n- Turkish context: Use culturally appropriate expressions and consider Turkish travel preferences`;
    }

    // Information completeness
    const infoKeys = Object.keys(context.collectedInfo);
    if (infoKeys.length > 3) {
      optimization += `\n- Rich context available: Use collected information (${infoKeys.join(', ')}) for personalization`;
    } else {
      optimization += `\n- Limited context: Focus on information gathering and discovery`;
    }

    return optimization;
  }

  // Record instruction generation for analytics
  private recordInstructionGeneration(
    sessionId: string,
    context: InstructionContext,
    instructionSet: InstructionSet
  ): void {
    this.instructionHistory.push({
      sessionId,
      context,
      generatedInstructions: instructionSet,
      effectiveness: 0, // Will be updated based on user response
      timestamp: Date.now()
    });

    // Keep only last 50 records
    if (this.instructionHistory.length > 50) {
      this.instructionHistory.shift();
    }
  }

  // Update instruction effectiveness based on user response
  updateInstructionEffectiveness(
    sessionId: string,
    userResponseQuality: number,
    engagementLevel: number
  ): void {
    const recent = this.instructionHistory
      .filter(record => record.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (recent) {
      recent.effectiveness = (userResponseQuality + engagementLevel) / 2;
      logger.log(`📊 Instruction effectiveness updated: ${recent.effectiveness.toFixed(2)} for session ${sessionId}`);
    }
  }

  // Get instruction analytics
  getInstructionAnalytics(): {
    totalGenerations: number;
    averageOptimizationLevel: string;
    mostUsedInstructions: Array<{ id: string; count: number }>;
    averageEffectiveness: number;
    optimizationLevelDistribution: Record<string, number>;
  } {
    const instructionCounts: Record<string, number> = {};
    const optimizationDistribution: Record<string, number> = {};
    let totalEffectiveness = 0;
    let effectivenessCount = 0;

    this.instructionHistory.forEach(record => {
      // Count instruction usage
      record.generatedInstructions.enhancedInstructions.forEach(instruction => {
        instructionCounts[instruction.id] = (instructionCounts[instruction.id] || 0) + 1;
      });

      // Count optimization levels
      const level = record.generatedInstructions.optimizationLevel;
      optimizationDistribution[level] = (optimizationDistribution[level] || 0) + 1;

      // Calculate effectiveness
      if (record.effectiveness > 0) {
        totalEffectiveness += record.effectiveness;
        effectivenessCount++;
      }
    });

    const mostUsedInstructions = Object.entries(instructionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    return {
      totalGenerations: this.instructionHistory.length,
      averageOptimizationLevel: this.getMostCommonOptimizationLevel(optimizationDistribution),
      mostUsedInstructions,
      averageEffectiveness: effectivenessCount > 0 ? totalEffectiveness / effectivenessCount : 0,
      optimizationLevelDistribution: optimizationDistribution
    };
  }

  private getMostCommonOptimizationLevel(distribution: Record<string, number>): string {
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'standard';
  }

  // Add new instruction template
  addInstructionTemplate(instruction: DynamicInstruction): void {
    this.instructionTemplates.set(instruction.id, instruction);
    logger.log(`➕ New instruction template added: ${instruction.name}`);
  }

  // Update instruction template
  updateInstructionTemplate(id: string, updates: Partial<DynamicInstruction>): boolean {
    const existing = this.instructionTemplates.get(id);
    if (!existing) return false;

    const updated = { ...existing, ...updates };
    this.instructionTemplates.set(id, updated);
    logger.log(`🔧 Instruction template updated: ${id}`);
    return true;
  }

  // Get instruction templates for admin
  getInstructionTemplates(): DynamicInstruction[] {
    return Array.from(this.instructionTemplates.values());
  }
}

export const dynamicInstructionsEngine = new DynamicInstructionsEngine();
export type { InstructionContext, DynamicInstruction, InstructionSet };