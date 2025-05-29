import { MapPin, Sparkles, ShoppingBag, Heart, ArrowLeft, Bot, Search, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentSearchesPage = () => {
  const navigate = useNavigate();

  const recentSearches = [
    { title: "Romantic Beach Destinations", icon: MapPin, time: "2 hours ago" },
    { title: "All-Inclusive Packages", icon: ShoppingBag, time: "1 day ago" },
    { title: "Special Anniversary Ideas", icon: Sparkles, time: "3 days ago" },
    { title: "Best Honeymoon Islands", icon: MapPin, time: "1 week ago" },
    { title: "Couples Spa Retreats", icon: Heart, time: "2 weeks ago" },
  ];

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
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent glow-text">
                  Recent Searches
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">Your search history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="glass-card rounded-2xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 sidebar-glow">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow gentle-floating">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 glow-text">
              Your Recent Searches
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              Keep track of your honeymoon planning journey and revisit your favorite searches
            </p>
          </div>

          {/* Search List */}
          <div className="space-y-4 mb-8">
            {recentSearches.map((search, index) => {
              const Icon = search.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 sidebar-chat-glow cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform sidebar-icon-glow">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                      {search.title}
                    </p>
                    <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      {search.time}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 luxury-button gentle-floating"
            >
              <Bot className="w-5 h-5" />
              Start New Search
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 luxury-button sidebar-glow"
            >
              <Sparkles className="w-5 h-5" />
              Clear History
            </button>
          </div>

          {/* Coming Soon Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 sidebar-glow">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 glow-text">More features coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentSearchesPage; 