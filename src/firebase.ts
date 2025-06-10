// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Analytics'i lazy load için
let analytics: any = null;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Debug mode for development
const isDevelopment = import.meta.env.DEV;
const useEmulators = false; // Always use production Firebase

import { env, debugLog } from './utils/environment';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID
};

// Debug logging for development
debugLog('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  isDev: isDevelopment,
  useEmulators: useEmulators
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics'i lazy load et - sadece production'da ve ihtiyaç halinde
const getAnalytics = async () => {
  if (!analytics && import.meta.env.PROD) {
    try {
      const { getAnalytics: getAnalyticsImport } = await import("firebase/analytics");
      analytics = getAnalyticsImport(app);
      console.log('📊 Analytics initialized');
    } catch (error) {
      console.warn('⚠️ Analytics initialization failed:', error);
    }
  }
  return analytics;
};

const auth = getAuth(app);

// Mobile browser compatibility settings
if (typeof window !== 'undefined') {
  // Set persistence for mobile browsers
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Configure for mobile browsers
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    console.log('📱 Mobile device detected, configuring Firebase Auth for mobile');
  }
}

// Firestore'u varsayılan database ile initialize et
const db = getFirestore(app, "(default)");
const functions = getFunctions(app, 'europe-west1');

// Connect to emulators in development
if (useEmulators) {
  try {
    // Only connect if not already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      console.log('🔌 Connected to Auth Emulator');
    }
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8091);
    console.log('🔌 Connected to Firestore Emulator');
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators (might already be connected):', error.message);
  }
}

const connectionType = useEmulators ? 'EMULATORS' : 'PRODUCTION';
console.log(`✅ Firebase services initialized for ${connectionType}`, {
  auth: !!auth,
  db: !!db,
  functions: !!functions,
  emulators: useEmulators,
  databaseId: "(default)"
});

export { app, getAnalytics, auth, db, functions, firebaseConfig }; 