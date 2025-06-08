import { useState, useEffect, useCallback } from 'react';
import { debugLog } from '../utils/environment';

interface PWAInstallPrompt {
  platforms: string[];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  supportsPWA: boolean;
  installPrompt: PWAInstallPrompt | null;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    supportsPWA: false,
    installPrompt: null,
  });

  // Check if PWA is supported
  useEffect(() => {
    const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window;
    
    setState(prev => ({ 
      ...prev, 
      supportsPWA,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true
    }));

    debugLog('PWA Support:', {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent,
    });
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      debugLog('PWA install prompt available');
      e.preventDefault();
      
      const installPrompt = e as any as PWAInstallPrompt;
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt,
      }));
    };

    const handleAppInstalled = () => {
      debugLog('PWA installed successfully');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      debugLog('App is online');
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      debugLog('App is offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker - TEMPORARILY DISABLED FOR DEVELOPMENT
  useEffect(() => {
    // Service Worker disabled to prevent cache issues during development
    debugLog('Service Worker registration skipped in development mode');
    return;
    
    if (!state.supportsPWA) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        debugLog('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          debugLog('Service Worker update found');
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  debugLog('New Service Worker available');
                  // Notify user about update
                } else {
                  debugLog('Service Worker installed for the first time');
                }
              }
            });
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [state.supportsPWA]);

  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!state.installPrompt) {
      debugLog('No install prompt available');
      return false;
    }

    try {
      debugLog('Showing PWA install prompt');
      await state.installPrompt.prompt();
      
      const choiceResult = await state.installPrompt.userChoice;
      debugLog('User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, [state.installPrompt]);

  const canInstall = state.isInstallable && !state.isInstalled && !state.isStandalone;

  return {
    ...state,
    canInstall,
    installPWA,
  };
};

export default usePWA;