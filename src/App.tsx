import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HolidayPackage from "./pages/HolidayPackage";
import FindHoliday from "./pages/FindHoliday";
import CoupleTest from "./pages/CoupleTest";
import FamilyHoliday from "./pages/FamilyHoliday";
import Advice from "./pages/Advice";
import RecentSearchesPage from "./pages/RecentSearchesPage";
import CappaLovePremiumPage from "./pages/CappaLovePremiumPage";
import UserProfilePage from "./pages/UserProfilePage";
import Settings from "./pages/Settings";

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

// Properly defined React function component to ensure hooks work correctly
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/holiday-package" element={<HolidayPackage />} />
            <Route path="/find-holiday" element={<FindHoliday />} />
            <Route path="/couple-test" element={<CoupleTest />} />
            <Route path="/family-holiday" element={<FamilyHoliday />} />
            <Route path="/advice" element={<Advice />} />
            <Route path="/recent-searches" element={<RecentSearchesPage />} />
            <Route path="/cappalove-premium" element={<CappaLovePremiumPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
