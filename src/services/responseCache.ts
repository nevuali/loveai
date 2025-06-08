import { logger } from '../utils/logger';
import { semanticSearchEngine, QueryIntent, SemanticMatch } from './semanticSearch';

interface CachedResponse {
  query: string;
  response: string;
  queryEmbedding: number[]; // Legacy support
  semanticIntent?: QueryIntent; // Enhanced with semantic analysis
  timestamp: number;
  hitCount: number;
  language: string;
  category: 'destination' | 'package' | 'general' | 'booking';
  qualityScore: number; // Response quality based on user feedback
}

interface SimilarityMatch {
  query: string;
  response: string;
  similarity: number;
  category: string;
}

class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 saat
  private readonly SIMILARITY_THRESHOLD = 0.8;

  // Basit word embedding simulation (gerçek projede proper embedding kullanılmalı)
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase()
      .replace(/[^\w\sçğıöşüÇĞIÖŞÜ]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Honeymoon domain'ine özel keyword'ler
    const keywords = [
      'balayı', 'honeymoon', 'romantik', 'romantic', 'luxury', 'lüks',
      'paris', 'bali', 'santorini', 'maldives', 'antalya', 'kapadokya',
      'hotel', 'resort', 'plaj', 'beach', 'spa', 'dinner', 'yemek',
      'bütçe', 'budget', 'fiyat', 'price', 'paket', 'package',
      'rezervasyon', 'booking', 'tarih', 'date', 'kişi', 'person'
    ];

    const embedding = new Array(50).fill(0); // 50 boyutlu vector

    // Her keyword için pozisyon belirle
    keywords.forEach((keyword, index) => {
      if (index < 50) {
        const count = words.filter(word => 
          word.includes(keyword) || keyword.includes(word)
        ).length;
        embedding[index] = count;
      }
    });

    // Normalize et
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  // Cosine similarity hesapla
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  // Query kategori tespiti
  private categorizeQuery(query: string): CachedResponse['category'] {
    const lowerQuery = query.toLowerCase();

    if (/paris|bali|santorini|maldiv|antalya|kapadokya|istanbul|destinasyon|destination|nere/.test(lowerQuery)) {
      return 'destination';
    }
    
    if (/paket|package|öner|recommend|show_packages|fiyat|price/.test(lowerQuery)) {
      return 'package';
    }
    
    if (/rezervasyon|booking|book|satın|buy|ödeme|payment/.test(lowerQuery)) {
      return 'booking';
    }

    return 'general';
  }

  // Enhanced cache addition with semantic analysis
  addToCache(query: string, response: string, language: string = 'tr', userFeedback?: 'thumbs_up' | 'thumbs_down'): void {
    // Cache boyutu kontrolü
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldEntries();
    }

    const queryEmbedding = this.generateSimpleEmbedding(query);
    const semanticIntent = semanticSearchEngine.classifyQueryIntent(query);
    const category = this.categorizeQueryWithIntent(query, semanticIntent);
    const cacheKey = this.generateCacheKey(query, language, category);

    // Calculate quality score based on feedback
    let qualityScore = 0.7; // Default quality
    if (userFeedback === 'thumbs_up') {
      qualityScore = 0.9;
    } else if (userFeedback === 'thumbs_down') {
      qualityScore = 0.3;
    }

    const cachedResponse: CachedResponse = {
      query,
      response,
      queryEmbedding,
      semanticIntent,
      timestamp: Date.now(),
      hitCount: 0,
      language,
      category,
      qualityScore
    };

    this.cache.set(cacheKey, cachedResponse);

    // Add to semantic knowledge base for future searches
    const keywords = this.extractKeywords(query);
    semanticSearchEngine.addEmbedding(
      query + ' ' + response.substring(0, 100), // Combine query and response start
      category,
      keywords
    );

    logger.log(`📝 Enhanced cache entry: ${query.substring(0, 50)}... (quality: ${qualityScore})`);
  }

  // Extract keywords for semantic analysis
  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'için', 'ile', 've', 'bir'];
    return query.toLowerCase()
      .replace(/[^\w\sçğıöşüÇĞIÖŞÜ]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 8);
  }

  // Enhanced semantic cache search
  findSimilarResponse(query: string, language: string = 'tr'): SimilarityMatch | null {
    // 🧠 1. Semantic intent analysis first
    const queryIntent = semanticSearchEngine.classifyQueryIntent(query);
    logger.log(`🧠 Query intent: ${queryIntent.primary} (confidence: ${queryIntent.confidence.toFixed(2)})`);

    // 🔍 2. Semantic similarity search
    const semanticMatches = semanticSearchEngine.findSemanticMatches(query, 3);
    if (semanticMatches.length > 0) {
      logger.log(`🎯 Found ${semanticMatches.length} semantic matches`);
      
      // Check if we have cached responses for semantic matches
      for (const semanticMatch of semanticMatches) {
        const cachedResponse = this.findCachedResponseForSemanticMatch(semanticMatch, language);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
    }

    // 🔄 3. Fallback to traditional embedding search (enhanced)
    const queryEmbedding = this.generateSimpleEmbedding(query);
    const category = this.categorizeQueryWithIntent(query, queryIntent);
    
    let bestMatch: SimilarityMatch | null = null;
    let highestSimilarity = 0;

    for (const [key, cached] of this.cache.entries()) {
      // Enhanced filtering with semantic intent
      if (cached.language !== language) continue;
      
      // Intent-aware category matching
      if (!this.isSemanticallySimilarCategory(cached.category, category, queryIntent)) continue;

      // TTL kontrolü
      if (Date.now() - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        continue;
      }

      // Multi-layer similarity calculation
      let similarity = this.calculateSimilarity(queryEmbedding, cached.queryEmbedding);
      
      // Boost similarity based on semantic intent match
      if (cached.semanticIntent && this.compareSemanticIntents(queryIntent, cached.semanticIntent)) {
        similarity *= 1.2; // 20% boost for intent match
      }

      // Boost based on quality score
      if (cached.qualityScore > 0.8) {
        similarity *= (1 + cached.qualityScore * 0.1); // Up to 10% boost for high quality
      }

      if (similarity > highestSimilarity && similarity >= this.SIMILARITY_THRESHOLD) {
        highestSimilarity = similarity;
        bestMatch = {
          query: cached.query,
          response: cached.response,
          similarity: Math.min(similarity, 1.0), // Cap at 1.0
          category: cached.category
        };

        // Hit count artır
        cached.hitCount++;
      }
    }

    if (bestMatch) {
      logger.log(`✅ Enhanced cache hit! Similarity: ${highestSimilarity.toFixed(3)} for query: ${query.substring(0, 50)}...`);
    }

    return bestMatch;
  }

  // Find cached response for semantic match
  private findCachedResponseForSemanticMatch(semanticMatch: SemanticMatch, language: string): SimilarityMatch | null {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.language !== language) continue;
      
      // Check if cached query matches semantic concepts
      const queryWords = cached.query.toLowerCase().split(/\s+/);
      const semanticWords = semanticMatch.text.toLowerCase().split(/\s+/);
      
      const commonWords = queryWords.filter(word => semanticWords.includes(word)).length;
      const semanticSimilarity = commonWords / Math.max(queryWords.length, semanticWords.length);
      
      if (semanticSimilarity > 0.6) { // 60% word overlap
        cached.hitCount++;
        return {
          query: cached.query,
          response: cached.response,
          similarity: semanticMatch.similarity,
          category: cached.category
        };
      }
    }
    return null;
  }

  // Enhanced category classification with intent
  private categorizeQueryWithIntent(query: string, intent: QueryIntent): CachedResponse['category'] {
    // Use intent entities for better categorization
    if (intent.entities.destinations.length > 0) {
      return 'destination';
    }
    
    if (intent.primary === 'booking') {
      return 'booking';
    }
    
    if (intent.entities.budgetRange || intent.entities.travelStyle) {
      return 'package';
    }

    // Fallback to traditional method
    return this.categorizeQuery(query);
  }

  // Semantic category similarity check
  private isSemanticallySimilarCategory(
    cachedCategory: string, 
    queryCategory: string, 
    queryIntent: QueryIntent
  ): boolean {
    // Exact match
    if (cachedCategory === queryCategory) return true;
    
    // General category is always compatible
    if (cachedCategory === 'general' || queryCategory === 'general') return true;
    
    // Intent-based compatibility
    if (queryIntent.primary === 'discovery' && cachedCategory === 'destination') return true;
    if (queryIntent.primary === 'booking' && cachedCategory === 'package') return true;
    if (queryIntent.primary === 'comparison' && ['package', 'destination'].includes(cachedCategory)) return true;
    
    return false;
  }

  // Compare semantic intents
  private compareSemanticIntents(intent1: QueryIntent, intent2: QueryIntent): boolean {
    // Primary intent match
    if (intent1.primary === intent2.primary) return true;
    
    // Compatible intent pairs
    const compatibleIntents = [
      ['discovery', 'information'],
      ['comparison', 'discovery'],
      ['booking', 'information']
    ];
    
    return compatibleIntents.some(pair => 
      (pair.includes(intent1.primary) && pair.includes(intent2.primary))
    );
  }

  // Cache key oluştur
  private generateCacheKey(query: string, language: string, category: string): string {
    // Query'yi normalize et
    const normalizedQuery = query.toLowerCase()
      .replace(/[^\w\sçğıöşüÇĞIÖŞÜ]/g, '')
      .trim();
    
    return `${language}_${category}_${normalizedQuery}`;
  }

  // Eski kayıtları sil
  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    // TTL'i geçenleri sil
    const expiredKeys = entries
      .filter(([_, cached]) => now - cached.timestamp > this.CACHE_TTL)
      .map(([key, _]) => key);

    expiredKeys.forEach(key => this.cache.delete(key));

    // Hala boyut limiti aşılıyorsa, en az kullanılanları sil
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedByUsage = entries
        .sort((a, b) => a[1].hitCount - b[1].hitCount)
        .slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.3)); // %30'unu sil

      sortedByUsage.forEach(([key, _]) => this.cache.delete(key));
    }

    logger.log(`Cache eviction completed. Current size: ${this.cache.size}`);
  }

  // Popüler cache'leri önce yükle
  preloadPopularResponses(): void {
    const popularQueries = [
      {
        query: 'En iyi balayı destinasyonları neler?',
        response: 'En popüler balayı destinasyonları arasında Santorini, Bali, Maldivler ve Paris bulunmaktadır. ✨ Her biri farklı romantik deneyimler sunar.\n\n**SHOW_PACKAGES:romantic**\n\nHangi tarz bir balayı hayal ediyorsunuz? 💕',
        language: 'tr',
        category: 'destination' as const
      },
      {
        query: 'Bali balayı paketleri',
        response: 'Bali, tropikal cennet atmosferi ile mükemmel balayı destinasyonu! 🌺 Lüks villalar, spa deneyimleri ve gün batımı yemekleri sizi bekliyor.\n\n**SHOW_PACKAGES:Bali**\n\nKaç günlük bir Bali tatili planlıyorsunuz? 💕',
        language: 'tr',
        category: 'package' as const
      },
      {
        query: 'romantik destinasyon önerileri',
        response: 'Romantik balayı için özel destinasyonlar! ✨ Paris\'in şıklığı, Santorini\'nin büyüsü, Kapadokya\'nın eşsizliği sizi bekliyor.\n\n**SHOW_PACKAGES:romantic**\n\nBütçeniz ve hayal ettiğiniz atmosfer nasıl? 💕',
        language: 'tr',
        category: 'destination' as const
      }
    ];

    popularQueries.forEach(({ query, response, language, category }) => {
      this.addToCache(query, response, language);
    });

    logger.log('Popular responses preloaded to cache');
  }

  // Cache istatistikleri
  getCacheStats(): { size: number; hitRate: number; categories: Record<string, number> } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, cached) => sum + cached.hitCount, 0);
    const totalQueries = entries.length;
    
    const categories: Record<string, number> = {};
    entries.forEach(cached => {
      categories[cached.category] = (categories[cached.category] || 0) + 1;
    });

    return {
      size: this.cache.size,
      hitRate: totalQueries > 0 ? totalHits / totalQueries : 0,
      categories
    };
  }

  // Cache'i temizle
  clearCache(): void {
    this.cache.clear();
    logger.log('Response cache cleared');
  }
}

export const responseCache = new ResponseCache();

// Başlangıçta popüler yanıtları yükle
responseCache.preloadPopularResponses();