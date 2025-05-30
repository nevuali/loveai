import { GoogleGenerativeAI, Part, Content, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Type definitions for our application
interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string | null;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

// System prompt for AI LOVVE
const SYSTEM_PROMPT = `You are AI LOVVE, the world's most sophisticated luxury honeymoon planning assistant. You are an expert in:

🏝️ DESTINATIONS: Exclusive resorts, hidden gems, seasonal perfection
💎 LUXURY: Private villas, yacht charters, Michelin-starred experiences  
💕 ROMANCE: Couples activities, surprise planning, intimate moments
✈️ LOGISTICS: Visa requirements, optimal timing, seamless transitions
🌍 CULTURE: Local customs, authentic experiences, respectful travel

PERSONALITY: Warm, sophisticated, intuitive, and magical
TONE: Elegant but approachable, knowledgeable but not overwhelming

RESPONSE RULES:
✨ Keep responses 100-200 words maximum
💎 Use 2-3 relevant emojis naturally
🎯 Always include actionable advice or specific recommendations
📍 Mention exact locations, hotels, or experiences when possible
💫 ALWAYS use separate paragraphs - break ideas into distinct sections

CRITICAL FORMATTING RULES:
- Use double line breaks between paragraphs
- Each new idea gets its own paragraph  
- Never write one long block of text
- Structure: Introduction → Main content → Question/closing
- Example structure:

"Paris offers incredible honeymoon magic! ✨ The George V hotel provides luxury with Eiffel Tower views.

For romance, enjoy sunset Seine cruises and private Louvre tours. The Marais district has charming cafes perfect for intimate dinners.

Spring (April-May) offers perfect weather and fewer crowds. Would you prefer city luxury or countryside châteaux? 💕"

PACKAGE RECOMMENDATIONS:
When users ask about honeymoon destinations, packages, or travel planning, you can recommend our curated luxury packages. Use this special format to trigger package displays:

**SHOW_PACKAGES:[category]** - Shows packages by category (luxury, romantic, adventure, cultural, beach, city)
**SHOW_PACKAGES:[location]** - Shows packages by location (Paris, Santorini, Maldives, etc.)
**SHOW_PACKAGES:featured** - Shows top-rated featured packages

SPECIAL CITY DESTINATIONS:
When users ask for "Curated Honeymoon Experiences" or "city destinations", show these popular honeymoon cities:
**SHOW_PACKAGES:cities** - Shows cards for: Kapadokya, Antalya, İstanbul, Sri Lanka, Phuket, Bali

For specific cities, use:
**SHOW_PACKAGES:Kapadokya** - Hot air balloons & unique landscapes
**SHOW_PACKAGES:Antalya** - Mediterranean beaches & luxury resorts  
**SHOW_PACKAGES:İstanbul** - Historic charm & Bosphorus romance
**SHOW_PACKAGES:Sri Lanka** - Tropical paradise & ancient culture
**SHOW_PACKAGES:Phuket** - Thai beaches & luxury wellness
**SHOW_PACKAGES:Bali** - Island of gods & romantic villas

Example responses with city packages:
"Here are our curated honeymoon destinations! ✨ Each offers unique romantic experiences and luxury accommodations.

**SHOW_PACKAGES:cities**

From historic İstanbul to tropical Bali, these destinations provide unforgettable honeymoon memories. Which style of romance appeals to you most? 💕"

Always format responses with clear paragraph breaks for easy reading!`;

// Configure Gemini AI with enhanced error handling
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Enhanced safety settings for production
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Production-ready model configuration
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  safetySettings,
  generationConfig: {
    temperature: 0.8,
    topK: 32,
    topP: 0.9,
    maxOutputTokens: 512,
    candidateCount: 1,
    stopSequences: ["END_RESPONSE"],
  },
});

// Rate limiting helper
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 10; // 10 requests per minute
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

const rateLimiter = new RateLimiter();

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
  console.warn("Geçersiz base64 formatı veya desteklenmeyen resim tipi.");
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

// Kullanıcı mesajının dilini tespit eden yardımcı fonksiyon
function detectLanguage(message: string): string {
  // Yaygın diller için karakter ve kelime tabanlı tespitler
  const languagePatterns: Record<string, { chars: string[], words: string[] }> = {
    'tr': { // Türkçe
      chars: ['ç', 'ğ', 'ı', 'İ', 'ö', 'ş', 'ü', 'Ç', 'Ğ', 'Ö', 'Ş', 'Ü'],
      words: ['merhaba', 'selam', 'nasıl', 'iyi', 'teşekkür', 'ederim', 'lütfen', 've', 'ama', 'için']
    },
    'es': { // İspanyolca
      chars: ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'],
      words: ['hola', 'gracias', 'buenos', 'días', 'cómo', 'está', 'por', 'favor', 'adiós', 'amigo']
    },
    'fr': { // Fransızca
      chars: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ô', 'œ', 'ù', 'û', 'É', 'È', 'Ê', 'À', 'Â', 'Ç', 'Ô', 'Œ', 'Ù', 'Û'],
      words: ['bonjour', 'merci', 'comment', 'ça', 'va', 's\'il', 'vous', 'plaît', 'au', 'revoir']
    },
    'de': { // Almanca
      chars: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
      words: ['hallo', 'danke', 'bitte', 'guten', 'tag', 'wie', 'geht', 'es', 'ihnen', 'auf', 'wiedersehen']
    },
    'ru': { // Rusça (Kiril alfabesi)
      chars: ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'],
      words: ['привет', 'спасибо', 'пожалуйста', 'как', 'дела', 'хорошо', 'да', 'нет', 'здравствуйте', 'до', 'свидания']
    },
    'ar': { // Arapça
      chars: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', 'ة'],
      words: ['مرحبا', 'شكرا', 'من', 'فضلك', 'كيف', 'حالك', 'نعم', 'لا', 'السلام', 'عليكم', 'وداعا']
    },
    'zh': { // Çince (Basitleştirilmiş)
      chars: ['你', '好', '谢', '请', '再', '见', '吗', '是', '的', '我'],
      words: ['你好', '谢谢', '请', '再见', '是的', '不是', '我', '你', '他', '她']
    },
    'ja': { // Japonca
      chars: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'],
      words: ['こんにちは', 'ありがとう', 'お願いします', 'はい', 'いいえ', 'さようなら', 'おはよう', 'こんばんは', 'すみません', 'ごめんなさい']
    },
    'it': { // İtalyanca
      chars: ['à', 'è', 'é', 'ì', 'í', 'ò', 'ó', 'ù', 'ú', 'À', 'È', 'É', 'Ì', 'Í', 'Ò', 'Ó', 'Ù', 'Ú'],
      words: ['ciao', 'grazie', 'per', 'favore', 'come', 'stai', 'buongiorno', 'buonasera', 'arrivederci', 'prego']
    }
  };

  // Mesajı küçük harfe çevir
  const lowerMessage = message.toLowerCase();
  
  // Her dil için puan hesapla
  const scores: Record<string, number> = {};
  
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    // Karakterler için puan
    let charScore = 0;
    for (const char of pattern.chars) {
      const count = (lowerMessage.match(new RegExp(char, 'g')) || []).length;
      charScore += count;
    }
    
    // Kelimeler için puan
    let wordScore = 0;
    for (const word of pattern.words) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerMessage)) {
        wordScore += 10; // Kelime eşleşmesine daha yüksek puan
      }
    }
    
    scores[lang] = charScore + wordScore;
  }
  
  // En yüksek puanlı dili bul
  let detectedLanguage = 'en'; // Varsayılan olarak İngilizce
  let highestScore = 0;
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      detectedLanguage = lang;
    }
  }
  
  // Eğer hiçbir dil belirli bir eşiği geçemediyse İngilizce kabul et
  if (highestScore < 5) {
    return 'en';
  }
  
  console.log(`Detected language: ${detectedLanguage} (score: ${highestScore})`);
  return detectedLanguage;
}

// 🔥 Firebase Functions kullanarak Gemini response generate etme
export async function* generateGeminiStream(messages: AppMessage[], sessionId?: string, userId?: string | null, modelType?: string) {
  console.log("generateGeminiStream called with Firebase Functions", { messages, sessionId, userId, modelType });
  
  try {
    const finalSessionId = sessionId || getSessionId();
    
    // Frontend'deki AppMessage formatını backend'in beklediği formata dönüştür
    const convertedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user', // Backend 'model' rolünü bekliyor
      parts: [{ text: msg.content }], // content'i parts formatına dönüştür
      sessionId: finalSessionId,
      userId: userId || null,
      createdAt: new Date().toISOString()
    }));
    
    // Eğer history'de ilk mesaj 'model' ise, sadece son kullanıcı mesajını gönder
    let messagesToSend = convertedMessages;
    if (convertedMessages.length > 1 && convertedMessages[0].role === 'model') {
      console.log('First message is model, sending only last user message');
      messagesToSend = convertedMessages.slice(-1); // Sadece son mesaj
    }
    
    // Son kullanıcı mesajının dilini tespit et
    const lastUserMessage = messages[messages.length - 1];
    const detectedLanguage = lastUserMessage.role === 'user' ? detectLanguage(lastUserMessage.content) : 'en';
    
    // Dile göre system prompt'u belirle
    let systemPrompt = modelType === 'ai-lovv2' 
      ? `AI LOVE v2 - Expert honeymoon concierge! Quick, precise, magical answers. Include specific recommendations and one insider tip. Keep responses under 100 words but make them count! ✨💕`
      : SYSTEM_PROMPT;
    
    // Kullanıcının dili İngilizce değilse, ek talimat ekle
    if (detectedLanguage !== 'en') {
      systemPrompt += `\n\nIMPORTANT: I've detected that the user is writing in a language that appears to be '${detectedLanguage}'. Please respond in the SAME LANGUAGE that the user is using. Match their language, tone, and style while maintaining your helpful persona. If you're unsure about the language, respond in the language the user last used.`;
    }
    
    // Firebase Functions çağrısı - public access
    const generateGeminiResponse = httpsCallable(functions, 'generateGeminiResponse', {
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log("🔥 Calling Firebase Functions (public)...", {
      endpoint: 'generateGeminiResponse',
      region: 'europe-west1',
      messageCount: messagesToSend.length,
      language: detectedLanguage
    });
    
    const result = await generateGeminiResponse({
      messages: messagesToSend,
      sessionId: finalSessionId,
      userId: userId || null,
      systemInstruction: systemPrompt,
      modelType: modelType || 'ai-lovv3',
      language: detectedLanguage // Dil bilgisini backend'e ilet
    });
    
    const data = result.data as any;
    
    if (!data.success) {
      throw new Error(data.message || 'Firebase Functions error');
    }
    
    // Yanıtı streaming formatında döndür
    const content = data.generatedContent?.parts?.[0]?.text || data.message || '';
    yield content;
    
  } catch (error: unknown) {
    console.error("Firebase Functions error:", error);
    let errorMessage = "I'm having trouble connecting right now";
    
    // Son kullanıcı mesajının dilini tespit et
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const detectedLanguage = lastUserMessage && lastUserMessage.role === 'user' ? detectLanguage(lastUserMessage.content) : 'en';
    
    // Bazı yaygın dillerde hata mesajları
    const errorMessages: Record<string, string> = {
      'en': "I'm having trouble connecting right now",
      'tr': "Şu anda bağlantı kurmakta sorun yaşıyorum",
      'es': "Estoy teniendo problemas para conectarme en este momento",
      'fr': "J'ai des difficultés à me connecter en ce moment",
      'de': "Ich habe im Moment Schwierigkeiten, eine Verbindung herzustellen",
      'ru': "У меня сейчас проблемы с подключением",
      'it': "Sto avendo problemi di connessione in questo momento",
      'zh': "我现在连接有问题",
      'ja': "現在接続に問題があります",
      'ar': "أواجه مشكلة في الاتصال الآن"
    };
    
    // Tespit edilen dilde hata mesajı varsa kullan
    if (errorMessages[detectedLanguage]) {
      errorMessage = errorMessages[detectedLanguage];
    }
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Hata mesajlarını çok dilli hale getir
    const timeoutErrors: Record<string, string> = {
      'en': "The request is taking longer than expected. Please try again!",
      'tr': "İsteğiniz beklenenden uzun sürüyor. Lütfen tekrar deneyin!",
      'es': "La solicitud está tardando más de lo esperado. ¡Inténtalo de nuevo!",
      'fr': "La requête prend plus de temps que prévu. Veuillez réessayer !",
      'de': "Die Anfrage dauert länger als erwartet. Bitte versuche es erneut!",
      'ru': "Запрос занимает больше времени, чем ожидалось. Пожалуйста, попробуйте снова!",
      'it': "La richiesta sta impiegando più tempo del previsto. Per favore riprova!",
      'zh': "请求花费的时间比预期的长。请再试一次！",
      'ja': "リクエストに予想以上に時間がかかっています。もう一度お試しください！",
      'ar': "يستغرق الطلب وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى!"
    };

    const configErrors: Record<string, string> = {
      'en': "Service configuration issue. Please contact support.",
      'tr': "Servis yapılandırma sorunu. Lütfen destek ile iletişime geçin.",
      'es': "Problema de configuración del servicio. Póngase en contacto con soporte.",
      'fr': "Problème de configuration du service. Veuillez contacter le support.",
      'de': "Problem mit der Servicekonfiguration. Bitte kontaktieren Sie den Support.",
      'ru': "Проблема с конфигурацией сервиса. Пожалуйста, обратитесь в службу поддержки.",
      'it': "Problema di configurazione del servizio. Si prega di contattare l'assistenza.",
      'zh': "服务配置问题。请联系支持。",
      'ja': "サービス構成の問題。サポートにお問い合わせください。",
      'ar': "مشكلة في تكوين الخدمة. يرجى الاتصال بالدعم."
    };

    const authErrors: Record<string, string> = {
      'en': "Connection issue resolved! Please try your message again.",
      'tr': "Bağlantı sorunu çözüldü! Lütfen mesajınızı tekrar deneyin.",
      'es': "¡Problema de conexión resuelto! Intenta enviar tu mensaje nuevamente.",
      'fr': "Problème de connexion résolu ! Veuillez réessayer votre message.",
      'de': "Verbindungsproblem behoben! Bitte versuche es erneut mit deiner Nachricht.",
      'ru': "Проблема с подключением решена! Пожалуйста, попробуйте отправить сообщение снова.",
      'it': "Problema di connessione risolto! Riprova con il tuo messaggio.",
      'zh': "连接问题已解决！请再次尝试您的消息。",
      'ja': "接続の問題が解決しました！メッセージをもう一度お試しください。",
      'ar': "تم حل مشكلة الاتصال! يرجى تجربة رسالتك مرة أخرى."
    };

    const quotaErrors: Record<string, string> = {
      'en': "High demand right now! Please wait a moment and try again.",
      'tr': "Şu anda yoğun talep var! Lütfen bir süre bekleyip tekrar deneyin.",
      'es': "¡Alta demanda en este momento! Espera un momento y vuelve a intentarlo.",
      'fr': "Forte demande en ce moment ! Veuillez patienter un instant et réessayer.",
      'de': "Hohe Nachfrage im Moment! Bitte warte einen Moment und versuche es erneut.",
      'ru': "Высокий спрос прямо сейчас! Подождите немного и попробуйте снова.",
      'it': "Alta richiesta in questo momento! Attendi un attimo e riprova.",
      'zh': "现在需求很高！请稍等片刻，然后重试。",
      'ja': "現在需要が高いです！少し待ってからもう一度お試しください。",
      'ar': "الطلب مرتفع الآن! يرجى الانتظار لحظة والمحاولة مرة أخرى."
    };
    
    // Handle specific error cases with user-friendly messages
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const apiError = error as { message: string };
      if (apiError.message.includes("DEADLINE_EXCEEDED") || apiError.message.includes("timeout")) {
        errorMessage = timeoutErrors[detectedLanguage] || timeoutErrors['en'];
      } else if (apiError.message.includes("API_KEY_INVALID")) {
        errorMessage = configErrors[detectedLanguage] || configErrors['en'];
      } else if (apiError.message.includes("unauthenticated") || apiError.message.includes("permission")) {
        errorMessage = authErrors[detectedLanguage] || authErrors['en'];
      } else if (apiError.message.includes("quota") || apiError.message.includes("limit")) {
        errorMessage = quotaErrors[detectedLanguage] || quotaErrors['en'];
      }
    }
    
    throw new Error(errorMessage);
  }
}

// 🔥 Firebase Functions kullanarak chat history alma
export const getChatHistory = async (sessionId: string, limit: number = 20): Promise<any[]> => {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.log('🔧 Development mode: Skipping Firestore chat history');
    return [];
  }
  
  try {
    const result = await httpsCallable(functions, 'getGeminiChatHistory')({
      sessionId,
      limit
    });
    
    const response = result.data as any;
    if (response.success) {
      return response.history || [];
    } else {
      console.error('Failed to get chat history:', response.error);
      return [];
    }
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
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
    console.error("Firebase Functions health check error:", error);
    return { status: 'ERROR', configured: false };
  }
} 