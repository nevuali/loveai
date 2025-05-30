import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster as HotToaster } from 'react-hot-toast';

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const HolidayPackage = lazy(() => import("./pages/HolidayPackage"));
const FindHoliday = lazy(() => import("./pages/FindHoliday"));
const CoupleTest = lazy(() => import("./pages/CoupleTest"));
const FamilyHoliday = lazy(() => import("./pages/FamilyHoliday"));
const Advice = lazy(() => import("./pages/Advice"));
const RecentSearchesPage = lazy(() => import("./pages/RecentSearchesPage"));
const CappaLovePremiumPage = lazy(() => import("./pages/CappaLovePremiumPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));

// Create a query client with configuration options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Luxury Loading component
const PageLoading = () => (
  <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini flex items-center justify-center">
    <div className="flex flex-col items-center gap-8">
      {/* Büyülü Efektli Logo */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg sidebar-icon-glow animate-pulse">
        <svg className="w-10 h-10 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
        </svg>
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
          <svg className="w-4 h-4 text-pink-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <p className="text-gray-300 text-base">Weaving enchantment...</p>
          <svg className="w-4 h-4 text-pink-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <p className="text-gray-400 text-sm mt-2">Summoning your love assistant...</p>
      </div>
      
      {/* Yükleme Çizgisi */}
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-gradient-to-r from-[#f1c40f] via-pink-500 to-purple-500 animate-loadingBar"></div>
      </div>
    </div>
  </div>
);

// Properly defined React function component to ensure hooks work correctly
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                {/* Ana chat sayfası - protected */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                {/* Diğer tüm sayfalar - protected */}
                <Route path="/holiday-package" element={
                  <ProtectedRoute>
                    <HolidayPackage />
                  </ProtectedRoute>
                } />
                
                <Route path="/find-holiday" element={
                  <ProtectedRoute>
                    <FindHoliday />
                  </ProtectedRoute>
                } />
                
                <Route path="/couple-test" element={
                  <ProtectedRoute>
                    <CoupleTest />
                  </ProtectedRoute>
                } />
                
                <Route path="/family-holiday" element={
                  <ProtectedRoute>
                    <FamilyHoliday />
                  </ProtectedRoute>
                } />
                
                <Route path="/advice" element={
                  <ProtectedRoute>
                    <Advice />
                  </ProtectedRoute>
                } />
                
                <Route path="/recent-searches" element={
                  <ProtectedRoute>
                    <RecentSearchesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/cappalove-premium" element={
                  <ProtectedRoute>
                    <CappaLovePremiumPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
          
          {/* Luxury Toast Notifications */}
          <HotToaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(31, 31, 31, 0.95)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 180, 248, 0.1)',
                fontFamily: 'Google Sans, system-ui, sans-serif'
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: 'white',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 63, 94, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
              loading: {
                style: {
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                },
                iconTheme: {
                  primary: '#8b5cf6',
                  secondary: 'white',
                },
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
