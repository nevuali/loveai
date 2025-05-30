import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAccountSelector } from './GoogleAccountSelector';
import { Sparkles, Heart } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Loading durumunda büyülü yükleme ekranı göster
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          {/* Büyülü Efektli Logo */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg sidebar-icon-glow animate-pulse">
            <Sparkles className="w-10 h-10 text-white opacity-90" />
          </div>
          
          {/* Büyülü Spinner */}
          <div className="relative">
            <div className="w-10 h-10 border-4 border-white/10 border-t-[#f1c40f] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-b-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-l-purple-500 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
          </div>
          
          {/* Büyülü Yükleme Metni */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#f1c40f] via-yellow-400 to-amber-500 bg-clip-text text-transparent glow-text mb-3">
              AI LOVVE
            </h2>
            <div className="flex items-center gap-2 justify-center">
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
              <p className="text-gray-300 text-base">The magic is beginning...</p>
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
            </div>
            <p className="text-gray-400 text-sm mt-2">Preparing your romantic journey</p>
          </div>
          
          {/* Yükleme Çizgisi */}
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-[#f1c40f] via-pink-500 to-purple-500 animate-loadingBar"></div>
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