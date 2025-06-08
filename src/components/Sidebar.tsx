import { Plus, Bot, Settings, HelpCircle, X, Sparkles, Heart, MapPin, Zap, Search, Menu, Users, Calendar } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userStatus: string;
  setUserStatus: (status: any) => void;
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  initiateAIChat: (message: string) => void;
  onStartProfileAnalysis: () => void;
  onStartHoneymoonPlanner: () => void;
}

const Sidebar = ({ isOpen, onClose, initiateAIChat, onStartProfileAnalysis, onStartHoneymoonPlanner }: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [chatHistory] = useState([
    { id: '1', title: 'Honeymoon Planning Guide', messages: 12, lastMessage: '2 hours ago' },
    { id: '2', title: 'Romantic Destinations', messages: 8, lastMessage: '1 day ago' },
    { id: '3', title: 'Luxury Package Details', messages: 15, lastMessage: '3 days ago' },
    { id: '4', title: 'Travel Budget Planning', messages: 6, lastMessage: '1 week ago' }
  ]);

  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPrompts = [
    { 
      icon: Users, 
      text: "Profil Analizi", 
      description: "Sizi tanıyalım",
      action: () => onStartProfileAnalysis(),
      gradient: "from-purple-600 to-purple-500",
      isSpecial: true
    },
    { 
      icon: Calendar, 
      text: "Balayı Planlayıcı", 
      description: "Adım adım planla",
      action: () => onStartHoneymoonPlanner(),
      gradient: "from-pink-600 to-rose-500",
      isSpecial: true
    },
    { 
      icon: Bot, 
      text: "AI Planner", 
      description: "Smart honeymoon planning",
      action: "I want AI to plan my perfect honeymoon step by step.",
      gradient: "from-amber-600 to-yellow-500"
    },
    { 
      icon: MapPin, 
      text: "Destinations", 
      description: "Explore romantic places",
      action: "Show me the most romantic honeymoon destinations.",
      gradient: "from-yellow-500 to-amber-400"
    },
    { 
      icon: Heart, 
      text: "Luxury Packages", 
      description: "Premium experiences",
      action: "I'm interested in luxury honeymoon packages and VIP services.",
      gradient: "from-amber-700 to-amber-500"
    },
    { 
      icon: Zap, 
      text: "Quick Match", 
      description: "Instant recommendations",
      action: "Give me quick honeymoon recommendations based on my preferences.",
      gradient: "from-yellow-600 to-amber-600"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`gemini-sidebar ${isOpen ? 'open' : ''}`}>
        {/* NEW HEADER DESIGN - No old classes */}
        <div className="px-6 py-4 border-b border-white/10">
          {/* AI LOVE Branding */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                  <Sparkles className="w-1.5 h-1.5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  AI LOVE
                </h2>
                <p className="text-xs text-green-400 font-medium">Assistant Online</p>
              </div>
            </div>
            
            {/* Close button */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/60 transition-all duration-200"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 ACTION BUTTONS - COMPLETELY NEW */}
          <div className="space-y-3">
            {/* Action Buttons Row */}
            <div className="flex gap-2">
              {/* Menu */}
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-amber-500/40 rounded-lg py-2.5 px-3 flex flex-col items-center gap-1 transition-all duration-200"
              >
                <Menu className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/80 font-medium">Menu</span>
              </button>

              {/* New Chat */}
              <button 
                onClick={() => {
                  initiateAIChat("Hello! I'd like to start planning my dream honeymoon.");
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 rounded-lg py-2.5 px-3 flex flex-col items-center gap-1 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">New</span>
              </button>

              {/* Search */}
              <button 
                onClick={() => setIsSearchActive(!isSearchActive)}
                className={`flex-1 rounded-lg py-2.5 px-3 flex flex-col items-center gap-1 transition-all duration-200 ${
                  isSearchActive 
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-lg' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-amber-500/40 text-white/80'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="text-xs font-medium">Search</span>
              </button>
            </div>

            {/* Search Box - Only when active */}
            {isSearchActive && (
              <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder-white/50 focus:border-amber-500/50 focus:outline-none transition-all"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-2 text-xs text-amber-300/80">
                    {filteredChats.length} conversations found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Start - Hide when searching */}
        {!isSearchActive && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Suggestions</h3>
            </div>
            <div className="space-y-3">
              {quickPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (prompt.isSpecial && typeof prompt.action === 'function') {
                        prompt.action();
                        onClose();
                      } else if (typeof prompt.action === 'string') {
                        initiateAIChat(prompt.action);
                        onClose();
                      }
                    }}
                    className="w-full p-4 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-3 text-left group glass hover:glass-elevated"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prompt.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                        {prompt.text}
                      </p>
                      <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                        {prompt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              {isSearchActive && searchQuery ? `Search Results (${filteredChats.length})` : 'History'}
            </h3>
          </div>
          <div className="space-y-2">
            {(isSearchActive && searchQuery ? filteredChats : chatHistory).map((chat) => (
              <button
                key={chat.id}
                className="w-full p-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-left group glass hover:glass-elevated"
                onClick={onClose}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/30 transition-colors">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors line-clamp-2 mb-1">
                      {chat.title}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/50 group-hover:text-white/70 transition-colors">
                      <span>{chat.messages} messages</span>
                      <span>{chat.lastMessage}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {isSearchActive && searchQuery && filteredChats.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-amber-400/40" />
                <p className="text-white/60 text-sm">No conversations found</p>
                <p className="text-white/40 text-xs mt-1">Try different keywords</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="p-3 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group glass hover:glass-elevated"
              onClick={onClose}
            >
              <Settings className="w-5 h-5 text-white/60 group-hover:text-white/80" />
              <span className="text-xs text-white/60 group-hover:text-white/80">Settings</span>
            </button>
            <button 
              className="p-3 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group glass hover:glass-elevated"
              onClick={onClose}
            >
              <HelpCircle className="w-5 h-5 text-white/60 group-hover:text-white/80" />
              <span className="text-xs text-white/60 group-hover:text-white/80">Help</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
