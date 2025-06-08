import { logger } from '../utils/logger';

interface CacheEntry {
  query: string;
  response: string;
  timestamp: number;
  usage: number;
  userProfile?: string;
  contextTags: string[];
  similarity?: number;
  language: string;
  responseTime: number;
  userFeedback?: 'positive' | 'negative';
}

interface UserBehavior {
  userId: string;
  queryPatterns: string[];
  preferredResponseLength: 'short' | 'medium' | 'long';
  responseTimePreference: number; // ms
  frequentTopics: string[];
  satisfactionRate: number;
  lastActivity: number;
}

interface SmartCacheMetrics {
  hitRate: number;
  avgResponseTime: number;
  userSatisfaction: number;
  cacheSizeOptimal: boolean;
  topQueries: Array<{ query: string; count: number }>;
}

class IntelligentCacheSystem {
  private cache = new Map<string, CacheEntry>();
  private userBehaviors = new Map<string, UserBehavior>();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SIMILARITY_THRESHOLD = 0.75;
  private metrics: SmartCacheMetrics = {
    hitRate: 0,
    avgResponseTime: 0,
    userSatisfaction: 0,
    cacheSizeOptimal: true,
    topQueries: []
  };

  // Akıllı önbellek araması
  findSmartCache(query: string, userId?: string, language: string = 'tr'): CacheEntry | null {
    const startTime = Date.now();
    
    // 1. Exact match - en hızlı
    const exactKey = this.generateCacheKey(query, language, userId);
    const exactMatch = this.cache.get(exactKey);
    if (exactMatch && this.isValidCache(exactMatch)) {
      this.updateCacheUsage(exactKey);
      logger.log(`⚡ Exact cache hit in ${Date.now() - startTime}ms`);
      return exactMatch;
    }

    // 2. User-specific similarity search
    if (userId) {
      const userCache = this.findUserSimilarCache(query, userId, language);
      if (userCache) {
        logger.log(`👤 User-specific cache hit in ${Date.now() - startTime}ms`);
        return userCache;
      }
    }

    // 3. Semantic similarity search
    const similarCache = this.findSimilarCache(query, language);
    if (similarCache) {
      logger.log(`🔍 Semantic cache hit in ${Date.now() - startTime}ms`);
      return similarCache;
    }

    logger.log(`❌ Cache miss in ${Date.now() - startTime}ms`);
    return null;
  }

  // Kullanıcıya özel benzer cache arama
  private findUserSimilarCache(query: string, userId: string, language: string): CacheEntry | null {
    const userBehavior = this.userBehaviors.get(userId);
    if (!userBehavior) return null;

    const userQueries = Array.from(this.cache.values())
      .filter(entry => 
        entry.userProfile === userId &&
        entry.language === language &&
        this.isValidCache(entry)
      )
      .sort((a, b) => b.usage - a.usage); // En çok kullanılanlar önce

    for (const entry of userQueries.slice(0, 10)) { // En popüler 10'u kontrol et
      const similarity = this.calculateSimilarity(query, entry.query);
      if (similarity > this.SIMILARITY_THRESHOLD) {
        entry.similarity = similarity;
        return entry;
      }
    }

    return null;
  }

  // Genel benzerlik arama
  private findSimilarCache(query: string, language: string): CacheEntry | null {
    const candidates = Array.from(this.cache.values())
      .filter(entry => 
        entry.language === language &&
        this.isValidCache(entry) &&
        entry.usage > 1 // En az 2 kez kullanılmış
      )
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 50); // Top 50 popular

    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of candidates) {
      const similarity = this.calculateSimilarity(query, entry.query);
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      bestMatch.similarity = bestSimilarity;
    }

    return bestMatch;
  }

  // Cache'e akıllı ekleme
  addSmartCache(
    query: string, 
    response: string, 
    userId?: string, 
    language: string = 'tr',
    responseTime: number = 0,
    contextTags: string[] = []
  ): void {
    const cacheKey = this.generateCacheKey(query, language, userId);
    
    // Kullanıcı davranışını güncelle
    if (userId) {
      this.updateUserBehavior(userId, query, response, responseTime);
    }

    const entry: CacheEntry = {
      query,
      response,
      timestamp: Date.now(),
      usage: 1,
      userProfile: userId,
      contextTags: this.extractContextTags(query, response, contextTags),
      language,
      responseTime
    };

    this.cache.set(cacheKey, entry);

    // Cache boyutu kontrolü
    this.manageCacheSize();

    logger.log(`💾 Smart cache added: ${query.substring(0, 50)}...`);
  }

  // Kullanıcı davranışını güncelle
  private updateUserBehavior(userId: string, query: string, response: string, responseTime: number): void {
    let behavior = this.userBehaviors.get(userId);
    
    if (!behavior) {
      behavior = {
        userId,
        queryPatterns: [],
        preferredResponseLength: 'medium',
        responseTimePreference: 2000,
        frequentTopics: [],
        satisfactionRate: 0.8,
        lastActivity: Date.now()
      };
    }

    // Query pattern güncelle
    const queryKeywords = this.extractKeywords(query);
    behavior.queryPatterns = this.updateFrequencyList(behavior.queryPatterns, queryKeywords[0] || query);

    // Response length tercihi
    const responseLength = response.length;
    if (responseLength < 150) behavior.preferredResponseLength = 'short';
    else if (responseLength > 300) behavior.preferredResponseLength = 'long';
    else behavior.preferredResponseLength = 'medium';

    // Response time tercihi (kullanıcı hızlı yanıt seviyor mu?)
    behavior.responseTimePreference = (behavior.responseTimePreference + responseTime) / 2;

    // Frequent topics
    const topics = this.extractTopics(query, response);
    topics.forEach(topic => {
      behavior.frequentTopics = this.updateFrequencyList(behavior.frequentTopics, topic);
    });

    behavior.lastActivity = Date.now();
    this.userBehaviors.set(userId, behavior);
  }

  // Context tags çıkar
  private extractContextTags(query: string, response: string, additionalTags: string[] = []): string[] {
    const tags = [...additionalTags];
    
    // Query'den tags
    const queryLower = query.toLowerCase();
    if (queryLower.includes('paket') || queryLower.includes('package')) tags.push('package-request');
    if (queryLower.includes('fiyat') || queryLower.includes('price')) tags.push('price-inquiry');
    if (queryLower.includes('rezervasyon') || queryLower.includes('booking')) tags.push('booking');
    if (queryLower.includes('balayı') || queryLower.includes('honeymoon')) tags.push('honeymoon');
    
    // Response'dan tags
    if (response.includes('SHOW_PACKAGES')) tags.push('package-shown');
    if (response.includes('€') || response.includes('$') || response.includes('₺')) tags.push('price-mentioned');
    
    // Destination tags
    const destinations = ['paris', 'bali', 'santorini', 'antalya', 'kapadokya', 'maldives'];
    destinations.forEach(dest => {
      if (queryLower.includes(dest) || response.toLowerCase().includes(dest)) {
        tags.push(`destination-${dest}`);
      }
    });

    return [...new Set(tags)];
  }

  // Akıllı benzerlik hesaplama
  private calculateSimilarity(query1: string, query2: string): number {
    const words1 = this.extractKeywords(query1);
    const words2 = this.extractKeywords(query2);
    
    if (words1.length === 0 || words2.length === 0) return 0;

    // Jaccard similarity
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    const jaccardSimilarity = intersection.length / union.length;

    // Levenshtein distance için basit yaklaşım
    const levenshteinSimilarity = 1 - (this.levenshteinDistance(query1, query2) / Math.max(query1.length, query2.length));

    // Ağırlıklı kombinasyon
    return (jaccardSimilarity * 0.7) + (levenshteinSimilarity * 0.3);
  }

  // Basit Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Kullanıcı geri bildirimi ile cache kalitesini güncelle
  updateCacheQuality(query: string, userId: string | undefined, language: string, feedback: 'positive' | 'negative'): void {
    const cacheKey = this.generateCacheKey(query, language, userId);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      entry.userFeedback = feedback;
      
      // Negatif feedback alırsa usage azalt
      if (feedback === 'negative') {
        entry.usage = Math.max(1, entry.usage - 1);
      } else {
        entry.usage += 1;
      }
      
      this.cache.set(cacheKey, entry);
      logger.log(`📊 Cache quality updated: ${feedback} for ${query.substring(0, 30)}...`);
    }
  }

  // Proaktif cache temizliği
  private manageCacheSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // Skorlama sistemi: usage + freshness + feedback
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      const ageScore = Math.max(0, 1 - (age / this.CACHE_TTL));
      const usageScore = Math.min(1, entry.usage / 10);
      const feedbackScore = entry.userFeedback === 'positive' ? 0.2 : 
                           entry.userFeedback === 'negative' ? -0.2 : 0;
      
      const totalScore = (usageScore * 0.5) + (ageScore * 0.3) + feedbackScore;
      
      return { key, entry, score: totalScore };
    });

    // En düşük skorlu %20'sini sil
    entries.sort((a, b) => a.score - b.score);
    const toRemove = Math.floor(this.cache.size * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].key);
    }

    logger.log(`🧹 Cache cleaned: removed ${toRemove} entries, size: ${this.cache.size}`);
  }

  // Cache geçerlilik kontrolü
  private isValidCache(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.CACHE_TTL;
  }

  // Cache anahtarı oluştur
  private generateCacheKey(query: string, language: string, userId?: string): string {
    const baseKey = `${language}:${query.toLowerCase().trim()}`;
    return userId ? `${userId}:${baseKey}` : baseKey;
  }

  // Cache kullanımını güncelle
  private updateCacheUsage(cacheKey: string): void {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.usage++;
      this.cache.set(cacheKey, entry);
    }
  }

  // Helper functions
  private extractKeywords(text: string): string[] {
    const stopWords = ['için', 'ile', 'bir', 've', 'bu', 'şu', 'the', 'and', 'for', 'with'];
    return text.toLowerCase()
      .replace(/[^\wçğıöşüÇĞIÖŞÜ\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private extractTopics(query: string, response: string): string[] {
    const topics = [];
    const combined = `${query} ${response}`.toLowerCase();
    
    const topicKeywords = {
      'luxury': ['luxury', 'lüks', 'premium', 'exclusive'],
      'romantic': ['romantic', 'romantik', 'love', 'aşk'],
      'beach': ['beach', 'plaj', 'sea', 'deniz'],
      'culture': ['culture', 'kültür', 'history', 'tarih'],
      'adventure': ['adventure', 'macera', 'hiking', 'activity']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => combined.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private updateFrequencyList<T>(list: T[], item: T, maxLength: number = 10): T[] {
    const newList = [...list];
    const index = newList.indexOf(item);
    
    if (index > -1) {
      newList.splice(index, 1);
    }
    
    newList.unshift(item);
    return newList.slice(0, maxLength);
  }

  // Analytics ve metrikleri güncelle
  updateMetrics(): void {
    const totalEntries = this.cache.size;
    if (totalEntries === 0) return;

    const entries = Array.from(this.cache.values());
    
    // Hit rate hesapla (usage > 1 olanlar)
    const hitEntries = entries.filter(e => e.usage > 1);
    this.metrics.hitRate = hitEntries.length / totalEntries;

    // Ortalama response time
    this.metrics.avgResponseTime = entries.reduce((sum, e) => sum + e.responseTime, 0) / totalEntries;

    // User satisfaction
    const feedbackEntries = entries.filter(e => e.userFeedback);
    const positiveCount = feedbackEntries.filter(e => e.userFeedback === 'positive').length;
    this.metrics.userSatisfaction = feedbackEntries.length > 0 ? positiveCount / feedbackEntries.length : 0.8;

    // Cache size optimal mi?
    this.metrics.cacheSizeOptimal = this.cache.size < this.MAX_CACHE_SIZE * 0.9;

    // Top queries
    const queryCount = new Map<string, number>();
    entries.forEach(entry => {
      const count = queryCount.get(entry.query) || 0;
      queryCount.set(entry.query, count + entry.usage);
    });

    this.metrics.topQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query: query.substring(0, 50), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Public getters
  getMetrics(): SmartCacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getUserBehavior(userId: string): UserBehavior | null {
    return this.userBehaviors.get(userId) || null;
  }

  getCacheStats(): {
    size: number;
    hitRate: number;
    avgResponseTime: number;
    userSatisfaction: number;
  } {
    this.updateMetrics();
    return {
      size: this.cache.size,
      hitRate: this.metrics.hitRate,
      avgResponseTime: this.metrics.avgResponseTime,
      userSatisfaction: this.metrics.userSatisfaction
    };
  }

  // Cache temizleme
  clearCache(): void {
    this.cache.clear();
    logger.log('🧹 Cache completely cleared');
  }

  // Cache export (backup için)
  exportCache(): any {
    return {
      cache: Array.from(this.cache.entries()),
      userBehaviors: Array.from(this.userBehaviors.entries()),
      metrics: this.metrics
    };
  }
}

export const intelligentCacheSystem = new IntelligentCacheSystem();