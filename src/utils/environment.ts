// Environment variables validation and management

interface Environment {
  // Firebase Config
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID?: string;
  
  // App Config
  APP_ENV: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  
  // Optional
  GEMINI_API_KEY?: string;
}

// Validate required environment variables
function validateEnvironment(): Environment {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check Firebase API key format (should start with AIza...)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey.startsWith('AIza')) {
    console.warn('Firebase API key format might be incorrect');
  }

  return {
    FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    
    APP_ENV: (import.meta.env.VITE_APP_ENV as any) || (import.meta.env.DEV ? 'development' : 'production'),
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
    
    GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  };
}

// Export validated environment
export const env = validateEnvironment();

// Helper functions
export const isDevelopment = env.APP_ENV === 'development';
export const isProduction = env.APP_ENV === 'production';
export const isStaging = env.APP_ENV === 'staging';

// Debug helper
export const debugLog = (...args: any[]) => {
  if (env.DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

// Environment status
export const getEnvironmentStatus = () => ({
  environment: env.APP_ENV,
  debug: env.DEBUG_MODE,
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
  },
  hasGeminiKey: !!env.GEMINI_API_KEY,
  timestamp: new Date().toISOString(),
});

export default env;