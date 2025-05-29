import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { GoogleAccountSelector } from './GoogleAccountSelector';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    phone: ''
  });

  const { login, register, signInWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Hoş geldiniz! 💕');
        onClose();
      } else {
        setError('Email veya şifre hatalı');
      }
    } catch (error: any) {
      setError('Bir hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await register({
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      
      if (success) {
        toast.success('Kayıt başarılı! Hoş geldiniz! 💕');
        onClose();
      } else {
        setError('Kayıt işlemi başarısız');
      }
    } catch (error: any) {
      setError('Kayıt yapılırken bir hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setShowGoogleSelector(true);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ email: '', password: '', name: '', surname: '', phone: '' });
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-3xl blur-xl transform scale-110" />
            
            {/* Main modal */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-pink-200/60 shadow-2xl p-8 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-300/30 to-purple-400/30 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-300/20 to-pink-300/20 rounded-full translate-y-12 -translate-x-12" />

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border border-pink-200/50 z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Header */}
              <div className="relative text-center mb-8">
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
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl"
                  >
                    <Heart className="w-8 h-8 text-white" fill="currentColor" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
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
                  AI LOVVE
                </motion.h1>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-semibold text-gray-800 mb-2"
                >
                  {mode === 'login' ? 'Tekrar Hoş Geldiniz! 💕' : 'Hesap Oluşturun 🌟'}
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-sm"
                >
                  {mode === 'login' 
                    ? 'Rüya balayınızı planlamaya devam edin' 
                    : 'AI destekli balayı deneyimini keşfedin'
                  }
                </motion.p>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5" />
                    <div className="relative">{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onSubmit={mode === 'login' ? handleLogin : handleRegister}
                className="space-y-4 relative"
              >
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                          <Input
                            type="text"
                            placeholder="Adınız"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10 h-12 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400/20 bg-pink-50/50 placeholder:text-pink-400/70"
                            required
                          />
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                          <Input
                            type="text"
                            placeholder="Soyadınız"
                            value={formData.surname}
                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                            className="pl-10 h-12 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 bg-purple-50/50 placeholder:text-purple-400/70"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                  <Input
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400/20 bg-pink-50/50 placeholder:text-pink-400/70"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifreniz"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 bg-purple-50/50 placeholder:text-purple-400/70"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white h-12 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{mode === 'login' ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4" fill="currentColor" />
                          <span>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
              </motion.form>

              {/* Google Sign In */}
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">veya</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-purple-50/50 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <svg className="relative w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="relative text-sm font-medium">
                  {isLoading ? 'Bağlanıyor...' : 'Google ile devam et'}
                </span>
              </motion.button>

              {/* Mode Switch */}
              <div className="mt-6 text-center relative">
                <p className="text-gray-600 text-sm">
                  {mode === 'login' ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={switchMode}
                    className="ml-2 font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
                  >
                    {mode === 'login' ? 'Kayıt olun' : 'Giriş yapın'}
                  </motion.button>
                </p>
              </div>

              {/* AI LOVVE branding footer */}
              <div className="mt-6 pt-4 border-t border-gray-200/60 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>AI destekli balayı deneyimi</span>
                  <Heart className="w-3 h-3 text-purple-400" fill="currentColor" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Google Account Selector */}
      <GoogleAccountSelector
        isOpen={showGoogleSelector}
        onClose={() => setShowGoogleSelector(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}; 