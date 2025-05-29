import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // AuthContextType'ı da import etmemiz gerekebilir

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 