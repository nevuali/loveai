import React from "react";
import { Menu } from "lucide-react";

interface ChatHeaderProps {
  onMenuClick?: () => void;
}

const ChatHeader = ({ onMenuClick }: ChatHeaderProps) => {
  return (
    <header 
      className="fixed top-0 border-b border-cappalove-border z-30 bg-white bg-opacity-95 backdrop-blur-sm safe-area-top 
                 left-0 right-0 w-full sm:left-64 sm:w-[calc(100%-16rem)]"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(60px + env(safe-area-inset-top, 0px))'
      }}
    >
      <div className="grid grid-cols-3 h-full items-center px-4">
        {/* Left section */}
        <div className="flex items-center">
          {onMenuClick && (
            <button 
              onClick={onMenuClick} 
              className="sm:hidden p-2 rounded-full hover:bg-cappalove-hover focus:outline-none touch-target flex items-center justify-center mr-2"
              style={{ 
                width: '38px', 
                height: '38px',
                transition: 'all 0.2s ease'
              }}
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          )}
          
          <span className="flex items-center">
            <span className="text-xl font-medium text-gray-800">LoveAI</span>
            <span className="ml-2 bg-cappalove-peach/20 text-gray-700 py-1 px-2 rounded-full text-xs">
              1.0.2
            </span>
          </span>
        </div>
        
        {/* Center section - empty */}
        <div className="flex items-center justify-center">
        </div>
        
        {/* Right section */}
        <div className="flex justify-end">
          <div className="bg-cappalove-blue/20 text-gray-700 py-1 px-3 rounded-md text-sm">
            PRO
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
