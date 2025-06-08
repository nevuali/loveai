// Custom Web Vitals Performance Monitor

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP' | 'TBT';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  timestamp: number;
}

interface PerformanceReport {
  url: string;
  timestamp: number;
  metrics: WebVitalsMetric[];
  userAgent: string;
  connection?: string;
  deviceMemory?: number;
  effectiveType?: string;
}

class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private isEnabled = import.meta.env.PROD; // Only in production
  private reportingEndpoint: string | null = null;

  constructor() {
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring() {
    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
    
    // Monitor custom metrics
    this.observeNavigationTiming();
    this.observeResourceTiming();
    
    // Report metrics when page is about to unload
    this.setupReporting();
    
    console.log('📊 Performance monitoring initialized');
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.reportMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          rating: this.getRating('LCP', lastEntry.startTime),
          id: this.generateId(),
          timestamp: Date.now()
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          this.reportMetric({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            delta: entry.processingStart - entry.startTime,
            rating: this.getRating('FID', entry.processingStart - entry.startTime),
            id: this.generateId(),
            timestamp: Date.now()
          });
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });

        this.reportMetric({
          name: 'CLS',
          value: clsValue,
          delta: clsValue,
          rating: this.getRating('CLS', clsValue),
          id: this.generateId(),
          timestamp: Date.now()
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  private observeFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.reportMetric({
              name: 'FCP',
              value: entry.startTime,
              delta: entry.startTime,
              rating: this.getRating('FCP', entry.startTime),
              id: this.generateId(),
              timestamp: Date.now()
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   */
  private observeTTFB() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart;
            this.reportMetric({
              name: 'TTFB',
              value: ttfb,
              delta: ttfb,
              rating: this.getRating('TTFB', ttfb),
              id: this.generateId(),
              timestamp: Date.now()
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Observe Interaction to Next Paint (INP)
   */
  private observeINP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          const inp = entry.processingEnd - entry.startTime;
          this.reportMetric({
            name: 'INP',
            value: inp,
            delta: inp,
            rating: this.getRating('INP', inp),
            id: this.generateId(),
            timestamp: Date.now()
          });
        });
      });
      
      try {
        observer.observe({ entryTypes: ['event'] });
      } catch (e) {
        // INP might not be supported in all browsers
        console.warn('INP monitoring not supported');
      }
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as any[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        
        // Calculate additional metrics
        const domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
        const domComplete = nav.domComplete - nav.navigationStart;
        const loadComplete = nav.loadEventEnd - nav.loadEventStart;
        
        console.log('📊 Navigation Timing:', {
          domContentLoaded: `${Math.round(domContentLoaded)}ms`,
          domComplete: `${Math.round(domComplete)}ms`,
          loadComplete: `${Math.round(loadComplete)}ms`,
          redirectCount: nav.redirectCount,
          type: nav.type
        });
      }
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const criticalResources = entries.filter(entry => 
          entry.name.includes('.js') || 
          entry.name.includes('.css') ||
          entry.name.includes('font')
        );

        criticalResources.forEach(entry => {
          if (entry.duration > 1000) { // Log slow resources
            console.warn(`⚠️ Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Get performance rating
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      'LCP': { good: 2500, poor: 4000 },
      'FID': { good: 100, poor: 300 },
      'CLS': { good: 0.1, poor: 0.25 },
      'FCP': { good: 1800, poor: 3000 },
      'TTFB': { good: 800, poor: 1800 },
      'INP': { good: 200, poor: 500 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Report metric
   */
  private reportMetric(metric: WebVitalsMetric) {
    this.metrics.set(metric.name, metric);
    
    console.log(`📊 ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`);
    
    // Send to analytics if configured
    this.sendToAnalytics(metric);
  }

  /**
   * Send metrics to analytics
   */
  private sendToAnalytics(metric: WebVitalsMetric) {
    // Send to Google Analytics 4 if available
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        custom_parameter_1: metric.value,
        custom_parameter_2: metric.rating
      });
    }

    // Send to Firebase Analytics if available
    if (typeof window !== 'undefined' && (window as any).firebase) {
      import('../firebase').then(({ getAnalytics }) => {
        getAnalytics().then(analytics => {
          if (analytics) {
            // Log custom event to Firebase
            console.log(`📊 Sent ${metric.name} to Firebase Analytics`);
          }
        });
      });
    }
  }

  /**
   * Setup reporting on page unload
   */
  private setupReporting() {
    const reportPerformance = () => {
      const report: PerformanceReport = {
        url: window.location.href,
        timestamp: Date.now(),
        metrics: Array.from(this.metrics.values()),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType,
        deviceMemory: (navigator as any).deviceMemory,
        effectiveType: (navigator as any).connection?.effectiveType
      };

      console.log('📊 Performance Report:', report);
      
      // Send to reporting endpoint if configured
      if (this.reportingEndpoint) {
        this.sendReport(report);
      }
    };

    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportPerformance();
      }
    });

    // Report on page unload
    window.addEventListener('beforeunload', reportPerformance);
  }

  /**
   * Send report to endpoint
   */
  private sendReport(report: PerformanceReport) {
    if ('navigator' in window && 'sendBeacon' in navigator) {
      navigator.sendBeacon(this.reportingEndpoint!, JSON.stringify(report));
    } else {
      fetch(this.reportingEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      }).catch(console.warn);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Set reporting endpoint
   */
  public setReportingEndpoint(endpoint: string) {
    this.reportingEndpoint = endpoint;
  }

  /**
   * Manual performance mark
   */
  public mark(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      console.log(`📊 Performance mark: ${name}`);
    }
  }

  /**
   * Manual performance measure
   */
  public measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window && 'measure' in performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const measure = measures[measures.length - 1];
          console.log(`📊 Performance measure: ${name} = ${Math.round(measure.duration)}ms`);
        }
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for manual tracking
export const markPerformance = (name: string) => performanceMonitor.mark(name);
export const measurePerformance = (name: string, startMark: string, endMark?: string) => 
  performanceMonitor.measure(name, startMark, endMark);

// Initialize on module load
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

console.log('📊 Performance Monitor ready');