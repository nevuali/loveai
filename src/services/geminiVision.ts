import { logger } from '../utils/logger';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface VisionAnalysis {
  sceneType: 'beach' | 'mountain' | 'city' | 'nature' | 'luxury' | 'cultural' | 'adventure' | 'romantic';
  mood: 'romantic' | 'adventure' | 'relaxing' | 'cultural' | 'luxury' | 'energetic' | 'peaceful';
  suggestedDestinations: string[];
  detectedElements: {
    architecture?: string[];
    naturalFeatures?: string[];
    activities?: string[];
    atmosphere?: string[];
  };
  confidenceScore: number;
  personalityInsights: {
    travelStyle: 'luxury' | 'budget' | 'mid-range' | 'adventure' | 'cultural';
    groupType: 'couple' | 'family' | 'solo' | 'friends';
    preferences: string[];
  };
  recommendedPackages: string[];
  colorPalette: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'unknown';
}

interface ImageContext {
  userMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  sessionId: string;
}

class GeminiVisionService {
  private readonly VISION_CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private visionCache: Map<string, { data: VisionAnalysis; timestamp: number }> = new Map();

  // Ana vision analiz fonksiyonu
  async analyzeImage(
    imageBase64: string, 
    context: ImageContext
  ): Promise<VisionAnalysis> {
    const startTime = Date.now();
    logger.log('🖼️ Gemini Vision analysis started');

    // Cache kontrolü
    const cacheKey = this.generateCacheKey(imageBase64, context);
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) {
      logger.log('✅ Vision cache hit!');
      return cached;
    }

    try {
      // Gelişmiş vision prompt oluştur
      const visionPrompt = this.createAdvancedVisionPrompt(context);
      
      // Firebase Functions üzerinden Gemini Pro Vision çağrısı
      const analyzeImageFunction = httpsCallable(functions, 'analyzeImageWithGemini');
      
      const result = await analyzeImageFunction({
        imageBase64,
        prompt: visionPrompt,
        sessionId: context.sessionId,
        userId: context.userId || null,
        userMessage: context.userMessage,
        conversationHistory: context.conversationHistory?.slice(-5) // Son 5 mesaj
      });

      const response = result.data as any;
      
      if (!response.success) {
        throw new Error(response.message || 'Vision analysis failed');
      }

      // Gemini yanıtını parse et
      const analysis = this.parseVisionResponse(response.analysis);
      
      // Cache'e kaydet
      this.setCachedAnalysis(cacheKey, analysis);
      
      const analysisTime = Date.now() - startTime;
      logger.log(`✨ Vision analysis completed in ${analysisTime}ms with confidence ${analysis.confidenceScore}`);
      
      return analysis;

    } catch (error) {
      logger.error('❌ Gemini Vision analysis failed:', error);
      
      // Fallback analiz
      return this.getFallbackAnalysis(imageBase64, context);
    }
  }

  // Gelişmiş vision prompt oluşturma
  private createAdvancedVisionPrompt(context: ImageContext): string {
    let prompt = `
You are AI LOVVE's Advanced Vision Analyst - Expert in travel and honeymoon destination analysis from images.

ANALYZE this image with EXPERT-LEVEL precision for honeymoon destination recommendations.

ANALYSIS FRAMEWORK:
1. SCENE IDENTIFICATION:
   - Primary scene type (beach, mountain, city, nature, luxury, cultural, adventure, romantic)
   - Architectural style and cultural markers
   - Natural features and landscapes
   - Activities visible or implied

2. MOOD & ATMOSPHERE DETECTION:
   - Emotional tone (romantic, adventure, relaxing, cultural, luxury, energetic, peaceful)
   - Time of day and lighting quality
   - Season indicators
   - Color palette and aesthetic

3. TRAVEL PREFERENCE INSIGHTS:
   - Implied travel style (luxury, budget, mid-range, adventure, cultural)
   - Group type indicators (couple, family, solo, friends)
   - Activity preferences
   - Accommodation type preferences

4. DESTINATION MATCHING:
   - Specific destination recommendations that match the scene
   - Similar destinations worldwide
   - Package type recommendations
   - Best travel seasons

DETAILED ANALYSIS REQUIREMENTS:
- Confidence score (0-100) for analysis accuracy
- Specific color palette extraction
- Cultural and architectural style identification
- Activity and experience recommendations
- Seasonal and timing suggestions

RESPONSE FORMAT (JSON):
{
  "sceneType": "primary scene category",
  "mood": "dominant emotional atmosphere",
  "suggestedDestinations": ["destination1", "destination2", "destination3"],
  "detectedElements": {
    "architecture": ["style1", "style2"],
    "naturalFeatures": ["feature1", "feature2"],
    "activities": ["activity1", "activity2"],
    "atmosphere": ["quality1", "quality2"]
  },
  "confidenceScore": confidence_number,
  "personalityInsights": {
    "travelStyle": "style_category",
    "groupType": "group_category", 
    "preferences": ["pref1", "pref2", "pref3"]
  },
  "recommendedPackages": ["package1", "package2"],
  "colorPalette": ["#color1", "#color2", "#color3"],
  "timeOfDay": "time_category",
  "season": "season_category"
}`;

    // Konuşma context'i ekle
    if (context.userMessage) {
      prompt += `\n\nUSER CONTEXT: "${context.userMessage}"`;
      prompt += `\nConsider this message when analyzing the image for personalized recommendations.`;
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `\n\nCONVERSATION HISTORY:`;
      context.conversationHistory.forEach((msg, index) => {
        prompt += `\n${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
      });
      prompt += `\nUse conversation context to provide more targeted destination analysis.`;
    }

    prompt += `\n\nANALYZE the image NOW and provide detailed JSON response with honeymoon destination insights.`;

    return prompt;
  }

  // Gemini vision yanıtını parse etme
  private parseVisionResponse(rawResponse: string): VisionAnalysis {
    try {
      // JSON çıkarmaya çalış
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validation ve cleanup
        return {
          sceneType: this.validateSceneType(parsed.sceneType),
          mood: this.validateMood(parsed.mood),
          suggestedDestinations: this.validateDestinations(parsed.suggestedDestinations),
          detectedElements: parsed.detectedElements || {},
          confidenceScore: Math.max(0, Math.min(100, parsed.confidenceScore || 70)),
          personalityInsights: {
            travelStyle: parsed.personalityInsights?.travelStyle || 'mid-range',
            groupType: parsed.personalityInsights?.groupType || 'couple',
            preferences: parsed.personalityInsights?.preferences || []
          },
          recommendedPackages: parsed.recommendedPackages || [],
          colorPalette: parsed.colorPalette || [],
          timeOfDay: parsed.timeOfDay || 'unknown',
          season: parsed.season || 'unknown'
        };
      }
    } catch (error) {
      logger.error('Vision response parsing failed:', error);
    }

    // Fallback parsing
    return this.parseVisionResponseFallback(rawResponse);
  }

  // Fallback parsing metodu
  private parseVisionResponseFallback(response: string): VisionAnalysis {
    const lowerResponse = response.toLowerCase();
    
    // Basit keyword detection
    let sceneType: VisionAnalysis['sceneType'] = 'nature';
    if (lowerResponse.includes('beach') || lowerResponse.includes('ocean')) sceneType = 'beach';
    else if (lowerResponse.includes('mountain') || lowerResponse.includes('hill')) sceneType = 'mountain';
    else if (lowerResponse.includes('city') || lowerResponse.includes('urban')) sceneType = 'city';
    else if (lowerResponse.includes('luxury') || lowerResponse.includes('hotel')) sceneType = 'luxury';

    let mood: VisionAnalysis['mood'] = 'relaxing';
    if (lowerResponse.includes('romantic') || lowerResponse.includes('sunset')) mood = 'romantic';
    else if (lowerResponse.includes('adventure') || lowerResponse.includes('active')) mood = 'adventure';
    else if (lowerResponse.includes('cultural') || lowerResponse.includes('historic')) mood = 'cultural';

    // Destination extraction
    const destinations = this.extractDestinationsFromText(response);

    return {
      sceneType,
      mood,
      suggestedDestinations: destinations,
      detectedElements: {},
      confidenceScore: 60, // Lower confidence for fallback
      personalityInsights: {
        travelStyle: 'mid-range',
        groupType: 'couple',
        preferences: []
      },
      recommendedPackages: [`${sceneType}-packages`],
      colorPalette: [],
      timeOfDay: 'unknown',
      season: 'unknown'
    };
  }

  // Validation helpers
  private validateSceneType(type: string): VisionAnalysis['sceneType'] {
    const validTypes: VisionAnalysis['sceneType'][] = ['beach', 'mountain', 'city', 'nature', 'luxury', 'cultural', 'adventure', 'romantic'];
    return validTypes.includes(type as any) ? type as VisionAnalysis['sceneType'] : 'nature';
  }

  private validateMood(mood: string): VisionAnalysis['mood'] {
    const validMoods: VisionAnalysis['mood'][] = ['romantic', 'adventure', 'relaxing', 'cultural', 'luxury', 'energetic', 'peaceful'];
    return validMoods.includes(mood as any) ? mood as VisionAnalysis['mood'] : 'relaxing';
  }

  private validateDestinations(destinations: any): string[] {
    if (!Array.isArray(destinations)) return [];
    return destinations.filter(d => typeof d === 'string' && d.length > 0).slice(0, 5);
  }

  private extractDestinationsFromText(text: string): string[] {
    const commonDestinations = [
      'Paris', 'Bali', 'Santorini', 'Maldives', 'Rome', 'Barcelona', 'Istanbul', 'Antalya', 
      'Kapadokya', 'Bodrum', 'Mykonos', 'Tuscany', 'Amalfi', 'Prague', 'Vienna', 'Budapest',
      'Thailand', 'Greece', 'Italy', 'France', 'Spain', 'Turkey'
    ];

    return commonDestinations.filter(dest => 
      text.toLowerCase().includes(dest.toLowerCase())
    ).slice(0, 3);
  }

  // Cache management
  private generateCacheKey(imageBase64: string, context: ImageContext): string {
    const imageHash = this.simpleHash(imageBase64.substring(0, 100));
    const contextHash = this.simpleHash(JSON.stringify({
      userMessage: context.userMessage,
      userId: context.userId
    }));
    return `vision_${imageHash}_${contextHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getCachedAnalysis(key: string): VisionAnalysis | null {
    const cached = this.visionCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.VISION_CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedAnalysis(key: string, data: VisionAnalysis): void {
    this.visionCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cache cleanup
    if (this.visionCache.size > 100) {
      const entries = Array.from(this.visionCache.entries());
      const oldEntries = entries
        .filter(([_, value]) => Date.now() - value.timestamp > this.VISION_CACHE_TTL)
        .map(([key, _]) => key);
      
      oldEntries.forEach(key => this.visionCache.delete(key));
    }
  }

  // Fallback analysis
  private getFallbackAnalysis(imageBase64: string, context: ImageContext): VisionAnalysis {
    logger.log('🔄 Using fallback vision analysis');
    
    return {
      sceneType: 'romantic',
      mood: 'romantic',
      suggestedDestinations: ['Santorini', 'Paris', 'Bali'],
      detectedElements: {
        atmosphere: ['romantic', 'scenic']
      },
      confidenceScore: 40, // Low confidence for fallback
      personalityInsights: {
        travelStyle: 'luxury',
        groupType: 'couple',
        preferences: ['romantic', 'scenic']
      },
      recommendedPackages: ['romantic', 'honeymoon-special'],
      colorPalette: [],
      timeOfDay: 'unknown',
      season: 'unknown'
    };
  }

  // Destination recommendation enhancer
  async enhanceDestinationRecommendations(
    analysis: VisionAnalysis,
    userPreferences?: any
  ): Promise<string[]> {
    try {
      const enhancementPrompt = `
Based on this vision analysis, provide 3-5 specific honeymoon destination recommendations:

VISION ANALYSIS:
- Scene Type: ${analysis.sceneType}
- Mood: ${analysis.mood}  
- Detected Elements: ${JSON.stringify(analysis.detectedElements)}
- Travel Style: ${analysis.personalityInsights.travelStyle}

USER PREFERENCES: ${userPreferences ? JSON.stringify(userPreferences) : 'Not specified'}

REQUIREMENTS:
- Specific destination names (cities/regions)
- Match the visual aesthetic and mood
- Consider honeymoon suitability
- Provide diversity in options

RESPOND with only destination names, comma-separated:
`;

      const enhanceFunction = httpsCallable(functions, 'enhanceDestinationRecommendations');
      const result = await enhanceFunction({
        prompt: enhancementPrompt,
        analysis: analysis
      });

      const response = result.data as any;
      if (response.success && response.destinations) {
        return response.destinations.split(',').map((d: string) => d.trim()).filter((d: string) => d.length > 0);
      }
    } catch (error) {
      logger.error('Destination enhancement failed:', error);
    }

    return analysis.suggestedDestinations;
  }

  // Analytics
  getVisionAnalytics(): {
    totalAnalyses: number;
    cacheHitRate: number;
    averageConfidence: number;
    topSceneTypes: Record<string, number>;
  } {
    const analyses = Array.from(this.visionCache.values()).map(v => v.data);
    
    const sceneTypeCounts: Record<string, number> = {};
    let totalConfidence = 0;

    analyses.forEach(analysis => {
      sceneTypeCounts[analysis.sceneType] = (sceneTypeCounts[analysis.sceneType] || 0) + 1;
      totalConfidence += analysis.confidenceScore;
    });

    return {
      totalAnalyses: analyses.length,
      cacheHitRate: analyses.length > 0 ? this.visionCache.size / analyses.length : 0,
      averageConfidence: analyses.length > 0 ? totalConfidence / analyses.length : 0,
      topSceneTypes: sceneTypeCounts
    };
  }

  // Clear cache
  clearVisionCache(): void {
    this.visionCache.clear();
    logger.log('🗑️ Vision cache cleared');
  }
}

export const geminiVisionService = new GeminiVisionService();
export type { VisionAnalysis, ImageContext };