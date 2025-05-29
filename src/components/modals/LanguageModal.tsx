import React, { useState } from 'react';
import { X, Globe, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
  ];

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const language = languages.find(lang => lang.code === langCode);
      toast({
        title: "Language Updated! 🌍",
        description: `Language changed to ${language?.name}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change language",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-gemini">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#1f1f1f] glass-elevated rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 sidebar-header-glow border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-gradient rounded-xl sidebar-icon-glow">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white glow-text">
                Choose Language
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 sidebar-glow min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sidebar-icon-glow">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white glow-text mb-2">
              Select Your Language
            </h3>
            <p className="text-gray-400 text-sm">
              Choose your preferred language for the best experience
            </p>
          </div>

          {/* Language List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isLoading}
                className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center gap-4 min-h-[60px] ${
                  selectedLanguage === language.code
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 sidebar-glow'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 glass-card`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{language.flag}</span>
                  <div className="text-left">
                    <div className="text-white font-semibold">{language.name}</div>
                    <div className="text-gray-400 text-sm">{language.native}</div>
                  </div>
                </div>
                
                {selectedLanguage === language.code && (
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {isLoading && selectedLanguage === language.code && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 glass-card p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>More languages coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal; 