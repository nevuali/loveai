// User Analytics Tracking System for AI LOVVE
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { app } from '../firebase';

// Analytics event types
interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

interface UserProperties {
  user_type?: 'free' | 'premium' | 'trial';
  preferred_destinations?: string[];
  budget_range?: string;
  honeymoon_style?: string;
  registration_date?: string;
  last_active?: string;
  total_chats?: number;
  total_packages_viewed?: number;
  favorite_categories?: string[];
  has_personality_profile?: boolean;
}

interface ConversionEvent {
  event_name: string;
  value?: number;
  currency?: string;
  package_id?: string;
  package_category?: string;
  user_journey_stage?: string;
}

class AnalyticsManager {
  private analytics: any;
  private isEnabled = true;
  private userId: string | null = null;
  private sessionId: string;
  private sessionStartTime: number;
  private eventQueue: AnalyticsEvent[] = [];
  private userProperties: UserProperties = {};

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeAnalytics();
  }

  /**
   * Initialize Firebase Analytics
   */
  private async initializeAnalytics() {
    try {
      if (typeof window !== 'undefined' && app) {
        this.analytics = getAnalytics(app);
        console.log('📊 Analytics initialized');
        
        // Track page load
        this.trackPageView(window.location.pathname);
        
        // Process queued events
        await this.processEventQueue();
      }
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for analytics
   */
  public setUser(userId: string, properties?: UserProperties) {
    this.userId = userId;
    
    if (this.analytics) {
      setUserId(this.analytics, userId);
      
      if (properties) {
        this.updateUserProperties(properties);
      }
    }
    
    console.log('👤 Analytics user set:', userId);
  }

  /**
   * Update user properties
   */
  public updateUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    
    if (this.analytics) {
      setUserProperties(this.analytics, {
        ...properties,
        last_active: new Date().toISOString()
      });
    }
    
    console.log('📋 User properties updated:', properties);
  }

  /**
   * Track page views
   */
  public trackPageView(page: string, title?: string) {
    this.trackEvent('page_view', {
      page_path: page,
      page_title: title || document.title,
      session_id: this.sessionId
    });
  }

  /**
   * Track user interactions
   */
  public trackUserInteraction(action: string, element: string, details?: Record<string, any>) {
    this.trackEvent('user_interaction', {
      action,
      element,
      ...details,
      session_id: this.sessionId
    });
  }

  /**
   * Track chat interactions
   */
  public trackChatEvent(eventType: 'message_sent' | 'response_received' | 'chat_started' | 'chat_exported', details?: Record<string, any>) {
    this.trackEvent('chat_interaction', {
      chat_event_type: eventType,
      ...details,
      session_id: this.sessionId,
      timestamp: Date.now()
    });
  }

  /**
   * Track honeymoon package interactions
   */
  public trackPackageEvent(eventType: 'package_viewed' | 'package_clicked' | 'package_shared' | 'package_favorited', packageData: {
    package_id: string;
    package_title: string;
    package_category: string;
    package_price?: number;
    package_location?: string;
    package_duration?: number;
  }) {
    this.trackEvent('package_interaction', {
      package_event_type: eventType,
      ...packageData,
      session_id: this.sessionId
    });
  }

  /**
   * Track conversion events
   */
  public trackConversion(conversion: ConversionEvent) {
    this.trackEvent('conversion', {
      ...conversion,
      session_id: this.sessionId,
      user_journey_stage: conversion.user_journey_stage || 'unknown'
    });

    // Also track as Firebase conversion event
    if (this.analytics) {
      logEvent(this.analytics, 'purchase', {
        currency: conversion.currency || 'USD',
        value: conversion.value || 0,
        transaction_id: `${this.sessionId}_${Date.now()}`,
        items: [{
          item_id: conversion.package_id,
          item_name: conversion.event_name,
          item_category: conversion.package_category,
          price: conversion.value,
          quantity: 1
        }]
      });
    }
  }

  /**
   * Track search behavior
   */
  public trackSearch(searchTerm: string, searchType: 'destination' | 'package' | 'general', results?: number) {
    this.trackEvent('search', {
      search_term: searchTerm,
      search_type: searchType,
      search_results_count: results,
      session_id: this.sessionId
    });
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(feature: string, usage_type: 'first_time' | 'repeated', details?: Record<string, any>) {
    this.trackEvent('feature_usage', {
      feature_name: feature,
      usage_type,
      ...details,
      session_id: this.sessionId
    });
  }

  /**
   * Track errors and performance issues
   */
  public trackError(error: Error, context?: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      error_severity: severity,
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
      session_id: this.sessionId,
      page_path: window.location.pathname
    });
  }

  /**
   * Track session duration and engagement
   */
  public trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    this.trackEvent('session_end', {
      session_duration_ms: sessionDuration,
      session_duration_minutes: Math.round(sessionDuration / 60000),
      session_id: this.sessionId,
      page_views: this.getSessionPageViews(),
      interactions: this.getSessionInteractions()
    });
  }

  /**
   * Track A/B test participation
   */
  public trackABTest(testName: string, variant: string, outcome?: string) {
    this.trackEvent('ab_test', {
      test_name: testName,
      test_variant: variant,
      test_outcome: outcome,
      session_id: this.sessionId
    });
  }

  /**
   * Core event tracking method
   */
  private trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      parameters: {
        ...parameters,
        user_id: this.userId,
        timestamp: Date.now(),
        session_id: this.sessionId,
        app_version: process.env.REACT_APP_VERSION || '1.0.0',
        platform: 'web'
      },
      userId: this.userId || undefined,
      timestamp: Date.now()
    };

    if (this.analytics) {
      // Send to Firebase Analytics
      logEvent(this.analytics, eventName, event.parameters);
    } else {
      // Queue for later if analytics not ready
      this.eventQueue.push(event);
    }

    // Also send to custom analytics endpoint if configured
    this.sendToCustomAnalytics(event);

    console.log('📊 Analytics event:', eventName, event.parameters);
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomAnalytics(event: AnalyticsEvent) {
    if (!process.env.REACT_APP_CUSTOM_ANALYTICS_URL) return;

    try {
      await fetch(process.env.REACT_APP_CUSTOM_ANALYTICS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Custom analytics endpoint failed:', error);
    }
  }

  /**
   * Process queued events
   */
  private async processEventQueue() {
    if (!this.analytics || this.eventQueue.length === 0) return;

    console.log(`📊 Processing ${this.eventQueue.length} queued events`);

    for (const event of this.eventQueue) {
      logEvent(this.analytics, event.name, event.parameters);
    }

    this.eventQueue = [];
  }

  /**
   * Get session statistics
   */
  private getSessionPageViews(): number {
    // Implementation would count page views in this session
    return parseInt(sessionStorage.getItem('session_page_views') || '1');
  }

  private getSessionInteractions(): number {
    // Implementation would count interactions in this session
    return parseInt(sessionStorage.getItem('session_interactions') || '0');
  }

  /**
   * Enable/disable analytics
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get analytics status
   */
  public getStatus() {
    return {
      enabled: this.isEnabled,
      userId: this.userId,
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      queuedEvents: this.eventQueue.length
    };
  }

  /**
   * Export analytics data for debugging
   */
  public exportData() {
    return {
      userProperties: this.userProperties,
      sessionInfo: {
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        duration: Date.now() - this.sessionStartTime
      },
      queuedEvents: this.eventQueue
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Utility functions
export const trackPageView = (page: string, title?: string) => 
  analytics.trackPageView(page, title);

export const trackUserInteraction = (action: string, element: string, details?: Record<string, any>) =>
  analytics.trackUserInteraction(action, element, details);

export const trackChatEvent = (eventType: 'message_sent' | 'response_received' | 'chat_started' | 'chat_exported', details?: Record<string, any>) =>
  analytics.trackChatEvent(eventType, details);

export const trackPackageEvent = (eventType: 'package_viewed' | 'package_clicked' | 'package_shared' | 'package_favorited', packageData: any) =>
  analytics.trackPackageEvent(eventType, packageData);

export const trackConversion = (conversion: ConversionEvent) =>
  analytics.trackConversion(conversion);

export const trackSearch = (searchTerm: string, searchType: 'destination' | 'package' | 'general', results?: number) =>
  analytics.trackSearch(searchTerm, searchType, results);

export const trackFeatureUsage = (feature: string, usage_type: 'first_time' | 'repeated', details?: Record<string, any>) =>
  analytics.trackFeatureUsage(feature, usage_type, details);

export const trackError = (error: Error, context?: string, severity: 'low' | 'medium' | 'high' = 'medium') =>
  analytics.trackError(error, context, severity);

export const trackPerformance = (metric: string, value: number, unit: string = 'ms') =>
  analytics.trackPerformance(metric, value, unit);

export const setAnalyticsUser = (userId: string, properties?: UserProperties) =>
  analytics.setUser(userId, properties);

export const updateUserProperties = (properties: UserProperties) =>
  analytics.updateUserProperties(properties);

// Auto-track session end on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.trackSessionEnd();
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      analytics.trackUserInteraction('page_hidden', 'visibility_api');
    } else {
      analytics.trackUserInteraction('page_visible', 'visibility_api');
    }
  });
}

console.log('📊 Analytics utilities loaded');