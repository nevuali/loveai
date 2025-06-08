// Advanced Rate Limiting System for AI LOVVE

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (userId?: string, ip?: string) => string;
}

interface RateLimitInfo {
  totalHits: number;
  totalHitsToday: number;
  resetTime: number;
  remaining: number;
  isBlocked: boolean;
  blockedUntil?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  dailyCount: number;
  dailyResetTime: number;
  blockedUntil?: number;
  violations: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests, please try again later.'
  };

  constructor() {
    this.setupDefaultLimits();
    this.setupCleanup();
  }

  /**
   * Setup default rate limits for different actions
   */
  private setupDefaultLimits() {
    // Chat messages - more restrictive
    this.configs.set('chat_message', {
      maxRequests: 30,
      windowMs: 10 * 60 * 1000, // 10 minutes
      message: 'Too many messages. Please wait before sending another message.',
      skipFailedRequests: true
    });

    // Image uploads - very restrictive
    this.configs.set('image_upload', {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many image uploads. Please wait before uploading another image.',
      skipFailedRequests: false
    });

    // Voice input - moderate
    this.configs.set('voice_input', {
      maxRequests: 20,
      windowMs: 10 * 60 * 1000, // 10 minutes
      message: 'Too many voice requests. Please wait before using voice input again.',
      skipFailedRequests: true
    });

    // Authentication attempts - strict
    this.configs.set('auth_attempt', {
      maxRequests: 5,
      windowMs: 30 * 60 * 1000, // 30 minutes
      message: 'Too many login attempts. Please wait 30 minutes before trying again.',
      skipFailedRequests: false
    });

    // Package requests - lenient
    this.configs.set('package_request', {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many package requests. Please wait before making more requests.',
      skipSuccessfulRequests: true
    });

    // General API calls
    this.configs.set('api_call', {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many API requests. Please wait before making more requests.'
    });
  }

  /**
   * Setup automatic cleanup of expired entries
   */
  private setupCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Clean up expired entries from store
   */
  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime && now > entry.dailyResetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Generate key for rate limiting
   */
  private generateKey(action: string, userId?: string, ip?: string): string {
    const config = this.configs.get(action);
    
    if (config?.keyGenerator) {
      return config.keyGenerator(userId, ip);
    }

    // Prefer user ID, fallback to IP
    const identifier = userId || ip || 'anonymous';
    return `${action}:${identifier}`;
  }

  /**
   * Check if request is allowed
   */
  public async checkLimit(
    action: string, 
    userId?: string, 
    ip?: string,
    weight: number = 1
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const config = this.configs.get(action) || this.defaultConfig;
    const key = this.generateKey(action, userId, ip);
    const now = Date.now();

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now,
        dailyCount: 0,
        dailyResetTime: this.getNextMidnight(),
        violations: 0
      };
      this.store.set(key, entry);
    }

    // Check if user is temporarily blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        info: {
          totalHits: entry.count,
          totalHitsToday: entry.dailyCount,
          resetTime: entry.resetTime,
          remaining: 0,
          isBlocked: true,
          blockedUntil: entry.blockedUntil
        }
      };
    }

    // Reset window if expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.firstRequest = now;
    }

    // Reset daily counter if needed
    if (now > entry.dailyResetTime) {
      entry.dailyCount = 0;
      entry.dailyResetTime = this.getNextMidnight();
    }

    // Check if request would exceed limit
    const wouldExceed = (entry.count + weight) > config.maxRequests;
    
    if (wouldExceed) {
      // Increment violation count
      entry.violations += 1;
      
      // Progressive blocking for repeat violators
      if (entry.violations > 3) {
        const blockDuration = Math.min(entry.violations * 10 * 60 * 1000, 2 * 60 * 60 * 1000); // Max 2 hours
        entry.blockedUntil = now + blockDuration;
        console.warn(`🚫 Rate limit violation: ${key} blocked for ${blockDuration / 60000} minutes`);
      }

      return {
        allowed: false,
        info: {
          totalHits: entry.count,
          totalHitsToday: entry.dailyCount,
          resetTime: entry.resetTime,
          remaining: Math.max(0, config.maxRequests - entry.count),
          isBlocked: false,
          blockedUntil: entry.blockedUntil
        }
      };
    }

    // Allow request and update counters
    entry.count += weight;
    entry.dailyCount += weight;

    return {
      allowed: true,
      info: {
        totalHits: entry.count,
        totalHitsToday: entry.dailyCount,
        resetTime: entry.resetTime,
        remaining: Math.max(0, config.maxRequests - entry.count),
        isBlocked: false
      }
    };
  }

  /**
   * Record successful request (for skip successful requests)
   */
  public recordSuccess(action: string, userId?: string, ip?: string) {
    const config = this.configs.get(action);
    if (config?.skipSuccessfulRequests) {
      const key = this.generateKey(action, userId, ip);
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count -= 1;
      }
    }
  }

  /**
   * Record failed request (for skip failed requests)
   */
  public recordFailure(action: string, userId?: string, ip?: string) {
    const config = this.configs.get(action);
    if (config?.skipFailedRequests) {
      const key = this.generateKey(action, userId, ip);
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count -= 1;
      }
    }
  }

  /**
   * Get rate limit info without checking/incrementing
   */
  public getInfo(action: string, userId?: string, ip?: string): RateLimitInfo {
    const config = this.configs.get(action) || this.defaultConfig;
    const key = this.generateKey(action, userId, ip);
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        totalHits: 0,
        totalHitsToday: 0,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests,
        isBlocked: false
      };
    }

    return {
      totalHits: entry.count,
      totalHitsToday: entry.dailyCount,
      resetTime: entry.resetTime,
      remaining: Math.max(0, config.maxRequests - entry.count),
      isBlocked: entry.blockedUntil ? now < entry.blockedUntil : false,
      blockedUntil: entry.blockedUntil
    };
  }

  /**
   * Reset rate limit for specific key
   */
  public reset(action: string, userId?: string, ip?: string) {
    const key = this.generateKey(action, userId, ip);
    this.store.delete(key);
    console.log(`🔄 Rate limit reset for: ${key}`);
  }

  /**
   * Add custom rate limit configuration
   */
  public setConfig(action: string, config: RateLimitConfig) {
    this.configs.set(action, { ...this.defaultConfig, ...config });
    console.log(`⚙️ Rate limit config set for: ${action}`);
  }

  /**
   * Get next midnight timestamp
   */
  private getNextMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Get current statistics
   */
  public getStats() {
    const stats = {
      totalKeys: this.store.size,
      activeBlocks: 0,
      totalViolations: 0,
      configs: this.configs.size
    };

    const now = Date.now();
    for (const entry of this.store.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        stats.activeBlocks++;
      }
      stats.totalViolations += entry.violations;
    }

    return stats;
  }

  /**
   * Whitelist/Premium user bypass
   */
  public isWhitelisted(userId?: string): boolean {
    // Add logic for premium users or whitelisted IPs
    // For now, return false for everyone
    return false;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Utility functions
export const checkRateLimit = (action: string, userId?: string, ip?: string, weight = 1) =>
  rateLimiter.checkLimit(action, userId, ip, weight);

export const recordSuccess = (action: string, userId?: string, ip?: string) =>
  rateLimiter.recordSuccess(action, userId, ip);

export const recordFailure = (action: string, userId?: string, ip?: string) =>
  rateLimiter.recordFailure(action, userId, ip);

export const getRateLimitInfo = (action: string, userId?: string, ip?: string) =>
  rateLimiter.getInfo(action, userId, ip);

export const resetRateLimit = (action: string, userId?: string, ip?: string) =>
  rateLimiter.reset(action, userId, ip);

// React hook for rate limiting
export const useRateLimit = (action: string, userId?: string) => {
  const checkLimit = async (weight = 1) => {
    return await rateLimiter.checkLimit(action, userId, undefined, weight);
  };

  const getInfo = () => {
    return rateLimiter.getInfo(action, userId);
  };

  return { checkLimit, getInfo, recordSuccess, recordFailure };
};

console.log('🛡️ Rate Limiter initialized');