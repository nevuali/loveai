import { useState, useRef } from 'react';
import { Send, Image, Bot, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string | null) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || imagePreview) {
      onSendMessage(message.trim(), imagePreview);
      setMessage('');
      setImagePreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
        <div className="mb-4 p-3 glass-card rounded-2xl">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-40 max-h-40 rounded-xl object-cover shadow-lg"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3">
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl hover:bg-white/10 transition-colors text-white/60 hover:text-white glass hover:glass-elevated"
          >
            <Image className="w-6 h-6" />
          </button>

          {/* Message input container */}
          <div className="flex-1 relative">
            <div className="glass-card rounded-3xl border border-white/20 focus-within:border-purple-400/50 transition-all duration-300">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AI LOVE ile konuşmaya başlayın..."
                className="w-full p-6 pr-16 bg-transparent text-white placeholder-white/50 resize-none min-h-[60px] max-h-40 rounded-3xl focus:outline-none"
                rows={1}
                disabled={isLoading}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />
              
              {/* Send button */}
              <button
                type="submit"
                disabled={(!message.trim() && !imagePreview) || isLoading}
                className="absolute right-3 bottom-3 p-3 rounded-2xl bg-purple-gradient hover:bg-purple-gradient-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <div className="loading-dot bg-white"></div>
                    <div className="loading-dot bg-white"></div>
                    <div className="loading-dot bg-white"></div>
                  </div>
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between mt-4 px-2 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <div className="relative">
              <Bot className="w-4 h-4 text-purple-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span>AI LOVE hazır ve bekliyor</span>
          </div>
          <span className="text-white/40 text-xs hidden sm:block">
            Enter ile gönder, Shift+Enter ile yeni satır
          </span>
        </div>

        {/* Quick suggestions */}
        {!message && !imagePreview && (
          <div className="flex items-center gap-2 mt-3 px-2">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setMessage("Balayı planlamaya nereden başlamalıyım?")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Balayı planı
              </button>
              <button
                type="button"
                onClick={() => setMessage("En romantik destinasyonları göster")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Romantik yerler
              </button>
              <button
                type="button"
                onClick={() => setMessage("Lüks paketler neler?")}
                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Lüks paketler
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default ChatInput;
