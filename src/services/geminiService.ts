import { Part, Content } from "@google/generative-ai";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { logger } from "../utils/logger";
import { contextManager } from "./contextManager";
import { responseCache } from "./responseCache";
import { intelligentCacheSystem } from "./intelligentCacheSystem";
import { smartRecommendationEngine } from "./smartRecommendationEngine";
import { aiLearningEngine } from "./aiLearningEngine";
import { aiExperimentEngine } from "./aiExperimentEngine";
import { conversationPredictor, ConversationState } from "./conversationPredictor";
import { realTimeDataService } from "./realTimeDataService";
import { emotionalIntelligenceEngine, EmotionalState, PersonalityProfile } from "./emotionalIntelligence";
import { multiAgentSystem } from "./multiAgentSystem";
import { semanticSearchEngine } from "./semanticSearch";
import { geminiVisionService, VisionAnalysis } from "./geminiVision";
import { dynamicInstructionsEngine, InstructionContext } from "./dynamicInstructions";
import { selfEvaluationSystem, ResponseEvaluation } from "./selfEvaluationSystem";

// Type definitions for our application
interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string | null;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

// Optimized system prompt - compressed for better performance
const SYSTEM_PROMPT = `AI LOVVE - luxury honeymoon expert. EXPERTISE: destinations, luxury accommodations, romantic experiences, travel logistics.

RESPONSE FORMAT: 100-200 words max, 2-3 emojis, actionable advice, specific recommendations, paragraph breaks.

PACKAGE TRIGGERS:
**SHOW_PACKAGES:[category]** - Shows packages (luxury, romantic, adventure, cultural, beach, city)
**SHOW_PACKAGES:[location]** - Location-specific packages
**SHOW_PACKAGES:cities** - Kapadokya, Antalya, İstanbul, Sri Lanka, Phuket, Bali

AI SYSTEM TRIGGERS:
**START_PROFILE_ANALYSIS** - Launches AI profile analysis wizard for personalized recommendations
**START_HONEYMOON_PLANNER** - Launches step-by-step honeymoon planning system
**AI_PREDICTION** - Shows AI behavior predictions and recommendations
**PERSONALIZE_EXPERIENCE** - Activates real-time personalization

DETECTION PATTERNS:
- "AI Profil Analizi" or "profil analizi" or "beni tanı" → **START_PROFILE_ANALYSIS**
- "AI Balayı Planlayıcı" or "balayı planla" or "adım adım" → **START_HONEYMOON_PLANNER**
- "AI tahmin" or "davranış analizi" → **AI_PREDICTION**
- "kişiselleştir" or "bana özel" → **PERSONALIZE_EXPERIENCE**

TONE: Sophisticated, warm, magical. Structure: intro → content → question.`;

// Configure Gemini AI with enhanced error handling
// ❌ Direct Gemini API removed - Using Firebase Functions only
// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// if (!GEMINI_API_KEY) {
//   console.error('❌ GEMINI_API_KEY not found in environment variables');
// }
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ❌ Direct Gemini model removed - Using Firebase Functions only
// Enhanced safety settings for production
// const safetySettings = [
//   {
//     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
//     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//   },
// ];

// ❌ Direct Gemini model removed - Using Firebase Functions only
// Production-ready model configuration
// const model = genAI.getGenerativeModel({ 
//   model: "gemini-pro",
//   safetySettings,
//   generationConfig: {
//     temperature: 0.8,
//     topK: 32,
//     topP: 0.9,
//     maxOutputTokens: 512,
//     candidateCount: 1,
//     stopSequences: ["END_RESPONSE"],
//   },
// });

// Enhanced rate limiting with exponential backoff
class OptimizedRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 15; // Increased to 15 requests per minute
  private readonly timeWindow = 60000; // 1 minute
  private retryCount = 0;
  private lastFailureTime = 0;

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check exponential backoff
    if (this.retryCount > 0) {
      const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000); // Max 30s
      if (now - this.lastFailureTime < backoffDelay) {
        return false;
      }
    }
    
    // Clean old requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      this.handleFailure();
      return false;
    }
    
    this.requests.push(now);
    this.resetBackoff();
    return true;
  }

  private handleFailure(): void {
    this.retryCount++;
    this.lastFailureTime = Date.now();
  }

  private resetBackoff(): void {
    this.retryCount = 0;
    this.lastFailureTime = 0;
  }

  getResetTime(): number {
    const now = Date.now();
    
    // If in backoff, return backoff time
    if (this.retryCount > 0) {
      const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000);
      const backoffRemaining = Math.max(0, backoffDelay - (now - this.lastFailureTime));
      if (backoffRemaining > 0) return backoffRemaining;
    }
    
    // Otherwise return rate limit reset time
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (now - oldestRequest));
  }
}

const rateLimiter = new OptimizedRateLimiter();

// Enhanced error types
export class GeminiError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

// Luxury honeymoon system prompt with safety guidelines
const HONEYMOON_SYSTEM_PROMPT = `You are AI LOVVE, an exclusive luxury honeymoon planning concierge assistant. Your expertise includes:

🌟 EXPERTISE:
- Luxury travel destinations and experiences
- Romantic getaway planning and customization  
- High-end accommodation recommendations
- Couple-focused activities and adventures
- Cultural experiences and local insights
- Budget planning for luxury honeymoons
- Travel logistics and timing optimization

💎 COMMUNICATION STYLE:
- Sophisticated, warm, and personalized
- Use romantic and luxury-focused language
- Provide detailed, actionable recommendations
- Always ask clarifying questions to personalize suggestions
- Include practical details (costs, booking info, best times to visit)

🛡️ SAFETY & GUIDELINES:
- Only provide travel and honeymoon-related advice
- Never share personal information or contact details
- Decline requests unrelated to travel/honeymoon planning
- Maintain professional boundaries while being friendly
- If unsure about information, clearly state limitations

🎯 RESPONSE FORMAT:
- Start with a warm, personalized greeting
- Organize information clearly with emojis and headers
- Include specific recommendations with rationale
- End with follow-up questions to continue the conversation
- Keep responses engaging but focused on honeymoon planning

Remember: You're creating dream honeymoons for couples in love. Make every interaction magical! ✨`;

// Base64'ten veri çıkaran fonksiyon (önceden vardı, olduğu gibi kalıyor)
function extractBase64Data(base64String: string): { mimeType: string; data: string } | null {
  const match = base64String.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (match && match[1] && match[2]) {
    return { mimeType: match[1], data: match[2] };
  }
  logger.warn("Geçersiz base64 formatı veya desteklenmeyen resim tipi.");
  return null;
}

// Mesajları Gemini API formatına dönüştüren yardımcı fonksiyon
function formatMessagesForGemini(messages: AppMessage[]): Content[] {
  const history: Content[] = [];
  for (const msg of messages) {
    const messageContent = msg.content || ''; // content tanımsızsa boş string kullan
    const parts: Part[] = [{ text: messageContent }];
    if (msg.role === 'user' && msg.imageBase64) {
      const imageInfo = extractBase64Data(msg.imageBase64);
      if (imageInfo) {
        parts.push({
          inlineData: {
            mimeType: imageInfo.mimeType,
            data: imageInfo.data,
          },
        });
      }
    }
    history.push({
      role: msg.role === 'assistant' ? 'model' : 'user', // API 'model' rolünü bekliyor
      parts,
    });
  }
  return history;
}

// ❌ Node.js Backend devre dışı - Firebase Functions kullanılacak
// const BACKEND_URL = 'http://localhost:3001/api';

// Generate session ID for conversation tracking
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// AI Command Detection Functions
export function detectAICommand(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Profile Analysis patterns
  if (lowerMessage.includes('ai profil analizi') || 
      lowerMessage.includes('profil analizi') || 
      lowerMessage.includes('beni tanı') ||
      lowerMessage.includes('kişiselleştirilmiş öneriler')) {
    return 'START_PROFILE_ANALYSIS';
  }
  
  // Honeymoon Planner patterns
  if (lowerMessage.includes('ai balayı planlayıcı') || 
      lowerMessage.includes('balayı planla') || 
      lowerMessage.includes('adım adım') ||
      lowerMessage.includes('hayalimde balayı')) {
    return 'START_HONEYMOON_PLANNER';
  }
  
  // AI Prediction patterns
  if (lowerMessage.includes('ai tahmin') || 
      lowerMessage.includes('davranış analizi') ||
      lowerMessage.includes('rezervasyon olasılığı')) {
    return 'AI_PREDICTION';
  }
  
  // Personalization patterns
  if (lowerMessage.includes('kişiselleştir') || 
      lowerMessage.includes('bana özel') ||
      lowerMessage.includes('özelleştir')) {
    return 'PERSONALIZE_EXPERIENCE';
  }
  
  return null;
}

export function generateAICommandResponse(command: string, userName?: string): { 
  content: string; 
  actionType: string; 
  actionData?: any 
} {
  const name = userName || 'sevgili kullanıcımız';
  
  switch (command) {
    case 'START_PROFILE_ANALYSIS':
      return {
        content: `🧠 Mükemmel ${name}! AI Profil Analizi başlatıyorum. Size en uygun balayı önerilerini sunabilmek için sizi daha yakından tanımam gerekiyor.

**PROFIL_ANALYSIS_CARDS**

Hangi kişilik özelliğinizi analiz etmek istersiniz?`,
        actionType: 'SHOW_PROFILE_CARDS',
        actionData: { 
          step: 'personality_selection',
          options: [
            { id: 'romantic', title: 'Romantik', description: 'Aşk ve romantizm odaklı', icon: '💕' },
            { id: 'adventurous', title: 'Maceracı', description: 'Yeni deneyimler arayan', icon: '🌍' },
            { id: 'luxury', title: 'Lüks Seven', description: 'Konfor ve kalite öncelikli', icon: '👑' },
            { id: 'cultural', title: 'Kültür Meraklısı', description: 'Tarih ve sanat ilgili', icon: '🏛️' }
          ]
        }
      };

    case 'START_HONEYMOON_PLANNER':
      return {
        content: `💕 Harika ${name}! AI Balayı Planlayıcınız devreye giriyor. Hayalinizdeki balayını adım adım birlikte oluşturacağız.

**HONEYMOON_PLANNER_CARDS**

Hangi tür bir balayı hayal ediyorsunuz?`,
        actionType: 'SHOW_HONEYMOON_CARDS',
        actionData: { 
          step: 'destination_type',
          options: [
            { id: 'beach', title: 'Plaj Balayısı', description: 'Deniz, kum ve güneş', icon: '🏖️' },
            { id: 'city', title: 'Şehir Turu', description: 'Kültür ve sanat dolu', icon: '🏙️' },
            { id: 'nature', title: 'Doğa Kaçamağı', description: 'Dağlar ve yeşillik', icon: '🌲' },
            { id: 'luxury', title: 'Lüks Tatil', description: 'En iyi oteller ve hizmet', icon: '💎' }
          ]
        }
      };

    case 'AI_PREDICTION':
      return {
        content: `🔮 ${name}, AI Tahmin Motorunuz analiz sonuçlarını hazırlıyor!

📊 Size özel analizler:
• Rezervasyon yapma olasılığınız
• En uygun rezervasyon zamanı
• Fiyat optimizasyonu önerileri
• Kişiselleştirilmiş teklifler

🎯 Davranış kalıplarınıza göre özel stratejiler geliştiriyorum...

Detaylı analiz sonuçlarınızı görmek ister misiniz? 📈`,
        actionType: 'SHOW_AI_PREDICTIONS',
        actionData: { includePredictions: true }
      };

    case 'PERSONALIZE_EXPERIENCE':
      return {
        content: `✨ ${name}, deneyiminizi tam size göre kişiselleştiriyorum!

🎨 Aktif kişiselleştirmeler:
• Size özel tema ve renkler
• Kişilik tipinize uygun içerik
• Davranışlarınıza göre öneriler
• Real-time deneyim optimizasyonu

🚀 Artık her etkileşim sizin için özelleştirilecek!

Kişiselleştirilmiş deneyiminiz nasıl? Daha fazla ince ayar yapalım mı? 🎯`,
        actionType: 'ACTIVATE_PERSONALIZATION',
        actionData: { realTime: true }
      };

    default:
      return {
        content: `🤖 AI sistemleriniz hazır! Hangi özelliği kullanmak istersiniz?

🧠 "AI Profil Analizi" - Sizi tanıyalım
💕 "AI Balayı Planlayıcı" - Adım adım planlama  
🔮 "AI Tahmin" - Davranış analizleri
✨ "Kişiselleştir" - Size özel deneyim

Nasıl yardımcı olabilirim? 😊`,
        actionType: 'SHOW_AI_OPTIONS'
      };
  }
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('ailovve_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('ailovve_session_id', sessionId);
  }
  return sessionId;
}

// Check if message is a chat command
export function isChatCommand(message: string): boolean {
  const commands = ['/register', '/login', '/profile', '/logout', '/help'];
  return commands.some(cmd => message.toLowerCase().startsWith(cmd));
}

// Process chat commands
export async function processChatCommand(message: string, currentUser: any): Promise<string> {
  const lowerMessage = message.toLowerCase().trim();
  
  if (lowerMessage.startsWith('/register')) {
    return `🔐 **Member Registration**

To become a member, please send the following information in order:

1️⃣ **Full Name**: Write your full name
2️⃣ **Email**: Write your email address  
3️⃣ **Password**: Set a secure password
4️⃣ **Phone** (optional): Write your phone number

Example:
\`\`\`
John Smith
john@email.com
123456
+1 555 123 4567
\`\`\`

Send your information in this format in a single message. 💕`;
  }
  
  if (lowerMessage.startsWith('/login')) {
    return `🔑 **Member Login**

To login, send your email and password in this format:

\`\`\`
Email: john@email.com
Password: 123456
\`\`\`

Send your information in this format in a single message. 🌟`;
  }
  
  if (lowerMessage.startsWith('/profile')) {
    if (!currentUser) {
      return `❌ You need to login first to view your profile information.

To login: \`/login\`
To register: \`/register\``;
    }
    
    return `👤 **Your Profile Information**

📝 **Name**: ${currentUser.name} ${currentUser.surname || ''}
📧 **Email**: ${currentUser.email}
📱 **Phone**: ${currentUser.phone || 'Not specified'}
💬 **Message Count**: ${currentUser.messageCount}
⭐ **Membership**: ${currentUser.isPremium ? '👑 Premium' : '🆓 Standard'}
📅 **Registration Date**: ${currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US') : 'Unknown'}

To logout: \`/logout\``;
  }
  
  if (lowerMessage.startsWith('/logout')) {
    return `👋 Successfully logged out! 

See you again! You can use \`/login\` command to login. 💕`;
  }
  
  if (lowerMessage.startsWith('/help')) {
    return `🤖 **Chat Commands**

📝 \`/register\` - New member registration
🔑 \`/login\` - Member login  
👤 \`/profile\` - Profile information
🚪 \`/logout\` - Logout
❓ \`/help\` - This help menu

💡 **Tip**: Instead of writing commands, you can also write in natural language like "I want to become a member" or "I want to login"!

I'm AI LOVE and I'm here to help you plan your honeymoon! 💕`;
  }
  
  return '';
}

// Parse registration data from chat message
export function parseRegistrationData(message: string): { name: string; surname?: string; email: string; password: string; phone?: string } | null {
  const lines = message.trim().split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 3) return null;
  
  const fullName = lines[0];
  const email = lines[1];
  const password = lines[2];
  const phone = lines[3] || undefined;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return null;
  
  // Split name
  const nameParts = fullName.split(' ');
  const name = nameParts[0];
  const surname = nameParts.slice(1).join(' ') || undefined;
  
  return { name, surname, email, password, phone };
}

// Parse login data from chat message
export function parseLoginData(message: string): { email: string; password: string } | null {
  const lines = message.trim().split('\n').map(line => line.trim()).filter(line => line);
  
  let email = '';
  let password = '';
  
  for (const line of lines) {
    if (line.toLowerCase().startsWith('email:') || line.toLowerCase().startsWith('e-mail:')) {
      email = line.split(':')[1]?.trim() || '';
    } else if (line.toLowerCase().startsWith('password:') || line.toLowerCase().startsWith('şifre:')) {
      password = line.split(':')[1]?.trim() || '';
    }
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !password || !emailRegex.test(email)) return null;
  
  return { email, password };
}

// Check if message looks like registration data
export function looksLikeRegistrationData(message: string): boolean {
  const lines = message.trim().split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 3) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return lines.length >= 3 && emailRegex.test(lines[1]);
}

// Check if message looks like login data
export function looksLikeLoginData(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (lowerMessage.includes('email:') || lowerMessage.includes('e-mail:')) && 
         (lowerMessage.includes('password:') || lowerMessage.includes('şifre:'));
}

// Optimized language detection - focus on common languages only
function detectLanguage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Priority languages with simple detection
  const patterns = [
    { lang: 'tr', test: /[çğıöşüÇĞIÖŞÜ]|merhaba|selam|teşekkür|nasıl/ },
    { lang: 'es', test: /[ñáéíóú¿¡]|hola|gracias|cómo|está/ },
    { lang: 'fr', test: /[àâéèêçôœ]|bonjour|merci|comment/ },
    { lang: 'de', test: /[äöüß]|hallo|danke|bitte/ },
    { lang: 'ru', test: /[а-я]|привет|спасибо/ }
  ];
  
  for (const { lang, test } of patterns) {
    if (test.test(lowerMessage)) return lang;
  }
  
  return 'en';
}

// Ultimate AI System: Learning + Experimentation + Prediction + Intelligence
export async function* generateGeminiStream(messages: AppMessage[], sessionId?: string, userId?: string | null, modelType?: string) {
  const startTime = Date.now();
  logger.log("🚀 Ultimate AI called with full intelligence stack", { messages, sessionId, userId, modelType });
  
  const finalSessionId = sessionId || getSessionId();
  const lastUserMessage = messages[messages.length - 1];
  const lastBotMessage = messages.length > 1 ? messages[messages.length - 2] : null;
  const detectedLanguage = lastUserMessage?.role === 'user' ? detectLanguage(lastUserMessage.content) : 'en';
  
  // 🔮 0. Conversation Flow Prediction & State Management
  let conversationState: ConversationState | null = null;
  if (lastUserMessage?.role === 'user') {
    conversationState = conversationPredictor.updateConversationState(
      finalSessionId,
      lastUserMessage.content,
      lastBotMessage?.content || '',
      userId || undefined
    );
    
    logger.log(`🔮 Conversation phase: ${conversationState.currentPhase}`);
    logger.log(`📈 Conversion probability: ${(conversationState.conversionProbability * 100).toFixed(1)}%`);
    logger.log(`⚡ Urgency level: ${conversationState.urgencyLevel}`);
  }
  
  // 🎭 0.5. Emotional Intelligence Analysis
  let emotionalState: EmotionalState | null = null;
  let personalityProfile: PersonalityProfile | null = null;
  let emotionalResponse = null;
  
  if (lastUserMessage?.role === 'user' && userId) {
    emotionalState = emotionalIntelligenceEngine.analyzeEmotionalState(lastUserMessage.content, detectedLanguage);
    emotionalIntelligenceEngine.updateEmotionalHistory(userId, emotionalState);
    
    // Build personality profile from conversation history
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    personalityProfile = emotionalIntelligenceEngine.buildPersonalityProfile(userId, userMessages);
    
    // Generate emotional response strategy
    emotionalResponse = emotionalIntelligenceEngine.generateEmotionalResponse(
      emotionalState, 
      personalityProfile, 
      lastUserMessage.content
    );
    
    logger.log(`🎭 Emotional state: ${emotionalState.primary} (intensity: ${emotionalState.intensity.toFixed(2)}, confidence: ${emotionalState.confidence.toFixed(2)})`);
    logger.log(`👤 Communication style: ${personalityProfile.communicationStyle}, Decision making: ${personalityProfile.decisionMaking}`);
    logger.log(`💬 Recommended tone: ${emotionalResponse.tone}, Approach: ${emotionalResponse.approach}`);
  }
  
  // 🖼️ 0.7. Gemini Vision Analysis (if image provided)
  let visionAnalysis: VisionAnalysis | null = null;
  
  if (lastUserMessage?.role === 'user' && lastUserMessage.imageBase64) {
    try {
      logger.log('🖼️ Image detected - starting Gemini Vision analysis...');
      
      visionAnalysis = await geminiVisionService.analyzeImage(
        lastUserMessage.imageBase64,
        {
          userMessage: lastUserMessage.content,
          conversationHistory: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
          userId: userId || undefined,
          sessionId: finalSessionId
        }
      );
      
      logger.log(`✨ Vision analysis completed: ${visionAnalysis.sceneType} scene, ${visionAnalysis.mood} mood (confidence: ${visionAnalysis.confidenceScore}%)`);
      logger.log(`🎯 Suggested destinations: ${visionAnalysis.suggestedDestinations.join(', ')}`);
      
      // Enhance conversation state with vision insights
      if (conversationState && visionAnalysis.suggestedDestinations.length > 0) {
        conversationState.collectedInfo.destinations = [
          ...(conversationState.collectedInfo.destinations || []),
          ...visionAnalysis.suggestedDestinations.slice(0, 2) // Add top 2 vision suggestions
        ];
        
        // Add travel style from vision
        if (visionAnalysis.personalityInsights.travelStyle) {
          conversationState.collectedInfo.travelStyle = visionAnalysis.personalityInsights.travelStyle;
        }
        
        // Add preferences from vision
        if (visionAnalysis.personalityInsights.preferences.length > 0) {
          conversationState.collectedInfo.preferences = [
            ...(conversationState.collectedInfo.preferences || []),
            ...visionAnalysis.personalityInsights.preferences
          ];
        }
      }
      
    } catch (error) {
      logger.error('❌ Gemini Vision analysis failed:', error);
      // Continue without vision analysis
    }
  }
  
  // 🧠 1. AI Learning Engine - Smart Response Suggestion
  const responseOptimization = lastUserMessage?.role === 'user' 
    ? aiLearningEngine.suggestOptimalResponse(lastUserMessage.content, userId || undefined)
    : null;
  
  logger.log("🧠 AI Learning suggestions:", responseOptimization);
  
  // 🚀 2. Intelligent Cache Check (Multi-layer caching)
  if (lastUserMessage?.role === 'user') {
    // Try intelligent cache first (fastest)
    const intelligentCache = intelligentCacheSystem.findSmartCache(
      lastUserMessage.content, 
      userId || undefined, 
      detectedLanguage
    );
    
    if (intelligentCache) {
      logger.log(`⚡ Intelligent cache hit! Similarity: ${intelligentCache.similarity || 1.0}`);
      
      // Get smart recommendations for this user
      if (userId) {
        const recommendations = smartRecommendationEngine.generateSmartRecommendations(
          userId,
          lastUserMessage.content,
          { conversationPhase: conversationState?.currentPhase, urgencyLevel: conversationState?.urgencyLevel }
        );
        
        // If this is a package-related query, enhance response with smart recommendations
        if (lastUserMessage.content.toLowerCase().includes('paket') || 
            lastUserMessage.content.toLowerCase().includes('package') ||
            lastUserMessage.content.toLowerCase().includes('öner')) {
          
          let enhancedResponse = intelligentCache.response;
          
          if (recommendations.packages.length > 0 && recommendations.timing === 'immediate') {
            const topPackage = recommendations.packages[0];
            enhancedResponse += `\n\n✨ **Kişisel Önerim**: ${topPackage.packageId} paketi ${topPackage.reasons.slice(0, 2).join(', ')} nedeniyle size çok uygun! (Uygunluk skoru: ${(topPackage.score * 100).toFixed(0)}%)`;
            
            if (recommendations.strategy === 'aggressive' && recommendations.packages.length > 1) {
              enhancedResponse += `\n\n🎯 Diğer favori seçimleriniz: ${recommendations.packages.slice(1, 3).map(p => p.packageId).join(', ')}`;
            }
          }
          
          yield enhancedResponse;
        } else {
          yield intelligentCache.response;
        }
      } else {
        yield intelligentCache.response;
      }
      
      // Record experiment result for intelligent cache usage
      const cacheExperimentResult = {
        variantId: 'intelligent_cache_hit',
        sessionId: finalSessionId,
        userId: userId || undefined,
        query: lastUserMessage.content,
        response: intelligentCache.response,
        engagementMetrics: {
          responseTime: Date.now() - startTime,
          userResponseTime: 0,
          messageLength: intelligentCache.response.length,
          containsPackageClick: intelligentCache.response.includes('SHOW_PACKAGES'),
          leadToBooking: false
        },
        timestamp: Date.now()
      };
      
      aiExperimentEngine.recordExperimentResult('response_source', cacheExperimentResult);
      return;
    }
    
    // Fallback to original cache if intelligent cache misses
    if (responseOptimization?.shouldUseCache) {
      const cachedResponse = responseCache.findSimilarResponse(lastUserMessage.content, detectedLanguage);
      if (cachedResponse) {
        logger.log(`✅ Fallback cache hit! Similarity: ${cachedResponse.similarity}`);
        
        // Record experiment result for fallback cache usage
        const cacheExperimentResult = {
          variantId: 'fallback_cache_hit',
          sessionId: finalSessionId,
          userId: userId || undefined,
          query: lastUserMessage.content,
          response: cachedResponse.response,
          engagementMetrics: {
            responseTime: Date.now() - startTime,
            userResponseTime: 0,
            messageLength: cachedResponse.response.length,
            containsPackageClick: cachedResponse.response.includes('SHOW_PACKAGES'),
            leadToBooking: false
          },
          timestamp: Date.now()
        };
        
        aiExperimentEngine.recordExperimentResult('response_source', cacheExperimentResult);
        yield cachedResponse.response;
        return;
      }
    }
  }
  
  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const resetTime = rateLimiter.getResetTime();
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)} seconds.`);
  }
  
  // 🧠 3. Context yönetimi - akıllı mesaj seçimi
  const context = contextManager.updateContext(finalSessionId, messages);
  const relevantMessages = contextManager.selectRelevantMessages(messages, finalSessionId);
  
  // 🌍 3.5. Real-time data enrichment
  let realTimeData = null;
  if (conversationState && conversationState.collectedInfo.destinations?.length) {
    const destination = conversationState.collectedInfo.destinations[0];
    logger.log(`🌍 Fetching real-time data for ${destination}`);
    
    try {
      realTimeData = await realTimeDataService.getComprehensiveTravelData(
        destination,
        undefined, // origin can be extracted from user location later
        conversationState.collectedInfo.timeframe ? {
          checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          checkOut: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // 7 days trip
        } : undefined
      );
      logger.log(`✅ Real-time data fetched for ${destination}`);
    } catch (error) {
      logger.error(`❌ Real-time data fetch failed for ${destination}:`, error);
    }
  }
  
  // 🧪 4. A/B Testing - Select experimental variant
  const promptStyleVariant = aiExperimentEngine.selectVariant('prompt_style', userId, finalSessionId);
  const packageStrategyVariant = aiExperimentEngine.selectVariant('package_strategy', userId, finalSessionId);
  
  logger.log(`🧪 Experiment variants:`, {
    promptStyle: promptStyleVariant?.id,
    packageStrategy: packageStrategyVariant?.id
  });
  
  logger.log(`🎯 Context-aware: Selected ${relevantMessages.length}/${messages.length} messages`);
  logger.log(`📊 User preferences:`, context.userPreferences);
  logger.log(`🔄 Conversation phase: ${context.conversationPhase}`);
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Optimized message conversion with context awareness
      const messagesToSend = relevantMessages.slice(-8).map(msg => ({ // Max 8 most relevant messages
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
        sessionId: finalSessionId,
        userId: userId || null
      }));
      
      // 🎯 5. Multi-layer prompt generation with conversation flow awareness
      const baseSystemPrompt = contextManager.generateDynamicSystemPrompt(context);
      
      // 🧠 5.5. Dynamic Instructions Optimization
      let systemPrompt = baseSystemPrompt;
      
      if (lastUserMessage?.role === 'user') {
        try {
          logger.log('🧠 Applying Dynamic Instructions optimization...');
          
          // Create instruction context
          const instructionContext: InstructionContext = {
            conversationPhase: conversationState?.currentPhase || 'greeting',
            messageCount: messages.length,
            emotionalState,
            personalityProfile,
            visionAnalysis,
            urgencyLevel: conversationState?.urgencyLevel || 'low',
            userIntent: conversationState?.userIntent?.primary || 'discovery',
            collectedInfo: conversationState?.collectedInfo || {},
            detectedLanguage,
            conversionProbability: conversationState?.conversionProbability || 0.1,
            realTimeData
          };
          
          // Generate optimized instructions
          const optimizedInstructions = dynamicInstructionsEngine.generateOptimizedInstructions(
            baseSystemPrompt,
            instructionContext,
            finalSessionId
          );
          
          systemPrompt = optimizedInstructions.baseInstruction;
          
          // Add enhanced instructions
          optimizedInstructions.enhancedInstructions.forEach(instruction => {
            systemPrompt += `\n\n${instruction.instructionTemplate}`;
          });
          
          logger.log(`✨ Dynamic instructions applied: ${optimizedInstructions.enhancedInstructions.length} enhancements, optimization level: ${optimizedInstructions.optimizationLevel}`);
          
        } catch (error) {
          logger.error('❌ Dynamic Instructions optimization failed:', error);
          // Continue with base system prompt
        }
      }
      
      // Add conversation flow intelligence
      if (conversationState) {
        systemPrompt += `\n\nCONVERSATION FLOW INTELLIGENCE:`;
        systemPrompt += `\n- Current phase: ${conversationState.currentPhase}`;
        systemPrompt += `\n- Conversion probability: ${(conversationState.conversionProbability * 100).toFixed(1)}%`;
        systemPrompt += `\n- Urgency level: ${conversationState.urgencyLevel}`;
        
        // Add collected information context
        if (Object.keys(conversationState.collectedInfo).length > 0) {
          systemPrompt += `\n- Known user info: ${JSON.stringify(conversationState.collectedInfo)}`;
        }
        
        // Add predicted actions
        if (conversationState.predictedNextActions.length > 0) {
          const topAction = conversationState.predictedNextActions[0];
          systemPrompt += `\n- Recommended action: ${topAction.type} - ${topAction.content}`;
        }
        
        // Phase-specific instructions
        switch (conversationState.currentPhase) {
          case 'greeting':
            systemPrompt += `\n- PHASE GUIDANCE: Be welcoming, ask about dream destination and travel preferences`;
            break;
          case 'discovery':
            systemPrompt += `\n- PHASE GUIDANCE: Focus on understanding needs, ask clarifying questions, probe for budget/preferences`;
            break;
          case 'exploration':
            systemPrompt += `\n- PHASE GUIDANCE: Show specific packages, highlight unique features, address concerns`;
            break;
          case 'comparison':
            systemPrompt += `\n- PHASE GUIDANCE: Help compare options, highlight differences, recommend based on preferences`;
            break;
          case 'decision':
            systemPrompt += `\n- PHASE GUIDANCE: Support their choice, create gentle urgency, explain next steps`;
            break;
          case 'booking':
            systemPrompt += `\n- PHASE GUIDANCE: Guide through booking process, address security concerns, be supportive`;
            break;
          case 'confirmation':
            systemPrompt += `\n- PHASE GUIDANCE: Confirm details, explain next steps, offer additional services`;
            break;
        }
        
        // Urgency-based modifications
        if (conversationState.urgencyLevel === 'high' || conversationState.urgencyLevel === 'urgent') {
          systemPrompt += `\n- URGENCY ALERT: User has urgent timing needs. Prioritize quick solutions and immediate assistance.`;
        }
      }
      
      // 🌍 Add real-time data context
      if (realTimeData) {
        systemPrompt += `\n\nREAL-TIME DATA CONTEXT:`;
        
        // Weather information
        if (realTimeData.weather) {
          systemPrompt += `\n- Current weather: ${realTimeData.weather.current.temperature}°C, ${realTimeData.weather.current.condition}`;
          const forecast = realTimeData.weather.forecast[0];
          if (forecast) {
            systemPrompt += `\n- Tomorrow's forecast: ${forecast.high}°C high, ${forecast.condition}`;
          }
        }
        
        // Currency information
        if (realTimeData.currency) {
          const eurRate = realTimeData.currency.rates.EUR;
          const tryRate = realTimeData.currency.rates.TRY;
          if (eurRate) systemPrompt += `\n- Exchange rate: 1 USD = ${eurRate.toFixed(2)} EUR`;
          if (tryRate) systemPrompt += `\n- Exchange rate: 1 USD = ${tryRate.toFixed(2)} TRY`;
        }
        
        // Events information
        if (realTimeData.events && realTimeData.events.events.length > 0) {
          const upcomingEvents = realTimeData.events.events.slice(0, 2);
          systemPrompt += `\n- Upcoming events: ${upcomingEvents.map(e => `${e.name} (${e.date})`).join(', ')}`;
          
          const highImpactEvents = upcomingEvents.filter(e => e.impact === 'high');
          if (highImpactEvents.length > 0) {
            systemPrompt += `\n- PRICE ALERT: High-impact events may increase accommodation prices by up to ${highImpactEvents[0].priceImpact}%`;
          }
        }
        
        // Travel advisory
        if (realTimeData.advisory) {
          systemPrompt += `\n- Safety level: ${realTimeData.advisory.safetyLevel}`;
          if (realTimeData.advisory.requirements.visa) {
            systemPrompt += `\n- IMPORTANT: Visa required for this destination`;
          }
          if (realTimeData.advisory.advisories.length > 0) {
            systemPrompt += `\n- Travel advisories: ${realTimeData.advisory.advisories.map(a => a.message).join(', ')}`;
          }
        }
        
        // Insights
        if (realTimeData.insights) {
          systemPrompt += `\n- Best time to visit: ${realTimeData.insights.bestTimeToVisit}`;
          if (realTimeData.insights.priceInsights.length > 0) {
            systemPrompt += `\n- Price insights: ${realTimeData.insights.priceInsights.join(', ')}`;
          }
          if (realTimeData.insights.travelTips.length > 0) {
            systemPrompt += `\n- Travel tips: ${realTimeData.insights.travelTips.join(', ')}`;
          }
        }
        
        // Flight data (if available)
        if (realTimeData.flights && realTimeData.flights.prices.length > 0) {
          const bestPrice = realTimeData.flights.bestDeal;
          systemPrompt += `\n- Best flight deal: ${bestPrice.airline} at $${bestPrice.price} (save $${bestPrice.savings})`;
        }
        
        // Hotel data (if available)
        if (realTimeData.hotels && realTimeData.hotels.hotels.length > 0) {
          const avgPrice = realTimeData.hotels.priceRange.average;
          const minPrice = realTimeData.hotels.priceRange.min;
          systemPrompt += `\n- Hotel prices: from $${minPrice}/night (average: $${avgPrice}/night)`;
        }
        
        systemPrompt += `\n\nUSE THIS REAL-TIME DATA: Incorporate current weather, prices, events, and travel conditions into your response. Make specific recommendations based on this live information.`;
      }
      
      // 🎭 Add emotional intelligence context
      if (emotionalState && personalityProfile && emotionalResponse) {
        systemPrompt += `\n\nEMOTIONAL INTELLIGENCE CONTEXT:`;
        systemPrompt += `\n- User's emotional state: ${emotionalState.primary} (intensity: ${emotionalState.intensity.toFixed(2)})`;
        systemPrompt += `\n- Secondary emotion: ${emotionalState.secondary || 'none'}`;
        systemPrompt += `\n- Emotional indicators: ${emotionalState.indicators.join(', ')}`;
        systemPrompt += `\n- Communication style: ${personalityProfile.communicationStyle}`;
        systemPrompt += `\n- Decision making: ${personalityProfile.decisionMaking}`;
        systemPrompt += `\n- Risk tolerance: ${personalityProfile.riskTolerance}`;
        systemPrompt += `\n- Personality traits: Openness ${(personalityProfile.traits.openness * 100).toFixed(0)}%, Extraversion ${(personalityProfile.traits.extraversion * 100).toFixed(0)}%, Conscientiousness ${(personalityProfile.traits.conscientiousness * 100).toFixed(0)}%`;
        
        // Emotional response strategy
        systemPrompt += `\n\nEMOTIONAL RESPONSE STRATEGY:`;
        systemPrompt += `\n- Recommended tone: ${emotionalResponse.tone}`;
        systemPrompt += `\n- Approach: ${emotionalResponse.approach}`;
        systemPrompt += `\n- Urgency level: ${emotionalResponse.urgency}`;
        systemPrompt += `\n- Response style: ${emotionalResponse.suggestions.responseStyle}`;
        
        if (emotionalResponse.suggestions.keyPoints.length > 0) {
          systemPrompt += `\n- Key points to address: ${emotionalResponse.suggestions.keyPoints.join(', ')}`;
        }
        
        if (emotionalResponse.suggestions.emphasizeTopics.length > 0) {
          systemPrompt += `\n- Topics to emphasize: ${emotionalResponse.suggestions.emphasizeTopics.join(', ')}`;
        }
        
        if (emotionalResponse.suggestions.avoidTopics.length > 0) {
          systemPrompt += `\n- Topics to avoid: ${emotionalResponse.suggestions.avoidTopics.join(', ')}`;
        }
        
        // Specific emotional guidance
        switch (emotionalState.primary) {
          case 'anxiety':
            systemPrompt += `\n\nANXIETY RESPONSE: User is anxious. Use reassuring language, provide concrete solutions, address their concerns directly, avoid mentioning risks or problems. Focus on safety and support.`;
            break;
          case 'excitement':
            systemPrompt += `\n\nEXCITEMENT RESPONSE: User is excited! Match their energy with enthusiastic language, use exclamation marks, build on their excitement with specific details about amazing experiences.`;
            break;
          case 'disappointment':
            systemPrompt += `\n\nDISAPPOINTMENT RESPONSE: User is disappointed. Show empathy, validate their feelings, then pivot to better alternatives and solutions. Focus on positive outcomes.`;
            break;
          case 'confusion':
            systemPrompt += `\n\nCONFUSION RESPONSE: User is confused. Use simple, clear language, break down complex information, ask clarifying questions, provide step-by-step explanations.`;
            break;
          case 'joy':
            systemPrompt += `\n\nJOY RESPONSE: User is happy! Celebrate with them, maintain the positive energy, build confidence in their choices, share their enthusiasm.`;
            break;
        }
        
        systemPrompt += `\n\nIMPORTANT: Adapt your entire response style, tone, and content based on the user's emotional state and personality. Be emotionally intelligent and empathetic.`;
      }
      
      // 🖼️ Add vision analysis context
      if (visionAnalysis) {
        systemPrompt += `\n\nVISION ANALYSIS CONTEXT:`;
        systemPrompt += `\n- Image scene type: ${visionAnalysis.sceneType}`;
        systemPrompt += `\n- Detected mood: ${visionAnalysis.mood}`;
        systemPrompt += `\n- Analysis confidence: ${visionAnalysis.confidenceScore}%`;
        systemPrompt += `\n- Suggested destinations: ${visionAnalysis.suggestedDestinations.join(', ')}`;
        
        if (visionAnalysis.detectedElements.architecture?.length) {
          systemPrompt += `\n- Architectural style: ${visionAnalysis.detectedElements.architecture.join(', ')}`;
        }
        
        if (visionAnalysis.detectedElements.naturalFeatures?.length) {
          systemPrompt += `\n- Natural features: ${visionAnalysis.detectedElements.naturalFeatures.join(', ')}`;
        }
        
        if (visionAnalysis.detectedElements.activities?.length) {
          systemPrompt += `\n- Activities detected: ${visionAnalysis.detectedElements.activities.join(', ')}`;
        }
        
        systemPrompt += `\n- Travel style preference: ${visionAnalysis.personalityInsights.travelStyle}`;
        systemPrompt += `\n- Group type: ${visionAnalysis.personalityInsights.groupType}`;
        
        if (visionAnalysis.personalityInsights.preferences.length > 0) {
          systemPrompt += `\n- Visual preferences: ${visionAnalysis.personalityInsights.preferences.join(', ')}`;
        }
        
        if (visionAnalysis.colorPalette.length > 0) {
          systemPrompt += `\n- Color palette: ${visionAnalysis.colorPalette.join(', ')}`;
        }
        
        systemPrompt += `\n- Time of day: ${visionAnalysis.timeOfDay}`;
        systemPrompt += `\n- Season detected: ${visionAnalysis.season}`;
        
        if (visionAnalysis.recommendedPackages.length > 0) {
          systemPrompt += `\n- Recommended package types: ${visionAnalysis.recommendedPackages.join(', ')}`;
        }
        
        systemPrompt += `\n\nVISION-BASED RECOMMENDATIONS:`;
        systemPrompt += `\n- IMPORTANT: The user shared an image that shows ${visionAnalysis.sceneType} scenery with ${visionAnalysis.mood} mood`;
        systemPrompt += `\n- Tailor your response to match this visual aesthetic and atmosphere`;
        systemPrompt += `\n- Prioritize destinations similar to what they showed: ${visionAnalysis.suggestedDestinations.slice(0, 3).join(', ')}`;
        systemPrompt += `\n- Match their visual preferences in your recommendations`;
        systemPrompt += `\n- Reference the image they shared to create a more personalized connection`;
        
        // Add specific package triggers based on vision
        if (visionAnalysis.sceneType === 'beach') {
          systemPrompt += `\n- Use **SHOW_PACKAGES:beach** for beach-related recommendations`;
        } else if (visionAnalysis.sceneType === 'luxury') {
          systemPrompt += `\n- Use **SHOW_PACKAGES:luxury** for luxury experiences`;
        } else if (visionAnalysis.sceneType === 'romantic') {
          systemPrompt += `\n- Use **SHOW_PACKAGES:romantic** for romantic packages`;
        } else if (visionAnalysis.suggestedDestinations.length > 0) {
          const topDestination = visionAnalysis.suggestedDestinations[0].toLowerCase();
          systemPrompt += `\n- Use **SHOW_PACKAGES:${topDestination}** for destination-specific packages`;
        }
        
        systemPrompt += `\n\nVISUAL RESPONSE ENHANCEMENT: Incorporate the visual aesthetic they shared into your language and recommendations. Make them feel understood based on their image choice.`;
      }
      
      // 🤖 6. Multi-Agent System Coordination
      let multiAgentResponse = null;
      let multiAgentInsights = null;
      
      if (lastUserMessage?.role === 'user') {
        try {
          logger.log('🤖 Initializing Multi-Agent System coordination...');
          
          const agentResult = await multiAgentSystem.coordinateResponse(
            lastUserMessage.content,
            finalSessionId,
            conversationState,
            emotionalState,
            personalityProfile,
            userId || undefined
          );
          
          multiAgentResponse = agentResult.response;
          multiAgentInsights = agentResult.systemInsights;
          
          logger.log(`✨ Multi-Agent coordination completed: ${agentResult.agentContributions.length} agents, quality: ${agentResult.systemInsights.qualityScore.toFixed(2)}`);
          
          // If multi-agent system provides high-quality response, use it directly
          if (agentResult.systemInsights.qualityScore > 0.85 && !agentResult.agentContributions.some(a => a.requiresHumanReview)) {
            logger.log('🎯 Using Multi-Agent System response directly (high quality)');
            
            // Record experiment result for multi-agent usage
            const multiAgentExperimentResult = {
              variantId: 'multi_agent_direct',
              sessionId: finalSessionId,
              userId: userId || undefined,
              query: lastUserMessage.content,
              response: multiAgentResponse,
              engagementMetrics: {
                responseTime: Date.now() - startTime,
                userResponseTime: 0,
                messageLength: multiAgentResponse.length,
                containsPackageClick: multiAgentResponse.includes('SHOW_PACKAGES'),
                leadToBooking: false
              },
              timestamp: Date.now()
            };
            
            aiExperimentEngine.recordExperimentResult('response_source', multiAgentExperimentResult);
            
            // Cache the high-quality multi-agent response
            responseCache.addToCache(lastUserMessage.content, multiAgentResponse, detectedLanguage, 'thumbs_up');
            
            yield multiAgentResponse;
            return;
          } else {
            // Use multi-agent insights to enhance the system prompt
            systemPrompt += `\n\nMULTI-AGENT INSIGHTS:`;
            systemPrompt += `\n- Task complexity: ${agentResult.systemInsights.taskComplexity}`;
            systemPrompt += `\n- Coordination quality: ${agentResult.systemInsights.qualityScore.toFixed(2)}`;
            systemPrompt += `\n- Agents involved: ${agentResult.systemInsights.agentsInvolved}`;
            
            // Add agent-specific recommendations
            const topRecommendations = agentResult.agentContributions
              .filter(a => a.confidence > 0.7)
              .flatMap(a => a.recommendations)
              .slice(0, 3);
              
            if (topRecommendations.length > 0) {
              systemPrompt += `\n- Agent recommendations: ${topRecommendations.join(', ')}`;
            }
            
            // Add partial multi-agent content as context
            if (multiAgentResponse && multiAgentResponse.length > 50) {
              const enhancedContent = multiAgentResponse.substring(0, 200);
              systemPrompt += `\n- Multi-agent baseline response: "${enhancedContent}..."`;
              systemPrompt += `\n\nENHANCE AND EXPAND the above multi-agent response with your advanced capabilities.`;
            }
          }
        } catch (error) {
          logger.error('❌ Multi-Agent System coordination failed:', error);
          // Continue with normal processing if multi-agent fails
        }
      }
      
      // Add AI Learning personalization
      if (userId) {
        systemPrompt = aiLearningEngine.generatePersonalizedPrompt(userId, systemPrompt);
      }
      
      // Apply A/B testing modifications
      if (promptStyleVariant) {
        systemPrompt = aiExperimentEngine.modifyPromptForVariant(systemPrompt, promptStyleVariant);
      }
      
      // Apply response optimization insights
      if (responseOptimization) {
        systemPrompt += `\n\nOPTIMIZATION INSIGHTS:`;
        systemPrompt += `\n- Recommended tone: ${responseOptimization.suggestedTone}`;
        systemPrompt += `\n- Recommended length: ${responseOptimization.recommendedLength}`;
        if (responseOptimization.includePackages) {
          systemPrompt += `\n- Include package recommendations`;
        }
        if (responseOptimization.personalizations.length > 0) {
          systemPrompt += `\n- Personalizations: ${responseOptimization.personalizations.join(', ')}`;
        }
      }
      
      if (detectedLanguage !== 'en') {
        systemPrompt += `\n\nIMPORTANT: Respond in ${detectedLanguage} language.`;
      }
      
      // Model type optimizasyonu
      if (modelType === 'ai-lovv2') {
        systemPrompt = `AI LOVE v2 - Next-gen personalized concierge with learning capabilities! ✨💕\n\n${systemPrompt}`;
      }
      
      // Firebase Functions call with progressive timeout
      const timeoutMs = Math.min(15000 + (attempt * 5000), 30000);
      const generateGeminiResponse = httpsCallable(functions, 'generateGeminiResponse', {
        timeout: timeoutMs
      });
      
      logger.log(`🚀 Ultimate AI attempt ${attempt + 1}/${maxRetries}`, {
        relevantMessages: messagesToSend.length,
        language: detectedLanguage,
        conversationPhase: conversationState?.currentPhase,
        conversionProbability: conversationState?.conversionProbability,
        urgencyLevel: conversationState?.urgencyLevel,
        realTimeDataAvailable: !!realTimeData,
        emotionalState: emotionalState?.primary,
        emotionalIntensity: emotionalState?.intensity,
        personalityStyle: personalityProfile?.communicationStyle,
        experimentVariants: {
          promptStyle: promptStyleVariant?.id,
          packageStrategy: packageStrategyVariant?.id
        },
        timeout: timeoutMs
      });
      
      const result = await generateGeminiResponse({
        messages: messagesToSend,
        sessionId: finalSessionId,
        userId: userId || null,
        systemInstruction: systemPrompt,
        modelType: modelType || 'ai-lovv3',
        language: detectedLanguage,
        // Enhanced context bilgileri
        userPreferences: context.userPreferences,
        conversationPhase: context.conversationPhase,
        // Conversation flow data
        conversationState: conversationState ? {
          phase: conversationState.currentPhase,
          conversionProbability: conversationState.conversionProbability,
          urgencyLevel: conversationState.urgencyLevel,
          collectedInfo: conversationState.collectedInfo,
          predictedActions: conversationState.predictedNextActions.slice(0, 2) // Top 2 actions
        } : null,
        // Real-time data summary
        realTimeContext: realTimeData ? {
          destination: realTimeData.weather?.destination,
          currentWeather: realTimeData.weather?.current,
          upcomingEvents: realTimeData.events?.events.slice(0, 2),
          safetyLevel: realTimeData.advisory?.safetyLevel,
          bestInsights: realTimeData.insights
        } : null,
        // Emotional intelligence context
        emotionalContext: emotionalState && personalityProfile ? {
          emotionalState: emotionalState.primary,
          intensity: emotionalState.intensity,
          indicators: emotionalState.indicators,
          communicationStyle: personalityProfile.communicationStyle,
          decisionMaking: personalityProfile.decisionMaking,
          riskTolerance: personalityProfile.riskTolerance,
          recommendedTone: emotionalResponse?.tone,
          recommendedApproach: emotionalResponse?.approach
        } : null,
        experimentVariants: {
          promptStyle: promptStyleVariant?.id,
          packageStrategy: packageStrategyVariant?.id
        }
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.message || 'Firebase Functions error');
      }
      
      const content = data.generatedContent?.parts?.[0]?.text || data.message || '';
      const responseTime = Date.now() - startTime;
      
      // 💾 6. Multi-layer result processing
      
      // 🚀 Multi-layer cache storage
      if (lastUserMessage?.role === 'user' && content) {
        // Add to intelligent cache with enhanced metadata
        intelligentCacheSystem.addSmartCache(
          lastUserMessage.content,
          content,
          userId || undefined,
          detectedLanguage,
          responseTime,
          [
            context.conversationPhase || 'unknown',
            conversationState?.urgencyLevel || 'normal',
            emotionalState?.primary || 'neutral'
          ]
        );
        
        // Update user profile in recommendation engine
        if (userId) {
          smartRecommendationEngine.updateUserProfile(userId, {
            query: lastUserMessage.content,
            sessionDuration: responseTime
          });
        }
        
        // Fallback cache
        responseCache.addToCache(lastUserMessage.content, content, detectedLanguage);
      }
      
      // Record experiment results
      if (promptStyleVariant && lastUserMessage?.role === 'user') {
        const experimentResult = {
          variantId: promptStyleVariant.id,
          sessionId: finalSessionId,
          userId: userId || undefined,
          query: lastUserMessage.content,
          response: content,
          engagementMetrics: {
            responseTime,
            userResponseTime: 0, // Will be updated when user responds
            messageLength: content.length,
            containsPackageClick: content.includes('SHOW_PACKAGES'),
            leadToBooking: false // Will be updated based on user actions
          },
          timestamp: Date.now()
        };
        
        aiExperimentEngine.recordExperimentResult('prompt_style', experimentResult);
        aiExperimentEngine.recordExperimentResult('response_source', {
          ...experimentResult,
          variantId: 'ai_generated'
        });
      }
      
      logger.log(`🚀 Ultimate AI response generated in ${responseTime}ms with ${content.length} characters`);
      
      // Log conversation insights
      if (conversationState) {
        logger.log(`📊 Conversation insights: Phase=${conversationState.currentPhase}, Conversion=${(conversationState.conversionProbability * 100).toFixed(1)}%, Urgency=${conversationState.urgencyLevel}`);
      }
      
      // Log real-time data usage
      if (realTimeData) {
        logger.log(`🌍 Real-time data used: Weather=${!!realTimeData.weather}, Events=${realTimeData.events?.events.length || 0}, Advisory=${!!realTimeData.advisory}`);
      }
      
      // Log emotional intelligence usage
      if (emotionalState && personalityProfile) {
        logger.log(`🎭 Emotional intelligence: ${emotionalState.primary} emotion, ${personalityProfile.communicationStyle} style, ${emotionalResponse?.tone} tone recommended`);
      }
      
      // Log multi-agent system usage
      if (multiAgentInsights) {
        logger.log(`🤖 Multi-Agent System: ${multiAgentInsights.agentsInvolved} agents, complexity: ${multiAgentInsights.taskComplexity}, quality: ${multiAgentInsights.qualityScore.toFixed(2)}, time: ${multiAgentInsights.coordinationTime}ms`);
      }
      
      // Log vision analysis usage
      if (visionAnalysis) {
        logger.log(`🖼️ Vision Analysis: ${visionAnalysis.sceneType} scene, ${visionAnalysis.mood} mood, confidence: ${visionAnalysis.confidenceScore}%, destinations: ${visionAnalysis.suggestedDestinations.slice(0, 2).join(', ')}`);
      }
      
      // 📊 7. Self-Evaluation & Continuous Improvement (Non-blocking with timeout)
      if (lastUserMessage?.role === 'user' && content) {
        // Run async self-evaluation with timeout protection (don't block response)
        setTimeout(() => {
          // Wrap in Promise with timeout to prevent hanging
          const evaluationPromise = (async () => {
          try {
              logger.log('📊 Starting async self-evaluation with timeout protection...');
            
            const evaluationContext = {
              conversationPhase: conversationState?.currentPhase,
              emotionalState: emotionalState?.primary,
              visionAnalysis: visionAnalysis ? {
                sceneType: visionAnalysis.sceneType,
                mood: visionAnalysis.mood,
                confidenceScore: visionAnalysis.confidenceScore
              } : undefined,
              messageCount: messages.length,
              conversionProbability: conversationState?.conversionProbability,
              urgencyLevel: conversationState?.urgencyLevel,
              realTimeDataUsed: !!realTimeData,
              multiAgentQuality: multiAgentInsights?.qualityScore,
              responseTime
            };
            
              // Add timeout to evaluation call
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Self-evaluation timeout')), 5000); // 5 second timeout
              });
              
              const evaluation = await Promise.race([
                selfEvaluationSystem.evaluateResponse(
              lastUserMessage.content,
              content,
              finalSessionId,
              userId || undefined,
              evaluationContext
                ),
                timeoutPromise
              ]);
            
              if (evaluation && typeof evaluation === 'object' && 'overallQuality' in evaluation) {
                const evalResult = evaluation as any; // Type assertion for evaluation object
                logger.log(`✨ Self-evaluation completed: Quality ${(evalResult.overallQuality || 0).toFixed(1)}/10, Confidence ${((evalResult.confidence || 0) * 100).toFixed(0)}%`);
            
            // Log key insights
                if (evalResult.strengths && Array.isArray(evalResult.strengths) && evalResult.strengths.length > 0) {
                  logger.log(`💪 Strengths: ${evalResult.strengths.slice(0, 2).join(', ')}`);
            }
                if (evalResult.improvements && Array.isArray(evalResult.improvements) && evalResult.improvements.length > 0) {
                  logger.log(`🔧 Improvements: ${evalResult.improvements.slice(0, 2).join(', ')}`);
            }
            
                // Auto-generate improvement recommendations if quality is consistently low (with protection)
                try {
            const recentEvaluations = selfEvaluationSystem.getRecentEvaluations(5);
                  if (recentEvaluations && recentEvaluations.length > 0) {
                    const avgRecentQuality = recentEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallQuality || 0), 0) / recentEvaluations.length;
            
            if (recentEvaluations.length >= 5 && avgRecentQuality < 6) {
              logger.log('🔄 Generating improvement recommendations due to low quality trend...');
                      // Add timeout to recommendations too
                      const recommendationsPromise = selfEvaluationSystem.generateImprovementRecommendations();
                      const recommendationsTimeout = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Recommendations timeout')), 3000); // 3 second timeout
                      });
                      
                      const recommendations = await Promise.race([recommendationsPromise, recommendationsTimeout]);
                      if (recommendations && Array.isArray(recommendations)) {
              logger.log(`💡 Generated ${recommendations.length} improvement recommendations`);
                      }
                    }
                  }
                } catch (recError) {
                  logger.warn('⚠️ Recommendations generation failed (non-critical):', recError instanceof Error ? recError.message : 'Unknown error');
                }
            }
            
          } catch (error) {
              // Log error but don't let it affect the main response
              logger.warn('⚠️ Self-evaluation failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
          }
          })();
          
          // Catch any unhandled promise rejections
          evaluationPromise.catch(error => {
            logger.warn('⚠️ Self-evaluation promise rejection (non-critical):', error instanceof Error ? error.message : 'Unknown error');
          });
          
        }, 200); // Increased delay to let response be sent first
      }
      
      yield content;
      return; // Success - exit retry loop
      
    } catch (error: unknown) {
      attempt++;
      logger.error(`Next-gen attempt ${attempt}/${maxRetries} failed:`, error);
      
      // If this was the last attempt or non-retryable error, throw
      if (attempt >= maxRetries || !isRetryableError(error)) {
        const errorMessage = getLocalizedErrorMessage(error, messages);
        throw new Error(errorMessage);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Enhanced user feedback recording
export function recordUserFeedback(
  messageId: string,
  sessionId: string,
  userId: string | undefined,
  feedback: 'thumbs_up' | 'thumbs_down',
  query: string,
  response: string,
  category: string = 'general'
): void {
  // Original AI learning engine
  aiLearningEngine.recordFeedback({
    messageId,
    sessionId,
    userId,
    feedback,
    query,
    response,
    timestamp: Date.now(),
    category
  });
  
  // Update intelligent cache quality
  if (userId) {
    intelligentCacheSystem.updateCacheQuality(
      query,
      userId,
      'tr', // default language
      feedback === 'thumbs_up' ? 'positive' : 'negative'
    );
    
    // Update recommendation engine
    smartRecommendationEngine.updateUserProfile(userId, {
      feedback: feedback === 'thumbs_up' ? 'positive' : 'negative'
    });
  }
  
  logger.log(`👍👎 Enhanced feedback recorded: ${feedback} for message ${messageId}`);
}

// AI performans istatistiklerini al
// Conversation insights export function
export function getConversationInsights(sessionId: string): ReturnType<typeof conversationPredictor.getConversationInsights> {
  return conversationPredictor.getConversationInsights(sessionId);
}

// Proactive suggestion function
export function getProactiveSuggestion(sessionId: string): ReturnType<typeof conversationPredictor.getProactiveSuggestion> {
  return conversationPredictor.getProactiveSuggestion(sessionId);
}

// Get emotional insights for user
export function getEmotionalInsights(userId: string): {
  currentState: ReturnType<typeof emotionalIntelligenceEngine.analyzeEmotionalState> | null;
  trend: ReturnType<typeof emotionalIntelligenceEngine.getEmotionalTrend>;
  personality: PersonalityProfile | null;
} | null {
  if (!userId) return null;
  
  return {
    currentState: null, // Would need last message to analyze
    trend: emotionalIntelligenceEngine.getEmotionalTrend(userId),
    personality: emotionalIntelligenceEngine.buildPersonalityProfile(userId, []) // Would need message history
  };
}

// Enhanced AI stats with all intelligence systems including new components
export function getAIStats(): {
  learning: ReturnType<typeof aiLearningEngine.getLearningStats>;
  experiments: Array<ReturnType<typeof aiExperimentEngine.generateExperimentReport>>;
  cache: ReturnType<typeof responseCache.getCacheStats>;
  intelligentCache: ReturnType<typeof intelligentCacheSystem.getCacheStats>;
  recommendations: ReturnType<typeof smartRecommendationEngine.getRecommendationAnalytics>;
  conversations: ReturnType<typeof conversationPredictor.getAnalytics>;
  semanticSearch: ReturnType<typeof semanticSearchEngine.getStats>;
  emotional: ReturnType<typeof emotionalIntelligenceEngine.getEmotionalAnalytics>;
  realTimeData: ReturnType<typeof realTimeDataService.getCacheStats>;
  multiAgent: ReturnType<typeof multiAgentSystem.getSystemAnalytics>;
  vision: ReturnType<typeof geminiVisionService.getVisionAnalytics>;
  dynamicInstructions: ReturnType<typeof dynamicInstructionsEngine.getInstructionAnalytics>;
  selfEvaluation: ReturnType<typeof selfEvaluationSystem.getEvaluationAnalytics>;
} {
  const activeExperiments = aiExperimentEngine.getActiveExperiments();
  
  return {
    learning: aiLearningEngine.getLearningStats(),
    experiments: activeExperiments.map(expId => aiExperimentEngine.generateExperimentReport(expId)),
    cache: responseCache.getCacheStats(),
    intelligentCache: intelligentCacheSystem.getCacheStats(),
    recommendations: smartRecommendationEngine.getRecommendationAnalytics(),
    conversations: conversationPredictor.getAnalytics(),
    semanticSearch: semanticSearchEngine.getStats(),
    emotional: emotionalIntelligenceEngine.getEmotionalAnalytics(),
    realTimeData: realTimeDataService.getCacheStats(),
    multiAgent: multiAgentSystem.getSystemAnalytics(),
    vision: geminiVisionService.getVisionAnalytics(),
    dynamicInstructions: dynamicInstructionsEngine.getInstructionAnalytics(),
    selfEvaluation: selfEvaluationSystem.getEvaluationAnalytics()
  };
}

// Helper function to determine if error is retryable
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const retryableErrors = [
    'DEADLINE_EXCEEDED',
    'timeout',
    'network',
    'temporary',
    'quota'
  ];
  
  return retryableErrors.some(keyword => 
    error.message.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Simplified error message generation
function getLocalizedErrorMessage(error: unknown, messages: AppMessage[]): string {
  const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lang = lastUserMessage?.role === 'user' ? detectLanguage(lastUserMessage.content) : 'en';
  
  const errorMessages: Record<string, string> = {
    'en': "Connection issue. Please try again!",
    'tr': "Bağlantı sorunu. Lütfen tekrar deneyin!",
    'es': "Problema de conexión. ¡Inténtalo de nuevo!",
    'fr': "Problème de connexion. Veuillez réessayer !",
    'de': "Verbindungsproblem. Bitte versuche es erneut!",
    'ru': "Проблема с подключением. Попробуйте снова!"
  };
  
  return errorMessages[lang] || errorMessages['en'];
}

// 🔥 Firebase Functions kullanarak chat history alma
export const getChatHistory = async (sessionId: string, limit: number = 20): Promise<any[]> => {
  logger.log('🔧 getChatHistory called with:', { sessionId, limit });
  
  try {
    logger.log('🔄 Calling Firebase Functions - getGeminiChatHistory');
    const result = await httpsCallable(functions, 'getGeminiChatHistory')({
      sessionId,
      limit
    });
    
    logger.log('📋 Firebase Functions response:', result);
    
    const response = result.data as any;
    logger.log('📊 Response data:', response);
    
    if (response.success) {
      logger.log('✅ getChatHistory successful, history length:', response.history?.length || 0);
      logger.log('📚 History data:', response.history);
      return response.history || [];
    } else {
      logger.error('❌ getChatHistory failed:', response.error);
      logger.error('❌ Full response:', response);
      return [];
    }
  } catch (error) {
    logger.error('❌ getChatHistory error:', error);
    logger.error('❌ Error type:', typeof error);
    logger.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    logger.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return [];
  }
};

// 🗑️ Firebase Functions kullanarak chat history silme
export const deleteChatHistory = async (sessionId: string): Promise<boolean> => {
  logger.log('🗑️ deleteChatHistory called with sessionId:', sessionId);
  
  try {
    logger.log('🔄 Calling Firebase Functions - deleteGeminiChatHistory');
    const result = await httpsCallable(functions, 'deleteGeminiChatHistory')({
      sessionId
    });
    
    logger.log('📋 Firebase Functions delete response:', result);
    
    const response = result.data as any;
    logger.log('📊 Delete response data:', response);
    
    if (response.success) {
      logger.log('✅ deleteChatHistory successful');
      return true;
    } else {
      logger.error('❌ deleteChatHistory failed:', response.error);
      logger.error('❌ Full delete response:', response);
      return false;
    }
  } catch (error) {
    logger.error('❌ deleteChatHistory error:', error);
    logger.error('❌ Error type:', typeof error);
    logger.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    logger.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return false;
  }
};

// ❌ Backend API fonksiyonları devre dışı - Firebase Functions kullanılacak
/*
// Get packages from backend
export async function getPackages() {
  // Bu fonksiyon Firebase Functions'a taşınacak
  return [];
}

// Check backend health
export async function checkBackendHealth() {
  // Bu fonksiyon Firebase Functions'a taşınacak
  return { status: 'Firebase Functions Active', configured: true };
}

// Create payment intent
export async function createPaymentIntent(reservationId: number, amount: number) {
  // Bu fonksiyon Firebase Functions'a taşınacak
  throw new Error("Payment functionality Firebase Functions'a taşınacak");
}

// Get reservations
export async function getReservations(customerId?: number) {
  // Bu fonksiyon Firebase Functions'a taşınacak
  return [];
}
*/

// Sample packages for development (Firebase Functions'da gerçek data olacak)
export async function getPackages() {
  // Geçici sample data - Firebase Functions'da gerçek paketler olacak
  return [
    {
      id: 1,
      name: "Romantic Bali Retreat",
      description: "10 days in private villa with ocean views, couples massage and candlelit dinners under the stars",
      price: "$3,500",
      location: "Bali, Indonesia",
      duration: "10 days"
    },
    {
      id: 2,
      name: "Parisian Love Affair",
      description: "7 days in luxury hotel near Eiffel Tower, with private tours and champagne experiences",
      price: "$4,200",
      location: "Paris, France",
      duration: "7 days"
    },
    {
      id: 3,
      name: "Santorini Sunset Dream",
      description: "8 days in private suite with infinity pool overlooking the Mediterranean Sea",
      price: "$4,800",
      location: "Santorini, Greece",
      duration: "8 days"
    }
  ];
}

// Check Firebase Functions health
export async function checkBackendHealth() {
  try {
    // Firebase Functions health check yapacağız
    return { status: 'Firebase Functions Active', configured: true };
  } catch (error) {
    logger.error("Firebase Functions health check error:", error);
    return { status: 'ERROR', configured: false };
  }
} 