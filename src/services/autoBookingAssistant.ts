import { logger } from '../utils/logger';
import { smartRecommendationEngine } from './smartRecommendationEngine';
import { proactiveNotificationEngine } from './proactiveNotificationEngine';
import { intelligentCacheSystem } from './intelligentCacheSystem';

interface BookingIntent {
  userId: string;
  sessionId: string;
  packageId?: string;
  preferences: {
    destination?: string;
    dateRange?: { start: Date; end: Date };
    budget?: { min: number; max: number };
    groupSize?: number;
    specialRequests?: string[];
  };
  confidence: number;
  extractedFromMessage: string;
  timestamp: number;
}

interface BookingStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: any;
  validationRules?: any;
  userFriendlyName: string;
  estimatedTime: number; // seconds
}

interface AutoBookingSession {
  id: string;
  userId: string;
  packageId?: string;
  currentStep: number;
  steps: BookingStep[];
  collectedData: Record<string, any>;
  startedAt: number;
  lastActivity: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned' | 'failed';
  totalEstimatedTime: number;
  completionPercentage: number;
  assistantPersonality: 'friendly' | 'professional' | 'enthusiastic';
  userPreferences: {
    communicationStyle: 'brief' | 'detailed' | 'conversational';
    needsReassurance: boolean;
    priceTransparency: 'full' | 'summary' | 'minimal';
  };
}

interface BookingAssistantAnalytics {
  totalSessions: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropOffPoints: Map<string, number>;
  userSatisfactionRating: number;
  conversionByStep: Map<number, number>;
  commonIssues: Array<{ issue: string; frequency: number }>;
}

interface PaymentOption {
  id: string;
  name: string;
  type: 'full' | 'installment' | 'deposit';
  amount: number;
  currency: string;
  dueDate?: Date;
  description: string;
  popular: boolean;
}

class AutoBookingAssistant {
  private activeSessions = new Map<string, AutoBookingSession>();
  private bookingIntents = new Map<string, BookingIntent[]>();
  private analytics: BookingAssistantAnalytics = {
    totalSessions: 0,
    completionRate: 0,
    averageTimeToComplete: 0,
    dropOffPoints: new Map(),
    userSatisfactionRating: 0,
    conversionByStep: new Map(),
    commonIssues: []
  };

  constructor() {
    this.initializeBookingSteps();
    this.startSessionMonitoring();
  }

  // Varsayılan booking steps
  private initializeBookingSteps(): void {
    logger.log('🤖 Auto-booking assistant initialized');
  }

  // Session monitoring başlat
  private startSessionMonitoring(): void {
    // Her 5 dakikada abandoned session'ları kontrol et
    setInterval(() => {
      this.checkAbandonedSessions();
    }, 5 * 60 * 1000); // 5 minutes

    logger.log('🤖 Booking session monitoring started');
  }

  // Mesajdan booking intent çıkar
  extractBookingIntent(userId: string, sessionId: string, message: string): BookingIntent | null {
    const lowerMessage = message.toLowerCase();
    
    // Booking keywords
    const bookingKeywords = [
      'rezervasyon', 'ayırt', 'booking', 'book', 'reserve',
      'satın al', 'buy', 'purchase', 'sipariş', 'order'
    ];
    
    const hasBookingKeyword = bookingKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Intent indicators
    const intentIndicators = [
      'istiyorum', 'want', 'would like', 'please',
      'can you', 'yapabilir', 'mümkün mü'
    ];
    
    const hasIntentIndicator = intentIndicators.some(indicator => lowerMessage.includes(indicator));
    
    // Calculate confidence
    let confidence = 0;
    if (hasBookingKeyword) confidence += 0.4;
    if (hasIntentIndicator) confidence += 0.2;
    
    // Extract preferences
    const preferences = this.extractPreferencesFromMessage(message);
    if (Object.keys(preferences).length > 0) confidence += 0.3;
    
    // Price mentions
    if (lowerMessage.includes('fiyat') || lowerMessage.includes('price') || 
        lowerMessage.includes('ücret') || lowerMessage.includes('cost')) {
      confidence += 0.1;
    }

    if (confidence < 0.3) return null;

    const intent: BookingIntent = {
      userId,
      sessionId,
      preferences,
      confidence,
      extractedFromMessage: message,
      timestamp: Date.now()
    };

    // Store intent
    const userIntents = this.bookingIntents.get(userId) || [];
    userIntents.push(intent);
    this.bookingIntents.set(userId, userIntents.slice(-10)); // Keep last 10

    logger.log(`🤖 Booking intent extracted with confidence ${confidence.toFixed(2)}`);
    
    return intent;
  }

  // Mesajdan preferences çıkar
  private extractPreferencesFromMessage(message: string): any {
    const preferences: any = {};
    const lowerMessage = message.toLowerCase();

    // Destination extraction
    const destinations = ['paris', 'bali', 'santorini', 'antalya', 'kapadokya', 'maldives'];
    destinations.forEach(dest => {
      if (lowerMessage.includes(dest)) {
        preferences.destination = dest;
      }
    });

    // Budget extraction
    const budgetRegex = /(\d+)\s*(dolar|dollar|euro|tl|₺|\$|€)/g;
    const budgetMatch = budgetRegex.exec(lowerMessage);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]);
      preferences.budget = { max: amount };
    }

    // Group size
    const groupRegex = /(\d+)\s*(kişi|person|people|couple|çift)/g;
    const groupMatch = groupRegex.exec(lowerMessage);
    if (groupMatch) {
      preferences.groupSize = parseInt(groupMatch[1]);
    }

    // Date extraction (simplified)
    const dateKeywords = ['tarih', 'date', 'when', 'ne zaman'];
    if (dateKeywords.some(keyword => lowerMessage.includes(keyword))) {
      preferences.needsDatePlanning = true;
    }

    return preferences;
  }

  // Auto-booking session başlat
  startAutoBookingSession(
    userId: string, 
    intent: BookingIntent, 
    packageId?: string
  ): AutoBookingSession {
    const sessionId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate steps based on intent and package
    const steps = this.generateBookingSteps(intent, packageId);
    
    // Determine assistant personality
    const personality = this.determineAssistantPersonality(userId);
    
    // User preferences
    const userPreferences = this.getUserBookingPreferences(userId);

    const session: AutoBookingSession = {
      id: sessionId,
      userId,
      packageId,
      currentStep: 0,
      steps,
      collectedData: {},
      startedAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      totalEstimatedTime: steps.reduce((sum, step) => sum + step.estimatedTime, 0),
      completionPercentage: 0,
      assistantPersonality: personality,
      userPreferences
    };

    this.activeSessions.set(sessionId, session);
    this.analytics.totalSessions++;

    logger.log(`🤖 Auto-booking session started: ${sessionId} for user ${userId}`);
    
    return session;
  }

  // Booking steps oluştur
  private generateBookingSteps(intent: BookingIntent, packageId?: string): BookingStep[] {
    const baseSteps: BookingStep[] = [
      {
        id: 'package_confirmation',
        name: 'Package Confirmation',
        description: 'Confirm the selected package and review details',
        required: true,
        completed: false,
        userFriendlyName: 'Paket Seçimi',
        estimatedTime: 30
      },
      {
        id: 'travel_dates',
        name: 'Travel Dates',
        description: 'Select travel dates and duration',
        required: true,
        completed: false,
        userFriendlyName: 'Seyahat Tarihleri',
        estimatedTime: 45
      },
      {
        id: 'traveler_info',
        name: 'Traveler Information',
        description: 'Collect traveler details and preferences',
        required: true,
        completed: false,
        userFriendlyName: 'Yolcu Bilgileri',
        estimatedTime: 90
      },
      {
        id: 'special_requests',
        name: 'Special Requests',
        description: 'Add special requests and customizations',
        required: false,
        completed: false,
        userFriendlyName: 'Özel İstekler',
        estimatedTime: 60
      },
      {
        id: 'payment_options',
        name: 'Payment Options',
        description: 'Choose payment method and plan',
        required: true,
        completed: false,
        userFriendlyName: 'Ödeme Seçenekleri',
        estimatedTime: 45
      },
      {
        id: 'final_review',
        name: 'Final Review',
        description: 'Review and confirm all details',
        required: true,
        completed: false,
        userFriendlyName: 'Son Kontrol',
        estimatedTime: 30
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing',
        description: 'Process payment and create booking',
        required: true,
        completed: false,
        userFriendlyName: 'Ödeme İşlemi',
        estimatedTime: 60
      }
    ];

    // Customize steps based on intent
    if (intent.preferences.destination || packageId) {
      baseSteps[0].completed = true; // Package already selected
    }

    if (intent.preferences.dateRange) {
      baseSteps[1].completed = true; // Dates already provided
    }

    return baseSteps;
  }

  // Assistant personality belirle
  private determineAssistantPersonality(userId: string): 'friendly' | 'professional' | 'enthusiastic' {
    // Get user profile from recommendation engine
    const userProfile = smartRecommendationEngine.getUserProfile(userId);
    
    if (userProfile?.analytics.engagementLevel === 'high') {
      return 'enthusiastic';
    } else if (userProfile?.behavior.averageSessionDuration > 600000) { // 10+ minutes
      return 'professional';
    } else {
      return 'friendly';
    }
  }

  // User booking preferences al
  private getUserBookingPreferences(userId: string): AutoBookingSession['userPreferences'] {
    const userProfile = smartRecommendationEngine.getUserProfile(userId);
    
    return {
      communicationStyle: userProfile?.behavior.responsePreference === 'quick' ? 'brief' : 'conversational',
      needsReassurance: userProfile?.analytics.engagementLevel === 'low',
      priceTransparency: userProfile?.behavior.priceInteractionRate > 0.7 ? 'full' : 'summary'
    };
  }

  // Next step için response oluştur
  generateStepResponse(sessionId: string, userMessage?: string): string {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return "Üzgünüm, rezervasyon oturumunuz bulunamadı. Yeniden başlayalım mı?";
    }

    // Update last activity
    session.lastActivity = Date.now();

    const currentStep = session.steps[session.currentStep];
    if (!currentStep) {
      return this.completeBookingSession(session);
    }

    // Process user message for current step
    if (userMessage) {
      this.processStepInput(session, currentStep, userMessage);
    }

    // Generate response based on step and personality
    return this.generateStepResponseMessage(session, currentStep);
  }

  // Step input işle
  private processStepInput(session: AutoBookingSession, step: BookingStep, userMessage: string): void {
    const lowerMessage = userMessage.toLowerCase();

    switch (step.id) {
      case 'package_confirmation':
        this.processPackageConfirmation(session, userMessage);
        break;
      case 'travel_dates':
        this.processTravelDates(session, userMessage);
        break;
      case 'traveler_info':
        this.processTravelerInfo(session, userMessage);
        break;
      case 'special_requests':
        this.processSpecialRequests(session, userMessage);
        break;
      case 'payment_options':
        this.processPaymentOptions(session, userMessage);
        break;
      case 'final_review':
        this.processFinalReview(session, userMessage);
        break;
    }
  }

  // Package confirmation işle
  private processPackageConfirmation(session: AutoBookingSession, message: string): void {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('evet') || lowerMessage.includes('yes') || 
        lowerMessage.includes('tamam') || lowerMessage.includes('ok')) {
      session.collectedData.packageConfirmed = true;
      this.completeCurrentStep(session);
    } else if (lowerMessage.includes('hayır') || lowerMessage.includes('no') ||
               lowerMessage.includes('değiştir') || lowerMessage.includes('change')) {
      session.collectedData.needsPackageChange = true;
    }
  }

  // Travel dates işle
  private processTravelDates(session: AutoBookingSession, message: string): void {
    // Simplified date processing
    const dateRegex = /(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/g;
    const dates = [...message.matchAll(dateRegex)];
    
    if (dates.length >= 2) {
      session.collectedData.startDate = dates[0][0];
      session.collectedData.endDate = dates[1][0];
      this.completeCurrentStep(session);
    } else if (dates.length === 1) {
      session.collectedData.startDate = dates[0][0];
      session.collectedData.needsEndDate = true;
    }

    // Duration extraction
    const durationRegex = /(\d+)\s*(gün|day|night|gece)/g;
    const durationMatch = durationRegex.exec(message);
    if (durationMatch) {
      session.collectedData.duration = parseInt(durationMatch[1]);
    }
  }

  // Traveler info işle
  private processTravelerInfo(session: AutoBookingSession, message: string): void {
    // Extract name, email, phone
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /[\+]?[0-9]{10,14}/;
    
    const emailMatch = message.match(emailRegex);
    const phoneMatch = message.match(phoneRegex);
    
    if (emailMatch) {
      session.collectedData.email = emailMatch[0];
    }
    
    if (phoneMatch) {
      session.collectedData.phone = phoneMatch[0];
    }

    // Check if we have minimum required info
    if (session.collectedData.email && session.collectedData.phone) {
      this.completeCurrentStep(session);
    }
  }

  // Special requests işle
  private processSpecialRequests(session: AutoBookingSession, message: string): void {
    session.collectedData.specialRequests = session.collectedData.specialRequests || [];
    session.collectedData.specialRequests.push(message);
    this.completeCurrentStep(session);
  }

  // Payment options işle
  private processPaymentOptions(session: AutoBookingSession, message: string): void {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('taksit') || lowerMessage.includes('installment')) {
      session.collectedData.paymentType = 'installment';
    } else if (lowerMessage.includes('peşin') || lowerMessage.includes('full')) {
      session.collectedData.paymentType = 'full';
    } else if (lowerMessage.includes('kapora') || lowerMessage.includes('deposit')) {
      session.collectedData.paymentType = 'deposit';
    }

    if (session.collectedData.paymentType) {
      this.completeCurrentStep(session);
    }
  }

  // Final review işle
  private processFinalReview(session: AutoBookingSession, message: string): void {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('onayla') || lowerMessage.includes('confirm') ||
        lowerMessage.includes('evet') || lowerMessage.includes('yes')) {
      session.collectedData.finalConfirmation = true;
      this.completeCurrentStep(session);
    }
  }

  // Step tamamla
  private completeCurrentStep(session: AutoBookingSession): void {
    const currentStep = session.steps[session.currentStep];
    currentStep.completed = true;
    session.currentStep++;
    
    // Update completion percentage
    const completedSteps = session.steps.filter(s => s.completed).length;
    session.completionPercentage = (completedSteps / session.steps.length) * 100;
    
    // Analytics
    this.analytics.conversionByStep.set(session.currentStep, 
      (this.analytics.conversionByStep.get(session.currentStep) || 0) + 1);

    logger.log(`🤖 Step completed: ${currentStep.id} (${session.completionPercentage.toFixed(1)}%)`);
  }

  // Step response message oluştur
  private generateStepResponseMessage(session: AutoBookingSession, step: BookingStep): string {
    const personality = session.assistantPersonality;
    const style = session.userPreferences.communicationStyle;

    switch (step.id) {
      case 'package_confirmation':
        return this.generatePackageConfirmationMessage(session, personality, style);
      case 'travel_dates':
        return this.generateTravelDatesMessage(session, personality, style);
      case 'traveler_info':
        return this.generateTravelerInfoMessage(session, personality, style);
      case 'special_requests':
        return this.generateSpecialRequestsMessage(session, personality, style);
      case 'payment_options':
        return this.generatePaymentOptionsMessage(session, personality, style);
      case 'final_review':
        return this.generateFinalReviewMessage(session, personality, style);
      case 'payment_processing':
        return this.generatePaymentProcessingMessage(session, personality, style);
      default:
        return "Size nasıl yardımcı olabilirim?";
    }
  }

  // Package confirmation message
  private generatePackageConfirmationMessage(session: AutoBookingSession, personality: string, style: string): string {
    const messages = {
      enthusiastic: {
        brief: "🎉 Harika seçim! Bu paketi onaylıyor musunuz?",
        detailed: "🎉 Mükemmel bir seçim yaptınız! Bu paket tam size göre. Rezervasyona devam etmek için onaylayın.",
        conversational: "Ne kadar heyecanlı! Bu paketi gerçekten çok beğeneceksiniz. Onaylayıp rezervasyona geçelim mi?"
      },
      professional: {
        brief: "Seçtiğiniz paketi onaylıyor musunuz?",
        detailed: "Seçtiğiniz paket detaylarını gözden geçirdim. Rezervasyona devam etmek için onayınızı bekliyorum.",
        conversational: "Paket seçiminizi inceledim. Her şey yerli yerinde görünüyor. Rezervasyona geçebiliriz."
      },
      friendly: {
        brief: "Bu paketi seçiyoruz mu? 😊",
        detailed: "Bu paket gerçekten harika! Size çok uygun. Onaylarsanız rezervasyona geçelim.",
        conversational: "Bu paketi çok beğeneceksiniz! Onaylar mısınız? Sonra tarihlere bakalım."
      }
    };

    return messages[personality as keyof typeof messages][style as keyof typeof messages.enthusiastic];
  }

  // Travel dates message
  private generateTravelDatesMessage(session: AutoBookingSession, personality: string, style: string): string {
    if (session.collectedData.needsEndDate) {
      return "Başlangıç tarihinizi aldım. Dönüş tarihinizi de söyleyebilir misiniz?";
    }

    const messages = {
      enthusiastic: {
        brief: "🗓️ Seyahat tarihlerinizi söyleyin!",
        detailed: "🗓️ Hangi tarihlerde bu muhteşem deneyimi yaşamak istiyorsunuz? Başlangıç ve bitiş tarihlerini paylaşın.",
        conversational: "Şimdi en eğlenceli kısım! Hangi tarihlerde bu harika tatile çıkacaksınız?"
      },
      professional: {
        brief: "Seyahat tarihlerinizi belirtin.",
        detailed: "Lütfen tercih ettiğiniz seyahat tarihleri aralığını belirtiniz. Başlangıç ve bitiş tarihlerini içerecek şekilde.",
        conversational: "Seyahat tarihlerinizi planlayalım. Hangi tarihleri düşünüyorsunuz?"
      },
      friendly: {
        brief: "Hangi tarihlerde gitmek istiyorsunuz? 📅",
        detailed: "Artık tarihleri planlama zamanı! Hangi tarihlerde bu güzel seyahate çıkmak istiyorsunuz?",
        conversational: "Hadi tarihleri belirleyelim! Ne zaman bu güzel maceraya başlamak istiyorsunuz?"
      }
    };

    return messages[personality as keyof typeof messages][style as keyof typeof messages.enthusiastic];
  }

  // Traveler info message
  private generateTravelerInfoMessage(session: AutoBookingSession, personality: string, style: string): string {
    const messages = {
      enthusiastic: {
        brief: "👥 İletişim bilgilerinizi alalım!",
        detailed: "👥 Rezervasyon için iletişim bilgilerinize ihtiyacım var. Email ve telefon numaranızı paylaşır mısınız?",
        conversational: "Sizi daha iyi tanıyalım! Email ve telefon bilgilerinizi alabilir miyim?"
      },
      professional: {
        brief: "İletişim bilgilerinizi bildirin.",
        detailed: "Rezervasyon işlemi için email adresi ve telefon numaranızı belirtmeniz gerekmektedir.",
        conversational: "Rezervasyon için bazı bilgilere ihtiyacım var. Email ve telefon numaranızı paylaşabilir misiniz?"
      },
      friendly: {
        brief: "Email ve telefonunuzu alabilir miyim? 📞",
        detailed: "Size kolay ulaşabilmem için email ve telefon numaranızı paylaşabilir misiniz?",
        conversational: "İletişimde kalalım! Email ve telefon numaranızı söyleyebilir misiniz?"
      }
    };

    return messages[personality as keyof typeof messages][style as keyof typeof messages.enthusiastic];
  }

  // Special requests message
  private generateSpecialRequestsMessage(session: AutoBookingSession, personality: string, style: string): string {
    const messages = {
      enthusiastic: {
        brief: "✨ Özel istekleriniz var mı?",
        detailed: "✨ Bu özel deneyimi daha da mükemmel hale getirebiliriz! Özel istekleriniz var mı?",
        conversational: "Seyahatinizi daha da özel kılmak için istekleriniz var mı? Balayı süprizi gibi?"
      },
      professional: {
        brief: "Özel taleplerinizi belirtin.",
        detailed: "Seyahatinizle ilgili özel talep veya ihtiyaçlarınız varsa lütfen belirtiniz.",
        conversational: "Bu seyahati kişiselleştirmek için özel istekleriniz var mı?"
      },
      friendly: {
        brief: "Özel bir isteğiniz var mı? 🎁",
        detailed: "Seyahatinizi daha güzel hale getirebilecek özel istekleriniz var mı?",
        conversational: "Bu güzel seyahate özel dokunuşlar ekleyebiliriz. Özel bir isteğiniz var mı?"
      }
    };

    return messages[personality as keyof typeof messages][style as keyof typeof messages.enthusiastic];
  }

  // Payment options message
  private generatePaymentOptionsMessage(session: AutoBookingSession, personality: string, style: string): string {
    const paymentOptions = this.getPaymentOptions(session);
    
    let baseMessage = "";
    
    if (style === 'brief') {
      baseMessage = "💳 Ödeme seçenekleriniz:\n";
      paymentOptions.forEach(option => {
        baseMessage += `${option.popular ? '⭐ ' : ''}${option.name}: ${option.amount} ${option.currency}\n`;
      });
    } else {
      baseMessage = "💳 Ödeme seçeneklerinizi hazırladım:\n\n";
      paymentOptions.forEach(option => {
        baseMessage += `${option.popular ? '⭐ ' : ''}**${option.name}**\n`;
        baseMessage += `${option.description}\n`;
        baseMessage += `Tutar: ${option.amount} ${option.currency}\n\n`;
      });
    }

    baseMessage += "Hangi ödeme seçeneğini tercih edersiniz?";
    return baseMessage;
  }

  // Final review message
  private generateFinalReviewMessage(session: AutoBookingSession, personality: string, style: string): string {
    const summary = this.generateBookingSummary(session);
    
    const messages = {
      enthusiastic: {
        brief: `🎯 Son kontrol:\n${summary}\n\nOnaylıyor musunuz?`,
        detailed: `🎯 Harika! Rezervasyon detaylarınızı son kez gözden geçirelim:\n\n${summary}\n\nHer şey mükemmel görünüyor! Onaylayıp ödemeye geçelim mi?`,
        conversational: `Neredeyse bitti! Son bir kontrol yapalım:\n\n${summary}\n\nBu bilgiler doğru mu? Onaylarsanız ödemeye geçiyoruz!`
      },
      professional: {
        brief: `Son kontrol:\n${summary}\n\nOnaylıyor musunuz?`,
        detailed: `Rezervasyon detaylarınızın son kontrolü:\n\n${summary}\n\nBilgileri onaylıyor ve ödeme işlemine geçmek istiyor musunuz?`,
        conversational: `Rezervasyon bilgilerinizi kontrol edelim:\n\n${summary}\n\nOnaylarsanız ödeme adımına geçebiliriz.`
      },
      friendly: {
        brief: `😊 Son kontrol:\n${summary}\n\nTamam mı?`,
        detailed: `😊 Çok güzel! Son bir kontrol yapalım:\n\n${summary}\n\nHer şey yerli yerinde! Onaylarsanız ödemeye geçelim.`,
        conversational: `Bitmek üzere! Bir bakalım:\n\n${summary}\n\nBu bilgiler doğru mu? Onaylarsan bitiriyoruz!`
      }
    };

    return messages[personality as keyof typeof messages][style as keyof typeof messages.enthusiastic];
  }

  // Payment processing message
  private generatePaymentProcessingMessage(session: AutoBookingSession, personality: string, style: string): string {
    return "🔒 Güvenli ödeme sayfasına yönlendiriliyorsunuz. Lütfen bekleyin...";
  }

  // Booking summary oluştur
  private generateBookingSummary(session: AutoBookingSession): string {
    const data = session.collectedData;
    let summary = "";

    if (session.packageId) {
      summary += `📦 Paket: ${session.packageId}\n`;
    }
    
    if (data.startDate && data.endDate) {
      summary += `📅 Tarihler: ${data.startDate} - ${data.endDate}\n`;
    }
    
    if (data.email) {
      summary += `📧 Email: ${data.email}\n`;
    }
    
    if (data.phone) {
      summary += `📞 Telefon: ${data.phone}\n`;
    }
    
    if (data.paymentType) {
      summary += `💳 Ödeme: ${data.paymentType}\n`;
    }

    return summary;
  }

  // Payment options al
  private getPaymentOptions(session: AutoBookingSession): PaymentOption[] {
    const basePrice = 3500; // Default package price
    
    return [
      {
        id: 'full_payment',
        name: 'Peşin Ödeme',
        type: 'full',
        amount: basePrice * 0.9, // 10% discount
        currency: 'USD',
        description: '%10 indirimli peşin ödeme',
        popular: true
      },
      {
        id: 'installment_3',
        name: '3 Taksit',
        type: 'installment',
        amount: basePrice / 3,
        currency: 'USD',
        description: '3 eşit taksit, faizsiz',
        popular: false
      },
      {
        id: 'deposit_30',
        name: '%30 Kapora',
        type: 'deposit',
        amount: basePrice * 0.3,
        currency: 'USD',
        description: '%30 kapora, kalan tutar seyahat öncesi',
        popular: false
      }
    ];
  }

  // Booking session tamamla
  private completeBookingSession(session: AutoBookingSession): string {
    session.status = 'completed';
    session.completionPercentage = 100;
    
    const completionTime = Date.now() - session.startedAt;
    this.analytics.averageTimeToComplete = 
      (this.analytics.averageTimeToComplete + completionTime) / 2;
    this.analytics.completionRate = 
      (this.analytics.completionRate * this.analytics.totalSessions + 1) / 
      (this.analytics.totalSessions + 1);

    // Send completion notification
    proactiveNotificationEngine.updateUserProfile(session.userId, {
      booking: session.packageId || 'completed'
    });

    logger.log(`🎉 Booking session completed: ${session.id} in ${completionTime}ms`);

    return "🎉 Tebrikler! Rezervasyonunuz başarıyla tamamlandı. Onay emaili gönderildi. Size harika bir balayı diliyorum! 💕";
  }

  // Abandoned session'ları kontrol et
  private checkAbandonedSessions(): void {
    const now = Date.now();
    const abandonThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.activeSessions) {
      if (session.status === 'active' && 
          (now - session.lastActivity) > abandonThreshold) {
        
        session.status = 'abandoned';
        
        // Record drop-off point
        const dropOffStep = session.steps[session.currentStep]?.id || 'unknown';
        this.analytics.dropOffPoints.set(dropOffStep, 
          (this.analytics.dropOffPoints.get(dropOffStep) || 0) + 1);

        // Send recovery notification
        proactiveNotificationEngine.updateUserProfile(session.userId, {
          activity: { abandoned: true, step: session.currentStep }
        });

        logger.log(`🔄 Session abandoned at step ${session.currentStep}: ${sessionId}`);
      }
    }
  }

  // Public methods
  getActiveSession(userId: string): AutoBookingSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.status === 'active') {
        return session;
      }
    }
    return null;
  }

  pauseSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'paused';
      return true;
    }
    return false;
  }

  resumeSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  getBookingAnalytics(): BookingAssistantAnalytics {
    return { ...this.analytics };
  }

  getUserBookingHistory(userId: string): AutoBookingSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }
}

export const autoBookingAssistant = new AutoBookingAssistant();