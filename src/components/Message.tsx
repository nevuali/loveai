import { Bot, User, Sparkles } from 'lucide-react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isThinking?: boolean;
}

const Message = ({ role, content, isThinking }: MessageProps) => {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-6 animate-fade-in">
        <div className="flex items-end gap-3 max-w-[80%]">
          <div className="message-user shadow-lg">
            {content}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-gradient flex items-center justify-center flex-shrink-0 shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="flex items-end gap-3 max-w-[80%]">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!isThinking && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center animate-pulse">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        <div className="message-assistant group hover:shadow-xl transition-all duration-300">
          {isThinking ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">AI düşünüyor</span>
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {content.split('\n').map((line, index) => {
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                
                // Enhanced markdown-like formatting
                const processedLine = line
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300 font-semibold">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="text-purple-200">$1</em>')
                  .replace(/`(.*?)`/g, '<code class="bg-white/10 px-2 py-1 rounded text-purple-200 text-sm">$1</code>');
                
                return (
                  <p 
                    key={index} 
                    className="mb-2 last:mb-0 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
