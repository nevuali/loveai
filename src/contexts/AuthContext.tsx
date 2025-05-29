import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { auth, firebaseConfig } from '../firebase';
import { authService, User, RegisterData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// useAuth hook'unu Fast Refresh için optimize et
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

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    // Check for Google redirect result on app load (for mobile)
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('🔍 Google redirect result found:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          });
          
          // The auth state listener will handle the rest
        }
      } catch (error) {
        console.error('❌ Error checking redirect result:', error);
      }
    };

    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email
      });
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          console.log('👤 User profile loaded:', {
            hasProfile: !!userProfile,
            uid: userProfile?.uid
          });
          setUser(userProfile);
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
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await authService.register(userData);
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.signInWithGoogle();
      if (response.success && response.user) {
        setUser(response.user);
        setFirebaseUser(response.firebaseUser || null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return false;
    }
  }, []);

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
  }), [user, firebaseUser, loading, login, register, signInWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 