import { GoogleGenerativeAI } from "@google/generative-ai";

// API anahtarını buraya ekleyin veya .env ile yönetin
const API_KEY = "AIzaSyAmEAc7ITnnGOQMIG8SeJSY4kBWiqGgH1E";
// Google dökümantasyonuna göre model adı tam yol olmalı:
// 'models/gemini-pro' veya 'models/gemini-1.5-pro-latest' gibi
const MODEL_NAME = "models/gemini-1.5-flash-latest";
// Eğer hata devam ederse, yukarıdaki satırı şu şekilde değiştirin:
// const MODEL_NAME = "models/gemini-1.5-pro-latest";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateGeminiContent(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API hatası:", error);
    throw new Error(error.message || "Gemini API hatası");
  }
} 