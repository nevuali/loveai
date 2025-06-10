import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { auth, firebaseConfig } from '../firebase';
import { authService, User, RegisterData } from '../services/authService';
import { personalityService } from '../services/personalityService';
import { logger } from '../utils/logger';
import { trackUserInteraction, setAnalyticsUser, updateUserProperties } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  checkOnboardingStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// useAuth hook'unu Fast Refresh için optimize et
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    logger.log('🔄 Setting up auth state listener...');
    
    // Enhanced redirect result checking with retry logic for phones
    const checkRedirectResult = async () => {
      try {
        logger.log('🔍 Checking for pending redirect result...');
        
        // Add a small delay for phone browsers to stabilize
        if (/iPhone|Android/i.test(navigator.userAgent)) {
          logger.log('📱 Phone detected, adding stabilization delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const result = await getRedirectResult(auth);
        if (result) {
          logger.log('✅ Google redirect result found:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            providerId: result.providerId,
            operationType: result.operationType
          });
          
          // Don't call signInWithGoogle again, the redirect already handled it
          // Just let the auth state listener handle the user update
          logger.log('✅ Redirect auth completed, letting auth state listener handle user');
        } else {
          logger.log('ℹ️ No pending redirect result found');
        }
      } catch (error) {
        logger.error('❌ Error checking redirect result:', error);
        
        // Retry once after a delay for phone browsers
        if (/iPhone|Android/i.test(navigator.userAgent)) {
          logger.log('📱 Retrying redirect result check for phone...');
          setTimeout(async () => {
            try {
              const retryResult = await getRedirectResult(auth);
              if (retryResult) {
                logger.log('✅ Redirect result found on retry');
              }
            } catch (retryError) {
              logger.error('❌ Retry also failed:', retryError);
            }
          }, 2000);
        }
      }
    };

    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.log('🔄 Auth state changed:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email
      });
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          logger.log('👤 User profile loaded:', {
            hasProfile: !!userProfile,
            uid: userProfile?.uid
          });
          setUser(userProfile);
          
          // Check onboarding status
          if (userProfile) {
            const hasCompletedOnboarding = await personalityService.hasCompletedOnboarding(userProfile.uid);
            setNeedsOnboarding(!hasCompletedOnboarding);
            
            // Set analytics user and properties
            setAnalyticsUser(userProfile.uid, {
              user_type: userProfile.isPremium ? 'premium' : 'free',
              registration_date: userProfile.createdAt || new Date().toISOString(),
              total_chats: 0, // Will be updated when chats are loaded
              has_personality_profile: hasCompletedOnboarding
            });
            
            trackUserInteraction('user_authenticated', 'auth_state_change', {
              user_type: userProfile.isPremium ? 'premium' : 'free',
              is_verified: userProfile.isVerified,
              needs_onboarding: !hasCompletedOnboarding
            });
          }
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          // Firestore hatası olsa bile Firebase user varsa minimal profil oluştur
          const minimalUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            name: firebaseUser.displayName?.split(' ')[0] || 'User',
            surname: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            isVerified: firebaseUser.emailVerified,
            isPremium: false,
            messageCount: 0,
          };
          setUser(minimalUser);
          setNeedsOnboarding(true); // Minimal user always needs onboarding
          
          // Set analytics for minimal user
          setAnalyticsUser(minimalUser.uid, {
            user_type: 'free',
            registration_date: new Date().toISOString(),
            total_chats: 0,
            has_personality_profile: false
          });
        }
      } else {
        setUser(null);
        setNeedsOnboarding(false);
        trackUserInteraction('user_unauthenticated', 'auth_state_change', {});
      }
      
      setLoading(false);
    });

    return () => {
      logger.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        
        // Track successful login
        trackUserInteraction('user_login', 'email_password', {
          user_type: response.user.isPremium ? 'premium' : 'free',
          login_method: 'email_password'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Login error:', error);
      trackUserInteraction('login_failed', 'email_password', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await authService.register(userData);
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        
        // Track successful registration
        trackUserInteraction('user_register', 'email_password', {
          user_type: 'free', // New users start as free
          registration_method: 'email_password'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Register error:', error);
      trackUserInteraction('registration_failed', 'email_password', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Track logout before clearing user data
      trackUserInteraction('user_logout', 'manual', {
        user_type: user?.isPremium ? 'premium' : 'free'
      });
      
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.signInWithGoogle();
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        
        // Track successful Google sign-in
        trackUserInteraction('user_login', 'google', {
          user_type: response.user.isPremium ? 'premium' : 'free',
          login_method: 'google'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Google Sign-In error:', error);
      trackUserInteraction('login_failed', 'google', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }, []);

  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const hasCompleted = await personalityService.hasCompletedOnboarding(user.uid);
    setNeedsOnboarding(!hasCompleted);
    return hasCompleted;
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    firebaseUser,
    loading,
    login,
    register,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
    needsOnboarding,
    checkOnboardingStatus
  }), [user, firebaseUser, loading, login, register, signInWithGoogle, logout, needsOnboarding, checkOnboardingStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 