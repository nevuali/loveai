import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAccountSelector } from './GoogleAccountSelector';
import { Bot } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Loading durumunda lüks spinner göster
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* AI LOVE Logo with gradient */}
          <div className="w-16 h-16 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow gentle-floating">
            <Bot className="w-8 h-8 text-white" />
          </div>
          
          {/* Loading Spinner */}
          <div className="relative">
            <div className="w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-b-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent glow-text mb-2">
              AI LOVE
            </h2>
            <p className="text-gray-400 text-sm">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa GoogleAccountSelector göster
  if (!isAuthenticated) {
    return (
      <GoogleAccountSelector
        isOpen={true}
        onClose={() => {}} // Kapatma butonu yok
        onSuccess={() => {}} // Auth context otomatik handle edecek
      />
    );
  }

  // Kullanıcı giriş yapmışsa children'ı render et
  return <>{children}</>;
}; 