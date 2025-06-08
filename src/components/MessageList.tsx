import Message from './Message';
import { useEffect, useRef, useState, memo, useMemo } from 'react';
import { ArrowDown, Bot, Sparkles, Heart, Cpu, Zap } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import AuthPromptCard from './AuthPromptCard';
import useVirtualScrolling from '../hooks/useVirtualScrolling';

type MessageType = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  imageBase64?: string | null;
  isThinking?: boolean;
};

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
  showAuthPrompt?: boolean;
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  messageCount?: number;
  maxMessages?: number;
}

const MessageList: React.FC<MessageListProps> = memo(({ 
  messages, 
  isLoading, 
  showAuthPrompt = false,
  onRegisterClick,
  onLoginClick,
  messageCount = 3,
  maxMessages = 3
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling configuration
  const ITEM_HEIGHT = 120; // Estimated message height
  const CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 200 : 600; // Dynamic height
  
  // Use virtual scrolling only for large message lists (performance optimization)
  const shouldUseVirtualScrolling = messages.length > 50;
  
  const {
    virtualItems,
    totalHeight,
    scrollElementProps,
    containerProps,
    scrollToBottom: virtualScrollToBottom
  } = useVirtualScrolling({
    items: shouldUseVirtualScrolling ? messages : [],
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 5,
    estimatedItemHeight: ITEM_HEIGHT
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Show scroll indicator when number of messages increases
    if (messages.length > 2) {
      setShowScrollIndicator(true);
      setTimeout(() => setShowScrollIndicator(false), 3000);
    }
  }, [messages]);

  // Listen to scroll events
  useEffect(() => {
    const container = containerRef.current;
    
    const handleScroll = () => {
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        
        if (!isAtBottom && !showScrollIndicator) {
          setShowScrollIndicator(true);
        } else if (isAtBottom && showScrollIndicator) {
          setShowScrollIndicator(false);
        }
      }
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [showScrollIndicator]);

  const scrollToBottom = () => {
    if (shouldUseVirtualScrolling) {
      virtualScrollToBottom('smooth');
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(() => setShowScrollIndicator(false), 300);
  };

  return (
    <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
      <div className="w-full max-w-5xl mx-auto px-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
            {/* AI Avatar with Electric Effects */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-electric-blue to-electric-purple flex items-center justify-center shadow-electric animate-float">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-neon-blue rounded-full animate-electric-pulse flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              
              {/* Floating particles around avatar */}
              <div className="absolute -inset-8 pointer-events-none">
                <div className="absolute top-2 left-2 w-2 h-2 bg-electric-blue rounded-full animate-pulse opacity-60" />
                <div className="absolute bottom-4 right-1 w-1.5 h-1.5 bg-electric-purple rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
                <div className="absolute top-8 right-4 w-1 h-1 bg-neon-blue rounded-full animate-pulse opacity-80" style={{ animationDelay: '2s' }} />
              </div>
            </div>
            
            {/* Welcome Card */}
            <div className="glass-elevated rounded-3xl p-8 mx-4 max-w-lg border border-white/20 shadow-glass-lg relative overflow-hidden">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-electric-purple/5 pointer-events-none" />
              
              <div className="relative z-10 text-center">
                {/* AI Status Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-electric-blue/20 border border-electric-blue/30">
                    <Cpu className="w-3 h-3 text-electric-blue animate-pulse" />
                    <span className="text-xs text-white font-medium">AI Assistant Online</span>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold mb-4 bg-gradient-to-r from-electric-blue to-electric-purple bg-clip-text text-transparent">
                  Hello! I'm AI LOVE ✨
                </h2>
                
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Your intelligent honeymoon assistant is ready to help! I'm here to design your perfect romantic getaway using advanced AI technology. 
                  Let's create an unforgettable experience together! 💕
                </p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="glass rounded-xl p-3 text-center border border-white/10">
                    <Heart className="w-5 h-5 text-electric-blue mx-auto mb-1" />
                    <span className="text-xs text-white/70">Romance</span>
                  </div>
                  <div className="glass rounded-xl p-3 text-center border border-white/10">
                    <Zap className="w-5 h-5 text-electric-purple mx-auto mb-1" />
                    <span className="text-xs text-white/70">AI-Powered</span>
                  </div>
                  <div className="glass rounded-xl p-3 text-center border border-white/10">
                    <Sparkles className="w-5 h-5 text-neon-blue mx-auto mb-1" />
                    <span className="text-xs text-white/70">Personalized</span>
                  </div>
                </div>
                
                {/* Activity indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {shouldUseVirtualScrolling ? (
          // Virtual scrolling for large message lists (50+ messages)
          <div {...scrollElementProps} className="flex-1 overflow-y-auto relative custom-scrollbar">
            <div {...containerProps}>
              {virtualItems.map((virtualItem) => (
                <div
                  key={virtualItem.index}
                  className="animate-fade-in absolute w-full"
                  style={{
                    top: virtualItem.start,
                    height: virtualItem.end - virtualItem.start,
                  }}
                  onMouseEnter={() => setFocusedMessageIndex(virtualItem.index)}
                  onMouseLeave={() => setFocusedMessageIndex(null)}
                >
                  <Message 
                    {...virtualItem.item} 
                    imageBase64={virtualItem.item.imageBase64} 
                    isThinking={virtualItem.item.isThinking} 
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Regular rendering for small message lists (<50 messages)
          messages.map((message, index) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => setFocusedMessageIndex(index)}
              onMouseLeave={() => setFocusedMessageIndex(null)}
            >
              <Message {...message} imageBase64={message.imageBase64} isThinking={message.isThinking} />
            </div>
          ))
        )}
        
        {/* Auth Prompt Card */}
        {showAuthPrompt && onRegisterClick && onLoginClick && (
          <div className="animate-slide-up">
            <AuthPromptCard 
              onRegisterClick={onRegisterClick}
              onLoginClick={onLoginClick}
              messageCount={messageCount}
              maxMessages={maxMessages}
            />
          </div>
        )}
        
        {/* Typing Indicator - if still loading and no thinking message */}
        {isLoading && !messages.some(m => m.isThinking) && (
          <div className="flex justify-start mb-4 animate-fade-in px-4 py-4">
            <div className="glass-card rounded-2xl px-6 py-4 border border-white/10 shadow-glass">
              <TypingIndicator />
            </div>
          </div>
        )}
        
        {/* Invisible div to maintain scroll position */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
      
      {/* Scroll to Bottom Button */}
      {showScrollIndicator && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-r from-electric-blue to-electric-purple 
                     text-white rounded-2xl shadow-electric hover:shadow-electric-lg hover:scale-110 
                     active:scale-95 transition-all duration-300 flex items-center justify-center z-40 
                     animate-bounce border border-white/20 group"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          
          {/* Electric pulse effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-electric-blue to-electric-purple opacity-0 group-hover:opacity-30 transition-opacity animate-pulse" />
        </button>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;