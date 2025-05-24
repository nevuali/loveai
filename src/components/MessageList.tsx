import Message from './Message';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

type MessageType = {
  role: 'user' | 'assistant';
  content: string;
};

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Mesajların sayısı arttığında scroll göstergesini göster
    if (messages.length > 2) {
      setShowScrollIndicator(true);
      setTimeout(() => setShowScrollIndicator(false), 3000);
    }
  }, [messages]);

  // Scroll olayını dinle
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Get more efficient message animation
  const getMessageAnimationDelay = (index: number) => {
    return Math.min(index * 0.05, 0.3); // Cap at 0.3s for faster loading
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setShowScrollIndicator(false), 300);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto relative" ref={containerRef}>
      <motion.div 
        className="w-full max-w-2xl mx-auto px-3 flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {messages.length === 0 && (
          <motion.div 
            className="flex flex-col items-center justify-center h-full opacity-80 py-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="text-5xl mb-3"
              animate={{ 
                y: [0, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                repeatType: "reverse" 
              }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                💖
              </motion.span>
            </motion.div>
            <motion.div 
              className="p-4 rounded-xl text-center mx-4 bg-white/80 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                scale: 1.02
              }}
            >
              <motion.h2 
                className="text-lg font-medium mb-1 text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                Hello!
              </motion.h2>
              <motion.p 
                className="text-center text-gray-600 text-sm max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                I'm here to help with your holiday planning and honeymoon selection.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
        
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: getMessageAnimationDelay(index),
                  type: 'spring',
                  damping: 20
                } 
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.01 }}
              onMouseEnter={() => setFocusedMessageIndex(index)}
              onMouseLeave={() => setFocusedMessageIndex(null)}
              className={`${focusedMessageIndex === index ? 'z-10' : 'z-0'}`}
            >
              <Message {...message} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isLoading && messages.length > 0 && messages[messages.length -1]?.role === 'user' && (
            <motion.div 
              className="flex items-center justify-start py-2 pl-10"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="py-2 px-4 rounded-lg bg-gray-100"
                animate={{ 
                  boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 2px 10px rgba(0,0,0,0.1)", "0 0 0 rgba(0,0,0,0)"]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <TypingIndicator name="AI" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Scroll göstergesi */}
        <AnimatePresence>
          {showScrollIndicator && messages.length > 2 && (
            <motion.div 
              className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-2 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 15L3 8H17L10 15Z" fill="#888888"/>
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} className="py-1" />
      </motion.div>
    </div>
  );
};

export default MessageList;