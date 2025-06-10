import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface ResponseEvaluation {
  responseId: string;
  sessionId: string;
  userId?: string;
  query: string;
  response: string;
  evaluationScores: {
    helpfulness: number; // 0-10
    emotionalIntelligence: number; // 0-10
    accuracy: number; // 0-10
    engagement: number; // 0-10
    personalization: number; // 0-10
    actionability: number; // 0-10
  };
  overallQuality: number; // 0-10
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  confidence: number; // 0-1
  timestamp: number;
}

interface ImprovementPattern {
  patternId: string;
  category: 'emotional_response' | 'personalization' | 'information_accuracy' | 'engagement' | 'flow';
  frequency: number;
  description: string;
  suggestedFix: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
}

interface LearningInsight {
  insightId: string;
  type: 'strength' | 'weakness' | 'opportunity';
  description: string;
  evidence: string[];
  actionableSteps: string[];
  impact: 'high' | 'medium' | 'low';
  frequency: number;
}

interface SelfImprovementAction {
  actionId: string;
  type: 'prompt_adjustment' | 'response_style' | 'personalization_enhancement' | 'error_correction';
  description: string;
  implementation: string;
  expectedImpact: number; // 0-1
  testResults?: {
    beforeScore: number;
    afterScore: number;
    improvement: number;
  };
  status: 'planned' | 'testing' | 'implemented' | 'retired';
}

class SelfEvaluationSystem {
  private evaluations: Map<string, ResponseEvaluation> = new Map();
  private improvementPatterns: Map<string, ImprovementPattern> = new Map();
  private learningInsights: Map<string, LearningInsight> = new Map();
  private improvementActions: Map<string, SelfImprovementAction> = new Map();
  private readonly MAX_EVALUATIONS = 500;

  constructor() {
    this.initializeBaselinePatterns();
  }

  // Initialize baseline improvement patterns
  private initializeBaselinePatterns(): void {
    const baselinePatterns: ImprovementPattern[] = [
      {
        patternId: 'emotional_mismatch',
        category: 'emotional_response',
        frequency: 0,
        description: 'Response tone does not match user emotional state',
        suggestedFix: 'Enhance emotional intelligence integration and tone adaptation',
        priority: 'high',
        examples: []
      },
      {
        patternId: 'generic_recommendations',
        category: 'personalization',
        frequency: 0,
        description: 'Recommendations lack personalization and context',
        suggestedFix: 'Improve context utilization and personalization algorithms',
        priority: 'medium',
        examples: []
      },
      {
        patternId: 'information_gaps',
        category: 'information_accuracy',
        frequency: 0,
        description: 'Important information missing or incomplete',
        suggestedFix: 'Enhance knowledge integration and real-time data usage',
        priority: 'high',
        examples: []
      },
      {
        patternId: 'low_engagement',
        category: 'engagement',
        frequency: 0,
        description: 'Response fails to maintain user interest and engagement',
        suggestedFix: 'Improve storytelling, questioning techniques, and interaction flow',
        priority: 'medium',
        examples: []
      },
      {
        patternId: 'conversation_flow_issues',
        category: 'flow',
        frequency: 0,
        description: 'Poor conversation flow and transition management',
        suggestedFix: 'Enhance conversation flow prediction and phase management',
        priority: 'high',
        examples: []
      }
    ];

    baselinePatterns.forEach(pattern => {
      this.improvementPatterns.set(pattern.patternId, pattern);
    });

    logger.log(`📊 Self-Evaluation System initialized with ${baselinePatterns.length} baseline patterns`);
  }

  // Evaluate response quality using Gemini
  async evaluateResponse(
    query: string,
    response: string,
    sessionId: string,
    userId?: string,
    context?: any
  ): Promise<ResponseEvaluation> {
    const startTime = Date.now();
    const responseId = this.generateResponseId(sessionId, Date.now());
    
    logger.log(`📊 Starting self-evaluation for response: ${responseId}`);

    // 🛠️ DEVELOPMENT MODE: Skip Firebase Cloud Functions for faster development
    if (import.meta.env.MODE === 'development' || location.hostname === 'localhost') {
      logger.log('🚀 Development mode: Using local evaluation fallback');
      return this.parseFallbackEvaluation('Development mode evaluation', responseId, sessionId, userId, query, response);
    }

    try {
      // Create comprehensive evaluation prompt
      const evaluationPrompt = this.createEvaluationPrompt(query, response, context);
      
      // Call Gemini for self-evaluation
      const evaluateFunction = httpsCallable(functions, 'evaluateResponseQuality');
      const result = await evaluateFunction({
        prompt: evaluationPrompt,
        query,
        response,
        sessionId,
        userId: userId || null,
        context
      });

      const evaluationData = result.data as any;
      
      if (!evaluationData.success) {
        throw new Error(evaluationData.message || 'Evaluation failed');
      }

      // Parse evaluation response
      const evaluation = this.parseEvaluationResponse(
        evaluationData.evaluation,
        responseId,
        sessionId,
        userId,
        query,
        response
      );

      // Store evaluation
      this.storeEvaluation(evaluation);

      // Analyze patterns and generate insights
      this.analyzeImprovementPatterns(evaluation);

      const evaluationTime = Date.now() - startTime;
      logger.log(`✨ Self-evaluation completed in ${evaluationTime}ms with quality score: ${evaluation.overallQuality.toFixed(1)}`);

      return evaluation;

    } catch (error) {
      logger.error('❌ Self-evaluation failed:', error);
      
      // Return basic evaluation as fallback
      return this.parseFallbackEvaluation('Basic evaluation due to error', responseId, sessionId, userId, query, response);
    }
  }

  // Create comprehensive evaluation prompt
  private createEvaluationPrompt(query: string, response: string, context?: any): string {
    let prompt = `
You are an expert AI response evaluator specializing in honeymoon and travel consultation quality assessment.

EVALUATE this AI response with EXPERT-LEVEL precision:

USER QUERY: "${query}"

AI RESPONSE: "${response}"

EVALUATION FRAMEWORK:
Rate each dimension from 0-10 and provide detailed analysis:

1. HELPFULNESS (0-10):
   - Does the response solve the user's actual need?
   - Are recommendations practical and actionable?
   - Is the information complete and sufficient?

2. EMOTIONAL INTELLIGENCE (0-10):
   - Does the tone match the user's emotional state?
   - Is the response empathetic and emotionally aware?
   - Does it address emotional needs, not just practical ones?

3. ACCURACY (0-10):
   - Is all information correct and up-to-date?
   - Are recommendations realistic and achievable?
   - Are facts and details properly verified?

4. ENGAGEMENT (0-10):
   - Is the response interesting and captivating?
   - Does it maintain conversational flow?
   - Would this response encourage continued interaction?

5. PERSONALIZATION (0-10):
   - Is the response tailored to this specific user?
   - Does it consider individual preferences and context?
   - Does it feel personal rather than generic?

6. ACTIONABILITY (0-10):
   - Are there clear next steps for the user?
   - Are recommendations specific and implementable?
   - Does it guide the user toward a decision or action?

STRENGTHS ANALYSIS:
- List 3-5 specific strengths of this response
- What did the AI do particularly well?

WEAKNESSES ANALYSIS:
- List 3-5 specific areas for improvement
- What could have been done better?

IMPROVEMENT RECOMMENDATIONS:
- Provide 3-5 specific, actionable improvements
- How could this response be enhanced?

RESPONSE FORMAT (JSON):
{
  "evaluationScores": {
    "helpfulness": score,
    "emotionalIntelligence": score,
    "accuracy": score,
    "engagement": score,
    "personalization": score,
    "actionability": score
  },
  "overallQuality": average_score,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "confidence": confidence_level_0_to_1
}`;

    // Add context if available
    if (context) {
      prompt += `\n\nCONTEXT INFORMATION:`;
      if (context.conversationPhase) {
        prompt += `\n- Conversation phase: ${context.conversationPhase}`;
      }
      if (context.emotionalState) {
        prompt += `\n- User emotional state: ${context.emotionalState}`;
      }
      if (context.visionAnalysis) {
        prompt += `\n- Visual context: User shared ${context.visionAnalysis.sceneType} image`;
      }
      prompt += `\n\nConsider this context when evaluating appropriateness and personalization.`;
    }

    prompt += `\n\nPROVIDE detailed, expert-level evaluation in the specified JSON format.`;

    return prompt;
  }

  // Parse Gemini evaluation response
  private parseEvaluationResponse(
    rawResponse: string,
    responseId: string,
    sessionId: string,
    userId: string | undefined,
    query: string,
    response: string
  ): ResponseEvaluation {
    try {
      // Extract JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          responseId,
          sessionId,
          userId,
          query,
          response,
          evaluationScores: {
            helpfulness: this.clampScore(parsed.evaluationScores?.helpfulness || 5),
            emotionalIntelligence: this.clampScore(parsed.evaluationScores?.emotionalIntelligence || 5),
            accuracy: this.clampScore(parsed.evaluationScores?.accuracy || 5),
            engagement: this.clampScore(parsed.evaluationScores?.engagement || 5),
            personalization: this.clampScore(parsed.evaluationScores?.personalization || 5),
            actionability: this.clampScore(parsed.evaluationScores?.actionability || 5)
          },
          overallQuality: this.clampScore(parsed.overallQuality || 5),
          strengths: this.validateStringArray(parsed.strengths),
          weaknesses: this.validateStringArray(parsed.weaknesses),
          improvements: this.validateStringArray(parsed.improvements),
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      logger.error('Evaluation parsing failed:', error);
    }

    // Fallback parsing
    return this.parseFallbackEvaluation(rawResponse, responseId, sessionId, userId, query, response);
  }

  // Fallback evaluation parsing
  private parseFallbackEvaluation(
    response: string,
    responseId: string,
    sessionId: string,
    userId: string | undefined,
    query: string,
    aiResponse: string
  ): ResponseEvaluation {
    const lowerResponse = response.toLowerCase();
    
    // Simple keyword-based scoring
    let overallQuality = 5;
    
    // Positive indicators
    if (lowerResponse.includes('excellent') || lowerResponse.includes('great')) overallQuality += 1;
    if (lowerResponse.includes('helpful') || lowerResponse.includes('useful')) overallQuality += 0.5;
    if (lowerResponse.includes('personalized') || lowerResponse.includes('specific')) overallQuality += 0.5;
    
    // Negative indicators
    if (lowerResponse.includes('generic') || lowerResponse.includes('basic')) overallQuality -= 1;
    if (lowerResponse.includes('incomplete') || lowerResponse.includes('missing')) overallQuality -= 0.5;
    
    overallQuality = this.clampScore(overallQuality);

    return {
      responseId,
      sessionId,
      userId,
      query,
      response: aiResponse,
      evaluationScores: {
        helpfulness: overallQuality,
        emotionalIntelligence: overallQuality,
        accuracy: overallQuality,
        engagement: overallQuality,
        personalization: overallQuality,
        actionability: overallQuality
      },
      overallQuality,
      strengths: ['Response provided'],
      weaknesses: ['Needs improvement'],
      improvements: ['Enhance specificity'],
      confidence: 0.5,
      timestamp: Date.now()
    };
  }

  // Helper functions
  private clampScore(score: number): number {
    return Math.max(0, Math.min(10, score));
  }

  private validateStringArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => typeof item === 'string' && item.length > 0).slice(0, 5);
  }

  private generateResponseId(sessionId: string, timestamp: number): string {
    return `eval_${sessionId}_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Store evaluation and maintain cache limits
  private storeEvaluation(evaluation: ResponseEvaluation): void {
    this.evaluations.set(evaluation.responseId, evaluation);

    // Maintain cache size
    if (this.evaluations.size > this.MAX_EVALUATIONS) {
      const oldestEntries = Array.from(this.evaluations.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(this.MAX_EVALUATIONS * 0.2));
      
      oldestEntries.forEach(([key]) => this.evaluations.delete(key));
    }

    logger.log(`📝 Evaluation stored: ${evaluation.responseId} (quality: ${evaluation.overallQuality.toFixed(1)})`);
  }

  // Analyze improvement patterns
  private analyzeImprovementPatterns(evaluation: ResponseEvaluation): void {
    // Check for emotional intelligence issues
    if (evaluation.evaluationScores.emotionalIntelligence < 6) {
      this.updateImprovementPattern('emotional_mismatch', evaluation);
    }

    // Check for personalization issues
    if (evaluation.evaluationScores.personalization < 6) {
      this.updateImprovementPattern('generic_recommendations', evaluation);
    }

    // Check for information gaps
    if (evaluation.evaluationScores.accuracy < 7 || evaluation.evaluationScores.helpfulness < 7) {
      this.updateImprovementPattern('information_gaps', evaluation);
    }

    // Check for engagement issues
    if (evaluation.evaluationScores.engagement < 6) {
      this.updateImprovementPattern('low_engagement', evaluation);
    }

    // Check for flow issues
    if (evaluation.evaluationScores.actionability < 6) {
      this.updateImprovementPattern('conversation_flow_issues', evaluation);
    }

    // Generate learning insights
    this.generateLearningInsights(evaluation);
  }

  // Update improvement pattern frequency
  private updateImprovementPattern(patternId: string, evaluation: ResponseEvaluation): void {
    const pattern = this.improvementPatterns.get(patternId);
    if (!pattern) return;

    pattern.frequency++;
    pattern.examples.push(`${evaluation.query} -> ${evaluation.response.substring(0, 100)}...`);
    
    // Keep only recent examples
    if (pattern.examples.length > 5) {
      pattern.examples.shift();
    }

    // Update priority based on frequency
    if (pattern.frequency > 10) pattern.priority = 'critical';
    else if (pattern.frequency > 5) pattern.priority = 'high';

    this.improvementPatterns.set(patternId, pattern);
  }

  // Generate learning insights
  private generateLearningInsights(evaluation: ResponseEvaluation): void {
    // Identify strengths
    if (evaluation.overallQuality >= 8) {
      const strengthInsight: LearningInsight = {
        insightId: `strength_${Date.now()}`,
        type: 'strength',
        description: `High quality response pattern identified`,
        evidence: evaluation.strengths,
        actionableSteps: ['Replicate this approach in similar contexts'],
        impact: 'medium',
        frequency: 1
      };
      this.learningInsights.set(strengthInsight.insightId, strengthInsight);
    }

    // Identify improvement opportunities
    if (evaluation.overallQuality < 6) {
      const opportunityInsight: LearningInsight = {
        insightId: `opportunity_${Date.now()}`,
        type: 'opportunity',
        description: `Response quality below threshold`,
        evidence: evaluation.weaknesses,
        actionableSteps: evaluation.improvements,
        impact: 'high',
        frequency: 1
      };
      this.learningInsights.set(opportunityInsight.insightId, opportunityInsight);
    }
  }

  // Generate improvement recommendations
  async generateImprovementRecommendations(): Promise<SelfImprovementAction[]> {
    logger.log('🔄 Generating improvement recommendations...');
    
    const recommendations: SelfImprovementAction[] = [];
    
    // Analyze patterns with high frequency/priority
    const criticalPatterns = Array.from(this.improvementPatterns.values())
      .filter(pattern => pattern.priority === 'critical' || pattern.frequency > 5)
      .sort((a, b) => b.frequency - a.frequency);

    for (const pattern of criticalPatterns.slice(0, 3)) {
      const action: SelfImprovementAction = {
        actionId: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: this.mapPatternToActionType(pattern.category),
        description: `Address ${pattern.description}`,
        implementation: pattern.suggestedFix,
        expectedImpact: this.calculateExpectedImpact(pattern),
        status: 'planned'
      };
      
      recommendations.push(action);
      this.improvementActions.set(action.actionId, action);
    }

    logger.log(`💡 Generated ${recommendations.length} improvement recommendations`);
    return recommendations;
  }

  // Map pattern category to action type
  private mapPatternToActionType(category: ImprovementPattern['category']): SelfImprovementAction['type'] {
    switch (category) {
      case 'emotional_response': return 'response_style';
      case 'personalization': return 'personalization_enhancement';
      case 'information_accuracy': return 'error_correction';
      case 'engagement': return 'response_style';
      case 'flow': return 'prompt_adjustment';
      default: return 'prompt_adjustment';
    }
  }

  // Calculate expected impact
  private calculateExpectedImpact(pattern: ImprovementPattern): number {
    let impact = 0.3; // Base impact
    
    if (pattern.priority === 'critical') impact += 0.4;
    else if (pattern.priority === 'high') impact += 0.3;
    else if (pattern.priority === 'medium') impact += 0.2;
    
    // Frequency bonus
    impact += Math.min(pattern.frequency * 0.02, 0.3);
    
    return Math.min(impact, 1.0);
  }

  // Get evaluation analytics
  getEvaluationAnalytics(): {
    totalEvaluations: number;
    averageQuality: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    topStrengths: string[];
    topWeaknesses: string[];
    improvementPatterns: ImprovementPattern[];
    activeActions: number;
  } {
    const evaluations = Array.from(this.evaluations.values());
    const totalEvaluations = evaluations.length;
    
    if (totalEvaluations === 0) {
      return {
        totalEvaluations: 0,
        averageQuality: 0,
        qualityTrend: 'stable',
        topStrengths: [],
        topWeaknesses: [],
        improvementPatterns: [],
        activeActions: 0
      };
    }

    // Calculate average quality
    const averageQuality = evaluations.reduce((sum, evaluation) => sum + evaluation.overallQuality, 0) / totalEvaluations;

    // Calculate trend
    const qualityTrend = this.calculateQualityTrend(evaluations);

    // Get top strengths and weaknesses
    const allStrengths = evaluations.flatMap(evaluation => evaluation.strengths);
    const allWeaknesses = evaluations.flatMap(evaluation => evaluation.weaknesses);
    
    const topStrengths = this.getTopItems(allStrengths, 5);
    const topWeaknesses = this.getTopItems(allWeaknesses, 5);

    // Get improvement patterns
    const improvementPatterns = Array.from(this.improvementPatterns.values())
      .filter(pattern => pattern.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency);

    // Count active actions
    const activeActions = Array.from(this.improvementActions.values())
      .filter(action => ['planned', 'testing', 'implemented'].includes(action.status)).length;

    return {
      totalEvaluations,
      averageQuality,
      qualityTrend,
      topStrengths,
      topWeaknesses,
      improvementPatterns,
      activeActions
    };
  }

  // Calculate quality trend
  private calculateQualityTrend(evaluations: ResponseEvaluation[]): 'improving' | 'stable' | 'declining' {
    if (evaluations.length < 10) return 'stable';

    const sorted = evaluations.sort((a, b) => a.timestamp - b.timestamp);
    const recentHalf = sorted.slice(Math.floor(sorted.length / 2));
    const olderHalf = sorted.slice(0, Math.floor(sorted.length / 2));

    const recentAvg = recentHalf.reduce((sum, evaluation) => sum + evaluation.overallQuality, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, evaluation) => sum + evaluation.overallQuality, 0) / olderHalf.length;

    const difference = recentAvg - olderAvg;

    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }

  // Get top items by frequency
  private getTopItems(items: string[], limit: number): string[] {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  // Clear evaluation data
  clearEvaluationData(): void {
    this.evaluations.clear();
    this.learningInsights.clear();
    logger.log('🗑️ Evaluation data cleared');
  }

  // Get recent evaluations
  getRecentEvaluations(limit: number = 10): ResponseEvaluation[] {
    return Array.from(this.evaluations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const selfEvaluationSystem = new SelfEvaluationSystem();
export type { ResponseEvaluation, ImprovementPattern, LearningInsight, SelfImprovementAction };