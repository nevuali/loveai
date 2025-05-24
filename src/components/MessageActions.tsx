import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share, Bookmark, Copy, ThumbsUp, Smile } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MessageActionsProps {
  isUserMessage?: boolean;
}

const MessageActions = ({ isUserMessage = false }: MessageActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [shared, setShared] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  // Get the message text from DOM
  const getMessageText = () => {
    try {
      // Find the closest message container
      const messageContainer = containerRef.current?.closest('.py-3');
      if (!messageContainer) return '';

      // Find message content div inside the container
      const contentDiv = messageContainer.querySelector('.message-content');
      if (!contentDiv) return '';

      return contentDiv.textContent || '';
    } catch (error) {
      console.error('Failed to get message text:', error);
      return '';
    }
  };
  
  const handleCopy = () => {
    const text = getMessageText();
    if (!text) {
      console.error('No text found to copy');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Text copied:', text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(error => {
        console.error('Failed to copy text:', error);
      });
  };
  
  const handleShare = () => {
    const text = getMessageText();
    if (!text) {
      console.error('No text found to share');
      return;
    }
    
    if (navigator.share) {
      navigator.share({
        title: 'CappaLove Honeymoon Message',
        text: text
      })
      .then(() => {
        console.log('Text shared:', text);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      })
      .catch(error => {
        console.error('Failed to share:', error);
        // Fallback to copy
        handleCopy();
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };
  
  return (
    <div className="relative z-50" ref={containerRef}>
      <div className="flex items-center gap-2 mt-1 bg-white/80 px-2 py-1 rounded-full shadow-sm">
        <button
          className={`action-icon-button ${liked ? 'text-pink-500' : 'text-gray-500'}`}
          onClick={() => setLiked(!liked)}
          aria-label="Like message"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-pink-500' : ''}`} />
        </button>
        
        <button
          className="action-icon-button text-gray-500 relative"
          onClick={() => setShowReactions(!showReactions)}
          aria-label="React to message"
        >
          <Smile className="h-4 w-4" />
        </button>
        
        <button
          className={`action-icon-button ${shared ? 'text-blue-500' : 'text-gray-500'}`}
          onClick={handleShare}
          aria-label="Share message"
        >
          <Share className={`h-4 w-4 ${shared ? 'text-blue-500' : ''}`} />
        </button>
        
        <button
          className={`action-icon-button ${saved ? 'text-blue-500' : 'text-gray-500'}`}
          onClick={() => setSaved(!saved)}
          aria-label="Save message"
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-blue-500' : ''}`} />
        </button>
        
        <button
          className={`action-icon-button ${copied ? 'text-green-500' : 'text-gray-500'}`}
          onClick={handleCopy}
          aria-label="Copy message"
        >
          <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : ''}`} />
        </button>
      </div>
      
      {/* Reactions dropdown */}
      {showReactions && (
        <div className="absolute -top-12 left-0 bg-white rounded-full border border-gray-200 shadow-md px-2 py-1 flex gap-1 z-50">
          {reactions.map((emoji, i) => (
            <button
              key={emoji}
              className="hover:bg-gray-100 p-1 rounded-full"
              onClick={() => setShowReactions(false)}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Feedback indicators */}
      <AnimatePresence>
        {copied && (
          <motion.div 
            className="absolute -top-8 right-0 bg-white rounded-md shadow-md px-2 py-1 text-xs text-green-500 border border-green-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Copied!
          </motion.div>
        )}
        
        {shared && (
          <motion.div 
            className="absolute -top-8 right-0 bg-white rounded-md shadow-md px-2 py-1 text-xs text-blue-500 border border-blue-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Shared!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageActions;
