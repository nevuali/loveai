import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Users, Shield, Loader2, Heart, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { GoogleAccountSelector } from './GoogleAccountSelector';

interface WelcomeAuthCardProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
}

const WelcomeAuthCard: React.FC<WelcomeAuthCardProps> = ({ 
  onRegisterClick, 
  onLoginClick
}) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const { signInWithGoogle } = useAuth();

  const features = [
    { 
      icon: Heart, 
      text: "Kişiselleştirilmiş Balayı Planları", 
      gradient: "from-pink-500 to-red-500" 
    },
    { 
      icon: Bot, 
      text: "AI Destekli Öneriler", 
      gradient: "from-purple-500 to-indigo-500" 
    },
    { 
      icon: Zap, 
      text: "Anında Rezervasyon Sistemi", 
      gradient: "from-yellow-500 to-orange-500" 
    },
    { 
      icon: Shield, 
      text: "Öncelikli Müşteri Desteği", 
      gradient: "from-green-500 to-teal-500" 
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = () => {
    setShowGoogleSelector(true);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-pink-300/30 to-purple-400/30 rounded-full blur-xl" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-purple-300/30 to-indigo-400/30 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-indigo-300/30 to-pink-400/30 rounded-full blur-xl" />
        <div className="absolute bottom-32 right-10 w-18 h-18 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-3xl blur-xl transform scale-110" />
          
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/60 shadow-2xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-300/15 to-pink-300/15 rounded-full translate-y-12 -translate-x-12" />

            {/* Header */}
            <div className="relative p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative inline-flex items-center justify-center mb-4"
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl"
                >
                  <Heart className="w-10 h-10 text-white" fill="currentColor" />
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2"
              >
                AI LOVVE'a Hoş Geldiniz
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 leading-relaxed"
              >
                Rüya balayınızı planlamaya başlamak için<br />
                lütfen kayıt olun veya giriş yapın 💕
              </motion.p>
            </div>

            {/* Features Showcase */}
            <div className="relative px-8 pb-8">
              <div className="mb-6">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-semibold text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text uppercase tracking-wider mb-4 text-center"
                >
                  ✨ Premium Özellikler ✨
                </motion.h3>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                    className="relative p-5 bg-gradient-to-br from-white/60 to-white/40 rounded-2xl border border-pink-200/50 shadow-lg backdrop-blur-sm overflow-hidden"
                  >
                    {/* Feature background glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${features[currentFeature].gradient} opacity-5 rounded-2xl`} />
                    
                    <div className="relative flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${features[currentFeature].gradient} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300`}>
                        {React.createElement(features[currentFeature].icon, {
                          className: "w-6 h-6 text-white"
                        })}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          {features[currentFeature].text}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Feature indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {features.map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: index === currentFeature ? 1.2 : 1,
                        opacity: index === currentFeature ? 1 : 0.5
                      }}
                      className={`w-2 h-2 rounded-full ${
                        index === currentFeature 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Google Sign-In Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl h-12 font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-purple-50/50 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    {isGoogleLoading ? (
                      <Loader2 className="relative w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="relative w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="relative">
                      {isGoogleLoading ? 'Bağlanıyor...' : 'Google ile Devam Et'}
                    </span>
                  </Button>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
                  <span className="text-sm text-gray-500 px-3 bg-white/50 rounded-full border border-pink-200/50">veya</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onRegisterClick}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl h-12 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-2">
                      <Heart className="w-4 h-4" fill="currentColor" />
                      <span>Hesap Oluştur</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onLoginClick}
                    variant="outline"
                    className="w-full border-2 border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400 rounded-xl h-12 font-medium transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-50/30 to-purple-50/30 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative">Giriş Yap</span>
                  </Button>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-pink-200/60 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>AI destekli balayı deneyimi</span>
                  <Heart className="w-3 h-3 text-purple-400" fill="currentColor" />
                </div>
                <p className="text-xs text-gray-400">
                  AI planlama özelliklerine erişim için üyelik gereklidir
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Google Account Selector */}
      <GoogleAccountSelector
        isOpen={showGoogleSelector}
        onClose={() => setShowGoogleSelector(false)}
        onSuccess={() => {
          // onSuccess burada parent'tan gelmiyor, bu yüzden toast gösterelim
          toast.success('Giriş başarılı! 💕');
        }}
      />
    </>
  );
};

export default WelcomeAuthCard; 