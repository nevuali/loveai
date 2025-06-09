/**
 * Advanced Rate Limiter - AAA Grade Security
 * High-performance, multi-tier rate limiting with intelligent threat detection
 */

interface RateLimitRule {
  name: string;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (key: string, hitInfo: any) => void;
}

interface RequestInfo {
  timestamp: number;
  ip: string;
  userId?: string;
  endpoint: string;
  success: boolean;
  userAgent: string;
  fingerprint: string;
}

interface RateLimitResult {
  allowed: boolean;
  resetTime: number;
  remaining: number;
  total: number;
  retryAfter?: number;
  reason?: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class AdvancedRateLimiter {
  private store = new Map<string, RequestInfo[]>();
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Map<string, number>();
  private userPatterns = new Map<string, any>();
  
  // Multi-tier rate limiting rules
  private rules: RateLimitRule[] = [
    // Tier 1: Aggressive bot protection
    {
      name: 'aggressive_requests',
      windowMs: 1000, // 1 second
      maxRequests: 5,
      onLimitReached: (key) => this.flagSuspiciousActivity(key, 'aggressive_requests')
    },
    
    // Tier 2: Standard API protection  
    {
      name: 'api_requests',
      windowMs: 60000, // 1 minute
      maxRequests: 30,
      skipSuccessfulRequests: false
    },
    
    // Tier 3: Per-user protection
    {
      name: 'user_requests',
      windowMs: 300000, // 5 minutes
      maxRequests: 100,
      keyGenerator: (req) => `user:${req.userId || req.ip}`
    },
    
    // Tier 4: Authentication attempts
    {
      name: 'auth_attempts',
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => `auth:${req.ip}`,
      onLimitReached: (key) => this.flagSuspiciousActivity(key, 'brute_force_attempt')
    },
    
    // Tier 5: AI model usage (expensive operations)
    {
      name: 'ai_requests',
      windowMs: 3600000, // 1 hour
      maxRequests: 200,
      keyGenerator: (req) => `ai:${req.userId || req.ip}`
    }
  ];

  checkRateLimit(request: {
    ip: string;
    userId?: string;
    endpoint: string;
    userAgent: string;
    fingerprint: string;
    type?: 'api' | 'auth' | 'ai' | 'general';
  }): RateLimitResult {
    const now = Date.now();
    
    // Check if IP is blocked
    if (this.isIPBlocked(request.ip)) {
      return {
        allowed: false,
        resetTime: this.blockedIPs.get(request.ip) || now + 3600000,
        remaining: 0,
        total: 0,
        retryAfter: Math.ceil((this.blockedIPs.get(request.ip)! - now) / 1000),
        reason: 'IP blocked due to suspicious activity',
        threatLevel: 'critical'
      };
    }

    // Apply intelligent rule selection based on request type
    const applicableRules = this.selectApplicableRules(request);
    
    for (const rule of applicableRules) {
      const key = rule.keyGenerator ? rule.keyGenerator(request) : request.ip;
      const fullKey = `${rule.name}:${key}`;
      
      const result = this.checkSingleRule(rule, fullKey, request, now);
      
      if (!result.allowed) {
        // Enhanced threat detection
        this.analyzeThreatLevel(request, rule, result);
        return result;
      }
    }

    // Track successful request
    this.recordRequest(request, now, true);
    
    return {
      allowed: true,
      resetTime: now + Math.min(...applicableRules.map(r => r.windowMs)),
      remaining: Math.min(...applicableRules.map(r => this.getRemainingRequests(r, request))),
      total: Math.max(...applicableRules.map(r => r.maxRequests)),
      threatLevel: 'low'
    };
  }

  private selectApplicableRules(request: any): RateLimitRule[] {
    const rules = [...this.rules];
    
    // Add dynamic rules based on user behavior
    if (this.suspiciousIPs.has(request.ip)) {
      rules.unshift({
        name: 'suspicious_ip',
        windowMs: 60000,
        maxRequests: 10,
        onLimitReached: (key) => this.blockIP(request.ip, 'repeated_suspicious_activity')
      });
    }
    
    // Add stricter rules for specific endpoints
    if (request.endpoint.includes('/admin')) {
      rules.unshift({
        name: 'admin_access',
        windowMs: 300000,
        maxRequests: 20
      });
    }
    
    if (request.endpoint.includes('/api/gemini')) {
      rules.unshift({
        name: 'ai_intensive',
        windowMs: 60000,
        maxRequests: 5
      });
    }

    return rules;
  }

  private checkSingleRule(rule: RateLimitRule, key: string, request: any, now: number): RateLimitResult {
    const requests = this.store.get(key) || [];
    
    // Clean old requests
    const validRequests = requests.filter(req => now - req.timestamp < rule.windowMs);
    
    // Apply rule-specific filtering
    let countableRequests = validRequests;
    if (rule.skipSuccessfulRequests) {
      countableRequests = validRequests.filter(req => !req.success);
    }
    if (rule.skipFailedRequests) {
      countableRequests = validRequests.filter(req => req.success);
    }

    const remaining = Math.max(0, rule.maxRequests - countableRequests.length);
    
    if (countableRequests.length >= rule.maxRequests) {
      const oldestRequest = Math.min(...validRequests.map(r => r.timestamp));
      const resetTime = oldestRequest + rule.windowMs;
      
      // Trigger rule-specific action
      if (rule.onLimitReached) {
        rule.onLimitReached(key, {
          requests: countableRequests.length,
          limit: rule.maxRequests,
          window: rule.windowMs,
          ip: request.ip,
          userId: request.userId
        });
      }
      
      return {
        allowed: false,
        resetTime,
        remaining: 0,
        total: rule.maxRequests,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        reason: `Rate limit exceeded for ${rule.name}`,
        threatLevel: this.calculateThreatLevel(rule, countableRequests.length)
      };
    }

    // Update store
    this.store.set(key, validRequests);
    
    return {
      allowed: true,
      resetTime: now + rule.windowMs,
      remaining,
      total: rule.maxRequests,
      threatLevel: 'low'
    };
  }

  private calculateThreatLevel(rule: RateLimitRule, requestCount: number): 'low' | 'medium' | 'high' | 'critical' {
    const overageRatio = requestCount / rule.maxRequests;
    
    if (overageRatio > 3) return 'critical';
    if (overageRatio > 2) return 'high';
    if (overageRatio > 1.5) return 'medium';
    return 'low';
  }

  private analyzeThreatLevel(request: any, rule: RateLimitRule, result: RateLimitResult): void {
    // Advanced threat pattern detection
    const userPattern = this.userPatterns.get(request.ip) || {
      requestTimes: [],
      endpoints: new Set(),
      userAgents: new Set(),
      authFailures: 0
    };

    userPattern.requestTimes.push(Date.now());
    userPattern.endpoints.add(request.endpoint);
    userPattern.userAgents.add(request.userAgent);

    // Detect automation patterns
    if (this.detectAutomationPattern(userPattern)) {
      this.flagSuspiciousActivity(request.ip, 'automation_detected');
    }

    // Detect credential stuffing
    if (rule.name === 'auth_attempts' && result.threatLevel === 'high') {
      userPattern.authFailures++;
      if (userPattern.authFailures > 3) {
        this.blockIP(request.ip, 'credential_stuffing_attempt');
      }
    }

    this.userPatterns.set(request.ip, userPattern);
  }

  private detectAutomationPattern(pattern: any): boolean {
    // Check for too-regular timing patterns
    const times = pattern.requestTimes.slice(-10);
    if (times.length >= 5) {
      const intervals = times.slice(1).map((time: number, i: number) => time - times[i]);
      const avgInterval = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((acc: number, interval: number) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      // Very regular intervals suggest automation
      if (variance < 100 && avgInterval < 5000) {
        return true;
      }
    }

    // Check for suspicious user agent patterns
    if (pattern.userAgents.size === 1) {
      const userAgent = Array.from(pattern.userAgents)[0];
      if (this.isSuspiciousUserAgent(userAgent)) {
        return true;
      }
    }

    return false;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /postman/i, /insomnia/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private flagSuspiciousActivity(key: string, reason: string): void {
    const ip = key.split(':').pop() || key;
    this.suspiciousIPs.add(ip);
    
    console.warn(`🚨 Suspicious activity detected: ${reason} from ${ip}`);
    
    // Auto-escalate to blocking after multiple flags
    setTimeout(() => {
      if (this.suspiciousIPs.has(ip)) {
        this.blockIP(ip, `auto_escalation_${reason}`);
      }
    }, 300000); // 5 minutes
  }

  private blockIP(ip: string, reason: string): void {
    const blockUntil = Date.now() + 3600000; // 1 hour
    this.blockedIPs.set(ip, blockUntil);
    this.suspiciousIPs.delete(ip);
    
    console.error(`🔒 IP blocked: ${ip} - Reason: ${reason}`);
    
    // Auto-unblock after timeout
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`🔓 IP unblocked: ${ip}`);
    }, 3600000);
  }

  private isIPBlocked(ip: string): boolean {
    const blockUntil = this.blockedIPs.get(ip);
    if (!blockUntil) return false;
    
    if (Date.now() > blockUntil) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  private getRemainingRequests(rule: RateLimitRule, request: any): number {
    const key = rule.keyGenerator ? rule.keyGenerator(request) : request.ip;
    const fullKey = `${rule.name}:${key}`;
    const requests = this.store.get(fullKey) || [];
    const validRequests = requests.filter(req => Date.now() - req.timestamp < rule.windowMs);
    
    return Math.max(0, rule.maxRequests - validRequests.length);
  }

  private recordRequest(request: any, timestamp: number, success: boolean): void {
    const requestInfo: RequestInfo = {
      timestamp,
      ip: request.ip,
      userId: request.userId,
      endpoint: request.endpoint,
      success,
      userAgent: request.userAgent,
      fingerprint: request.fingerprint
    };

    // Record for all applicable rules
    for (const rule of this.rules) {
      const key = rule.keyGenerator ? rule.keyGenerator(request) : request.ip;
      const fullKey = `${rule.name}:${key}`;
      const requests = this.store.get(fullKey) || [];
      requests.push(requestInfo);
      this.store.set(fullKey, requests);
    }
  }

  // Performance optimization: Clean old data
  cleanup(): void {
    const now = Date.now();
    const maxAge = Math.max(...this.rules.map(r => r.windowMs));
    
    for (const [key, requests] of this.store.entries()) {
      const validRequests = requests.filter(req => now - req.timestamp < maxAge);
      if (validRequests.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, validRequests);
      }
    }
    
    // Clean blocked IPs
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (now > blockUntil) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  // Analytics and monitoring
  getSecurityMetrics(): any {
    return {
      totalRequests: Array.from(this.store.values()).reduce((sum, requests) => sum + requests.length, 0),
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
      activeRules: this.rules.length,
      topEndpoints: this.getTopEndpoints(),
      threatDistribution: this.getThreatDistribution()
    };
  }

  private getTopEndpoints(): any[] {
    const endpointCounts = new Map<string, number>();
    
    for (const requests of this.store.values()) {
      for (const request of requests) {
        endpointCounts.set(request.endpoint, (endpointCounts.get(request.endpoint) || 0) + 1);
      }
    }
    
    return Array.from(endpointCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private getThreatDistribution(): any {
    return {
      suspicious: this.suspiciousIPs.size,
      blocked: this.blockedIPs.size,
      clean: this.userPatterns.size - this.suspiciousIPs.size
    };
  }
}

export const advancedRateLimiter = new AdvancedRateLimiter();

// Auto-cleanup every 5 minutes
setInterval(() => {
  advancedRateLimiter.cleanup();
}, 300000);