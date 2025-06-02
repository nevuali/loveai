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
    <header className="gemini-header">
      <div className="flex-between">
        {/* Left side */}
        <div className="flex-start gap-3 md:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="gemini-menu-button lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* AI LOVE branding */}
          <div className="flex-start gap-3 md:gap-4">
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 flex-center shadow-md">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex-center animate-pulse">
                <Sparkles className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="gemini-title">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  AI LOVE
                </span>
              </h1>
              <div className="flex-start gap-2 text-xs md:text-sm text-green-400">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
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
                className="gemini-profile"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 flex-center shadow-md">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs md:text-sm font-medium text-primary truncate max-w-24 md:max-w-32">
                    {currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-secondary">Member</p>
                </div>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  
                  {/* Dropdown menu */}
                  <div className="gemini-dropdown-menu absolute right-0 top-full mt-2 w-64 md:w-72 py-2 z-50 animate-scale-in">
                    <div className="gemini-dropdown-header">
                      <p className="user-name truncate">{currentUser.email}</p>
                      <p className="user-email">AI LOVE Member</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserMenuOpen(false);
                        }}
                        className="gemini-dropdown-item"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 flex-center shadow-md">
              <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
