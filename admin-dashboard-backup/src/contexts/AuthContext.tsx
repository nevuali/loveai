import React, { createContext, useContext, useState, useEffect } from 'react'
import { clearStorage } from '../services/api'

// AuthContextType'ı export et
export interface AuthContextType {
  isAuthenticated: boolean
  loginSession: (sessionId: string) => void
  logout: () => void
  sessionId: string | null
}

// AuthContext'i export et
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('admin_session_id'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Session kontrolü yap
    if (sessionId && sessionId.trim() !== '') {
      console.log('✅ Session ID found, user authenticated via session');
      setIsAuthenticated(true);
    } else {
      // Geçerli session yok
      console.log('❌ No valid session found');
      if (sessionId) { // only clear storage if there was an invalid session to begin with
        clearStorage(); // Clear out the bad session
      }
      setSessionId(null);
      setIsAuthenticated(false);
    }
  }, [sessionId]); // Re-run when sessionId state changes

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'admin_session_id') {
        const newSessionId = event.newValue;
        setSessionId(newSessionId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loginSession = (newSessionId: string) => {
    console.log('🎫 Session Login');
    localStorage.setItem('admin_session_id', newSessionId);
    setSessionId(newSessionId);
  };

  const logout = () => {
    console.log('👋 Logout');
    clearStorage();
    setSessionId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loginSession, 
      logout, 
      sessionId
    }}>
      {children}
    </AuthContext.Provider>
  );
} 