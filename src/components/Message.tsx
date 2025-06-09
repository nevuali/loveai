import React, { memo } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isThinking?: boolean;
  imageBase64?: string | null;
  actionData?: any;
  onCardClick?: (cardId: string, cardData: any) => void;
}

const Message = memo(({ role, content, isThinking, imageBase64, actionData, onCardClick }: MessageProps) => {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4 md:mb-6 animate-fade-in">
        <div className="flex items-end gap-3 max-w-[85%] md:max-w-[80%]">
          <div className="message-user text-sm md:text-base leading-relaxed">
            {imageBase64 && (
              <div className="mb-3">
                <img 
                  src={imageBase64} 
                  alt="User uploaded" 
                  className="max-w-full h-auto rounded-xl shadow-md border border-white/20" 
                />
              </div>
            )}
            {content}
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 flex-center flex-shrink-0 shadow-md">
            <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 md:mb-6 animate-fade-in">
      <div className="flex items-start gap-3 max-w-[90%] md:max-w-[85%]">
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 mt-1">
          <div className="w-full h-full rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 flex-center shadow-md">
            <span className="text-lg md:text-xl">✨</span>
          </div>
          {!isThinking && (
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex-center animate-pulse">
              <Sparkles className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
            </div>
          )}
        </div>
        <div className="message-assistant text-sm md:text-base leading-relaxed flex-1">
          {isThinking ? (
            <div className="flex items-center gap-3 text-secondary">
              <span className="text-sm md:text-base">AI thinking</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Content with formatting preserved */}
              <div 
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: content
                    .replace(/\*\*PROFIL_ANALYSIS_CARDS\*\*/g, '')
                    .replace(/\*\*HONEYMOON_PLANNER_CARDS\*\*/g, '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                    .replace(/`(.*?)`/g, '<code class="px-2 py-1 bg-surface rounded text-sm font-mono">$1</code>')
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/\n/g, '<br>')
                }}
              />
              
              {/* Render AI Cards */}
              {(content.includes('**PROFIL_ANALYSIS_CARDS**') || content.includes('**HONEYMOON_PLANNER_CARDS**')) && actionData?.options && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {actionData.options.map((option: any, index: number) => (
                      <button
                        key={option.id}
                        onClick={() => onCardClick?.(option.id, option)}
                        className="gemini-chat-item p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl flex-shrink-0">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                              {option.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;
