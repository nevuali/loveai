import { logger } from '../utils/logger';

interface EmotionalState {
  primary: 'joy' | 'excitement' | 'anxiety' | 'disappointment' | 'confusion' | 'trust' | 'anticipation' | 'neutral';
  intensity: number; // 0-1 scale
  confidence: number; // 0-1 scale
  secondary?: EmotionalState['primary'];
  indicators: string[]; // Words/phrases that led to this detection
}

interface SentimentAnalysis {
  polarity: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  score: number; // -1 to 1
  confidence: number;
  aspects: {
    destination: number;
    price: number;
    service: number;
    experience: number;
  };
}

interface PersonalityProfile {
  traits: {
    openness: number; // Adventure-seeking vs routine
    extraversion: number; // Social vs private experiences
    agreeableness: number; // Cooperative vs independent
    conscientiousness: number; // Planned vs spontaneous
    neuroticism: number; // Anxious vs calm
  };
  communicationStyle: 'direct' | 'diplomatic' | 'enthusiastic' | 'analytical' | 'supportive';
  decisionMaking: 'impulsive' | 'deliberate' | 'collaborative' | 'research_driven';
  riskTolerance: 'high' | 'medium' | 'low';
  confidence: number;
}

interface EmotionalResponse {
  tone: 'empathetic' | 'reassuring' | 'enthusiastic' | 'informative' | 'supportive' | 'celebratory';
  approach: 'solution_focused' | 'emotional_validation' | 'information_gathering' | 'confidence_building';
  urgency: 'immediate' | 'standard' | 'patient';
  suggestions: {
    responseStyle: string;
    keyPoints: string[];
    avoidTopics: string[];
    emphasizeTopics: string[];
  };
}

class EmotionalIntelligenceEngine {
  private emotionalHistory: Map<string, EmotionalState[]> = new Map();
  private personalityProfiles: Map<string, PersonalityProfile> = new Map();
  
  // Emotional lexicon for Turkish and English
  private emotionalLexicon = {
    joy: {
      en: ['happy', 'excited', 'thrilled', 'delighted', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love'],
      tr: ['mutlu', 'heyecanlı', 'harika', 'mükemmel', 'süper', 'muhteşem', 'fevkalade', 'güzel', 'seviyorum']
    },
    excitement: {
      en: ['can\'t wait', 'so excited', 'amazing', 'incredible', 'awesome', 'brilliant', 'outstanding'],
      tr: ['sabırsızlanıyorum', 'çok heyecanlı', 'inanılmaz', 'muhteşem', 'harika', 'şahane']
    },
    anxiety: {
      en: ['worried', 'nervous', 'concerned', 'anxious', 'scared', 'afraid', 'unsure', 'doubt'],
      tr: ['endişeli', 'kaygılı', 'korkuyorum', 'emin değilim', 'tereddüt', 'şüphe', 'gergin']
    },
    disappointment: {
      en: ['disappointed', 'sad', 'unfortunate', 'not good', 'bad', 'terrible', 'awful'],
      tr: ['hayal kırıklığı', 'üzgün', 'kötü', 'berbat', 'yazık', 'maalesef']
    },
    confusion: {
      en: ['confused', 'don\'t understand', 'unclear', 'lost', 'what do you mean', 'help'],
      tr: ['karışık', 'anlamadım', 'belirsiz', 'ne demek', 'yardım', 'açıklayabilir misiniz']
    },
    trust: {
      en: ['trust', 'reliable', 'confident', 'sure', 'believe', 'faith', 'depend'],
      tr: ['güven', 'güvenilir', 'emin', 'inanıyorum', 'bağlı', 'kesin']
    },
    anticipation: {
      en: ['looking forward', 'hoping', 'planning', 'expecting', 'waiting', 'future'],
      tr: ['dört gözle bekliyorum', 'planlıyorum', 'umuyorum', 'gelecek', 'bekliyorum']
    }
  };

  // Sentiment lexicon
  private sentimentLexicon = {
    positive: {
      en: ['good', 'great', 'excellent', 'wonderful', 'amazing', 'perfect', 'love', 'like', 'enjoy', 'happy'],
      tr: ['iyi', 'güzel', 'mükemmel', 'harika', 'süper', 'seviyorum', 'beğeniyorum', 'hoşuma gidiyor']
    },
    negative: {
      en: ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disappointed'],
      tr: ['kötü', 'berbat', 'nefret', 'beğenmiyorum', 'en kötü', 'hayal kırıklığı']
    },
    intensifiers: {
      en: ['very', 'really', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely'],
      tr: ['çok', 'gerçekten', 'son derece', 'kesinlikle', 'tamamen', 'inanılmaz derecede']
    }
  };

  // Analyze emotional state from text
  analyzeEmotionalState(text: string, language: string = 'tr'): EmotionalState {
    const lowerText = text.toLowerCase();
    const emotionScores: Record<string, { score: number; indicators: string[] }> = {};
    
    // Initialize emotion scores
    Object.keys(this.emotionalLexicon).forEach(emotion => {
      emotionScores[emotion] = { score: 0, indicators: [] };
    });

    // Score each emotion
    Object.entries(this.emotionalLexicon).forEach(([emotion, words]) => {
      const wordList = words[language as keyof typeof words] || words.en;
      
      wordList.forEach(word => {
        if (lowerText.includes(word)) {
          emotionScores[emotion].score += 1;
          emotionScores[emotion].indicators.push(word);
          
          // Check for intensifiers
          const intensifiers = this.sentimentLexicon.intensifiers[language as keyof typeof this.sentimentLexicon.intensifiers] || this.sentimentLexicon.intensifiers.en;
          const wordIndex = lowerText.indexOf(word);
          const beforeWord = lowerText.substring(Math.max(0, wordIndex - 20), wordIndex);
          
          if (intensifiers.some(intensifier => beforeWord.includes(intensifier))) {
            emotionScores[emotion].score += 0.5; // Boost for intensifiers
          }
        }
      });
    });

    // Find primary emotion
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([,a], [,b]) => b.score - a.score)
      .filter(([,data]) => data.score > 0);

    if (sortedEmotions.length === 0) {
      return {
        primary: 'neutral',
        intensity: 0.3,
        confidence: 0.6,
        indicators: []
      };
    }

    const [primaryEmotion, primaryData] = sortedEmotions[0];
    const [secondaryEmotion] = sortedEmotions[1] || [null];

    // Calculate intensity and confidence
    const maxPossibleScore = this.emotionalLexicon[primaryEmotion as keyof typeof this.emotionalLexicon][language as 'en' | 'tr']?.length || 5;
    const intensity = Math.min(primaryData.score / maxPossibleScore, 1);
    const confidence = Math.min(primaryData.score / 3, 1); // Confidence based on number of indicators

    return {
      primary: primaryEmotion as EmotionalState['primary'],
      intensity,
      confidence,
      secondary: secondaryEmotion as EmotionalState['primary'] || undefined,
      indicators: primaryData.indicators
    };
  }

  // Analyze sentiment
  analyzeSentiment(text: string, language: string = 'tr'): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    // Get word lists
    const positiveWords = this.sentimentLexicon.positive[language as keyof typeof this.sentimentLexicon.positive] || this.sentimentLexicon.positive.en;
    const negativeWords = this.sentimentLexicon.negative[language as keyof typeof this.sentimentLexicon.negative] || this.sentimentLexicon.negative.en;
    const intensifiers = this.sentimentLexicon.intensifiers[language as keyof typeof this.sentimentLexicon.intensifiers] || this.sentimentLexicon.intensifiers.en;

    // Score positive words
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        let wordScore = 1;
        
        // Check for intensifiers
        const wordIndex = lowerText.indexOf(word);
        const beforeWord = lowerText.substring(Math.max(0, wordIndex - 20), wordIndex);
        if (intensifiers.some(intensifier => beforeWord.includes(intensifier))) {
          wordScore *= 1.5;
        }
        
        score += wordScore;
        positiveCount++;
      }
    });

    // Score negative words
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        let wordScore = -1;
        
        // Check for intensifiers
        const wordIndex = lowerText.indexOf(word);
        const beforeWord = lowerText.substring(Math.max(0, wordIndex - 20), wordIndex);
        if (intensifiers.some(intensifier => beforeWord.includes(intensifier))) {
          wordScore *= 1.5;
        }
        
        score += wordScore;
        negativeCount++;
      }
    });

    // Normalize score
    const totalWords = positiveCount + negativeCount;
    const normalizedScore = totalWords > 0 ? score / totalWords : 0;
    const clampedScore = Math.max(-1, Math.min(1, normalizedScore));

    // Determine polarity
    let polarity: SentimentAnalysis['polarity'];
    if (clampedScore >= 0.6) polarity = 'very_positive';
    else if (clampedScore >= 0.2) polarity = 'positive';
    else if (clampedScore <= -0.6) polarity = 'very_negative';
    else if (clampedScore <= -0.2) polarity = 'negative';
    else polarity = 'neutral';

    // Calculate confidence
    const confidence = Math.min(totalWords / 3, 1);

    // Analyze aspects (simplified)
    const aspects = {
      destination: this.analyzeAspectSentiment(text, ['destination', 'place', 'location', 'destinasyon', 'yer'], language),
      price: this.analyzeAspectSentiment(text, ['price', 'cost', 'expensive', 'cheap', 'fiyat', 'maliyet', 'pahalı', 'ucuz'], language),
      service: this.analyzeAspectSentiment(text, ['service', 'help', 'support', 'staff', 'servis', 'yardım', 'destek'], language),
      experience: this.analyzeAspectSentiment(text, ['experience', 'trip', 'vacation', 'deneyim', 'seyahat', 'tatil'], language)
    };

    return {
      polarity,
      score: clampedScore,
      confidence,
      aspects
    };
  }

  // Analyze sentiment for specific aspects
  private analyzeAspectSentiment(text: string, aspectWords: string[], language: string): number {
    const lowerText = text.toLowerCase();
    let aspectScore = 0;
    let aspectMentions = 0;

    aspectWords.forEach(aspectWord => {
      const aspectIndex = lowerText.indexOf(aspectWord);
      if (aspectIndex !== -1) {
        aspectMentions++;
        
        // Look for sentiment words near the aspect word (within 50 characters)
        const contextStart = Math.max(0, aspectIndex - 25);
        const contextEnd = Math.min(lowerText.length, aspectIndex + aspectWord.length + 25);
        const context = lowerText.substring(contextStart, contextEnd);
        
        // Quick sentiment analysis for this context
        const contextSentiment = this.analyzeSentiment(context, language);
        aspectScore += contextSentiment.score;
      }
    });

    return aspectMentions > 0 ? aspectScore / aspectMentions : 0;
  }

  // Build personality profile from conversation history
  buildPersonalityProfile(userId: string, messages: string[]): PersonalityProfile {
    let existingProfile = this.personalityProfiles.get(userId);
    
    if (!existingProfile) {
      existingProfile = {
        traits: {
          openness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          conscientiousness: 0.5,
          neuroticism: 0.5
        },
        communicationStyle: 'supportive',
        decisionMaking: 'deliberate',
        riskTolerance: 'medium',
        confidence: 0.5
      };
    }

    // Analyze communication patterns
    const allText = messages.join(' ').toLowerCase();
    
    // Openness indicators
    const adventureWords = ['adventure', 'new', 'different', 'explore', 'unique', 'macera', 'yeni', 'farklı', 'keşfet'];
    const routineWords = ['safe', 'familiar', 'usual', 'normal', 'güvenli', 'bildiğim', 'normal'];
    
    const adventureScore = adventureWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const routineScore = routineWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (adventureScore + routineScore > 0) {
      existingProfile.traits.openness = adventureScore / (adventureScore + routineScore);
    }

    // Extraversion indicators
    const socialWords = ['friends', 'people', 'social', 'party', 'group', 'arkadaş', 'insan', 'sosyal', 'grup'];
    const privateWords = ['quiet', 'private', 'alone', 'peaceful', 'sessiz', 'özel', 'yalnız', 'huzurlu'];
    
    const socialScore = socialWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const privateScore = privateWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (socialScore + privateScore > 0) {
      existingProfile.traits.extraversion = socialScore / (socialScore + privateScore);
    }

    // Conscientiousness indicators
    const planningWords = ['plan', 'schedule', 'organize', 'detailed', 'plan', 'program', 'organize', 'detaylı'];
    const spontaneousWords = ['spontaneous', 'flexible', 'last minute', 'kendiliğinden', 'esnek', 'son dakika'];
    
    const planningScore = planningWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const spontaneousScore = spontaneousWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (planningScore + spontaneousScore > 0) {
      existingProfile.traits.conscientiousness = planningScore / (planningScore + spontaneousScore);
    }

    // Neuroticism indicators (anxiety level)
    const anxietyWords = ['worried', 'nervous', 'anxious', 'concerned', 'endişeli', 'kaygılı', 'gergin'];
    const calmWords = ['relaxed', 'calm', 'confident', 'sure', 'rahat', 'sakin', 'emin'];
    
    const anxietyScore = anxietyWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const calmScore = calmWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (anxietyScore + calmScore > 0) {
      existingProfile.traits.neuroticism = anxietyScore / (anxietyScore + calmScore);
    }

    // Communication style detection
    const directWords = ['want', 'need', 'must', 'should', 'istiyorum', 'ihtiyacım', 'gerekiyor'];
    const diplomaticWords = ['maybe', 'perhaps', 'would like', 'could', 'belki', 'mümkünse', 'isterdim'];
    const enthusiasticWords = ['amazing', 'fantastic', 'love', 'excited', 'harika', 'muhteşem', 'seviyorum', 'heyecanlı'];
    
    const directScore = directWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const diplomaticScore = diplomaticWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const enthusiasticScore = enthusiasticWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);

    const maxScore = Math.max(directScore, diplomaticScore, enthusiasticScore);
    if (maxScore > 0) {
      if (directScore === maxScore) existingProfile.communicationStyle = 'direct';
      else if (diplomaticScore === maxScore) existingProfile.communicationStyle = 'diplomatic';
      else if (enthusiasticScore === maxScore) existingProfile.communicationStyle = 'enthusiastic';
    }

    // Decision making style
    const researchWords = ['compare', 'research', 'information', 'details', 'karşılaştır', 'araştır', 'bilgi', 'detay'];
    const impulsiveWords = ['now', 'immediately', 'quick', 'fast', 'şimdi', 'hemen', 'hızlı', 'çabuk'];
    
    const researchScore = researchWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const impulsiveScore = impulsiveWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (researchScore > impulsiveScore && researchScore > 2) {
      existingProfile.decisionMaking = 'research_driven';
    } else if (impulsiveScore > researchScore && impulsiveScore > 2) {
      existingProfile.decisionMaking = 'impulsive';
    }

    // Risk tolerance
    const riskWords = ['safe', 'secure', 'guaranteed', 'sure', 'güvenli', 'garanti', 'emin'];
    const adventureRiskWords = ['adventure', 'risk', 'try', 'new', 'macera', 'risk', 'dene', 'yeni'];
    
    const safetyScore = riskWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    const riskScore = adventureRiskWords.reduce((score, word) => score + (allText.includes(word) ? 1 : 0), 0);
    
    if (safetyScore > riskScore * 1.5) existingProfile.riskTolerance = 'low';
    else if (riskScore > safetyScore * 1.5) existingProfile.riskTolerance = 'high';
    else existingProfile.riskTolerance = 'medium';

    // Update confidence based on message analysis quality
    const totalIndicators = adventureScore + routineScore + socialScore + privateScore + planningScore + spontaneousScore;
    existingProfile.confidence = Math.min(totalIndicators / 10, 1);

    this.personalityProfiles.set(userId, existingProfile);
    return existingProfile;
  }

  // Generate emotionally intelligent response strategy
  generateEmotionalResponse(emotionalState: EmotionalState, personality: PersonalityProfile, context: string): EmotionalResponse {
    let tone: EmotionalResponse['tone'] = 'supportive';
    let approach: EmotionalResponse['approach'] = 'information_gathering';
    let urgency: EmotionalResponse['urgency'] = 'standard';
    
    const suggestions = {
      responseStyle: '',
      keyPoints: [] as string[],
      avoidTopics: [] as string[],
      emphasizeTopics: [] as string[]
    };

    // Response based on emotional state
    switch (emotionalState.primary) {
      case 'joy':
      case 'excitement':
        tone = 'enthusiastic';
        approach = 'confidence_building';
        suggestions.responseStyle = 'Match their excitement with enthusiastic language and exclamation marks';
        suggestions.keyPoints.push('Celebrate their positive feelings');
        suggestions.keyPoints.push('Build on their excitement with specific details');
        suggestions.emphasizeTopics.push('unique experiences', 'special moments', 'dream destinations');
        break;

      case 'anxiety':
        tone = 'reassuring';
        approach = 'emotional_validation';
        urgency = 'immediate';
        suggestions.responseStyle = 'Use calm, reassuring language and provide concrete solutions';
        suggestions.keyPoints.push('Acknowledge their concerns');
        suggestions.keyPoints.push('Provide reassurance with facts');
        suggestions.keyPoints.push('Offer step-by-step guidance');
        suggestions.avoidTopics.push('risks', 'problems', 'complications');
        suggestions.emphasizeTopics.push('safety', 'support', 'guarantees');
        break;

      case 'disappointment':
        tone = 'empathetic';
        approach = 'solution_focused';
        suggestions.responseStyle = 'Show understanding and offer alternative solutions';
        suggestions.keyPoints.push('Validate their disappointment');
        suggestions.keyPoints.push('Present better alternatives');
        suggestions.keyPoints.push('Focus on positive outcomes');
        suggestions.emphasizeTopics.push('better options', 'improvements', 'solutions');
        break;

      case 'confusion':
        tone = 'informative';
        approach = 'information_gathering';
        suggestions.responseStyle = 'Be clear, simple, and ask clarifying questions';
        suggestions.keyPoints.push('Simplify complex information');
        suggestions.keyPoints.push('Ask specific questions to understand needs');
        suggestions.keyPoints.push('Provide step-by-step explanations');
        suggestions.emphasizeTopics.push('clarity', 'simple steps', 'easy process');
        break;

      case 'trust':
        tone = 'informative';
        approach = 'confidence_building';
        suggestions.responseStyle = 'Be professional and provide detailed, accurate information';
        suggestions.keyPoints.push('Maintain professionalism');
        suggestions.keyPoints.push('Provide comprehensive details');
        suggestions.emphasizeTopics.push('expertise', 'reliability', 'track record');
        break;

      case 'anticipation':
        tone = 'enthusiastic';
        approach = 'solution_focused';
        suggestions.responseStyle = 'Share their anticipation and provide exciting details';
        suggestions.keyPoints.push('Build anticipation with exciting details');
        suggestions.keyPoints.push('Provide timeline and next steps');
        suggestions.emphasizeTopics.push('upcoming experiences', 'planning timeline', 'exciting features');
        break;

      default: // neutral
        tone = 'supportive';
        approach = 'information_gathering';
        suggestions.responseStyle = 'Be helpful and gather more information about their needs';
        break;
    }

    // Adjust based on personality
    if (personality.traits.neuroticism > 0.7) {
      tone = 'reassuring';
      suggestions.avoidTopics.push('risks', 'problems', 'uncertainties');
      suggestions.emphasizeTopics.push('safety', 'guarantees', 'support');
    }

    if (personality.traits.openness > 0.7) {
      suggestions.emphasizeTopics.push('unique experiences', 'adventure', 'new discoveries');
    } else {
      suggestions.emphasizeTopics.push('comfort', 'familiarity', 'proven options');
    }

    if (personality.communicationStyle === 'direct') {
      suggestions.responseStyle += ' Be direct and to the point.';
    } else if (personality.communicationStyle === 'diplomatic') {
      suggestions.responseStyle += ' Use diplomatic and gentle language.';
    }

    if (personality.decisionMaking === 'research_driven') {
      suggestions.keyPoints.push('Provide detailed comparisons and data');
    } else if (personality.decisionMaking === 'impulsive') {
      urgency = 'immediate';
      suggestions.keyPoints.push('Create gentle urgency and highlight immediate benefits');
    }

    return {
      tone,
      approach,
      urgency,
      suggestions
    };
  }

  // Store emotional history
  updateEmotionalHistory(userId: string, emotionalState: EmotionalState): void {
    const history = this.emotionalHistory.get(userId) || [];
    history.push(emotionalState);
    
    // Keep only last 10 emotional states
    if (history.length > 10) {
      history.shift();
    }
    
    this.emotionalHistory.set(userId, history);
  }

  // Get emotional trend
  getEmotionalTrend(userId: string): {
    trend: 'improving' | 'declining' | 'stable';
    dominantEmotion: EmotionalState['primary'];
    averageIntensity: number;
  } {
    const history = this.emotionalHistory.get(userId) || [];
    
    if (history.length < 2) {
      return {
        trend: 'stable',
        dominantEmotion: 'neutral',
        averageIntensity: 0.5
      };
    }

    // Calculate trend
    const recentStates = history.slice(-3);
    const olderStates = history.slice(-6, -3);
    
    const recentAvg = recentStates.reduce((sum, state) => sum + state.intensity, 0) / recentStates.length;
    const olderAvg = olderStates.length > 0 ? olderStates.reduce((sum, state) => sum + state.intensity, 0) / olderStates.length : recentAvg;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (recentAvg > olderAvg + 0.1) trend = 'improving';
    else if (recentAvg < olderAvg - 0.1) trend = 'declining';
    else trend = 'stable';

    // Find dominant emotion
    const emotionCounts: Record<string, number> = {};
    history.forEach(state => {
      emotionCounts[state.primary] = (emotionCounts[state.primary] || 0) + 1;
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as EmotionalState['primary'];

    const averageIntensity = history.reduce((sum, state) => sum + state.intensity, 0) / history.length;

    return {
      trend,
      dominantEmotion,
      averageIntensity
    };
  }

  // Get analytics
  getEmotionalAnalytics(): {
    totalUsers: number;
    emotionDistribution: Record<string, number>;
    averageIntensity: number;
    personalityInsights: {
      communicationStyles: Record<string, number>;
      decisionMakingStyles: Record<string, number>;
      riskToleranceLevels: Record<string, number>;
    };
  } {
    const allHistory = Array.from(this.emotionalHistory.values()).flat();
    const allProfiles = Array.from(this.personalityProfiles.values());

    const emotionDistribution: Record<string, number> = {};
    allHistory.forEach(state => {
      emotionDistribution[state.primary] = (emotionDistribution[state.primary] || 0) + 1;
    });

    const averageIntensity = allHistory.length > 0 
      ? allHistory.reduce((sum, state) => sum + state.intensity, 0) / allHistory.length
      : 0;

    const communicationStyles: Record<string, number> = {};
    const decisionMakingStyles: Record<string, number> = {};
    const riskToleranceLevels: Record<string, number> = {};

    allProfiles.forEach(profile => {
      communicationStyles[profile.communicationStyle] = (communicationStyles[profile.communicationStyle] || 0) + 1;
      decisionMakingStyles[profile.decisionMaking] = (decisionMakingStyles[profile.decisionMaking] || 0) + 1;
      riskToleranceLevels[profile.riskTolerance] = (riskToleranceLevels[profile.riskTolerance] || 0) + 1;
    });

    return {
      totalUsers: this.emotionalHistory.size,
      emotionDistribution,
      averageIntensity,
      personalityInsights: {
        communicationStyles,
        decisionMakingStyles,
        riskToleranceLevels
      }
    };
  }
}

export const emotionalIntelligenceEngine = new EmotionalIntelligenceEngine();
export type { EmotionalState, SentimentAnalysis, PersonalityProfile, EmotionalResponse };