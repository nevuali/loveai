/**
 * Advanced JWT Security Manager - AAA Grade
 * Comprehensive token security with automatic refresh, rotation, and threat detection
 */

interface JWTConfig {
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  algorithm: 'HS256' | 'RS256';
  issuer: string;
  audience: string;
  enableRotation: boolean;
  maxRefreshAttempts: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenId: string;
}

interface TokenPayload {
  sub: string; // user ID
  iat: number; // issued at
  exp: number; // expires at
  jti: string; // JWT ID
  aud: string; // audience
  iss: string; // issuer
  scope: string[];
  sessionId: string;
  fingerprint: string;
  deviceId: string;
  lastActivity: number;
}

interface RefreshAttempt {
  timestamp: number;
  ip: string;
  userAgent: string;
  success: boolean;
  tokenId: string;
}

export class JWTSecurityManager {
  private config: JWTConfig;
  private revokedTokens = new Set<string>();
  private refreshAttempts = new Map<string, RefreshAttempt[]>();
  private activeTokens = new Map<string, TokenPayload>();
  private suspiciousActivities = new Map<string, any>();

  constructor(config: Partial<JWTConfig> = {}) {
    this.config = {
      accessTokenExpiry: 15 * 60 * 1000, // 15 minutes
      refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      algorithm: 'HS256',
      issuer: 'ai-lovve-app',
      audience: 'ai-lovve-users',
      enableRotation: true,
      maxRefreshAttempts: 5,
      ...config
    };
  }

  // Generate secure token pair
  async generateTokenPair(payload: {
    userId: string;
    sessionId: string;
    fingerprint: string;
    deviceId: string;
    scope?: string[];
  }): Promise<TokenPair> {
    const now = Date.now();
    const tokenId = this.generateSecureId();
    
    const tokenPayload: TokenPayload = {
      sub: payload.userId,
      iat: now,
      exp: now + this.config.accessTokenExpiry,
      jti: tokenId,
      aud: this.config.audience,
      iss: this.config.issuer,
      scope: payload.scope || ['read', 'write'],
      sessionId: payload.sessionId,
      fingerprint: payload.fingerprint,
      deviceId: payload.deviceId,
      lastActivity: now
    };

    const accessToken = await this.createToken(tokenPayload);
    
    // Create refresh token with longer expiry
    const refreshPayload = {
      ...tokenPayload,
      exp: now + this.config.refreshTokenExpiry,
      jti: this.generateSecureId(),
      scope: ['refresh']
    };
    
    const refreshToken = await this.createToken(refreshPayload);
    
    // Store active token for tracking
    this.activeTokens.set(tokenId, tokenPayload);
    
    return {
      accessToken,
      refreshToken,
      expiresAt: tokenPayload.exp,
      tokenId
    };
  }

  // Verify and decode token with security checks
  async verifyToken(token: string, expectedScope?: string[]): Promise<TokenPayload | null> {
    try {
      const payload = await this.decodeToken(token);
      
      if (!payload) return null;
      
      // Check if token is revoked
      if (this.revokedTokens.has(payload.jti)) {
        console.warn(`🚫 Revoked token used: ${payload.jti}`);
        return null;
      }
      
      // Check expiration
      if (Date.now() > payload.exp) {
        console.warn(`⏰ Expired token used: ${payload.jti}`);
        return null;
      }
      
      // Check audience and issuer
      if (payload.aud !== this.config.audience || payload.iss !== this.config.issuer) {
        console.warn(`🎯 Invalid token audience/issuer: ${payload.jti}`);
        return null;
      }
      
      // Check scope if required
      if (expectedScope && !this.hasRequiredScope(payload.scope, expectedScope)) {
        console.warn(`🔐 Insufficient scope: ${payload.jti}`);
        return null;
      }
      
      // Update last activity
      payload.lastActivity = Date.now();
      this.activeTokens.set(payload.jti, payload);
      
      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Refresh token with security checks and rotation
  async refreshToken(refreshToken: string, request: {
    ip: string;
    userAgent: string;
    fingerprint: string;
    deviceId: string;
  }): Promise<TokenPair | null> {
    try {
      const payload = await this.verifyToken(refreshToken, ['refresh']);
      
      if (!payload) return null;
      
      // Security checks for refresh attempt
      const securityCheck = this.performRefreshSecurityChecks(payload, request);
      
      if (!securityCheck.allowed) {
        this.recordSuspiciousActivity(payload.sub, securityCheck.reason, request);
        return null;
      }
      
      // Record refresh attempt
      this.recordRefreshAttempt(payload.sub, request, true, payload.jti);
      
      // Revoke old tokens if rotation is enabled
      if (this.config.enableRotation) {
        this.revokeToken(payload.jti);
        // Also revoke any other active tokens for this session for security
        this.revokeSessionTokens(payload.sessionId);
      }
      
      // Generate new token pair
      const newTokenPair = await this.generateTokenPair({
        userId: payload.sub,
        sessionId: payload.sessionId,
        fingerprint: request.fingerprint,
        deviceId: request.deviceId,
        scope: payload.scope.filter(s => s !== 'refresh') // Remove refresh scope for access token
      });
      
      return newTokenPair;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.recordRefreshAttempt('unknown', request, false, 'unknown');
      return null;
    }
  }

  private performRefreshSecurityChecks(payload: TokenPayload, request: any): { allowed: boolean; reason?: string } {
    // Check device fingerprint consistency
    if (payload.fingerprint !== request.fingerprint) {
      return { allowed: false, reason: 'device_fingerprint_mismatch' };
    }
    
    // Check device ID consistency
    if (payload.deviceId !== request.deviceId) {
      return { allowed: false, reason: 'device_id_mismatch' };
    }
    
    // Check for too many refresh attempts
    const attempts = this.refreshAttempts.get(payload.sub) || [];
    const recentAttempts = attempts.filter(a => Date.now() - a.timestamp < 3600000); // Last hour
    
    if (recentAttempts.length > this.config.maxRefreshAttempts) {
      return { allowed: false, reason: 'too_many_refresh_attempts' };
    }
    
    // Check for suspicious timing patterns
    if (recentAttempts.length > 2) {
      const intervals = recentAttempts.slice(1).map((attempt, i) => 
        attempt.timestamp - recentAttempts[i].timestamp
      );
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Suspiciously regular intervals (likely automated)
      if (avgInterval < 5000 && this.calculateVariance(intervals) < 1000) {
        return { allowed: false, reason: 'automated_refresh_pattern_detected' };
      }
    }
    
    // Check IP geolocation consistency (simplified)
    const userActivity = this.suspiciousActivities.get(payload.sub);
    if (userActivity && userActivity.lastKnownIP && userActivity.lastKnownIP !== request.ip) {
      const timeSinceLastActivity = Date.now() - userActivity.lastActivity;
      // If IP changed in less than 1 minute, it's suspicious
      if (timeSinceLastActivity < 60000) {
        return { allowed: false, reason: 'rapid_ip_change_detected' };
      }
    }
    
    return { allowed: true };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  private recordRefreshAttempt(userId: string, request: any, success: boolean, tokenId: string): void {
    const attempts = this.refreshAttempts.get(userId) || [];
    
    attempts.push({
      timestamp: Date.now(),
      ip: request.ip,
      userAgent: request.userAgent,
      success,
      tokenId
    });
    
    // Keep only last 50 attempts for performance
    if (attempts.length > 50) {
      attempts.splice(0, attempts.length - 50);
    }
    
    this.refreshAttempts.set(userId, attempts);
  }

  private recordSuspiciousActivity(userId: string, reason: string, request: any): void {
    const activity = this.suspiciousActivities.get(userId) || {
      incidents: [],
      lastKnownIP: null,
      lastActivity: 0
    };
    
    activity.incidents.push({
      timestamp: Date.now(),
      reason,
      ip: request.ip,
      userAgent: request.userAgent
    });
    
    activity.lastKnownIP = request.ip;
    activity.lastActivity = Date.now();
    
    // Keep only last 20 incidents
    if (activity.incidents.length > 20) {
      activity.incidents.splice(0, activity.incidents.length - 20);
    }
    
    this.suspiciousActivities.set(userId, activity);
    
    console.warn(`🚨 Suspicious token activity: ${reason} for user ${userId}`);
  }

  // Revoke specific token
  revokeToken(tokenId: string): void {
    this.revokedTokens.add(tokenId);
    this.activeTokens.delete(tokenId);
    
    // Auto-cleanup revoked tokens after they would have expired anyway
    setTimeout(() => {
      this.revokedTokens.delete(tokenId);
    }, this.config.refreshTokenExpiry);
  }

  // Revoke all tokens for a session
  revokeSessionTokens(sessionId: string): void {
    for (const [tokenId, payload] of this.activeTokens.entries()) {
      if (payload.sessionId === sessionId) {
        this.revokeToken(tokenId);
      }
    }
  }

  // Revoke all tokens for a user
  revokeUserTokens(userId: string): void {
    for (const [tokenId, payload] of this.activeTokens.entries()) {
      if (payload.sub === userId) {
        this.revokeToken(tokenId);
      }
    }
  }

  // Generate secure random ID
  private generateSecureId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
  }

  // Check if token has required scope
  private hasRequiredScope(tokenScope: string[], requiredScope: string[]): boolean {
    return requiredScope.every(scope => tokenScope.includes(scope));
  }

  // Simple JWT implementation (in production, use a proper JWT library)
  private async createToken(payload: TokenPayload): Promise<string> {
    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };
    
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private async decodeToken(token: string): Promise<TokenPayload | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    try {
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      
      // Verify signature
      const expectedSignature = await this.sign(`${parts[0]}.${parts[1]}`);
      if (parts[2] !== expectedSignature) {
        console.warn('🚫 Invalid token signature');
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
  }

  private async sign(data: string): Promise<string> {
    // Simple HMAC-SHA256 implementation
    // In production, use WebCrypto API or a proper JWT library
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode('your-super-secret-key'), // In production, use environment variable
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  }

  // Get security analytics
  getSecurityAnalytics(): any {
    const now = Date.now();
    
    // Active tokens analysis
    const activeTokensCount = this.activeTokens.size;
    const expiredTokens = Array.from(this.activeTokens.values())
      .filter(token => now > token.exp).length;
    
    // Refresh attempts analysis
    const totalRefreshAttempts = Array.from(this.refreshAttempts.values())
      .reduce((sum, attempts) => sum + attempts.length, 0);
    
    const failedRefreshAttempts = Array.from(this.refreshAttempts.values())
      .reduce((sum, attempts) => sum + attempts.filter(a => !a.success).length, 0);
    
    // Suspicious activities analysis
    const totalSuspiciousActivities = Array.from(this.suspiciousActivities.values())
      .reduce((sum, activity) => sum + activity.incidents.length, 0);
    
    const recentSuspiciousActivities = Array.from(this.suspiciousActivities.values())
      .reduce((sum, activity) => sum + activity.incidents.filter(
        incident => now - incident.timestamp < 86400000
      ).length, 0);
    
    return {
      activeTokens: activeTokensCount,
      expiredTokens,
      revokedTokens: this.revokedTokens.size,
      totalRefreshAttempts,
      failedRefreshAttempts,
      refreshSuccessRate: totalRefreshAttempts > 0 
        ? ((totalRefreshAttempts - failedRefreshAttempts) / totalRefreshAttempts * 100).toFixed(2)
        : '100.00',
      totalSuspiciousActivities,
      recentSuspiciousActivities,
      securityScore: this.calculateSecurityScore()
    };
  }

  private calculateSecurityScore(): number {
    let score = 100;
    
    // Deduct points for suspicious activities
    const recentSuspicious = Array.from(this.suspiciousActivities.values())
      .reduce((sum, activity) => sum + activity.incidents.filter(
        incident => Date.now() - incident.timestamp < 86400000
      ).length, 0);
    
    score -= Math.min(30, recentSuspicious * 5);
    
    // Deduct points for failed refresh attempts
    const recentFailedRefresh = Array.from(this.refreshAttempts.values())
      .reduce((sum, attempts) => sum + attempts.filter(
        a => !a.success && Date.now() - a.timestamp < 86400000
      ).length, 0);
    
    score -= Math.min(20, recentFailedRefresh * 2);
    
    return Math.max(0, score);
  }

  // Cleanup expired data
  cleanup(): void {
    const now = Date.now();
    
    // Clean expired active tokens
    for (const [tokenId, payload] of this.activeTokens.entries()) {
      if (now > payload.exp) {
        this.activeTokens.delete(tokenId);
      }
    }
    
    // Clean old refresh attempts
    for (const [userId, attempts] of this.refreshAttempts.entries()) {
      const validAttempts = attempts.filter(a => now - a.timestamp < 86400000);
      if (validAttempts.length === 0) {
        this.refreshAttempts.delete(userId);
      } else {
        this.refreshAttempts.set(userId, validAttempts);
      }
    }
    
    // Clean old suspicious activities
    for (const [userId, activity] of this.suspiciousActivities.entries()) {
      const validIncidents = activity.incidents.filter(i => now - i.timestamp < 604800000);
      if (validIncidents.length === 0) {
        this.suspiciousActivities.delete(userId);
      } else {
        activity.incidents = validIncidents;
        this.suspiciousActivities.set(userId, activity);
      }
    }
  }
}

export const jwtSecurityManager = new JWTSecurityManager();

// Auto-cleanup every 15 minutes
setInterval(() => {
  jwtSecurityManager.cleanup();
}, 900000);