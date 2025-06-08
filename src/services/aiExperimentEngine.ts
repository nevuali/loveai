import { logger } from '../utils/logger';

interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100 arasında yüzde
  config: {
    promptStyle?: 'formal' | 'casual' | 'enthusiastic' | 'minimal';
    responseLength?: 'short' | 'medium' | 'long';
    emojiUsage?: 'none' | 'minimal' | 'moderate' | 'heavy';
    packageRecommendationStrategy?: 'conservative' | 'aggressive' | 'contextual';
    personalizationLevel?: 'low' | 'medium' | 'high';
  };
}

interface ExperimentResult {
  variantId: string;
  sessionId: string;
  userId?: string;
  query: string;
  response: string;
  userFeedback?: 'thumbs_up' | 'thumbs_down';
  engagementMetrics: {
    responseTime: number;
    userResponseTime: number; // Kullanıcının sonraki mesaja kadar geçen süre
    messageLength: number;
    containsPackageClick: boolean;
    leadToBooking: boolean;
  };
  timestamp: number;
}

interface ExperimentStats {
  variantId: string;
  totalTests: number;
  successRate: number;
  avgResponseTime: number;
  avgUserEngagement: number;
  conversionRate: number;
  lastUpdated: number;
}

class AIExperimentEngine {
  private experiments: Map<string, ExperimentVariant[]> = new Map();
  private experimentResults: Map<string, ExperimentResult[]> = new Map();
  private experimentStats: Map<string, ExperimentStats> = new Map();
  private activeExperiments: Set<string> = new Set();

  constructor() {
    this.initializeDefaultExperiments();
  }

  // Varsayılan deneyleri başlat
  private initializeDefaultExperiments(): void {
    // Prompt Style Experiment
    this.createExperiment('prompt_style', [
      {
        id: 'formal',
        name: 'Formal Professional',
        weight: 25,
        config: {
          promptStyle: 'formal',
          responseLength: 'medium',
          emojiUsage: 'minimal'
        }
      },
      {
        id: 'casual',
        name: 'Casual Friendly',
        weight: 25,
        config: {
          promptStyle: 'casual',
          responseLength: 'medium',
          emojiUsage: 'moderate'
        }
      },
      {
        id: 'enthusiastic',
        name: 'Enthusiastic',
        weight: 25,
        config: {
          promptStyle: 'enthusiastic',
          responseLength: 'long',
          emojiUsage: 'heavy'
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Concise',
        weight: 25,
        config: {
          promptStyle: 'minimal',
          responseLength: 'short',
          emojiUsage: 'none'
        }
      }
    ]);

    // Package Recommendation Strategy Experiment
    this.createExperiment('package_strategy', [
      {
        id: 'conservative',
        name: 'Conservative Recommendations',
        weight: 33,
        config: {
          packageRecommendationStrategy: 'conservative',
          personalizationLevel: 'low'
        }
      },
      {
        id: 'aggressive',
        name: 'Aggressive Recommendations',
        weight: 33,
        config: {
          packageRecommendationStrategy: 'aggressive',
          personalizationLevel: 'high'
        }
      },
      {
        id: 'contextual',
        name: 'Contextual Recommendations',
        weight: 34,
        config: {
          packageRecommendationStrategy: 'contextual',
          personalizationLevel: 'medium'
        }
      }
    ]);

    this.activeExperiments.add('prompt_style');
    this.activeExperiments.add('package_strategy');

    logger.log('🧪 Default AI experiments initialized');
  }

  // Yeni deney oluştur
  createExperiment(experimentId: string, variants: ExperimentVariant[]): void {
    // Weight'lerin toplamının 100 olduğunu kontrol et
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      logger.error(`Experiment ${experimentId} weights don't add up to 100: ${totalWeight}`);
      return;
    }

    this.experiments.set(experimentId, variants);
    this.experimentResults.set(experimentId, []);
    
    // Her variant için stats initialize et
    variants.forEach(variant => {
      const statsKey = `${experimentId}_${variant.id}`;
      this.experimentStats.set(statsKey, {
        variantId: variant.id,
        totalTests: 0,
        successRate: 0,
        avgResponseTime: 0,
        avgUserEngagement: 0,
        conversionRate: 0,
        lastUpdated: Date.now()
      });
    });

    logger.log(`🧪 Experiment created: ${experimentId} with ${variants.length} variants`);
  }

  // Kullanıcı için variant seç
  selectVariant(experimentId: string, userId?: string, sessionId?: string): ExperimentVariant | null {
    if (!this.activeExperiments.has(experimentId)) {
      return null;
    }

    const variants = this.experiments.get(experimentId);
    if (!variants) return null;

    // Kullanıcı bazlı consistent assignment (aynı kullanıcı hep aynı variant'ı alsın)
    let seed = 0;
    if (userId) {
      seed = this.hashString(userId);
    } else if (sessionId) {
      seed = this.hashString(sessionId);
    } else {
      seed = Math.random();
    }

    // Weight'lere göre seçim yap
    const randomValue = (seed % 100);
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        logger.log(`🎯 Selected variant ${variant.id} for experiment ${experimentId}`);
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  // String'i hash'e çevir (basit hash function)
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  // Deney sonucunu kaydet
  recordExperimentResult(experimentId: string, result: ExperimentResult): void {
    const results = this.experimentResults.get(experimentId) || [];
    results.push(result);
    this.experimentResults.set(experimentId, results);

    // Stats'ı güncelle
    this.updateExperimentStats(experimentId, result);

    logger.log(`📊 Experiment result recorded for ${experimentId}:${result.variantId}`);
  }

  // Deney istatistiklerini güncelle
  private updateExperimentStats(experimentId: string, result: ExperimentResult): void {
    const statsKey = `${experimentId}_${result.variantId}`;
    let stats = this.experimentStats.get(statsKey);

    if (!stats) {
      stats = {
        variantId: result.variantId,
        totalTests: 0,
        successRate: 0,
        avgResponseTime: 0,
        avgUserEngagement: 0,
        conversionRate: 0,
        lastUpdated: Date.now()
      };
    }

    const oldTotal = stats.totalTests;
    stats.totalTests++;

    // Running average calculations
    stats.avgResponseTime = ((stats.avgResponseTime * oldTotal) + result.engagementMetrics.responseTime) / stats.totalTests;
    stats.avgUserEngagement = ((stats.avgUserEngagement * oldTotal) + result.engagementMetrics.userResponseTime) / stats.totalTests;

    // Success rate (thumbs up)
    if (result.userFeedback === 'thumbs_up') {
      stats.successRate = ((stats.successRate * oldTotal) + 1) / stats.totalTests;
    } else if (result.userFeedback === 'thumbs_down') {
      stats.successRate = (stats.successRate * oldTotal) / stats.totalTests;
    }

    // Conversion rate (package click or booking)
    if (result.engagementMetrics.containsPackageClick || result.engagementMetrics.leadToBooking) {
      const oldConversions = stats.conversionRate * oldTotal;
      stats.conversionRate = (oldConversions + 1) / stats.totalTests;
    } else {
      stats.conversionRate = (stats.conversionRate * oldTotal) / stats.totalTests;
    }

    stats.lastUpdated = Date.now();
    this.experimentStats.set(statsKey, stats);
  }

  // Variant'a göre prompt modifikasyonu
  modifyPromptForVariant(basePrompt: string, variant: ExperimentVariant): string {
    let modifiedPrompt = basePrompt;

    // Prompt style'a göre modifikasyon
    switch (variant.config.promptStyle) {
      case 'formal':
        modifiedPrompt += '\n\nSTYLE: Professional, sophisticated, use formal language. Address user respectfully.';
        break;
      case 'casual':
        modifiedPrompt += '\n\nSTYLE: Friendly, conversational, approachable. Use casual but warm language.';
        break;
      case 'enthusiastic':
        modifiedPrompt += '\n\nSTYLE: Exciting, energetic, passionate about travel. Show genuine enthusiasm!';
        break;
      case 'minimal':
        modifiedPrompt += '\n\nSTYLE: Direct, concise, no-nonsense. Get straight to the point.';
        break;
    }

    // Response length
    switch (variant.config.responseLength) {
      case 'short':
        modifiedPrompt += '\n\nLENGTH: Keep responses under 100 words. Be brief and focused.';
        break;
      case 'long':
        modifiedPrompt += '\n\nLENGTH: Provide detailed responses (200-300 words). Include comprehensive information.';
        break;
      case 'medium':
        modifiedPrompt += '\n\nLENGTH: Medium responses (100-200 words). Balance detail with conciseness.';
        break;
    }

    // Emoji usage
    switch (variant.config.emojiUsage) {
      case 'none':
        modifiedPrompt += '\n\nEMOJIS: Do not use any emojis in responses.';
        break;
      case 'minimal':
        modifiedPrompt += '\n\nEMOJIS: Use 1-2 emojis maximum, only when very relevant.';
        break;
      case 'moderate':
        modifiedPrompt += '\n\nEMOJIS: Use 2-3 emojis naturally in responses.';
        break;
      case 'heavy':
        modifiedPrompt += '\n\nEMOJIS: Use emojis generously (4-6 per response) to make it engaging.';
        break;
    }

    // Package recommendation strategy
    switch (variant.config.packageRecommendationStrategy) {
      case 'conservative':
        modifiedPrompt += '\n\nPACKAGES: Only recommend packages when explicitly asked. Be selective.';
        break;
      case 'aggressive':
        modifiedPrompt += '\n\nPACKAGES: Actively suggest relevant packages in most responses. Be proactive.';
        break;
      case 'contextual':
        modifiedPrompt += '\n\nPACKAGES: Recommend packages based on conversation context and user needs.';
        break;
    }

    return modifiedPrompt;
  }

  // Deney istatistiklerini al
  getExperimentStats(experimentId: string): ExperimentStats[] {
    const variants = this.experiments.get(experimentId);
    if (!variants) return [];

    return variants.map(variant => {
      const statsKey = `${experimentId}_${variant.id}`;
      return this.experimentStats.get(statsKey)!;
    }).filter(stats => stats.totalTests > 0);
  }

  // Kazanan variant'ı tespit et
  identifyWinningVariant(experimentId: string, metric: 'successRate' | 'conversionRate' | 'avgUserEngagement' = 'successRate'): ExperimentStats | null {
    const stats = this.getExperimentStats(experimentId);
    if (stats.length === 0) return null;

    // Minimum sample size kontrolü
    const minSampleSize = 50;
    const qualifiedStats = stats.filter(s => s.totalTests >= minSampleSize);
    
    if (qualifiedStats.length === 0) {
      logger.log(`🧪 Not enough data for ${experimentId} (min ${minSampleSize} tests per variant)`);
      return null;
    }

    return qualifiedStats.reduce((winner, current) => {
      return current[metric] > winner[metric] ? current : winner;
    });
  }

  // Deney raporu oluştur
  generateExperimentReport(experimentId: string): {
    experimentId: string;
    status: 'running' | 'concluded';
    totalTests: number;
    variants: Array<{
      variantId: string;
      tests: number;
      successRate: number;
      conversionRate: number;
      isWinner?: boolean;
    }>;
    winner?: ExperimentStats;
    insights: string[];
  } {
    const stats = this.getExperimentStats(experimentId);
    const totalTests = stats.reduce((sum, s) => sum + s.totalTests, 0);
    const winner = this.identifyWinningVariant(experimentId);

    const insights: string[] = [];
    
    // Statistical insights
    if (stats.length > 1) {
      const sortedBySuccess = [...stats].sort((a, b) => b.successRate - a.successRate);
      const best = sortedBySuccess[0];
      const worst = sortedBySuccess[sortedBySuccess.length - 1];
      
      if (best.successRate - worst.successRate > 0.1) {
        insights.push(`Significant difference: ${best.variantId} performs ${((best.successRate - worst.successRate) * 100).toFixed(1)}% better than ${worst.variantId}`);
      }

      // Conversion insights
      const sortedByConversion = [...stats].sort((a, b) => b.conversionRate - a.conversionRate);
      if (sortedByConversion[0].conversionRate > 0.05) {
        insights.push(`${sortedByConversion[0].variantId} has the highest conversion rate at ${(sortedByConversion[0].conversionRate * 100).toFixed(1)}%`);
      }
    }

    return {
      experimentId,
      status: winner ? 'concluded' : 'running',
      totalTests,
      variants: stats.map(s => ({
        variantId: s.variantId,
        tests: s.totalTests,
        successRate: s.successRate,
        conversionRate: s.conversionRate,
        isWinner: winner?.variantId === s.variantId
      })),
      winner: winner || undefined,
      insights
    };
  }

  // Aktif deneyleri al
  getActiveExperiments(): string[] {
    return Array.from(this.activeExperiments);
  }

  // Deney başlat/durdur
  toggleExperiment(experimentId: string, active: boolean): void {
    if (active) {
      this.activeExperiments.add(experimentId);
    } else {
      this.activeExperiments.delete(experimentId);
    }
    
    logger.log(`🧪 Experiment ${experimentId} ${active ? 'activated' : 'deactivated'}`);
  }
}

export const aiExperimentEngine = new AIExperimentEngine();