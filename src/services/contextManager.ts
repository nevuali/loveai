import { logger } from '../utils/logger';

interface ConversationContext {
  userPreferences: {
    budget?: string;
    destinations?: string[];
    travelStyle?: string;
    groupSize?: number;
    specialRequests?: string[];
  };
  sessionSummary: string;
  keyTopics: string[];
  lastInteractionTime: number;
  conversationPhase: 'discovery' | 'planning' | 'booking' | 'follow_up';
}

interface MessageRelevance {
  message: string;
  relevanceScore: number;
  containsUserPreferences: boolean;
  isQuestionAnswer: boolean;
}

class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_CONTEXT_MESSAGES = 10;
  private readonly RELEVANCE_THRESHOLD = 0.6;

  // Sohbet geçmişinden önemli bilgileri çıkar
  extractUserPreferences(messages: any[]): ConversationContext['userPreferences'] {
    const preferences: ConversationContext['userPreferences'] = {};
    
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');

    // Bütçe tespiti
    const budgetMatches = allText.match(/(\d+[k]?)\s*(euro|dolar|tl|lira|\$|€|₺)/gi);
    if (budgetMatches) {
      preferences.budget = budgetMatches[budgetMatches.length - 1]; // En son bahsedilen bütçe
    }

    // Destinasyon tespiti
    const destinations = this.extractDestinations(allText);
    if (destinations.length > 0) {
      preferences.destinations = destinations;
    }

    // Grup büyüklüğü
    const groupMatches = allText.match(/(ikimiz|çift|2\s*kişi|iki kişi|tek|alone|solo)/gi);
    if (groupMatches) {
      preferences.groupSize = groupMatches.includes('tek') || groupMatches.includes('solo') ? 1 : 2;
    }

    // Seyahat tarzı
    const styleKeywords = {
      luxury: /lüks|luxury|5\s*yıldız|five\s*star|premium|vip/gi,
      adventure: /macera|adventure|aktif|active|hiking|trekking/gi,
      romantic: /romantik|romantic|balayı|honeymoon|aşk|love/gi,
      cultural: /kültür|culture|tarih|history|müze|museum/gi,
      beach: /plaj|beach|deniz|sea|kumsal|sand/gi
    };

    for (const [style, regex] of Object.entries(styleKeywords)) {
      if (regex.test(allText)) {
        preferences.travelStyle = style;
        break;
      }
    }

    return preferences;
  }

  // Destinasyon çıkarma
  private extractDestinations(text: string): string[] {
    const destinations = [
      'paris', 'roma', 'istanbul', 'antalya', 'kapadokya', 'santorini', 
      'bali', 'maldives', 'maldivler', 'phuket', 'sri lanka', 'tokyo',
      'new york', 'london', 'venice', 'venedik', 'amsterdam', 'barcelona'
    ];

    const found = destinations.filter(dest => 
      text.includes(dest.toLowerCase()) || 
      text.includes(dest.charAt(0).toUpperCase() + dest.slice(1))
    );

    return found;
  }

  // Mesajların önem puanını hesapla
  calculateMessageRelevance(messages: any[]): MessageRelevance[] {
    return messages.map(msg => {
      let score = 0.3; // Base score
      const content = msg.content.toLowerCase();

      // Kullanıcı tercihleri içeriyor mu?
      const hasPreferences = /bütçe|budget|para|fiyat|price|destinasyon|destination|tarih|date|kişi|people/.test(content);
      if (hasPreferences) score += 0.4;

      // Soru-cevap yapısı var mı?
      const isQA = content.includes('?') || /nerede|nasıl|ne zaman|hangi|why|where|when|which|how/.test(content);
      if (isQA) score += 0.3;

      // Paket önerileri içeriyor mu?
      const hasPackages = /show_packages|paket|package|öner|recommend/.test(content);
      if (hasPackages) score += 0.2;

      // Son mesajlara daha yüksek puan
      const position = messages.indexOf(msg);
      const recencyBonus = (position / messages.length) * 0.2;
      score += recencyBonus;

      return {
        message: msg.content,
        relevanceScore: Math.min(score, 1.0),
        containsUserPreferences: hasPreferences,
        isQuestionAnswer: isQA
      };
    });
  }

  // Konuşma özetini çıkar
  generateConversationSummary(messages: any[], userPreferences: ConversationContext['userPreferences']): string {
    const userMessages = messages.filter(m => m.role === 'user').slice(-5); // Son 5 kullanıcı mesajı
    
    let summary = 'Kullanıcı ';
    
    if (userPreferences.destinations?.length) {
      summary += `${userPreferences.destinations.join(', ')} destinasyonlarıyla ilgilenmiş. `;
    }
    
    if (userPreferences.budget) {
      summary += `Bütçesi: ${userPreferences.budget}. `;
    }
    
    if (userPreferences.travelStyle) {
      summary += `Seyahat tarzı: ${userPreferences.travelStyle}. `;
    }

    // Son sorular
    const recentQuestions = userMessages
      .filter(m => m.content.includes('?'))
      .slice(-2)
      .map(m => m.content.substring(0, 100));
    
    if (recentQuestions.length > 0) {
      summary += `Son sorular: ${recentQuestions.join('; ')}`;
    }

    return summary;
  }

  // Konuşma fazını belirle
  determineConversationPhase(messages: any[]): ConversationContext['conversationPhase'] {
    const recentMessages = messages.slice(-3).map(m => m.content.toLowerCase()).join(' ');

    if (/merhaba|selam|hello|hi|başla/.test(recentMessages)) {
      return 'discovery';
    }
    
    if (/rezervasyon|booking|book|rezerve|satın al|buy/.test(recentMessages)) {
      return 'booking';
    }
    
    if (/plan|program|itinerary|gün|day|schedule/.test(recentMessages)) {
      return 'planning';
    }

    return 'discovery'; // Default
  }

  // Context güncelle
  updateContext(sessionId: string, messages: any[]): ConversationContext {
    const userPreferences = this.extractUserPreferences(messages);
    const summary = this.generateConversationSummary(messages, userPreferences);
    const phase = this.determineConversationPhase(messages);
    
    // Key topics extraction (basit keyword bazlı)
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const keyTopics = this.extractKeyTopics(allText);

    const context: ConversationContext = {
      userPreferences,
      sessionSummary: summary,
      keyTopics,
      lastInteractionTime: Date.now(),
      conversationPhase: phase
    };

    this.contexts.set(sessionId, context);
    logger.log(`Context updated for session ${sessionId}:`, context);
    
    return context;
  }

  // Anahtar konuları çıkar
  private extractKeyTopics(text: string): string[] {
    const topics = [
      'balayı', 'honeymoon', 'romantik', 'luxury', 'budget', 'adventure',
      'beach', 'cultural', 'food', 'spa', 'shopping', 'nightlife'
    ];

    return topics.filter(topic => text.includes(topic));
  }

  // En önemli mesajları seç
  selectRelevantMessages(messages: any[], sessionId: string): any[] {
    if (messages.length <= this.MAX_CONTEXT_MESSAGES) {
      return messages;
    }

    const relevanceData = this.calculateMessageRelevance(messages);
    
    // Her zaman son mesajı dahil et
    const lastMessage = messages[messages.length - 1];
    
    // Yüksek puanlı mesajları seç
    const relevantIndices = relevanceData
      .map((data, index) => ({ ...data, index }))
      .filter(data => data.relevanceScore >= this.RELEVANCE_THRESHOLD)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.MAX_CONTEXT_MESSAGES - 1) // Son mesaj için yer bırak
      .map(data => data.index);

    // Son mesajın indexini ekle (eğer yoksa)
    if (!relevantIndices.includes(messages.length - 1)) {
      relevantIndices.push(messages.length - 1);
    }

    // Index'leri sırala ve mesajları döndür
    relevantIndices.sort((a, b) => a - b);
    
    return relevantIndices.map(i => messages[i]);
  }

  // Context al
  getContext(sessionId: string): ConversationContext | null {
    return this.contexts.get(sessionId) || null;
  }

  // Dinamik system prompt oluştur
  generateDynamicSystemPrompt(context: ConversationContext | null): string {
    let basePrompt = `AI LOVVE - luxury honeymoon expert. EXPERTISE: destinations, luxury accommodations, romantic experiences, travel logistics.

RESPONSE FORMAT: 100-200 words max, 2-3 emojis, actionable advice, specific recommendations, paragraph breaks.

PACKAGE TRIGGERS:
**SHOW_PACKAGES:[category]** - Shows packages (luxury, romantic, adventure, cultural, beach, city)
**SHOW_PACKAGES:[location]** - Location-specific packages
**SHOW_PACKAGES:cities** - Kapadokya, Antalya, İstanbul, Sri Lanka, Phuket, Bali

TONE: Sophisticated, warm, magical. Structure: intro → content → question.`;

    if (!context) return basePrompt;

    // Kullanıcı tercihlerine göre prompt'u özelleştir
    let customization = '\n\nCONTEXT AWARENESS:\n';
    
    if (context.userPreferences.budget) {
      customization += `- User budget: ${context.userPreferences.budget}\n`;
    }
    
    if (context.userPreferences.destinations?.length) {
      customization += `- Interested destinations: ${context.userPreferences.destinations.join(', ')}\n`;
    }
    
    if (context.userPreferences.travelStyle) {
      customization += `- Travel style: ${context.userPreferences.travelStyle}\n`;
    }

    customization += `- Conversation phase: ${context.conversationPhase}\n`;
    customization += `- Session summary: ${context.sessionSummary}\n`;

    // Faza göre özel talimatlar
    switch (context.conversationPhase) {
      case 'discovery':
        customization += '- Focus on understanding needs and showing options\n';
        break;
      case 'planning':
        customization += '- Focus on detailed itineraries and specific recommendations\n';
        break;
      case 'booking':
        customization += '- Focus on booking process and confirmation details\n';
        break;
      case 'follow_up':
        customization += '- Focus on additional services and support\n';
        break;
    }

    return basePrompt + customization;
  }
}

export const contextManager = new ContextManager();