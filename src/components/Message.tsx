import { motion, AnimatePresence } from 'framer-motion';
import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { useState, useEffect } from 'react';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

const Message = ({ role, content }: MessageProps) => {
  const [liked, setLiked] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    // Mesaj okundu olarak işaretle - gerçek uygulamada bu sunucuya kaydedilebilir
    const timer = setTimeout(() => {
      setHasBeenRead(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Function to parse and render content with markdown-like formatting
  const renderContent = (text: string) => {
    // Replace **bold text** with bold styled spans
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>');
    
    // Simple emoji handling
    const emojiMap: Record<string, string> = {
      "💕": "emoji-love",
      "💖": "emoji-sparkle-heart",
      "✨": "emoji-sparkle",
      "🌴": "emoji-palm"
    };
    
    // Replace emojis with spans that have special styling
    Object.entries(emojiMap).forEach(([emoji, className]) => {
      formattedText = formattedText.replace(
        new RegExp(emoji, 'g'), 
        `<span class="inline-block emoji ${className}">${emoji}</span>`
      );
    });
    
    // Split by newlines and create paragraphs
    return formattedText.split('\n').map((paragraph, i) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return <br key={i} />;
      
      // Check if this line is a bullet point
      if (paragraph.trim().startsWith('•')) {
        return (
          <motion.div 
            key={i} 
            className="flex items-start gap-2 my-1"
            initial={{ opacity: 0, x: role === 'user' ? 5 : -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * Math.min(i, 3), duration: 0.2 }}
          >
            <motion.span 
              className="text-gray-500"
              whileHover={{ scale: 1.2, color: '#f472b6' }}
            >
              •
            </motion.span>
            <div dangerouslySetInnerHTML={{ __html: paragraph.substring(1) }} />
          </motion.div>
        );
      }
      
      return (
        <motion.p 
          key={i} 
          className="mb-1 break-words" 
          dangerouslySetInnerHTML={{ __html: paragraph }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * Math.min(i, 3), duration: 0.2 }}
        />
      );
    });
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', damping: 15 }
    },
    hover: { scale: 1.01 }
  };

  // Handle double tap/click on message
  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setShowParticles(true);
      setTimeout(() => {
        setLiked(false);
        setShowParticles(false);
      }, 1500);
    }
  };

  // Mesajı vurgulama
  const handleHighlight = () => {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1000);
  };
  
  // Minimalist style
  const getMessageStyle = () => {
    const baseStyle = {
      position: 'relative' as const,
      zIndex: 1,
      transition: 'all 0.3s ease'
    };
    
    if (role === 'user') {
      return {
        ...baseStyle,
        background: isHighlighted ? 'linear-gradient(135deg, #c4e0ff, #e9f1ff)' : '#e9f1ff',
        borderRadius: '16px 16px 4px 16px'
      };
    } else {
      return {
        ...baseStyle,
        background: isHighlighted ? 'linear-gradient(135deg, #f9f9f9, #f0f0f0)' : '#f9f9f9',
        borderRadius: '16px 16px 16px 4px'
      };
    }
  };
  
  // Particles for heart animation
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 60 - 30,
    y: -(Math.random() * 50 + 20),
    size: Math.random() * 6 + 4,
    rotation: Math.random() * 360,
    opacity: Math.random() * 0.5 + 0.5,
  }));

  return (
    <motion.div 
      className="py-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className={`flex gap-2 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
          whileHover={{ scale: 1.1 }}
        >
          <MessageAvatar isAssistant={role === 'assistant'} />
          
          {/* Okundu bilgisi / durumu */}
          {role === 'user' && hasBeenRead && (
            <motion.div 
              className="flex justify-center mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" className="text-blue-500 fill-current">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </motion.div>
          )}
        </motion.div>
        
        <div className={`flex-1 ${role === 'user' ? 'flex justify-end' : ''} relative max-w-[80%]`}>
          <motion.div 
            className={`py-2 px-3 overflow-hidden relative z-1`}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onDoubleClick={handleDoubleTap}
            onClick={handleHighlight}
            style={getMessageStyle()}
            layout
          >
            <AnimatePresence>
              {isHighlighted && (
                <motion.div 
                  className="absolute inset-0 bg-pink-100/20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
            <div className="max-w-full overflow-hidden break-all whitespace-normal hyphens-auto message-content">
              {renderContent(content)}
            </div>
          </motion.div>
          
          {/* Heart animation on double tap */}
          <AnimatePresence>
            {liked && (
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <span className="text-3xl">❤️</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Particles animation for extra flair */}
          <AnimatePresence>
            {showParticles && particles.map(particle => (
              <motion.div
                key={particle.id}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-lg pointer-events-none z-10"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: particle.opacity, 
                  rotate: 0
                }}
                animate={{ 
                  x: particle.x, 
                  y: particle.y, 
                  scale: particle.size / 10,
                  opacity: [particle.opacity, 0],
                  rotate: particle.rotation 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8 + Math.random() * 0.5,
                  ease: "easeOut"
                }}
                style={{
                  background: `hsl(${340 + Math.random() * 40}, 100%, 70%)`,
                }}
              />
            ))}
          </AnimatePresence>
          
          {/* Aksiyon butonları - sadece asistan mesajlarında görünsün */}
          {role === 'assistant' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="ml-1 mt-1"
              style={{ position: 'relative', zIndex: 10 }}
            >
              <MessageActions isUserMessage={false} />
            </motion.div>
          )}
          
          {/* Zaman bilgisi */}
          <motion.div
            className={`text-xs text-gray-400 mt-1 ${role === 'user' ? 'text-right mr-1' : 'ml-1'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5 }}
          >
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
