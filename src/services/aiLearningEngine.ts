import { logger } from '../utils/logger';

interface UserFeedback {
  messageId: string;
  sessionId: string;
  userId?: string;
  feedback: 'thumbs_up' | 'thumbs_down';
  query: string;
  response: string;
  timestamp: number;
  category: string;
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  totalAttempts: number;
  lastUpdated: number;
  category: string;
  improvements: string[];
}

interface PersonalizationProfile {
  userId: string;
  preferences: {
    responseStyle: 'detailed' | 'concise' | 'creative';
    preferredLanguage: string;
    favoriteDestinations: string[];
    budgetRange: string;
    travelStyle: string[];
    communicationTone: 'formal' | 'casual' | 'friendly';
  };
  interactionHistory: {
    totalMessages: number;
    positiveRatings: number;
    negativeRatings: number;
    commonQueries: string[];
    successfulPackages: string[];
  };
  learningInsights: {
    bestResponseTimes: string[];
    preferredPackageTypes: string[];
    conversionTriggers: string[];
  };
}

class AILearningEngine {
  private feedbackData: Map<string, UserFeedback[]> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private userProfiles: Map<string, PersonalizationProfile> = new Map();
  private readonly LEARNING_THRESHOLD = 10; // Minimum feedback for pattern learning

  // Kullanıcı geri bildirimini kaydet ve öğren
  recordFeedback(feedback: UserFeedback): void {
    const sessionFeedbacks = this.feedbackData.get(feedback.sessionId) || [];
    sessionFeedbacks.push(feedback);
    this.feedbackData.set(feedback.sessionId, sessionFeedbacks);

    // Kullanıcı profilini güncelle
    if (feedback.userId) {
      this.updateUserProfile(feedback);
    }

    // Öğrenme desenlerini güncelle
    this.updateLearningPatterns(feedback);

    logger.log(`✅ Feedback recorded: ${feedback.feedback} for query: ${feedback.query.substring(0, 50)}...`);
  }

  // Kullanıcı profilini güncelle
  private updateUserProfile(feedback: UserFeedback): void {
    if (!feedback.userId) return;

    let profile = this.userProfiles.get(feedback.userId);
    
    if (!profile) {
      profile = {
        userId: feedback.userId,
        preferences: {
          responseStyle: 'detailed',
          preferredLanguage: 'tr',
          favoriteDestinations: [],
          budgetRange: '',
          travelStyle: [],
          communicationTone: 'friendly'
        },
        interactionHistory: {
          totalMessages: 0,
          positiveRatings: 0,
          negativeRatings: 0,
          commonQueries: [],
          successfulPackages: []
        },
        learningInsights: {
          bestResponseTimes: [],
          preferredPackageTypes: [],
          conversionTriggers: []
        }
      };
    }

    // İstatistikleri güncelle
    profile.interactionHistory.totalMessages++;
    if (feedback.feedback === 'thumbs_up') {
      profile.interactionHistory.positiveRatings++;
    } else {
      profile.interactionHistory.negativeRatings++;
    }

    // Sık sorulan soruları kaydet
    const queryKeywords = this.extractKeywords(feedback.query);
    profile.interactionHistory.commonQueries = this.updateFrequencyList(
      profile.interactionHistory.commonQueries, 
      queryKeywords[0] || feedback.query.substring(0, 30)
    );

    // Başarılı paket türlerini kaydet
    if (feedback.feedback === 'thumbs_up' && feedback.response.includes('SHOW_PACKAGES')) {
      const packageType = this.extractPackageType(feedback.response);
      if (packageType) {
        profile.interactionHistory.successfulPackages = this.updateFrequencyList(
          profile.interactionHistory.successfulPackages,
          packageType
        );
      }
    }

    // Tercih öğrenme
    this.learnUserPreferences(profile, feedback);

    this.userProfiles.set(feedback.userId, profile);
  }

  // Kullanıcı tercihlerini öğren
  private learnUserPreferences(profile: PersonalizationProfile, feedback: UserFeedback): void {
    const query = feedback.query.toLowerCase();
    
    // Destinasyon tercihleri
    const destinations = ['paris', 'bali', 'santorini', 'maldivler', 'antalya', 'kapadokya'];
    destinations.forEach(dest => {
      if (query.includes(dest) && feedback.feedback === 'thumbs_up') {
        if (!profile.preferences.favoriteDestinations.includes(dest)) {
          profile.preferences.favoriteDestinations.push(dest);
        }
      }
    });

    // Yanıt stili tercihi
    if (feedback.feedback === 'thumbs_up') {
      const responseLength = feedback.response.length;
      if (responseLength > 300) {
        profile.preferences.responseStyle = 'detailed';
      } else if (responseLength < 150) {
        profile.preferences.responseStyle = 'concise';
      }
    }

    // Seyahat stili öğrenme
    const travelStyles = ['luxury', 'romantic', 'adventure', 'cultural', 'beach'];
    travelStyles.forEach(style => {
      if ((query.includes(style) || feedback.response.toLowerCase().includes(style)) && 
          feedback.feedback === 'thumbs_up') {
        if (!profile.preferences.travelStyle.includes(style)) {
          profile.preferences.travelStyle.push(style);
        }
      }
    });
  }

  // Öğrenme desenlerini güncelle
  private updateLearningPatterns(feedback: UserFeedback): void {
    const keywords = this.extractKeywords(feedback.query);
    
    keywords.forEach(keyword => {
      let pattern = this.learningPatterns.get(keyword);
      
      if (!pattern) {
        pattern = {
          pattern: keyword,
          successRate: 0,
          totalAttempts: 0,
          lastUpdated: Date.now(),
          category: feedback.category,
          improvements: []
        };
      }

      pattern.totalAttempts++;
      if (feedback.feedback === 'thumbs_up') {
        pattern.successRate = ((pattern.successRate * (pattern.totalAttempts - 1)) + 1) / pattern.totalAttempts;
      } else {
        pattern.successRate = (pattern.successRate * (pattern.totalAttempts - 1)) / pattern.totalAttempts;
        
        // Başarısız yanıtlar için iyileştirme önerileri
        this.generateImprovementSuggestions(pattern, feedback);
      }

      pattern.lastUpdated = Date.now();
      this.learningPatterns.set(keyword, pattern);
    });
  }

  // İyileştirme önerileri oluştur
  private generateImprovementSuggestions(pattern: LearningPattern, feedback: UserFeedback): void {
    const suggestions: string[] = [];

    // Response uzunluğu analizi
    if (feedback.response.length > 400) {
      suggestions.push('Daha kısa ve öz yanıtlar ver');
    } else if (feedback.response.length < 100) {
      suggestions.push('Daha detaylı bilgi ver');
    }

    // Paket önerisi eksikliği
    if (!feedback.response.includes('SHOW_PACKAGES') && feedback.category === 'package') {
      suggestions.push('Paket önerileri ekle');
    }

    // Emoji kullanımı
    const emojiCount = (feedback.response.match(/[\u2728\u{1F495}\u{1F3DD}\u{1F48E}\u2B50\u{1F31F}]/gu) || []).length;
    if (emojiCount === 0) {
      suggestions.push('Daha fazla emoji kullan');
    } else if (emojiCount > 5) {
      suggestions.push('Emoji kullanımını azalt');
    }

    pattern.improvements = [...new Set([...pattern.improvements, ...suggestions])];
  }

  // Anahtar kelimeleri çıkar
  private extractKeywords(text: string): string[] {
    const stopWords = ['için', 'ile', 'bir', 've', 'bu', 'that', 'the', 'and', 'for'];
    return text.toLowerCase()
      .replace(/[^\w\sçğıöşüÇĞIÖŞÜ]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // En fazla 5 keyword
  }

  // Paket türünü çıkar
  private extractPackageType(response: string): string | null {
    const packageMatch = response.match(/SHOW_PACKAGES:(\w+)/);
    return packageMatch ? packageMatch[1] : null;
  }

  // Frekans listesini güncelle
  private updateFrequencyList(list: string[], item: string, maxLength: number = 10): string[] {
    const index = list.indexOf(item);
    if (index > -1) {
      // Mevcut öğeyi başa taşı
      list.splice(index, 1);
      list.unshift(item);
    } else {
      // Yeni öğeyi başa ekle
      list.unshift(item);
      if (list.length > maxLength) {
        list.pop();
      }
    }
    return list;
  }

  // Kullanıcıya özel prompt oluştur
  generatePersonalizedPrompt(userId: string, basePrompt: string): string {
    const profile = this.userProfiles.get(userId);
    if (!profile) return basePrompt;

    let personalizedPrompt = basePrompt;

    // Yanıt stili tercihi
    switch (profile.preferences.responseStyle) {
      case 'concise':
        personalizedPrompt += '\n\nUSER PREFERENCE: Keep responses under 150 words, be direct and to the point.';
        break;
      case 'detailed':
        personalizedPrompt += '\n\nUSER PREFERENCE: Provide detailed explanations and comprehensive information.';
        break;
      case 'creative':
        personalizedPrompt += '\n\nUSER PREFERENCE: Be creative, use storytelling and vivid descriptions.';
        break;
    }

    // Favori destinasyonlar
    if (profile.preferences.favoriteDestinations.length > 0) {
      personalizedPrompt += `\n\nUSER FAVORITE DESTINATIONS: ${profile.preferences.favoriteDestinations.join(', ')}`;
    }

    // Seyahat stili
    if (profile.preferences.travelStyle.length > 0) {
      personalizedPrompt += `\n\nUSER TRAVEL STYLE: ${profile.preferences.travelStyle.join(', ')}`;
    }

    // Başarılı paket türleri
    if (profile.interactionHistory.successfulPackages.length > 0) {
      personalizedPrompt += `\n\nUSER PREFERRED PACKAGES: ${profile.interactionHistory.successfulPackages.slice(0, 3).join(', ')}`;
    }

    // İletişim tonu
    personalizedPrompt += `\n\nCOMMUNICATION TONE: ${profile.preferences.communicationTone}`;

    return personalizedPrompt;
  }

  // Başarı oranı düşük desenleri tespit et
  identifyProblematicPatterns(): LearningPattern[] {
    return Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.totalAttempts >= this.LEARNING_THRESHOLD)
      .filter(pattern => pattern.successRate < 0.6)
      .sort((a, b) => a.successRate - b.successRate);
  }

  // En başarılı desenleri tespit et
  identifySuccessfulPatterns(): LearningPattern[] {
    return Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.totalAttempts >= this.LEARNING_THRESHOLD)
      .filter(pattern => pattern.successRate > 0.8)
      .sort((a, b) => b.successRate - a.successRate);
  }

  // Öğrenme istatistikleri
  getLearningStats(): {
    totalFeedback: number;
    overallSuccessRate: number;
    topPatterns: LearningPattern[];
    userProfilesCount: number;
    avgResponsesPerUser: number;
  } {
    const allFeedback = Array.from(this.feedbackData.values()).flat();
    const totalFeedback = allFeedback.length;
    const positiveCount = allFeedback.filter(f => f.feedback === 'thumbs_up').length;
    
    const topPatterns = this.identifySuccessfulPatterns().slice(0, 5);
    
    const avgResponsesPerUser = this.userProfiles.size > 0 
      ? Array.from(this.userProfiles.values())
          .reduce((sum, profile) => sum + profile.interactionHistory.totalMessages, 0) / this.userProfiles.size
      : 0;

    return {
      totalFeedback,
      overallSuccessRate: totalFeedback > 0 ? positiveCount / totalFeedback : 0,
      topPatterns,
      userProfilesCount: this.userProfiles.size,
      avgResponsesPerUser
    };
  }

  // Kullanıcı profilini al
  getUserProfile(userId: string): PersonalizationProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  // Smart response öner
  suggestOptimalResponse(query: string, userId?: string): {
    shouldUseCache: boolean;
    suggestedTone: string;
    recommendedLength: 'short' | 'medium' | 'long';
    includePackages: boolean;
    personalizations: string[];
  } {
    const keywords = this.extractKeywords(query);
    const userProfile = userId ? this.getUserProfile(userId) : null;
    
    // Başarılı desenleri kontrol et
    const successfulPatterns = keywords
      .map(keyword => this.learningPatterns.get(keyword))
      .filter(pattern => pattern && pattern.successRate > 0.7);

    // Öneri oluştur
    const suggestion = {
      shouldUseCache: successfulPatterns.length > 0,
      suggestedTone: userProfile?.preferences.communicationTone || 'friendly',
      recommendedLength: this.getRecommendedLength(userProfile, keywords),
      includePackages: this.shouldIncludePackages(query, userProfile),
      personalizations: this.generatePersonalizations(userProfile, keywords)
    };

    return suggestion;
  }

  private getRecommendedLength(userProfile: PersonalizationProfile | null, keywords: string[]): 'short' | 'medium' | 'long' {
    if (userProfile?.preferences.responseStyle === 'concise') return 'short';
    if (userProfile?.preferences.responseStyle === 'detailed') return 'long';
    
    // Query complexity'e göre
    if (keywords.length > 3 || keywords.some(k => ['plan', 'itinerary', 'detailed'].includes(k))) {
      return 'long';
    }
    
    return 'medium';
  }

  private shouldIncludePackages(query: string, userProfile: PersonalizationProfile | null): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Explicit package request
    if (lowerQuery.includes('paket') || lowerQuery.includes('package') || lowerQuery.includes('öner')) {
      return true;
    }

    // User previously liked packages
    if (userProfile?.interactionHistory.successfulPackages.length && userProfile.interactionHistory.successfulPackages.length > 0) {
      return true;
    }

    return false;
  }

  private generatePersonalizations(userProfile: PersonalizationProfile | null, keywords: string[]): string[] {
    const personalizations: string[] = [];

    if (!userProfile) return personalizations;

    // Favori destinasyonları vurgula
    userProfile.preferences.favoriteDestinations.forEach(dest => {
      if (keywords.some(k => k.includes(dest))) {
        personalizations.push(`Emphasize ${dest} as user's favorite destination`);
      }
    });

    // Tercih edilen paket türlerini öner
    if (userProfile.interactionHistory.successfulPackages.length > 0) {
      personalizations.push(`Prioritize ${userProfile.interactionHistory.successfulPackages[0]} type packages`);
    }

    return personalizations;
  }
}

export const aiLearningEngine = new AILearningEngine();