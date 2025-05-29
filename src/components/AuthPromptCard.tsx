import React from 'react';
import { motion } from 'framer-motion';
import { Heart, User, Mail, Lock, Phone, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthPromptCardProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
  messageCount?: number;
  maxMessages?: number;
}

const AuthPromptCard: React.FC<AuthPromptCardProps> = ({ 
  onRegisterClick, 
  onLoginClick, 
  messageCount = 3, 
  maxMessages = 3 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="w-full max-w-md mx-auto my-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 via-white to-purple-50 border border-pink-200 shadow-xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-300/20 to-purple-300/20 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative p-6">
          {/* Header with icon */}
          <div className="text-center mb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-3 shadow-lg"
            >
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Mesaj Limitiniz Doldu! 💕
            </h3>
            
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex gap-1">
                {Array.from({ length: maxMessages }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < messageCount 
                        ? 'bg-gradient-to-r from-pink-400 to-purple-500' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {messageCount}/{maxMessages}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700 leading-relaxed">
              Konuşmaya devam etmek için <span className="font-semibold text-pink-600">üye olun</span> 
              {" "}veya <span className="font-semibold text-purple-600">giriş yapın</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Üyelikle sınırsız mesaj + özel özellikler! ✨
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white/60 rounded-xl p-4 mb-6 border border-pink-100">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-800">Üyelik Avantajları</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Sınırsız mesaj gönderimi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Kişiselleştirilmiş öneriler</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Premium balayı paketleri</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onRegisterClick}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <User className="w-5 h-5 mr-2" />
              Üye Ol (Ücretsiz)
            </Button>
            
            <Button
              onClick={onLoginClick}
              variant="outline"
              className="w-full border-2 border-pink-300 text-pink-700 hover:bg-pink-50 font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Lock className="w-5 h-5 mr-2" />
              Giriş Yap
            </Button>
          </div>

          {/* Chat alternative */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              💬 <strong>Chat üzerinden de kayıt olabilirsiniz!</strong><br/>
              <code className="bg-blue-100 px-1 rounded">/kayit</code> yazın veya bilgilerinizi doğrudan gönderin
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthPromptCard; 