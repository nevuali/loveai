import { Plus, Bot, Settings, HelpCircle, X, Sparkles, Heart, MapPin, Zap } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userStatus: string;
  setUserStatus: (status: any) => void;
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  initiateAIChat: (message: string) => void;
}

const Sidebar = ({ isOpen, onClose, initiateAIChat }: SidebarProps) => {
  const [chatHistory] = useState([
    { id: '1', title: 'Honeymoon Planning Guide', messages: 12, lastMessage: '2 hours ago' },
    { id: '2', title: 'Romantic Destinations', messages: 8, lastMessage: '1 day ago' },
    { id: '3', title: 'Luxury Package Details', messages: 15, lastMessage: '3 days ago' },
    { id: '4', title: 'Travel Budget Planning', messages: 6, lastMessage: '1 week ago' }
  ]);

  const quickPrompts = [
    { 
      icon: Bot, 
      text: "AI Planner", 
      description: "Smart honeymoon planning",
      action: "I want AI to plan my perfect honeymoon step by step.",
      gradient: "from-purple-500 to-blue-500"
    },
    { 
      icon: MapPin, 
      text: "Destinations", 
      description: "Explore romantic places",
      action: "Show me the most romantic honeymoon destinations.",
      gradient: "from-pink-500 to-purple-500"
    },
    { 
      icon: Heart, 
      text: "Luxury Packages", 
      description: "Premium experiences",
      action: "I'm interested in luxury honeymoon packages and VIP services.",
      gradient: "from-red-500 to-pink-500"
    },
    { 
      icon: Zap, 
      text: "Quick Match", 
      description: "Instant recommendations",
      action: "Give me quick honeymoon recommendations based on my preferences.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 mobile-backdrop z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-80 lg:w-full h-full
        transform transition-transform duration-300 ease-out transform-gpu
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        glass-card border-r border-white/10 flex flex-col backdrop-blur-xl
        shadow-2xl lg:shadow-none
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10 sidebar-header-glow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center subtle-pulse">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent glow-text">
                  AI LOVE
                </h2>
                <p className="text-sm text-green-400 font-medium">Assistant Online</p>
              </div>
            </div>
            {/* Close button - always visible on mobile */}
            <button 
              onClick={onClose} 
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 sidebar-glow transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5 text-white/60 hover:text-white/90" />
            </button>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={() => {
              initiateAIChat("Hello! I'd like to start planning my dream honeymoon.");
              onClose(); // Close sidebar on mobile after action
            }}
            className="w-full btn-primary flex items-center justify-center gap-3 text-sm font-medium py-4 rounded-2xl hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-5 h-5" />
            New Honeymoon Chat
          </button>
        </div>

        {/* Quick Start */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 glow-text">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Quick Start
          </h3>
          <div className="space-y-3">
            {quickPrompts.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    initiateAIChat(prompt.action);
                    onClose(); // Close sidebar on mobile after action
                  }}
                  className="w-full p-4 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-3 text-left group glass hover:glass-elevated sidebar-glow"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prompt.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform sidebar-icon-glow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
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

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 glow-text">
            <Bot className="w-4 h-4 text-purple-400" />
            Recent Chats
          </h3>
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                className="w-full p-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-left group glass hover:glass-elevated sidebar-chat-glow"
                onClick={onClose} // Close sidebar when chat is selected on mobile
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors sidebar-icon-glow">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
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
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="p-3 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group glass hover:glass-elevated sidebar-glow"
              onClick={onClose} // Close sidebar when navigating on mobile
            >
              <Settings className="w-5 h-5 text-white/60 group-hover:text-white/80" />
              <span className="text-xs text-white/60 group-hover:text-white/80">Settings</span>
            </button>
            <button 
              className="p-3 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group glass hover:glass-elevated sidebar-glow"
              onClick={onClose} // Close sidebar when navigating on mobile
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
