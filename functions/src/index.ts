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
    memory: "512MiB", // Memory increased
    timeoutSeconds: 60 // Timeout added
  },
  async (request) => {
    logger.info("generateGeminiResponse called with data:", request.data);

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
        maxOutputTokens: 200, // Reduced from 512 to 200 for shorter responses
        temperature: 0.7, // Slightly increased for more creativity
        topP: 0.8, // Better balance
        topK: 20 // Fewer options = faster
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
    // ULTRA FAST: Use only last 3 messages
    const recentMessages = messages.slice(-3); // Last 3 messages
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
  limitCount = 5, // Reduced from 20 to 5 - minimal context
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
  {region: "europe-west1"}, // Made region same as generateGeminiResponse
  async (request) => {
    logger.info("getGeminiChatHistory called with data:", request.data);
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
