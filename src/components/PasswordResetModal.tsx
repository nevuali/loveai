import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  initialEmail = ''
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('E-posta adresi gerekli');
      return;
    }

    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      
      toast.success('Şifre sıfırlama e-postası gönderildi!', {
        description: 'E-posta kutunuzu kontrol edin.',
        duration: 5000
      });
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Şifre sıfırlama e-postası gönderilirken hata oluştu.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz e-posta adresi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
          break;
        default:
          errorMessage = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
      }
      
      setError(errorMessage);
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(initialEmail);
    setError('');
    setSent(false);
    setLoading(false);
    onClose();
  };

  const handleBackToForm = () => {
    setSent(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
            <CardHeader className="text-center relative">
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {!sent ? (
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-primary">
                    Şifre Sıfırlama
                  </CardTitle>
                  <p className="text-secondary text-sm mt-2">
                    E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-primary">
                    E-posta Gönderildi!
                  </CardTitle>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {!sent ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="ornek@email.com"
                        className="pl-10"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </span>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37] text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Sıfırlama Linki Gönder
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleClose}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="space-y-2">
                    <p className="text-green-600 font-medium">
                      Şifre sıfırlama linki gönderildi!
                    </p>
                    <p className="text-secondary text-sm">
                      <strong>{email}</strong> adresine gönderilen e-postadaki 
                      linke tıklayarak şifrenizi sıfırlayabilirsiniz.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Not:</strong> E-posta gelmemişse spam klasörünüzü kontrol edin. 
                      Birkaç dakika sürebilir.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleBackToForm}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Farklı E-posta Adresi Kullan
                    </Button>

                    <Button
                      onClick={handleClose}
                      className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37] text-white"
                    >
                      Tamam
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-secondary">
                  Hesabınızı hatırladınız mı?{' '}
                  <button
                    onClick={handleClose}
                    className="text-[#d4af37] hover:underline font-medium"
                  >
                    Giriş yapın
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PasswordResetModal;