import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
  variant?: 'banner' | 'card';
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ 
  onDismiss, 
  variant = 'banner' 
}) => {
  const { firebaseUser, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Local storage key for dismissal tracking
  const dismissalKey = `email_verification_dismissed_${firebaseUser?.uid}`;

  useEffect(() => {
    // Check if user has dismissed the banner
    const wasDismissed = localStorage.getItem(dismissalKey);
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const now = new Date();
      const hoursSinceDismissal = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60);
      
      // Show again after 24 hours
      if (hoursSinceDismissal < 24) {
        setDismissed(true);
      }
    }

    // Check last sent timestamp
    const lastSentTime = localStorage.getItem(`email_verification_sent_${firebaseUser?.uid}`);
    if (lastSentTime) {
      const lastSentDate = new Date(lastSentTime);
      setLastSent(lastSentDate);
      
      const now = new Date();
      const timeDiff = now.getTime() - lastSentDate.getTime();
      const cooldownTime = 60 * 1000; // 1 minute cooldown
      
      if (timeDiff < cooldownTime) {
        setCanResend(false);
        setCountdown(Math.ceil((cooldownTime - timeDiff) / 1000));
      }
    }
  }, [firebaseUser?.uid, dismissalKey]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSendVerification = async () => {
    if (!firebaseUser || sending || !canResend) return;

    setSending(true);
    try {
      await sendEmailVerification(firebaseUser);
      
      const now = new Date();
      setLastSent(now);
      localStorage.setItem(`email_verification_sent_${firebaseUser.uid}`, now.toISOString());
      
      setCanResend(false);
      setCountdown(60); // 1 minute cooldown
      
      toast.success('Doğrulama e-postası gönderildi!', {
        description: 'E-posta kutunuzu kontrol edin ve spam klasörünü de kontrol etmeyi unutmayın.',
        duration: 5000
      });
      
    } catch (error: any) {
      console.error('Email verification send error:', error);
      
      let errorMessage = 'E-posta gönderilirken hata oluştu.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Hesabınız devre dışı bırakılmış.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(dismissalKey, new Date().toISOString());
    onDismiss?.();
  };

  // Don't show if:
  // - User is already verified
  // - No firebase user
  // - Already dismissed recently
  if (!firebaseUser || firebaseUser.emailVerified || dismissed) {
    return null;
  }

  const timeAgo = lastSent ? Math.floor((new Date().getTime() - lastSent.getTime()) / (1000 * 60)) : null;

  if (variant === 'card') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    E-posta Adresinizi Doğrulayın
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                    Hesabınızın güvenliği için e-posta adresinizi doğrulamanız gerekmektedir. 
                    Doğrulama linki <strong>{firebaseUser.email}</strong> adresine gönderilecektir.
                  </p>
                  
                  {lastSent && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mb-3">
                      <Clock className="w-3 h-3" />
                      Son gönderim: {timeAgo} dakika önce
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSendVerification}
                      disabled={sending || !canResend}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {sending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : !canResend ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          {countdown}s bekleyin
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          {lastSent ? 'Tekrar Gönder' : 'Doğrulama E-postası Gönder'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Daha Sonra
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner variant artık notification center'a entegre - banner gösterimi kaldırıldı
  return null;
};

export default EmailVerificationBanner;