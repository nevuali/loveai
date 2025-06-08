import { logger } from '../utils/logger';

// Vector embedding interface
interface VectorEmbedding {
  vector: number[];
  text: string;
  metadata: {
    category: 'destination' | 'package' | 'activity' | 'accommodation' | 'general';
    language: string;
    keywords: string[];
    intent: 'discovery' | 'comparison' | 'booking' | 'information';
    confidence: number;
  };
  timestamp: number;
}

interface SemanticMatch {
  text: string;
  similarity: number;
  category: string;
  intent: string;
  metadata: any;
}

interface QueryIntent {
  primary: 'discovery' | 'comparison' | 'booking' | 'information' | 'support';
  confidence: number;
  entities: {
    destinations: string[];
    budgetRange?: string;
    travelStyle?: string;
    groupSize?: number;
    timeframe?: string;
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'excited' | 'urgent';
}

class SemanticSearchEngine {
  private embeddings: Map<string, VectorEmbedding> = new Map();
  private intentClassifier: Map<string, QueryIntent> = new Map();
  private readonly VECTOR_DIMENSION = 128; // Optimize for performance
  private readonly SIMILARITY_THRESHOLD = 0.75; // Higher threshold for better matches

  constructor() {
    this.initializeSemanticKnowledge();
  }

  // Semantic knowledge base'i initialize et
  private initializeSemanticKnowledge(): void {
    const knowledgeBase = [
      // Destination knowledge
      {
        text: "Paris romantic honeymoon luxury Eiffel Tower Seine cruise",
        category: 'destination' as const,
        keywords: ['paris', 'romantic', 'luxury', 'eiffel', 'seine', 'france'],
        intent: 'discovery' as const,
        related_concepts: ['romance', 'city break', 'culture', 'luxury']
      },
      {
        text: "Bali tropical paradise villa spa massage sunset beach",
        category: 'destination' as const,
        keywords: ['bali', 'tropical', 'villa', 'spa', 'beach', 'indonesia'],
        intent: 'discovery' as const,
        related_concepts: ['tropical', 'relaxation', 'nature', 'wellness']
      },
      {
        text: "Santorini Greek islands blue dome sunset caldera wine",
        category: 'destination' as const,
        keywords: ['santorini', 'greece', 'islands', 'sunset', 'caldera', 'wine'],
        intent: 'discovery' as const,
        related_concepts: ['islands', 'mediterranean', 'scenic', 'wine']
      },
      {
        text: "Maldives overwater bungalow crystal clear water snorkeling",
        category: 'destination' as const,
        keywords: ['maldives', 'overwater', 'bungalow', 'crystal', 'snorkeling'],
        intent: 'discovery' as const,
        related_concepts: ['luxury', 'water sports', 'isolation', 'marine life']
      },
      {
        text: "Kapadokya hot air balloon cave hotel fairy chimneys",
        category: 'destination' as const,
        keywords: ['kapadokya', 'balloon', 'cave', 'hotel', 'fairy', 'turkey'],
        intent: 'discovery' as const,
        related_concepts: ['adventure', 'unique', 'history', 'landscape']
      },
      
      // Package types
      {
        text: "luxury honeymoon package five star resort spa treatment",
        category: 'package' as const,
        keywords: ['luxury', 'honeymoon', 'five', 'star', 'spa', 'treatment'],
        intent: 'comparison' as const,
        related_concepts: ['premium', 'exclusive', 'high-end', 'personalized']
      },
      {
        text: "budget romantic getaway affordable couple package deal",
        category: 'package' as const,
        keywords: ['budget', 'romantic', 'affordable', 'couple', 'deal'],
        intent: 'comparison' as const,
        related_concepts: ['value', 'economical', 'basic', 'essential']
      },
      {
        text: "adventure honeymoon hiking mountain climbing outdoor activities",
        category: 'package' as const,
        keywords: ['adventure', 'hiking', 'mountain', 'climbing', 'outdoor'],
        intent: 'discovery' as const,
        related_concepts: ['active', 'nature', 'sports', 'adrenaline']
      },
      
      // Activities
      {
        text: "romantic dinner candlelight private chef wine tasting",
        category: 'activity' as const,
        keywords: ['romantic', 'dinner', 'candlelight', 'chef', 'wine'],
        intent: 'information' as const,
        related_concepts: ['dining', 'intimacy', 'culinary', 'special']
      },
      {
        text: "couples massage spa relaxation wellness treatment therapy",
        category: 'activity' as const,
        keywords: ['couples', 'massage', 'spa', 'relaxation', 'wellness'],
        intent: 'information' as const,
        related_concepts: ['relaxation', 'bonding', 'health', 'luxury']
      },
      
      // Booking intents
      {
        text: "book now reservation available dates payment confirm",
        category: 'general' as const,
        keywords: ['book', 'reservation', 'available', 'payment', 'confirm'],
        intent: 'booking' as const,
        related_concepts: ['purchase', 'commitment', 'finalize', 'secure']
      },
      {
        text: "price cost budget how much expensive affordable cheap",
        category: 'general' as const,
        keywords: ['price', 'cost', 'budget', 'expensive', 'affordable'],
        intent: 'information' as const,
        related_concepts: ['financial', 'value', 'comparison', 'planning']
      }
    ];

    knowledgeBase.forEach((item, index) => {
      const embedding = this.generateAdvancedEmbedding(item.text, item.keywords, item.related_concepts);
      const vectorEmbedding: VectorEmbedding = {
        vector: embedding,
        text: item.text,
        metadata: {
          category: item.category,
          language: 'en', // Multi-language support eklenebilir
          keywords: item.keywords,
          intent: item.intent,
          confidence: 0.9
        },
        timestamp: Date.now()
      };
      
      this.embeddings.set(`knowledge_${index}`, vectorEmbedding);
    });

    logger.log(`🧠 Semantic knowledge base initialized with ${this.embeddings.size} embeddings`);
  }

  // Gelişmiş embedding generation (concept-aware)
  private generateAdvancedEmbedding(text: string, keywords: string[], relatedConcepts: string[]): number[] {
    const vector = new Array(this.VECTOR_DIMENSION).fill(0);
    
    // Temel kelime embedding
    const words = text.toLowerCase().split(/\s+/);
    const allTerms = [...words, ...keywords, ...relatedConcepts];
    
    // Domain-specific concept mapping
    const conceptMap = {
      // Romance concepts
      'romantic': [0, 10, 25, 45, 67, 89, 101],
      'luxury': [1, 15, 30, 50, 70, 90, 110],
      'honeymoon': [2, 18, 35, 55, 75, 95, 115],
      'couples': [3, 20, 40, 60, 80, 100, 120],
      
      // Destination concepts
      'beach': [4, 12, 28, 48, 68, 88, 108],
      'mountain': [5, 14, 32, 52, 72, 92, 112],
      'city': [6, 16, 36, 56, 76, 96, 116],
      'island': [7, 19, 39, 59, 79, 99, 119],
      
      // Activity concepts
      'adventure': [8, 22, 42, 62, 82, 102, 122],
      'relaxation': [9, 24, 44, 64, 84, 104, 124],
      'culture': [10, 26, 46, 66, 86, 106, 126],
      'wellness': [11, 27, 47, 67, 87, 107, 127],
      
      // Intent concepts
      'booking': [13, 33, 53, 73, 93, 113],
      'discovery': [17, 37, 57, 77, 97, 117],
      'comparison': [21, 41, 61, 81, 101, 121],
      'information': [23, 43, 63, 83, 103, 123]
    };

    // Fill vector based on concepts
    allTerms.forEach(term => {
      const cleanTerm = term.toLowerCase().replace(/[^\w]/g, '');
      
      // Direct concept mapping
      if (conceptMap[cleanTerm]) {
        conceptMap[cleanTerm].forEach(index => {
          if (index < this.VECTOR_DIMENSION) {
            vector[index] += 1;
          }
        });
      }
      
      // Fuzzy concept matching
      Object.entries(conceptMap).forEach(([concept, indices]) => {
        if (cleanTerm.includes(concept) || concept.includes(cleanTerm)) {
          indices.forEach(index => {
            if (index < this.VECTOR_DIMENSION) {
              vector[index] += 0.5;
            }
          });
        }
      });
      
      // Character-based hashing for unknown words
      for (let i = 0; i < cleanTerm.length; i++) {
        const charCode = cleanTerm.charCodeAt(i);
        const index = (charCode * (i + 1)) % this.VECTOR_DIMENSION;
        vector[index] += 0.1;
      }
    });

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  // Query intent classification
  classifyQueryIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Intent detection patterns
    const intentPatterns = {
      booking: {
        patterns: [/book/, /reserve/, /satın al/, /buy/, /payment/, /ödeme/, /confirm/, /available/],
        weight: 1.0
      },
      comparison: {
        patterns: [/compare/, /vs/, /better/, /difference/, /karşılaştır/, /fark/, /which/, /hangi/],
        weight: 0.9
      },
      discovery: {
        patterns: [/recommend/, /suggest/, /öner/, /best/, /top/, /where/, /nerede/, /what/, /ne/],
        weight: 0.8
      },
      information: {
        patterns: [/how/, /when/, /why/, /nasıl/, /ne zaman/, /neden/, /price/, /cost/, /fiyat/],
        weight: 0.7
      },
      support: {
        patterns: [/help/, /problem/, /issue/, /yardım/, /sorun/, /error/, /hata/],
        weight: 0.6
      }
    };

    // Calculate intent scores
    const intentScores: Record<string, number> = {};
    Object.entries(intentPatterns).forEach(([intent, config]) => {
      const score = config.patterns.reduce((sum, pattern) => {
        return sum + (pattern.test(lowerQuery) ? config.weight : 0);
      }, 0);
      intentScores[intent] = score;
    });

    // Get primary intent
    const primaryIntent = Object.entries(intentScores).reduce((a, b) => 
      intentScores[a[0]] > intentScores[b[0]] ? a : b
    )[0] as QueryIntent['primary'];

    // Entity extraction
    const entities = this.extractEntities(query);

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(query);

    return {
      primary: primaryIntent,
      confidence: Math.max(...Object.values(intentScores)) / Math.max(1, Object.keys(intentScores).length),
      entities,
      sentiment
    };
  }

  // Entity extraction
  private extractEntities(query: string): QueryIntent['entities'] {
    const entities: QueryIntent['entities'] = {
      destinations: []
    };

    // Destination extraction
    const destinations = [
      'paris', 'bali', 'santorini', 'maldives', 'maldivler', 'kapadokya',
      'antalya', 'istanbul', 'rome', 'london', 'tokyo', 'new york',
      'barcelona', 'amsterdam', 'venice', 'venedik', 'phuket', 'sri lanka'
    ];

    const lowerQuery = query.toLowerCase();
    destinations.forEach(dest => {
      if (lowerQuery.includes(dest)) {
        entities.destinations.push(dest);
      }
    });

    // Budget extraction
    const budgetMatch = query.match(/(\d+[k]?)\s*(euro|dolar|tl|lira|\$|€|₺)/i);
    if (budgetMatch) {
      entities.budgetRange = budgetMatch[0];
    }

    // Group size extraction
    const groupMatch = query.match(/(ikimiz|çift|2\s*kişi|iki kişi|tek|alone|solo)/i);
    if (groupMatch) {
      entities.groupSize = groupMatch[0].includes('tek') || groupMatch[0].includes('solo') ? 1 : 2;
    }

    // Travel style extraction
    const styleKeywords = ['luxury', 'lüks', 'budget', 'bütçe', 'adventure', 'macera', 'romantic', 'romantik'];
    const foundStyle = styleKeywords.find(style => lowerQuery.includes(style));
    if (foundStyle) {
      entities.travelStyle = foundStyle;
    }

    return entities;
  }

  // Sentiment analysis
  private analyzeSentiment(query: string): QueryIntent['sentiment'] {
    const lowerQuery = query.toLowerCase();
    
    const sentimentPatterns = {
      excited: [/amazing/, /fantastic/, /perfect/, /love/, /excited/, /harika/, /mükemmel/, /seviyorum/],
      positive: [/good/, /great/, /nice/, /beautiful/, /iyi/, /güzel/, /harika/],
      urgent: [/urgent/, /asap/, /quickly/, /soon/, /acil/, /hızlı/, /çabuk/],
      negative: [/problem/, /bad/, /terrible/, /disappointed/, /sorun/, /kötü/, /berbat/]
    };

    for (const [sentiment, patterns] of Object.entries(sentimentPatterns)) {
      if (patterns.some(pattern => pattern.test(lowerQuery))) {
        return sentiment as QueryIntent['sentiment'];
      }
    }

    return 'neutral';
  }

  // Semantic similarity search
  findSemanticMatches(query: string, limit: number = 5): SemanticMatch[] {
    const queryEmbedding = this.generateQueryEmbedding(query);
    const matches: Array<{ key: string; similarity: number; embedding: VectorEmbedding }> = [];

    // Calculate similarities
    for (const [key, embedding] of this.embeddings.entries()) {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding.vector);
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        matches.push({ key, similarity, embedding });
      }
    }

    // Sort by similarity and return top matches
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(match => ({
        text: match.embedding.text,
        similarity: match.similarity,
        category: match.embedding.metadata.category,
        intent: match.embedding.metadata.intent,
        metadata: match.embedding.metadata
      }));
  }

  // Generate query embedding
  private generateQueryEmbedding(query: string): number[] {
    const intent = this.classifyQueryIntent(query);
    const keywords = this.extractKeywords(query);
    const relatedConcepts = this.inferRelatedConcepts(query, intent);
    
    return this.generateAdvancedEmbedding(query, keywords, relatedConcepts);
  }

  // Extract keywords from query
  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
                      'için', 'ile', 've', 'veya', 'ama', 'bu', 'şu', 'o', 'bir', 'de', 'da', 'den', 'dan'];
    
    return query.toLowerCase()
      .replace(/[^\w\sçğıöşüÇĞIÖŞÜ]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit keywords
  }

  // Infer related concepts based on query and intent
  private inferRelatedConcepts(query: string, intent: QueryIntent): string[] {
    const concepts: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Add intent-based concepts
    switch (intent.primary) {
      case 'discovery':
        concepts.push('explore', 'find', 'search');
        break;
      case 'booking':
        concepts.push('purchase', 'reserve', 'confirm');
        break;
      case 'comparison':
        concepts.push('evaluate', 'compare', 'choose');
        break;
      case 'information':
        concepts.push('learn', 'understand', 'know');
        break;
    }

    // Add entity-based concepts
    if (intent.entities.destinations.length > 0) {
      concepts.push('destination', 'travel', 'location');
    }

    if (intent.entities.travelStyle) {
      concepts.push(intent.entities.travelStyle, 'style', 'preference');
    }

    // Add sentiment-based concepts
    if (intent.sentiment === 'excited') {
      concepts.push('enthusiasm', 'passion', 'eagerness');
    }

    return concepts;
  }

  // Cosine similarity calculation
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  // Add new embedding to knowledge base
  addEmbedding(text: string, category: VectorEmbedding['metadata']['category'], keywords: string[]): void {
    const relatedConcepts = this.inferRelatedConcepts(text, this.classifyQueryIntent(text));
    const embedding = this.generateAdvancedEmbedding(text, keywords, relatedConcepts);
    
    const vectorEmbedding: VectorEmbedding = {
      vector: embedding,
      text,
      metadata: {
        category,
        language: 'en', // Auto-detect language eklenebilir
        keywords,
        intent: 'information',
        confidence: 0.8
      },
      timestamp: Date.now()
    };

    const key = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.embeddings.set(key, vectorEmbedding);
    
    logger.log(`📝 New embedding added: ${text.substring(0, 50)}...`);
  }

  // Get semantic search stats
  getStats(): {
    totalEmbeddings: number;
    categories: Record<string, number>;
    avgSimilarityThreshold: number;
    lastUpdated: number;
  } {
    const categories: Record<string, number> = {};
    let lastUpdated = 0;

    for (const embedding of this.embeddings.values()) {
      const category = embedding.metadata.category;
      categories[category] = (categories[category] || 0) + 1;
      lastUpdated = Math.max(lastUpdated, embedding.timestamp);
    }

    return {
      totalEmbeddings: this.embeddings.size,
      categories,
      avgSimilarityThreshold: this.SIMILARITY_THRESHOLD,
      lastUpdated
    };
  }
}

export const semanticSearchEngine = new SemanticSearchEngine();
export type { QueryIntent, SemanticMatch };