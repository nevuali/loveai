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
const SYSTEM_PROMPT = `You are AI LOVVE, a luxury honeymoon planning assistant. 

RESPONSE RULES:
- Keep responses under 150 words
- Use romantic, elegant language
- Include 1-2 relevant emojis
- Focus on actionable honeymoon advice
- Be concise but magical

Examples:
✨ "Paris in spring offers enchanted walks along the Seine, candlelit dinners at intimate bistros, and sunset views from Montmartre. Perfect for 5-7 days of romance! 💕"

🌅 "For Maldives magic: overwater villas, couples spa treatments, and private beach dinners. Best time: November-April for crystal waters! ✨"

Keep it short, sweet, and actionable! 💖`;

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
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
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
    
    // Model tipine göre system prompt'u belirle
    const systemPrompt = modelType === 'ai-lovv2' 
      ? `AI LOVE v2 - Fast honeymoon assistant. Very short responses. 💕`
      : SYSTEM_PROMPT;
    
    // Firebase Functions çağrısı
    const generateGeminiResponse = httpsCallable(functions, 'generateGeminiResponse', {
      timeout: 15000 // 30'dan 15 saniyeye düşürdük
    });
    
    const result = await generateGeminiResponse({
      messages: messagesToSend,
      sessionId: finalSessionId,
      userId: userId || null,
      systemInstruction: systemPrompt,
      modelType: modelType || 'ai-lovv3'
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
    let errorMessage = "General Firebase Functions error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Handle specific error cases
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const apiError = error as { message: string };
      if (apiError.message.includes("DEADLINE_EXCEEDED")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (apiError.message.includes("API_KEY_INVALID")) {
        errorMessage = "API key is invalid. Please contact administrator.";
      } else if (apiError.message.includes("unauthenticated") || apiError.message.includes("permission")) {
        errorMessage = "Firebase Functions access error. Please contact administrator.";
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