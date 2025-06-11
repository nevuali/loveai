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

  // Check Firebase API key format and security
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (apiKey && !apiKey.startsWith('AIza')) {
    console.warn('Firebase API key format might be incorrect');
  }
  
  // Security check: ensure we're not using placeholder values in production
  if (apiKey === 'your_firebase_api_key_here' || apiKey.includes('PLACEHOLDER')) {
    throw new Error('Production deployment blocked: Placeholder API key detected');
  }

  // Keep using Firebase authDomain until custom domain is properly configured
  // TODO: Configure lovve.tech as authorized domain in Firebase Console first
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

  console.log('🔧 Firebase authDomain configuration:', {
    authDomain,
    usingDefault: true
  });

  return {
    FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: authDomain,
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

// Domain validation for OAuth
export const validateCurrentDomain = () => {
  if (typeof window === 'undefined') return true;
  
  const currentDomain = window.location.hostname;
  const allowedDomains = [
    'lovve.tech',
    'www.lovve.tech',
    'localhost',
    '127.0.0.1',
    'ailovve.firebaseapp.com'
  ];
  
  const isValidDomain = allowedDomains.some(domain => 
    currentDomain === domain || currentDomain.endsWith('.' + domain)
  );
  
  if (!isValidDomain && isProduction) {
    console.warn('⚠️ Current domain not in allowed OAuth domains:', currentDomain);
    console.warn('📋 Allowed domains:', allowedDomains);
  }
  
  return isValidDomain;
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
  currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'server',
  domainValid: validateCurrentDomain(),
  timestamp: new Date().toISOString(),
});

export default env;