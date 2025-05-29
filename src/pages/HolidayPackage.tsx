import { ArrowLeft, Bot, Package, Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HolidayPackage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-700 sidebar-header-glow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 rounded-xl hover:bg-white/10 sidebar-glow transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white/60 hover:text-white/90" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent glow-text">
                  Holiday Packages
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">Premium Deals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="glass-card rounded-2xl p-8 backdrop-blur-xl border border-white/10 sidebar-glow text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow gentle-floating">
              <Package className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-semibold text-white mb-4 glow-text">
              Luxury Holiday Packages
            </h2>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              Exclusive honeymoon packages are being curated by our travel experts. Get ready for amazing deals and premium experiences!
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 luxury-button gentle-floating"
              >
                <Bot className="w-5 h-5" />
                Plan Custom Honeymoon
              </button>
              
              <button 
                onClick={() => navigate('/settings')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 luxury-button sidebar-glow"
              >
                <Heart className="w-5 h-5" />
                Notify Me When Ready
              </button>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 sidebar-glow">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 glow-text">Packages coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayPackage;
