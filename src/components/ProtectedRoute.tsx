import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Loading durumunda minimalist yükleme ekranı göster
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Sadece ışıltı emojisi */}
          <div className="text-4xl animate-pulse">✨</div>
          
          {/* Minimalist Spinner */}
          <div className="relative">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
          
          {/* Minimalist Yükleme Metni */}
          <div className="text-center">
            <p className="text-gray-300 text-sm">The magic is beginning...</p>
          </div>
        </div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa /auth sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Kullanıcı giriş yapmışsa children'ı render et
  return <>{children}</>;
}; 