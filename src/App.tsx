import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster as HotToaster } from 'react-hot-toast';
import ErrorBoundary from "./components/ErrorBoundary";
import PWAInstall from "./components/PWAInstall";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const PackageDetail = lazy(() => import("./pages/PackageDetail"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const HolidayPackage = lazy(() => import("./pages/HolidayPackage"));
const FindHoliday = lazy(() => import("./pages/FindHoliday"));
const CoupleTest = lazy(() => import("./pages/CoupleTest"));
const FamilyHoliday = lazy(() => import("./pages/FamilyHoliday"));
const Advice = lazy(() => import("./pages/Advice"));
const RecentSearchesPage = lazy(() => import("./pages/RecentSearchesPage"));
const CappaLovePremiumPage = lazy(() => import("./pages/CappaLovePremiumPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TestPersonality = lazy(() => import("./pages/TestPersonality"));

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

// Minimalist Loading component
const PageLoading = () => (
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
        <p className="text-gray-300 text-sm">Weaving enchantment...</p>
      </div>
    </div>
  </div>
);

// Properly defined React function component to ensure hooks work correctly
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:via-[#1f1f1f] dark:to-[#2a2a2a]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Loading AI LOVVE...</p>
                  </div>
                </div>
              }>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/package/:id" element={
                    <ProtectedRoute>
                      <PackageDetail />
                    </ProtectedRoute>
                  } />
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
                  <Route path="/premium" element={
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
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/test/personality" element={<TestPersonality />} />
                </Routes>
              </Suspense>

              <Toaster />
              <Sonner />
              
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
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
