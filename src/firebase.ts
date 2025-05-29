// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Analytics'i lazy load için
let analytics: any = null;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Debug mode for development
const isDevelopment = import.meta.env.DEV;
const useEmulators = false; // Always use production Firebase

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ailovve.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ailovve",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ailovve.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "67784907260",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:67784907260:web:bdde3514cea143949ffa79",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-70KJQL4737"
};

// Debug logging for development
if (isDevelopment) {
  console.log('🔥 Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    isDev: isDevelopment,
    useEmulators: useEmulators
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics'i lazy load et
const getAnalytics = async () => {
  if (!analytics && !isDevelopment) {
    const { getAnalytics: getAnalyticsImport } = await import("firebase/analytics");
    analytics = getAnalyticsImport(app);
  }
  return analytics;
};

const auth = getAuth(app);
// Firestore'u varsayılan database ile initialize et
const db = getFirestore(app, "(default)");
const storage = getStorage(app);
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
  storage: !!storage,
  functions: !!functions,
  emulators: useEmulators,
  databaseId: "(default)"
});

export { app, getAnalytics, auth, db, storage, functions, firebaseConfig }; 