import { useState, useRef, memo, useCallback } from 'react';
import { Send, Image, Bot, Sparkles } from 'lucide-react';
import VoiceInput from './VoiceInput';
import ImageUpload from './ImageUpload';
import { useDebouncedCallback } from '../hooks/useDebounce';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string | null) => void;
  isLoading: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const ChatInput = memo(({ onSendMessage, isLoading, onTypingStart, onTypingStop }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounced typing stop callback
  const [debouncedTypingStop] = useDebouncedCallback(() => {
    onTypingStop?.();
  }, 1500);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || imagePreview) {
      onSendMessage(message.trim(), imagePreview);
      setMessage('');
      setImagePreview(null);
      onTypingStop?.();
    }
  }, [message, imagePreview, onSendMessage, onTypingStop]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Trigger typing start only if this is the first character
    if (newMessage.length === 1 && message.length === 0) {
      onTypingStart?.();
    }
    
    // Reset the debounced typing stop timer
    debouncedTypingStop();
  }, [message.length, onTypingStart, debouncedTypingStop]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-6 p-mobile md:p-tablet">
          <div className="glass-card rounded-2xl p-4 inline-block">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-40 max-h-40 rounded-xl object-cover shadow-lg border border-default"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex-center text-sm hover:scale-110 transition-transform shadow-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 md:gap-4">
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost p-3 md:p-4 rounded-2xl flex-shrink-0 w-12 h-12 md:w-14 md:h-14 flex-center"
            disabled={isLoading}
          >
            <Image className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
          </button>

          {/* Message input container - Improved wrapper */}
          <div className="flex-1 relative">
            <div className="glass-elevated rounded-3xl border border-default shadow-lg transition-all duration-300">
              <textarea
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="AI LOVE ile konuşmaya başlayın..."
                className="w-full p-4 md:p-6 pr-16 md:pr-20 bg-transparent text-primary placeholder-tertiary resize-none min-h-[48px] md:min-h-[60px] max-h-32 md:max-h-40 rounded-3xl focus:outline-none font-medium"
                rows={1}
                disabled={isLoading}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />
              
              {/* Action buttons */}
              <div className="absolute right-2 md:right-3 bottom-2 md:bottom-3 flex items-center gap-1 md:gap-2">
                {/* Image Upload Button */}
                <ImageUpload
                  onImageSelect={(base64) => setImagePreview(base64)}
                  onImageClear={() => setImagePreview(null)}
                  currentImage={imagePreview}
                  size="md"
                  disabled={isLoading}
                  showPreview={true}
                />
                
                {/* Voice Input Button */}
                <VoiceInput
                  onTranscript={(text) => {
                    setMessage(prev => prev + (prev ? ' ' : '') + text);
                  }}
                  onError={(error) => {
                    console.error('Voice input error:', error);
                  }}
                  size="md"
                  disabled={isLoading}
                />
                
                {/* Send button */}
                <button
                  type="submit"
                  disabled={isLoading || (!message.trim() && !imagePreview)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex-center group overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-500 text-white"
                >
                {isLoading ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                    {/* Gold pulse effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-400 opacity-0 group-hover:opacity-30 transition-opacity animate-pulse" />
                  </>
                )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between mt-4 px-2 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <div className="relative">
              <Bot className="w-4 h-4 text-amber-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span>AI LOVE hazır ve bekliyor</span>
          </div>
          <span className="text-white/40 text-xs hidden sm:block">
            📸 Fotoğraf | 🎤 Mikrofon | Enter ile gönder | Shift+Enter ile yeni satır
          </span>
        </div>

        {/* Quick suggestions */}
        {!message && !imagePreview && (
          <div className="mt-4 px-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300/80 font-medium">Quick suggestions</span>
            </div>
            <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setMessage("Balayı planlamaya nereden başlamalıyım?")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-amber-500/20 rounded-full text-white/70 hover:text-white hover:bg-amber-500/10 transition-colors whitespace-nowrap"
              >
                Balayı planı
              </button>
              <button
                type="button"
                onClick={() => setMessage("En romantik destinasyonları göster")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-amber-500/20 rounded-full text-white/70 hover:text-white hover:bg-amber-500/10 transition-colors whitespace-nowrap"
              >
                Romantik yerler
              </button>
              <button
                type="button"
                onClick={() => setMessage("Lüks paketler neler?")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-amber-500/20 rounded-full text-white/70 hover:text-white hover:bg-amber-500/10 transition-colors whitespace-nowrap"
              >
                Lüks paketler
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
