// Lazy-loaded Firebase utilities for bundle optimization

// Cache for lazy-loaded modules
const moduleCache = new Map<string, any>();

/**
 * Lazy load Firebase Auth functions
 */
export const getAuthFunctions = async () => {
  if (!moduleCache.has('auth-functions')) {
    const authModule = await import('firebase/auth');
    moduleCache.set('auth-functions', {
      signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
      createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
      signInWithPopup: authModule.signInWithPopup,
      signInWithRedirect: authModule.signInWithRedirect,
      getRedirectResult: authModule.getRedirectResult,
      GoogleAuthProvider: authModule.GoogleAuthProvider,
      signOut: authModule.signOut,
      sendPasswordResetEmail: authModule.sendPasswordResetEmail,
      sendEmailVerification: authModule.sendEmailVerification,
      updateProfile: authModule.updateProfile,
      updatePassword: authModule.updatePassword,
      onAuthStateChanged: authModule.onAuthStateChanged
    });
  }
  return moduleCache.get('auth-functions');
};

/**
 * Lazy load Firebase Firestore functions
 */
export const getFirestoreFunctions = async () => {
  if (!moduleCache.has('firestore-functions')) {
    const firestoreModule = await import('firebase/firestore');
    moduleCache.set('firestore-functions', {
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      getDocs: firestoreModule.getDocs,
      setDoc: firestoreModule.setDoc,
      addDoc: firestoreModule.addDoc,
      updateDoc: firestoreModule.updateDoc,
      deleteDoc: firestoreModule.deleteDoc,
      query: firestoreModule.query,
      where: firestoreModule.where,
      orderBy: firestoreModule.orderBy,
      limit: firestoreModule.limit,
      onSnapshot: firestoreModule.onSnapshot,
      serverTimestamp: firestoreModule.serverTimestamp,
      Timestamp: firestoreModule.Timestamp,
      writeBatch: firestoreModule.writeBatch,
      runTransaction: firestoreModule.runTransaction
    });
  }
  return moduleCache.get('firestore-functions');
};

/**
 * Lazy load Firebase Functions
 */
export const getFunctionHelpers = async () => {
  if (!moduleCache.has('functions-helpers')) {
    const functionsModule = await import('firebase/functions');
    moduleCache.set('functions-helpers', {
      httpsCallable: functionsModule.httpsCallable,
      connectFunctionsEmulator: functionsModule.connectFunctionsEmulator
    });
  }
  return moduleCache.get('functions-helpers');
};

/**
 * Lazy load Firebase Analytics (only in production)
 */
export const getAnalyticsModule = async () => {
  if (!moduleCache.has('analytics') && import.meta.env.PROD) {
    const analyticsModule = await import('firebase/analytics');
    moduleCache.set('analytics', {
      getAnalytics: analyticsModule.getAnalytics,
      logEvent: analyticsModule.logEvent,
      setUserProperties: analyticsModule.setUserProperties,
      setUserId: analyticsModule.setUserId
    });
  }
  return moduleCache.get('analytics');
};

/**
 * Preload critical Firebase modules
 */
export const preloadCriticalModules = async () => {
  const criticalModules = [
    getAuthFunctions(),
    getFirestoreFunctions()
  ];

  try {
    await Promise.all(criticalModules);
    console.log('🔥 Critical Firebase modules preloaded');
  } catch (error) {
    console.warn('⚠️ Failed to preload some Firebase modules:', error);
  }
};

/**
 * Get bundle size info for debugging
 */
export const getModuleInfo = () => {
  return {
    loadedModules: Array.from(moduleCache.keys()),
    cacheSize: moduleCache.size,
    memoryUsage: (performance as any).memory ? {
      used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
    } : 'Not available'
  };
};