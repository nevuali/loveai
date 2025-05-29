/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  Part,
} from "@google/generative-ai";

// Firebase Admin SDK'yı başlat
initializeApp();
// Use default database for both development and production
const db = getFirestore();
console.log("Using default Firestore database");

// 🔐 Define Gemini API Secret with defineSecret
// Before deployment, you need to set this secret:
// firebase functions:secrets:set GEMINI_KEY
const geminiKey = defineSecret("GEMINI_KEY");

// Gemini Model Name
const MODEL_NAME = "gemini-1.5-flash-8b"; // Fastest model

// --- Interfaces ---
interface AppMessagePart { // Clarify Part interface
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}
interface AppMessage {
  role: "user" | "model";
  parts: AppMessagePart[];
  sessionId?: string;
  userId?: string;
  createdAt?: Timestamp;
}

// Honeymoon Package Interfaces
interface HoneymoonPackage {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  duration: number; // days
  price: number; // USD
  currency: string;
  category: 'luxury' | 'adventure' | 'romantic' | 'cultural' | 'beach' | 'city';
  features: string[];
  inclusions: string[];
  images: string[];
  rating: number;
  reviews: number;
  availability: boolean;
  seasonality: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface PackageRequestData {
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  limit?: number;
}

interface PackageResponse {
  success: boolean;
  packages?: HoneymoonPackage[];
  message?: string;
  error?: unknown;
}

interface GeminiRequestData {
  messages: AppMessage[]; // Messages from client (last one is user's new message)
  sessionId: string;
  userId?: string;
  systemInstruction?: string;
}

interface GeminiResponse {
  success: boolean;
  message?: string;
  generatedContent?: AppMessage; // Modelin ürettiği tek bir mesaj
  error?: unknown;
}

interface ChatHistoryRequestData {
  sessionId: string;
  userId?: string;
  limit?: number;
}

interface ChatHistoryResponse {
  success: boolean;
  history?: AppMessage[];
  message?: string;
  error?: unknown;
}

// Safety Settings
const safetySettings = [
  {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
  {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
  {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
  {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
];

/**
 * Generates a response from the Gemini API and saves the conversation to Firestore.
 */
export const generateGeminiResponse = onCall<GeminiRequestData, Promise<GeminiResponse>>(
  {
    region: "europe-west1", 
    secrets: [geminiKey],
    memory: "512MiB",
    timeoutSeconds: 60,
    enforceAppCheck: false,
    cors: true
  },
  async (request) => {
    // Remove auth context check - allow public access
    logger.info("generateGeminiResponse called (public access)", { 
      hasData: !!request.data,
      messagesCount: request.data?.messages?.length || 0 
    });

    // Get API key from secret
    const apiKey = geminiKey.value();
    if (!apiKey) {
      logger.error("Gemini API key is not configured. Make sure to set GEMINI_KEY secret.");
      throw new HttpsError("failed-precondition", "Gemini API key is not configured.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        maxOutputTokens: 512, // Increased for better responses
        temperature: 0.8, // More creativity for luxury planning
        topP: 0.9, // Better for creative writing  
        topK: 32, // Optimized balance
        candidateCount: 1, // Single best response
        stopSequences: ["END_RESPONSE"] // Emergency stop if needed
      }
    });

    const {messages, sessionId, userId, systemInstruction} = request.data;

    if (!messages || messages.length === 0) {
      logger.warn("No messages provided for Gemini.");
      throw new HttpsError("invalid-argument", "No messages provided.");
    }
    if (!sessionId) {
      logger.warn("Session ID is required for Gemini.");
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    // Prepare system instruction if provided
    let systemInstructionContent: Content | undefined = undefined;
    if (systemInstruction) {
      systemInstructionContent = {
        parts: [{text: systemInstruction}],
        role: "user" // System instruction is treated as user input by the API
      };
    }

    // Convert messages array from client to Content[] format expected by Gemini.
    // Improved context: Use last 6 messages for better conversation flow
    const recentMessages = messages.slice(-6); // Increased from 3 to 6 messages
    let historyForGemini: Content[] = recentMessages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: msg.parts as Part[], // Type casting, assuming client sends correct format
    }));

    // Ensure first message in history is from 'user' role
    // If first message is from 'model', start with empty history
    if (historyForGemini.length > 0 && historyForGemini[0].role === 'model') {
      logger.info("First message was from model, using empty history");
      historyForGemini = [];
    }

    const lastUserMessageParts = recentMessages[recentMessages.length - 1].parts as Part[];

    try {
      const chat = model.startChat({
        history: historyForGemini,
        safetySettings,
        ...(systemInstructionContent && {systemInstruction: systemInstructionContent}),
      });

      const result = await chat.sendMessage(lastUserMessageParts);
      const response = result.response;

      if (!response) {
        logger.error("No response from Gemini API.", {result});
        throw new HttpsError("internal", "No response from Gemini API.");
      }

      const generatedText = response.text();
      const modelResponse: AppMessage = {
        role: "model",
        parts: [{text: generatedText}],
        sessionId: sessionId,
        userId: userId,
        createdAt: Timestamp.now(),
      };

      // Save user's last message and model's response to Firestore
      const conversationRef = db.collection("conversations");
      const userMessageToSave: AppMessage = {
        ...messages[messages.length - 1], // Last message from client
        sessionId: sessionId,
        userId: userId,
        createdAt: Timestamp.now(), // Server timestamp
      };
      
      // Parallel database operations for speed
      try {
        logger.info("Attempting to save to Firestore...");
        
        // Parallel saving - use Promise.all instead of await
        const [userDoc, modelDoc] = await Promise.all([
          conversationRef.add(userMessageToSave),
          conversationRef.add(modelResponse)
        ]);
        
        logger.info("User message saved successfully, ID:", userDoc.id);
        logger.info("Model response saved successfully, ID:", modelDoc.id);
        logger.info("Messages saved to Firestore successfully");
      } catch (firestoreError) {
        logger.error("Error saving to Firestore:", firestoreError);
        // Better error details
        if (firestoreError instanceof Error) {
          logger.error("Firestore error message:", firestoreError.message);
          logger.error("Firestore error stack:", firestoreError.stack);
        }
        // Return Gemini response to user even if Firestore error occurs
        logger.warn("Continuing with response despite Firestore error");
      }

      return {
        success: true,
        generatedContent: modelResponse,
      };
    } catch (e: unknown) {
      logger.error("Error calling Gemini API or saving to Firestore:", e);
      let message = "Internal server error";
      let details;
      if (e instanceof Error) {
        message = e.message;
      }
      // HttpsError için 'details' özelliğini kontrol et
      if (typeof e === 'object' && e !== null && 'details' in e) {
        details = (e as { details: unknown }).details;
      }
      throw new HttpsError("internal", message, details);
    }
  },
);

/**
 * Retrieves chat history from Firestore for a given session ID.
 */
async function getChatHistoryInternal(
  sessionId: string,
  limitCount = 10, // Increased from 5 to 10 for better conversation memory
): Promise<AppMessage[]> {
  if (!sessionId) {
    logger.warn("getChatHistoryInternal: Session ID is required.");
    return [];
  }
  try {
    const query = db.collection("conversations")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "asc")
      .limit(limitCount);

    const snapshot = await query.get();
    const history: AppMessage[] = [];
    snapshot.forEach((doc) => {
      history.push(doc.data() as AppMessage);
    });
    return history;
  } catch (error) {
    logger.error(`Error fetching chat history for session ${sessionId}:`, error);
    return [];
  }
}

export const getGeminiChatHistory = onCall<ChatHistoryRequestData, Promise<ChatHistoryResponse>>(
  {
    region: "europe-west1",
    enforceAppCheck: false,
    cors: true
  },
  async (request) => {
    // Public access for chat history
    logger.info("getGeminiChatHistory called (public access)", { 
      sessionId: request.data?.sessionId?.substring(0, 8) + "...",
      hasData: !!request.data
    });
    const {sessionId, limit} = request.data;

    if (!sessionId) {
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    try {
      const history = await getChatHistoryInternal(sessionId, limit);
      return {success: true, history};
    } catch (e: unknown) {
      logger.error("Error in getGeminiChatHistory callable function:", e);
      let message = "Internal server error";
      let details;
      if (e instanceof Error) {
        message = e.message;
      }
      // Check 'details' property for HttpsError
      if (typeof e === 'object' && e !== null && 'details' in e) {
        details = (e as { details: unknown }).details;
      }
      throw new HttpsError("internal", message, details);
    }
  },
);

/**
 * Get honeymoon packages from Firestore with optional filtering
 */
export const getHoneymoonPackages = onCall<PackageRequestData, Promise<PackageResponse>>(
  {
    region: "europe-west1",
    enforceAppCheck: false,
    cors: true
  },
  async (request) => {
    logger.info("getHoneymoonPackages called", { 
      hasData: !!request.data,
      filters: request.data
    });

    try {
      const { category, location, minPrice, maxPrice, duration, limit = 20 } = request.data || {};

      let query = db.collection("honeymoonPackages")
        .where("availability", "==", true);

      // Apply filters
      if (category) {
        query = query.where("category", "==", category);
      }
      if (location) {
        query = query.where("location", "==", location);
      }
      if (minPrice !== undefined) {
        query = query.where("price", ">=", minPrice);
      }
      if (maxPrice !== undefined) {
        query = query.where("price", "<=", maxPrice);
      }
      if (duration) {
        query = query.where("duration", "==", duration);
      }

      // Order by rating and limit results
      query = query.orderBy("rating", "desc").limit(limit);

      const snapshot = await query.get();
      const packages: HoneymoonPackage[] = [];

      snapshot.forEach((doc) => {
        packages.push({
          id: doc.id,
          ...doc.data()
        } as HoneymoonPackage);
      });

      logger.info(`Retrieved ${packages.length} packages`);
      return { success: true, packages };

    } catch (error) {
      logger.error("Error fetching honeymoon packages:", error);
      let message = "Failed to fetch packages";
      if (error instanceof Error) {
        message = error.message;
      }
      throw new HttpsError("internal", message);
    }
  }
);

/**
 * Get a single honeymoon package by ID
 */
export const getHoneymoonPackage = onCall<{packageId: string}, Promise<{success: boolean; package?: HoneymoonPackage; message?: string}>>(
  {
    region: "europe-west1",
    enforceAppCheck: false,
    cors: true
  },
  async (request) => {
    logger.info("getHoneymoonPackage called", { 
      packageId: request.data?.packageId
    });

    const { packageId } = request.data || {};

    if (!packageId) {
      throw new HttpsError("invalid-argument", "Package ID is required");
    }

    try {
      const doc = await db.collection("honeymoonPackages").doc(packageId).get();
      
      if (!doc.exists) {
        return { success: false, message: "Package not found" };
      }

      const packageData = {
        id: doc.id,
        ...doc.data()
      } as HoneymoonPackage;

      return { success: true, package: packageData };

    } catch (error) {
      logger.error("Error fetching honeymoon package:", error);
      let message = "Failed to fetch package";
      if (error instanceof Error) {
        message = error.message;
      }
      throw new HttpsError("internal", message);
    }
  }
);

/**
 * Initialize sample honeymoon packages (admin only)
 */
export const initializeHoneymoonPackages = onCall<{}, Promise<{success: boolean; message: string}>>(
  {
    region: "europe-west1",
    enforceAppCheck: false,
    cors: true
  },
  async () => {
    logger.info("initializeHoneymoonPackages called");

    try {
      const packagesCollection = db.collection("honeymoonPackages");
      
      // Check if packages already exist
      const existingPackages = await packagesCollection.limit(1).get();
      if (!existingPackages.empty) {
        return { success: true, message: "Packages already initialized" };
      }

      const samplePackages: Omit<HoneymoonPackage, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          title: "Romantic Santorini Escape",
          description: "Experience the magic of Santorini with stunning sunset views, luxury accommodations, and private vineyard tours. Perfect for couples seeking romance and breathtaking beauty.",
          location: "Santorini",
          country: "Greece",
          duration: 7,
          price: 4500,
          currency: "USD",
          category: "romantic",
          features: ["Private Villa", "Sunset Views", "Wine Tasting", "Couples Spa", "Private Chef"],
          inclusions: ["Luxury accommodation", "Daily breakfast", "Airport transfers", "Wine tour", "Couples massage"],
          images: ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800"],
          rating: 4.9,
          reviews: 127,
          availability: true,
          seasonality: ["Spring", "Summer", "Fall"]
        },
        {
          title: "Maldives Paradise Retreat",
          description: "Overwater bungalows, crystal-clear waters, and world-class diving. The ultimate luxury beach honeymoon in an untouched tropical paradise.",
          location: "Maldives",
          country: "Maldives",
          duration: 10,
          price: 8500,
          currency: "USD", 
          category: "luxury",
          features: ["Overwater Villa", "Private Beach", "Diving", "Spa Treatments", "Butler Service"],
          inclusions: ["Overwater accommodation", "All meals included", "Seaplane transfers", "Diving equipment", "Spa credits"],
          images: ["https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800", "https://images.unsplash.com/photo-1571417904834-b745c0359781?w=800"],
          rating: 4.8,
          reviews: 89,
          availability: true,
          seasonality: ["Year-round"]
        },
        {
          title: "Paris City of Love",
          description: "Classic Parisian romance with luxury hotels, Michelin-starred dining, private museum tours, and charming walks along the Seine.",
          location: "Paris",
          country: "France",
          duration: 5,
          price: 3200,
          currency: "USD",
          category: "city",
          features: ["Luxury Hotel", "Michelin Dining", "Private Tours", "Seine Cruise", "Shopping"],
          inclusions: ["5-star hotel", "Daily breakfast", "Museum passes", "Seine dinner cruise", "Shopping guide"],
          images: ["https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800", "https://images.unsplash.com/photo-1471623320832-752e8bbf8413?w=800"],
          rating: 4.7,
          reviews: 156,
          availability: true,
          seasonality: ["Spring", "Summer", "Fall"]
        },
        {
          title: "Bali Adventure & Romance",
          description: "Combine adventure with romance in Bali. Luxury resorts, temple visits, rice terrace tours, and traditional spa treatments in tropical paradise.",
          location: "Ubud",
          country: "Indonesia",
          duration: 8,
          price: 2800,
          currency: "USD",
          category: "adventure",
          features: ["Jungle Villa", "Temple Tours", "Rice Terraces", "Traditional Spa", "Cooking Classes"],
          inclusions: ["Luxury resort", "Daily breakfast", "Cultural tours", "Spa treatments", "Cooking experience"],
          images: ["https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800", "https://images.unsplash.com/photo-1580227475780-8c6e62ae5b4a?w=800"],
          rating: 4.6,
          reviews: 203,
          availability: true,
          seasonality: ["Year-round"]
        },
        {
          title: "Tuscany Wine & Romance",
          description: "Rolling hills, world-class wineries, charming villages, and exquisite Italian cuisine. Perfect blend of culture, romance, and gastronomy.",
          location: "Tuscany",
          country: "Italy",
          duration: 6,
          price: 3800,
          currency: "USD",
          category: "cultural",
          features: ["Wine Estate", "Cooking Classes", "Historic Tours", "Vineyard Views", "Private Tastings"],
          inclusions: ["Boutique hotel", "Daily breakfast", "Wine tours", "Cooking class", "Private transfers"],
          images: ["https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800", "https://images.unsplash.com/photo-1534445638895-b7bb0ba9da00?w=800"],
          rating: 4.8,
          reviews: 94,
          availability: true,
          seasonality: ["Spring", "Summer", "Fall"]
        },
        {
          title: "Dubai Luxury Experience",
          description: "Ultra-luxury in the desert oasis. Sky-high accommodations, world-class shopping, desert safaris, and exclusive dining experiences.",
          location: "Dubai",
          country: "UAE",
          duration: 5,
          price: 5200,
          currency: "USD",
          category: "luxury",
          features: ["Burj Al Arab", "Desert Safari", "Luxury Shopping", "Fine Dining", "Private Beach"],
          inclusions: ["7-star hotel", "All meals", "Desert experience", "Shopping credits", "Spa access"],
          images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800"],
          rating: 4.7,
          reviews: 67,
          availability: true,
          seasonality: ["Fall", "Winter", "Spring"]
        }
      ];

      // Add packages to Firestore
      const batch = db.batch();
      const now = Timestamp.now();

      samplePackages.forEach((packageData) => {
        const docRef = packagesCollection.doc();
        batch.set(docRef, {
          ...packageData,
          createdAt: now,
          updatedAt: now
        });
      });

      await batch.commit();
      logger.info(`Successfully initialized ${samplePackages.length} honeymoon packages`);

      return { 
        success: true, 
        message: `Successfully initialized ${samplePackages.length} honeymoon packages` 
      };

    } catch (error) {
      logger.error("Error initializing honeymoon packages:", error);
      let message = "Failed to initialize packages";
      if (error instanceof Error) {
        message = error.message;
      }
      throw new HttpsError("internal", message);
    }
  }
);
