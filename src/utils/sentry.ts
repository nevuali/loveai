import * as Sentry from '@sentry/react';
import React from 'react';
import { env } from './environment';

// Sentry configuration
export const initSentry = () => {
  // Only initialize Sentry in production or if explicitly enabled
  if (!env.DEBUG_MODE && (env.APP_ENV === 'production' || import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true')) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: env.APP_ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      
      // Performance monitoring
      tracesSampleRate: env.APP_ENV === 'production' ? 0.1 : 1.0,
      
      // Session replay (for debugging)
      replaysSessionSampleRate: env.APP_ENV === 'production' ? 0.1 : 0.0,
      replaysOnErrorSampleRate: 1.0,
      
      // User context
      beforeSend(event, hint) {
        // Filter out development errors
        if (env.APP_ENV === 'development') {
          console.log('Sentry Event (Development):', event);
          return null; // Don't send in development
        }
        
        // Filter out certain errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Don't send network errors
            if (error.message.includes('NetworkError') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('ERR_NETWORK')) {
              return null;
            }
            
            // Don't send auth errors (user-facing)
            if (error.message.includes('auth/') ||
                error.message.includes('Permission denied')) {
              return null;
            }
          }
        }
        
        return event;
      },
      
      // Additional options
      attachStacktrace: true,
      autoSessionTracking: true,
      sendDefaultPii: false, // Don't send personally identifiable information
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        
        // Network errors
        'NetworkError',
        'AbortError',
        'QuotaExceededError',
        
        // Common user errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      
      // Ignore certain URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        
        // Ad blockers
        /adnxs\.com/i,
        /doubleclick\.net/i,
        /googletagmanager\.com/i,
      ],
    });

    console.log('🔍 Sentry error monitoring initialized');
  } else {
    console.log('🔍 Sentry disabled (development mode)');
  }
};

// Performance monitoring helpers
export const startTransaction = (name: string, operation: string = 'navigation') => {
  return Sentry.startSpan({
    name,
    op: operation,
  }, (span) => span);
};

// Error reporting helpers
export const captureError = (error: Error | string, context?: any) => {
  if (typeof error === 'string') {
    Sentry.captureMessage(error, 'error');
  } else {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional_info', context);
      }
      Sentry.captureException(error);
    });
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// User context
export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Breadcrumbs for debugging
export const addBreadcrumb = (message: string, category: string = 'user', level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// React Error Boundary
export const SentryErrorBoundary = Sentry.withErrorBoundary;