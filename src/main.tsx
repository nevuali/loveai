import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePreloader } from './utils/preloader'
import { performanceMonitor, markPerformance } from './utils/performance-monitor'
import { accessibilityManager } from './utils/accessibility'
import { analytics, trackPageView, trackPerformance } from './utils/analytics'
import { pushNotificationManager } from './utils/push-notifications'
import { initSentry } from './utils/sentry'
import './utils/admin-helper'
import './utils/get-user-id'

// Initialize error monitoring first
initSentry();

// Performance tracking
markPerformance('app-start');

// Initialize performance preloader
initializePreloader();

// Create skip link for accessibility
accessibilityManager.createSkipLink('#main-content', 'Skip to main content');

// Initialize analytics
analytics.setEnabled(true);
trackPageView(window.location.pathname, 'AI LOVVE App Start');

// Initialize push notifications (non-blocking)
setTimeout(() => {
  console.log('🔔 Initializing push notifications...');
  // Push notification manager initializes automatically
}, 1000);

// Mark when React starts rendering
markPerformance('react-render-start');

createRoot(document.getElementById("root")!).render(
  <App />
);

// Mark when React finishes initial render
setTimeout(() => {
  markPerformance('react-render-end');
  
  // Track initial app load performance
  const appStartTime = performance.getEntriesByName('app-start')[0];
  const renderEndTime = performance.getEntriesByName('react-render-end')[0];
  
  if (appStartTime && renderEndTime) {
    const loadTime = renderEndTime.startTime - appStartTime.startTime;
    trackPerformance('app_load_time', loadTime, 'ms');
  }
}, 0);
