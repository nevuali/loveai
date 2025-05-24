import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Send, Image, X, Mic, Smile, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ChatInput = ({ onSendMessage, isLoading, className = "" }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [lastTypedTime, setLastTypedTime] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();
  
  // Handle mobile keyboard and viewport adjustments
  useEffect(() => {
    const handleResize = () => {
      // Fix for mobile browsers: scroll to input when keyboard appears
      if (isFocused && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFocused]);

  // Yazma önerilerini göster/gizle
  useEffect(() => {
    if (message.trim().length > 0) {
      setLastTypedTime(Date.now());
      
      // Kullanıcı yazıyı durdurduğunda önerileri göster
      const timeoutId = setTimeout(() => {
        // En az 3 karakter varsa önerileri göster
        if (message.trim().length >= 3 && !suggestionSelected) {
          setShowSuggestions(true);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
    }
  }, [message, suggestionSelected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || imagePreview) && !isLoading) {
      // In a real app, we'd handle the image upload here
      onSendMessage(imagePreview ? `${message} [Image attached]` : message);
      setMessage("");
      setImagePreview(null);
      setShowSuggestions(false);
      setSuggestionSelected(false);
      
      // Blur input after sending (helps on mobile)
      if (inputRef.current) {
        inputRef.current.blur();
      }
      
      // Animate the send button
      controls.start({
        scale: [1, 1.2, 1],
        rotate: [0, 15, 0],
        transition: { duration: 0.3 }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleRecordStart = () => {
    setIsRecording(true);
    
    // Simulate recording for demo purposes
    recordingTimeoutRef.current = setTimeout(() => {
      setIsRecording(false);
      setMessage((prev) => prev + " [Voice message transcribed]");
    }, 3000);
  };
  
  const handleRecordStop = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    setIsRecording(false);
  };

  // Yazma önerileri (gerçek uygulamada API'den gelebilir)
  const suggestions = [
    "Can you recommend a honeymoon destination for us?",
    "We're looking for a romantic place with a beach",
    "What are your most popular packages?"
  ].filter(s => message.length > 0 && s.toLowerCase().includes(message.toLowerCase()) && message.length >= 3);

  const applySuggestion = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    setSuggestionSelected(true);
    inputRef.current?.focus();
  };

  // Recording animation
  const recordingAnimation = {
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      repeatType: "loop" as const,
      duration: 1
    }
  };
  
  // Modern minimalist style
  const minimalistStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  };

  return (
    <motion.div 
      className={`relative w-full chat-input-container safe-area-bottom px-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence>
        {imagePreview && (
          <motion.div 
            className="mb-2 photo-preview w-20 h-20 mx-2 rounded-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="relative w-full h-full">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <motion.button 
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                onClick={handleRemoveImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-3 w-3" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.form 
        className="relative flex items-center py-2"
        onSubmit={handleSubmit}
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <div className="relative w-full">
          <motion.div 
            className="flex items-center p-1" 
            style={minimalistStyle}
            animate={{
              boxShadow: isFocused 
                ? '0 4px 12px rgba(0,0,0,0.08)'
                : '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            {/* Image upload button */}
            <motion.button
              type="button" 
              className="h-9 w-9 flex items-center justify-center rounded-full mx-1 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(236, 252, 203, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerFileInput}
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Image className="h-4 w-4 text-gray-500" />
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </motion.button>
            
            {/* Text input with custom effects */}
            <div className="relative flex-1">
              <motion.input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Ask about your perfect honeymoon..."
                disabled={isLoading}
                className="w-full py-2 px-2 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 text-sm"
                // iOS specific attributes
                autoComplete="off"
                autoCorrect="on"
                spellCheck="true"
                autoCapitalize="sentences"
              />
              
              {/* Yazma indikatörü */}
              {isFocused && message.length > 0 && !isLoading && (
                <motion.div 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Sparkles className="h-3 w-3 text-blue-400 opacity-70" />
                </motion.div>
              )}
              
              {/* Yazma önerileri */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div 
                    className="absolute top-0 left-0 right-0 transform -translate-y-full bg-white rounded-lg shadow-lg overflow-hidden z-10 border border-gray-100"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.div 
                        key={index}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        onClick={() => applySuggestion(suggestion)}
                        whileHover={{ 
                          backgroundColor: "rgba(219, 234, 254, 0.8)",
                          x: 2
                        }}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="font-medium text-blue-600">{suggestion}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center">
              {!message.trim() ? (
                <motion.button
                  type="button"
                  className={`h-9 w-9 flex items-center justify-center rounded-full mx-1 ${isRecording ? 'bg-red-500' : 'hover:bg-gray-100'} transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isRecording ? recordingAnimation : undefined}
                  onTouchStart={handleRecordStart}
                  onTouchEnd={handleRecordStop}
                  onMouseDown={handleRecordStart}
                  onMouseUp={handleRecordStop}
                  onMouseLeave={() => isRecording && handleRecordStop()}
                  title="Voice message"
                >
                  <Mic className={`h-4 w-4 ${isRecording ? 'text-white' : 'text-gray-500'}`} />
                  
                  {/* Recording pulse animation */}
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(239, 68, 68, 0.7)',
                          '0 0 0 10px rgba(239, 68, 68, 0)',
                        ],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                      }}
                    />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`h-9 w-9 flex items-center justify-center rounded-full mx-1 ${isLoading ? 'bg-gray-200' : 'bg-blue-500'} transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={controls}
                  title="Send"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.form>
      
      {/* İlham verici not */}
      <AnimatePresence>
        {message.length > 20 && (
          <motion.div
            className="w-full text-center mt-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <motion.span 
              className="text-xs text-gray-400 italic"
              animate={{ 
                color: ['#9ca3af', '#60a5fa', '#9ca3af'],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Creating perfect honeymoon moments...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatInput;
