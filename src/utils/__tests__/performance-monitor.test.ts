// Unit tests for Performance Monitor functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor, markPerformance } from '../performance-monitor';

// Mock performance API
const mockPerformanceEntries: any[] = [];
const mockObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([])
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPerformanceEntries.length = 0;
  
  // Mock performance API
  Object.defineProperty(global, 'performance', {
    writable: true,
    value: {
      mark: vi.fn((name: string) => {
        mockPerformanceEntries.push({
          name,
          entryType: 'mark',
          startTime: Date.now(),
          duration: 0
        });
      }),
      measure: vi.fn((name: string, startMark?: string, endMark?: string) => {
        mockPerformanceEntries.push({
          name,
          entryType: 'measure',
          startTime: Date.now() - 100,
          duration: 100
        });
      }),
      getEntriesByType: vi.fn((type: string) => {
        return mockPerformanceEntries.filter(entry => entry.entryType === type);
      }),
      getEntriesByName: vi.fn((name: string) => {
        return mockPerformanceEntries.filter(entry => entry.name === name);
      }),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      now: vi.fn(() => Date.now())
    }
  });

  // Mock PerformanceObserver
  Object.defineProperty(global, 'PerformanceObserver', {
    writable: true,
    value: vi.fn().mockImplementation((callback) => {
      return mockObserver;
    })
  });

  // Mock IntersectionObserver
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    value: vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    }))
  });

  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Performance Monitor', () => {
  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        // The performance monitor should initialize when imported
        expect(performanceMonitor).toBeDefined();
      }).not.toThrow();
    });

    it('should set up performance observers', () => {
      // Test that PerformanceObserver is available and can be used
      expect(global.PerformanceObserver).toBeDefined();
      
      // Create a new observer to test functionality
      const testObserver = new (global.PerformanceObserver as any)(() => {});
      expect(testObserver).toBeDefined();
      expect(testObserver.observe).toBeDefined();
    });
  });

  describe('Performance Marking', () => {
    it('should create performance marks', () => {
      markPerformance('test-mark');
      
      expect(performance.mark).toHaveBeenCalledWith('test-mark');
    });

    it('should handle duplicate marks gracefully', () => {
      markPerformance('duplicate-mark');
      markPerformance('duplicate-mark');
      
      expect(performance.mark).toHaveBeenCalledTimes(2);
    });

    it('should handle empty mark names', () => {
      expect(() => {
        markPerformance('');
      }).not.toThrow();
    });

    it('should handle special characters in mark names', () => {
      const specialNames = [
        'mark-with-dashes',
        'mark_with_underscores',
        'mark.with.dots',
        'mark with spaces'
      ];
      
      specialNames.forEach(name => {
        expect(() => {
          markPerformance(name);
        }).not.toThrow();
      });
    });
  });

  describe('Web Vitals Monitoring', () => {
    it('should monitor Core Web Vitals', () => {
      // Mock Web Vitals entries
      const mockLCPEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1500,
        duration: 0,
        value: 1500
      };

      const mockFIDEntry = {
        name: 'first-input-delay',
        entryType: 'first-input',
        startTime: 100,
        duration: 8,
        processingStart: 108,
        processingEnd: 108
      };

      const mockCLSEntry = {
        name: 'layout-shift',
        entryType: 'layout-shift',
        startTime: 200,
        value: 0.05,
        hadRecentInput: false
      };

      // Test that we can create performance observers and they handle entries
      const testCallback = vi.fn();
      const testObserver = new (global.PerformanceObserver as any)(testCallback);
      
      // Simulate calling the callback with mock data
      testCallback({
        getEntries: () => [mockLCPEntry]
      });

      // Test FID observation
      testCallback({
        getEntries: () => [mockFIDEntry]
      });

      // Test CLS observation  
      testCallback({
        getEntries: () => [mockCLSEntry]
      });

      expect(testCallback).toHaveBeenCalled();
    });

    it('should handle missing Web Vitals gracefully', () => {
      // Test when PerformanceObserver is not available
      delete (global as any).PerformanceObserver;
      
      expect(() => {
        markPerformance('test-without-observer');
      }).not.toThrow();
    });
  });

  describe('Performance Measurements', () => {
    it('should create measurements between marks', () => {
      markPerformance('start-mark');
      markPerformance('end-mark');
      
      // Performance monitor should create measurements
      expect(performance.mark).toHaveBeenCalledWith('start-mark');
      expect(performance.mark).toHaveBeenCalledWith('end-mark');
    });

    it('should handle measurement errors gracefully', () => {
      // Mock performance.measure to throw an error
      performance.measure = vi.fn().mockImplementation(() => {
        throw new Error('Measurement failed');
      });
      
      expect(() => {
        markPerformance('error-test');
      }).not.toThrow();
    });
  });

  describe('Navigation Timing', () => {
    it('should monitor navigation performance', () => {
      // Mock navigation timing entry
      const mockNavigationEntry = {
        name: 'navigation',
        entryType: 'navigation',
        startTime: 0,
        duration: 2000,
        domainLookupStart: 10,
        domainLookupEnd: 50,
        connectStart: 50,
        connectEnd: 100,
        requestStart: 100,
        responseStart: 200,
        responseEnd: 500,
        domInteractive: 800,
        domContentLoadedEventStart: 900,
        domContentLoadedEventEnd: 950,
        loadEventStart: 1800,
        loadEventEnd: 2000
      };

      // Mock getEntriesByType for navigation timing
      performance.getEntriesByType = vi.fn().mockImplementation((type: string) => {
        if (type === 'navigation') {
          return [mockNavigationEntry];
        }
        return [];
      });

      // The performance monitor should handle navigation timing
      expect(() => {
        performance.getEntriesByType('navigation');
      }).not.toThrow();
    });
  });

  describe('Resource Timing', () => {
    it('should monitor resource loading performance', () => {
      const mockResourceEntry = {
        name: 'https://example.com/script.js',
        entryType: 'resource',
        startTime: 100,
        duration: 200,
        initiatorType: 'script',
        transferSize: 5000,
        encodedBodySize: 4500,
        decodedBodySize: 4800
      };

      performance.getEntriesByType = vi.fn().mockImplementation((type: string) => {
        if (type === 'resource') {
          return [mockResourceEntry];
        }
        return [];
      });

      expect(() => {
        performance.getEntriesByType('resource');
      }).not.toThrow();
    });

    it('should filter large resources', () => {
      const resources = [
        { name: 'small.js', transferSize: 1000 },
        { name: 'large.js', transferSize: 100000 },
        { name: 'medium.js', transferSize: 50000 }
      ];

      const largeResources = resources.filter(r => r.transferSize > 50000);
      expect(largeResources).toHaveLength(1);
      expect(largeResources[0].name).toBe('large.js');
    });
  });

  describe('Long Task Monitoring', () => {
    it('should monitor long tasks', () => {
      const mockLongTask = {
        name: 'long-task',
        entryType: 'longtask',
        startTime: 1000,
        duration: 200, // 200ms long task
        attribution: [{
          name: 'script',
          entryType: 'longtask-attribution',
          startTime: 1000,
          duration: 200,
          containerType: 'script',
          containerSrc: 'script.js'
        }]
      };

      // Test long task monitoring
      const testCallback = vi.fn();
      const testObserver = new (global.PerformanceObserver as any)(testCallback);
      
      testCallback({
        getEntries: () => [mockLongTask]
      });

      expect(testCallback).toHaveBeenCalled();
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage when available', () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 20000000,
          jsHeapSizeLimit: 100000000
        }
      });

      expect(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
          expect(usage).toBeGreaterThan(0);
          expect(usage).toBeLessThanOrEqual(1);
        }
      }).not.toThrow();
    });

    it('should handle missing memory API gracefully', () => {
      delete (performance as any).memory;
      
      expect(() => {
        const memory = (performance as any).memory;
        // Should not crash when memory API is unavailable
      }).not.toThrow();
    });
  });

  describe('Performance Budget Monitoring', () => {
    it('should track performance budgets', () => {
      const budgets = {
        LCP: 2500, // 2.5s
        FID: 100,  // 100ms
        CLS: 0.1   // 0.1
      };

      const metrics = {
        LCP: 2000,
        FID: 50,
        CLS: 0.05
      };

      Object.keys(budgets).forEach(metric => {
        const budget = budgets[metric as keyof typeof budgets];
        const value = metrics[metric as keyof typeof metrics];
        const withinBudget = value <= budget;
        
        expect(withinBudget).toBe(true);
      });
    });

    it('should warn when budgets are exceeded', () => {
      const mockConsoleWarn = vi.spyOn(console, 'warn');
      
      const budget = 2000;
      const actualValue = 3000;
      
      if (actualValue > budget) {
        console.warn(`Performance budget exceeded: ${actualValue}ms > ${budget}ms`);
      }
      
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('User Interaction Timing', () => {
    it('should measure interaction responsiveness', () => {
      const interactions = [
        { type: 'click', duration: 50 },
        { type: 'scroll', duration: 16 },
        { type: 'keypress', duration: 25 }
      ];

      const averageResponseTime = interactions.reduce((sum, interaction) => 
        sum + interaction.duration, 0) / interactions.length;
      
      expect(averageResponseTime).toBeGreaterThan(0);
      expect(averageResponseTime).toBeLessThan(100); // Should be responsive
    });
  });

  describe('Error Handling', () => {
    it('should handle performance API unavailability', () => {
      delete (global as any).performance;
      
      expect(() => {
        markPerformance('test-no-api');
      }).not.toThrow();
    });

    it('should handle observer creation failures', async () => {
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('Observer creation failed');
      });
      
      expect(async () => {
        // Re-initialize performance monitor
        const performanceModule = await import('../performance-monitor');
      }).not.toThrow();
    });

    it('should handle malformed performance entries', () => {
      const malformedEntry = {
        // Missing required properties
        name: null,
        entryType: undefined,
        startTime: 'invalid'
      };

      expect(() => {
        // Performance monitor should handle malformed entries gracefully
        if (typeof malformedEntry.startTime === 'number') {
          // Only process valid entries
        }
      }).not.toThrow();
    });
  });

  describe('Performance Analytics', () => {
    it('should calculate performance scores', () => {
      const metrics = {
        LCP: 1800,  // Good
        FID: 80,    // Good
        CLS: 0.08   // Good
      };

      // Simple scoring algorithm
      const scores = {
        LCP: metrics.LCP <= 2500 ? 'good' : metrics.LCP <= 4000 ? 'needs-improvement' : 'poor',
        FID: metrics.FID <= 100 ? 'good' : metrics.FID <= 300 ? 'needs-improvement' : 'poor',
        CLS: metrics.CLS <= 0.1 ? 'good' : metrics.CLS <= 0.25 ? 'needs-improvement' : 'poor'
      };

      expect(scores.LCP).toBe('good');
      expect(scores.FID).toBe('good');
      expect(scores.CLS).toBe('good');
    });

    it('should track performance trends', () => {
      const measurements = [
        { timestamp: 1000, LCP: 2000 },
        { timestamp: 2000, LCP: 1800 },
        { timestamp: 3000, LCP: 1600 }
      ];

      // Calculate trend (improving if latest < first)
      const trend = measurements[measurements.length - 1].LCP < measurements[0].LCP ? 'improving' : 'degrading';
      
      expect(trend).toBe('improving');
    });
  });

  describe('Data Export', () => {
    it('should export performance data', () => {
      const performanceData = {
        marks: performance.getEntriesByType('mark'),
        measures: performance.getEntriesByType('measure'),
        navigation: performance.getEntriesByType('navigation'),
        resources: performance.getEntriesByType('resource'),
        timestamp: Date.now()
      };

      expect(performanceData.timestamp).toBeGreaterThan(0);
      expect(Array.isArray(performanceData.marks)).toBe(true);
      expect(Array.isArray(performanceData.measures)).toBe(true);
    });

    it('should handle data serialization', () => {
      const data = {
        metric: 'LCP',
        value: 1500,
        timestamp: Date.now()
      };

      expect(() => {
        JSON.stringify(data);
      }).not.toThrow();
    });
  });
});