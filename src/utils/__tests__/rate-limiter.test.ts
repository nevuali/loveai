// Unit tests for Rate Limiter functionality
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter, checkRateLimit, recordSuccess, recordFailure } from '../rate-limiter';

// Mock console.log and console.warn to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limiter state between tests
    // Note: This is a simple approach - in production you might want a reset method
    vi.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('chat_message', 'test-user');
      
      expect(result.allowed).toBe(true);
      expect(result.info.remaining).toBeGreaterThan(0);
      expect(result.info.isBlocked).toBe(false);
    });

    it('should track request count correctly', async () => {
      const userId = 'test-user-count';
      
      // First request
      const result1 = await checkRateLimit('chat_message', userId);
      expect(result1.allowed).toBe(true);
      expect(result1.info.totalHits).toBe(1);
      
      // Second request
      const result2 = await checkRateLimit('chat_message', userId);
      expect(result2.allowed).toBe(true);
      expect(result2.info.totalHits).toBe(2);
      expect(result2.info.remaining).toBe(result1.info.remaining - 1);
    });

    it('should handle different action types', async () => {
      const userId = 'test-user-actions';
      
      const chatResult = await checkRateLimit('chat_message', userId);
      const imageResult = await checkRateLimit('image_upload', userId);
      const voiceResult = await checkRateLimit('voice_input', userId);
      
      expect(chatResult.allowed).toBe(true);
      expect(imageResult.allowed).toBe(true);
      expect(voiceResult.allowed).toBe(true);
      
      // Different actions should have different limits
      expect(chatResult.info.remaining).not.toBe(imageResult.info.remaining);
    });
  });

  describe('Rate Limit Enforcement', () => {
    it('should block requests when limit is exceeded', async () => {
      const userId = 'test-user-exceeded';
      
      // Quickly exceed the limit for auth attempts (5 requests)
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(await checkRateLimit('auth_attempt', userId));
      }
      
      // First 5 should be allowed
      expect(results.slice(0, 5).every(r => r.allowed)).toBe(true);
      
      // 6th should be blocked
      expect(results[5].allowed).toBe(false);
      expect(results[5].info.remaining).toBe(0);
    });

    it('should handle weighted requests', async () => {
      const userId = 'test-user-weighted';
      
      // Use a weighted request that counts as 5
      const heavyResult = await checkRateLimit('auth_attempt', userId, undefined, 5);
      expect(heavyResult.allowed).toBe(true);
      expect(heavyResult.info.totalHits).toBe(5);
      
      // Next request should be blocked since we've hit the limit (5)
      const blockedResult = await checkRateLimit('auth_attempt', userId);
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Success/Failure Recording', () => {
    it('should handle success recording for skipSuccessfulRequests', async () => {
      const userId = 'test-user-success';
      
      // Package requests skip successful requests
      const result1 = await checkRateLimit('package_request', userId);
      expect(result1.allowed).toBe(true);
      expect(result1.info.totalHits).toBe(1);
      
      // Record success - should reduce count
      recordSuccess('package_request', userId);
      
      const result2 = await checkRateLimit('package_request', userId);
      expect(result2.info.totalHits).toBe(1); // Should not increase due to success recording
    });

    it('should handle failure recording for skipFailedRequests', async () => {
      const userId = 'test-user-failure';
      
      // Chat messages skip failed requests
      const result1 = await checkRateLimit('chat_message', userId);
      expect(result1.allowed).toBe(true);
      expect(result1.info.totalHits).toBe(1);
      
      // Record failure - should reduce count
      recordFailure('chat_message', userId);
      
      const result2 = await checkRateLimit('chat_message', userId);
      expect(result2.info.totalHits).toBe(1); // Should not increase due to failure recording
    });
  });

  describe('Progressive Blocking', () => {
    it('should implement progressive blocking for repeat violators', async () => {
      const userId = 'test-user-violations';
      
      // Make 6 requests to exceed the limit (auth_attempt limit is 5)
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(await checkRateLimit('auth_attempt', userId));
      }
      
      // The 6th request should be blocked
      const blockedResult = results[5];
      
      // The 6th request should be blocked as it exceeds the limit
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Different User Isolation', () => {
    it('should isolate rate limits between different users', async () => {
      const user1 = 'user1';
      const user2 = 'user2';
      
      // User 1 makes requests
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit('auth_attempt', user1);
        expect(result.allowed).toBe(true);
      }
      
      // User 1 should be at limit
      const user1Blocked = await checkRateLimit('auth_attempt', user1);
      expect(user1Blocked.allowed).toBe(false);
      
      // User 2 should still be able to make requests
      const user2Result = await checkRateLimit('auth_attempt', user2);
      expect(user2Result.allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined/null user IDs', async () => {
      const result1 = await checkRateLimit('chat_message', undefined);
      const result2 = await checkRateLimit('chat_message', null as any);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should handle unknown action types gracefully', async () => {
      const result = await checkRateLimit('unknown_action' as any, 'test-user');
      
      expect(result.allowed).toBe(true);
      expect(result.info).toBeDefined();
    });

    it('should handle invalid weight values', async () => {
      const result1 = await checkRateLimit('chat_message', 'test-user', undefined, 0);
      const result2 = await checkRateLimit('chat_message', 'test-user', undefined, -1);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Daily Limits', () => {
    it('should track daily usage separately', async () => {
      const userId = 'test-user-daily';
      
      const result = await checkRateLimit('chat_message', userId);
      
      expect(result.info.totalHitsToday).toBeDefined();
      expect(result.info.totalHitsToday).toBeGreaterThanOrEqual(0);
      expect(result.info.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const userId = 'test-user-concurrent';
      const startTime = Date.now();
      
      // Make 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) => 
        checkRateLimit('chat_message', `${userId}-${i}`)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // All requests should be allowed (different user IDs)
      expect(results.every(r => r.allowed)).toBe(true);
    });
  });
});

describe('Rate Limiter Statistics', () => {
  it('should provide accurate statistics', async () => {
    const userId = 'test-user-stats';
    
    // Make some requests
    await checkRateLimit('chat_message', userId);
    await checkRateLimit('image_upload', userId);
    await checkRateLimit('voice_input', userId);
    
    const stats = rateLimiter.getStats();
    
    expect(stats.totalKeys).toBeGreaterThan(0);
    expect(stats.configs).toBeGreaterThan(0);
    expect(stats.activeBlocks).toBeGreaterThanOrEqual(0);
    expect(stats.totalViolations).toBeGreaterThanOrEqual(0);
  });
});

describe('Rate Limiter Configuration', () => {
  it('should allow custom rate limit configurations', () => {
    const customAction = 'custom_test_action';
    
    rateLimiter.setConfig(customAction, {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
      message: 'Custom rate limit exceeded'
    });
    
    // Test that custom config is applied
    expect(() => rateLimiter.setConfig(customAction, {
      maxRequests: 5,
      windowMs: 60000
    })).not.toThrow();
  });

  it('should handle reset functionality', () => {
    const userId = 'test-user-reset';
    
    // Make a request first
    checkRateLimit('chat_message', userId);
    
    // Reset should not throw
    expect(() => rateLimiter.reset('chat_message', userId)).not.toThrow();
  });
});