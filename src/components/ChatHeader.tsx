import { Menu, Bot, ChevronDown, LogOut, User, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChatHeaderProps {
  onMenuClick: () => void;
  currentUser: any;
  onLogout: () => void;
}

const ChatHeader = ({ onMenuClick, currentUser, onLogout }: ChatHeaderProps) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="glass-card border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white/70" />
          </button>

          {/* AI LOVE branding */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                AI LOVE
              </h1>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online & Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="relative">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors glass"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white truncate max-w-32">
                    {currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-white/60">Member</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 glass-elevated rounded-2xl border border-white/20 py-3 z-50 shadow-2xl">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm text-white font-medium truncate">{currentUser.email}</p>
                    <p className="text-xs text-white/60 mt-1">AI LOVE Member</p>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-xl mx-2 mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
