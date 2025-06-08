import { logger } from '../utils/logger';
import { generateGeminiStream } from './geminiService';
import { intelligentCacheSystem } from './intelligentCacheSystem';
import { smartRecommendationEngine } from './smartRecommendationEngine';

interface VoiceConfig {
  language: string;
  accent: string;
  speed: number;
  pitch: number;
  voice: 'male' | 'female' | 'neutral';
}

interface VoiceInteraction {
  id: string;
  userId?: string;
  sessionId: string;
  audioInput?: Blob;
  transcription: string;
  aiResponse: string;
  audioOutput?: Blob;
  timestamp: number;
  duration: number;
  confidence: number;
  conversationContext: string[];
}

interface VoiceAnalytics {
  totalInteractions: number;
  avgConfidence: number;
  avgDuration: number;
  preferredVoice: string;
  topCommands: Array<{ command: string; count: number }>;
  errorRate: number;
}

class VoiceAI {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private voiceInteractions = new Map<string, VoiceInteraction[]>();
  private userVoicePreferences = new Map<string, VoiceConfig>();
  private analytics: VoiceAnalytics = {
    totalInteractions: 0,
    avgConfidence: 0,
    avgDuration: 0,
    preferredVoice: 'female',
    topCommands: [],
    errorRate: 0
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.setupVoiceCommands();
  }

  // Speech Recognition başlat
  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'tr-TR';
      this.recognition.maxAlternatives = 3;
      
      logger.log('🎙️ Speech Recognition initialized');
    } else {
      logger.warn('❌ Speech Recognition not supported');
    }
  }

  // Ses komutlarını ayarla
  private setupVoiceCommands(): void {
    const commands = {
      'paket öner': this.handlePackageRequest.bind(this),
      'rezervasyon yap': this.handleBookingRequest.bind(this),
      'fiyat sor': this.handlePriceInquiry.bind(this),
      'yardım': this.handleHelpRequest.bind(this),
      'sesli aramayı durdur': this.stopListening.bind(this)
    };
    
    logger.log('🎙️ Voice commands configured:', Object.keys(commands));
  }

  // Dinlemeye başla
  async startListening(userId?: string, sessionId?: string): Promise<VoiceInteraction | null> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported');
    }

    if (this.isListening) {
      logger.warn('🎙️ Already listening');
      return null;
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      const startTime = Date.now();
      this.isListening = true;
      
      // User voice preferences'ı al
      const voiceConfig = userId ? this.userVoicePreferences.get(userId) : null;
      if (voiceConfig) {
        this.recognition.lang = voiceConfig.language === 'en' ? 'en-US' : 'tr-TR';
      }

      this.recognition.onstart = () => {
        logger.log('🎙️ Voice recording started');
      };

      this.recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        const duration = Date.now() - startTime;

        logger.log(`🎙️ Voice recognized: "${transcript}" (confidence: ${confidence.toFixed(2)})`);

        // Interaction oluştur
        const interaction: VoiceInteraction = {
          id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionId: sessionId || 'voice_session',
          transcription: transcript,
          aiResponse: '',
          timestamp: Date.now(),
          duration,
          confidence,
          conversationContext: []
        };

        try {
          // AI yanıtı oluştur
          const aiResponse = await this.generateVoiceResponse(transcript, userId, sessionId);
          interaction.aiResponse = aiResponse;

          // Sesli yanıt oluştur
          await this.speakResponse(aiResponse, userId);

          // Interaction'ı kaydet
          this.saveVoiceInteraction(userId || 'anonymous', interaction);

          // Analytics güncelle
          this.updateAnalytics(interaction);

          resolve(interaction);
        } catch (error) {
          logger.error('❌ Voice AI error:', error);
          reject(error);
        }

        this.isListening = false;
      };

      this.recognition.onerror = (event) => {
        logger.error('❌ Speech recognition error:', event.error);
        this.isListening = false;
        this.analytics.errorRate = (this.analytics.errorRate + 1) / (this.analytics.totalInteractions + 1);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        logger.log('🎙️ Voice recording ended');
        this.isListening = false;
      };

      this.recognition.start();
    });
  }

  // Dinlemeyi durdur
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      logger.log('🎙️ Voice listening stopped');
    }
  }

  // Voice response oluştur
  private async generateVoiceResponse(transcript: string, userId?: string, sessionId?: string): Promise<string> {
    logger.log('🤖 Generating voice response for:', transcript);

    // Özel ses komutlarını kontrol et
    const specialResponse = this.handleSpecialVoiceCommands(transcript, userId);
    if (specialResponse) {
      return specialResponse;
    }

    // AI response oluştur (message format'a çevir)
    const messages = [
      {
        role: 'user' as const,
        content: transcript,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'voice_session',
        userId: userId || null
      }
    ];

    try {
      // Gemini'den yanıt al
      const responseGenerator = generateGeminiStream(messages, sessionId, userId, 'voice-optimized');
      let fullResponse = '';
      
      for await (const chunk of responseGenerator) {
        fullResponse += chunk;
      }

      // Voice için optimize et
      return this.optimizeForVoice(fullResponse, userId);
    } catch (error) {
      logger.error('❌ Voice response generation failed:', error);
      return this.getFallbackVoiceResponse(transcript, userId);
    }
  }

  // Sesli yanıt için optimize et
  private optimizeForVoice(response: string, userId?: string): string {
    // User voice preferences al
    const voiceConfig = userId ? this.userVoicePreferences.get(userId) : null;
    
    let optimizedResponse = response
      // Markdown formatting'i temizle
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      
      // SHOW_PACKAGES komutlarını sesli açıklamalara çevir
      .replace(/\*\*SHOW_PACKAGES:(\w+)\*\*/g, (match, category) => {
        return `Size ${category} kategorisinde harika paketler gösterebilirim.`;
      })
      
      // Emoji'leri sesli açıklamalara çevir
      .replace(/✨/g, 'özel')
      .replace(/💕/g, 'sevgiyle')
      .replace(/🏝️/g, 'ada tatili')
      .replace(/💎/g, 'lüks')
      .replace(/⭐/g, 'yıldızlı')
      
      // URL'leri temizle
      .replace(/https?:\/\/[^\s]+/g, 'websitemizde detayları görebilirsiniz')
      
      // Uzun cümleleri böl
      .replace(/[.!?]\s*(?=[A-ZÇĞIÖŞÜa-zçğıöşü])/g, '$& '); // Noktalama sonrası pause

    // Sesli yanıt için daha kısa tut
    if (optimizedResponse.length > 300) {
      const sentences = optimizedResponse.split(/[.!?]+/);
      optimizedResponse = sentences.slice(0, 3).join('. ') + '.';
    }

    // Kişiselleştirme
    if (voiceConfig?.voice === 'formal') {
      optimizedResponse = optimizedResponse.replace(/merhaba/gi, 'İyi günler');
    }

    return optimizedResponse.trim();
  }

  // Özel ses komutlarını işle
  private handleSpecialVoiceCommands(transcript: string, userId?: string): string | null {
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes('paket öner') || lowerTranscript.includes('paket önerir')) {
      return this.handlePackageRequest(transcript, userId);
    }

    if (lowerTranscript.includes('rezervasyon') || lowerTranscript.includes('ayırt')) {
      return this.handleBookingRequest(transcript, userId);
    }

    if (lowerTranscript.includes('fiyat') || lowerTranscript.includes('ne kadar')) {
      return this.handlePriceInquiry(transcript, userId);
    }

    if (lowerTranscript.includes('yardım') || lowerTranscript.includes('nasıl')) {
      return this.handleHelpRequest(transcript, userId);
    }

    return null;
  }

  // Paket önerisi işle
  private handlePackageRequest(transcript: string, userId?: string): string {
    if (userId) {
      try {
        const recommendations = smartRecommendationEngine.generateSmartRecommendations(
          userId,
          transcript,
          { conversationPhase: 'voice_discovery', urgencyLevel: 'medium' }
        );

        if (recommendations.packages.length > 0) {
          const topPackage = recommendations.packages[0];
          return `Size özel olarak ${topPackage.packageId} paketini öneriyorum. ${topPackage.reasons.slice(0, 2).join(' ve ')} nedeniyle size çok uygun. Detaylarını görmek ister misiniz?`;
        }
      } catch (error) {
        logger.error('❌ Voice package recommendation failed:', error);
      }
    }

    return "Size harika balayı paketlerimizi önerebilirim. Hangi destinasyonu tercih edersiniz? Bali, Paris veya Santorini gibi popüler seçeneklerimiz var.";
  }

  // Rezervasyon işle
  private handleBookingRequest(transcript: string, userId?: string): string {
    return "Rezervasyon yapmak için size yardımcı olabilirim. Hangi paketi tercih ediyorsunuz? Size özel fiyat teklifim var.";
  }

  // Fiyat sorgusunu işle
  private handlePriceInquiry(transcript: string, userId?: string): string {
    return "Paket fiyatlarımız 2800 dolardan başlayıp 4800 dolara kadar çıkıyor. Bütçenizi söylerseniz size en uygun seçenekleri önerebilirim.";
  }

  // Yardım işle
  private handleHelpRequest(transcript: string, userId?: string): string {
    return "Size nasıl yardımcı olabilirim? Paket önerileri, rezervasyon yapma, fiyat bilgisi veya destinasyon hakkında sorularınızı yanıtlayabilirim. Ne istiyorsunuz?";
  }

  // Fallback yanıt
  private getFallbackVoiceResponse(transcript: string, userId?: string): string {
    const fallbacks = [
      "Anlamadım, tekrar söyleyebilir misiniz?",
      "Size nasıl yardımcı olabilirim?",
      "Balayı planlamanızda size yardımcı olmaya hazırım. Ne istiyorsunuz?",
      "Daha net konuşabilir misiniz? Size yardımcı olmak istiyorum."
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Sesli yanıt oluştur ve çal
  async speakResponse(text: string, userId?: string): Promise<void> {
    if (!this.synthesis) {
      logger.warn('❌ Speech Synthesis not supported');
      return;
    }

    // User voice preferences al
    const voiceConfig = userId ? this.userVoicePreferences.get(userId) : null;

    return new Promise((resolve, reject) => {
      // Mevcut konuşmaları durdur
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Voice configuration
      if (voiceConfig) {
        utterance.lang = voiceConfig.language === 'en' ? 'en-US' : 'tr-TR';
        utterance.rate = voiceConfig.speed;
        utterance.pitch = voiceConfig.pitch;
      } else {
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9; // Biraz yavaş konuş
        utterance.pitch = 1.0;
      }

      // Mevcut sesleri kontrol et ve uygun olanı seç
      const voices = this.synthesis.getVoices();
      const turkishVoices = voices.filter(voice => voice.lang.includes('tr'));
      
      if (turkishVoices.length > 0) {
        utterance.voice = turkishVoices[0];
      }

      utterance.onstart = () => {
        logger.log('🔊 Speech synthesis started');
      };

      utterance.onend = () => {
        logger.log('🔊 Speech synthesis completed');
        resolve();
      };

      utterance.onerror = (event) => {
        logger.error('❌ Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  // Kullanıcı ses tercihlerini güncelle
  updateUserVoicePreferences(userId: string, config: Partial<VoiceConfig>): void {
    const currentConfig = this.userVoicePreferences.get(userId) || {
      language: 'tr',
      accent: 'standard',
      speed: 0.9,
      pitch: 1.0,
      voice: 'female'
    };

    const updatedConfig = { ...currentConfig, ...config };
    this.userVoicePreferences.set(userId, updatedConfig);
    
    logger.log(`🎙️ Voice preferences updated for user ${userId}:`, updatedConfig);
  }

  // Voice interaction kaydet
  private saveVoiceInteraction(userId: string, interaction: VoiceInteraction): void {
    const interactions = this.voiceInteractions.get(userId) || [];
    interactions.push(interaction);
    
    // Son 50 interaction'ı tut
    if (interactions.length > 50) {
      interactions.shift();
    }
    
    this.voiceInteractions.set(userId, interactions);
    
    // Intelligent cache'e ekle
    intelligentCacheSystem.addSmartCache(
      interaction.transcription,
      interaction.aiResponse,
      userId,
      'tr',
      interaction.duration,
      ['voice-interaction', `confidence-${Math.round(interaction.confidence * 10)}`]
    );
  }

  // Analytics güncelle
  private updateAnalytics(interaction: VoiceInteraction): void {
    this.analytics.totalInteractions++;
    
    // Running averages
    const count = this.analytics.totalInteractions;
    this.analytics.avgConfidence = ((this.analytics.avgConfidence * (count - 1)) + interaction.confidence) / count;
    this.analytics.avgDuration = ((this.analytics.avgDuration * (count - 1)) + interaction.duration) / count;

    // Top commands
    const command = this.extractCommand(interaction.transcription);
    if (command) {
      const existingCommand = this.analytics.topCommands.find(c => c.command === command);
      if (existingCommand) {
        existingCommand.count++;
      } else {
        this.analytics.topCommands.push({ command, count: 1 });
      }
      
      // Sort by count and keep top 10
      this.analytics.topCommands.sort((a, b) => b.count - a.count);
      this.analytics.topCommands = this.analytics.topCommands.slice(0, 10);
    }
  }

  // Komut çıkar
  private extractCommand(transcript: string): string | null {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('paket')) return 'paket-önerisi';
    if (lowerTranscript.includes('rezervasyon')) return 'rezervasyon';
    if (lowerTranscript.includes('fiyat')) return 'fiyat-sorgusu';
    if (lowerTranscript.includes('yardım')) return 'yardım';
    if (lowerTranscript.includes('merhaba')) return 'selamlama';
    
    return null;
  }

  // Public getters
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getVoiceAnalytics(): VoiceAnalytics {
    return { ...this.analytics };
  }

  getUserVoiceHistory(userId: string): VoiceInteraction[] {
    return this.voiceInteractions.get(userId) || [];
  }

  getUserVoicePreferences(userId: string): VoiceConfig | null {
    return this.userVoicePreferences.get(userId) || null;
  }

  // Voice capability check
  static checkVoiceSupport(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    voiceList: string[];
  } {
    const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesis = 'speechSynthesis' in window;
    
    let voiceList: string[] = [];
    if (speechSynthesis && window.speechSynthesis) {
      voiceList = window.speechSynthesis.getVoices().map(voice => `${voice.name} (${voice.lang})`);
    }

    return {
      speechRecognition,
      speechSynthesis,
      voiceList
    };
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.voiceInteractions.clear();
    this.userVoicePreferences.clear();
    logger.log('🎙️ Voice AI destroyed');
  }
}

// Export singleton instance
export const voiceAI = new VoiceAI();
export default voiceAI;