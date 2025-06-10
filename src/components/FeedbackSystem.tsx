import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Star, ThumbsUp, ThumbsDown, Send, X, 
  CheckCircle, AlertTriangle, Heart, Sparkles, Lightbulb
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'general' | 'personality_test';
  rating: number;
  category: string;
  message: string;
  context?: {
    page: string;
    userAgent: string;
    timestamp: string;
  };
}

interface FeedbackSystemProps {
  trigger?: 'button' | 'float' | 'modal';
  context?: string;
  onClose?: () => void;
  isOpen?: boolean;
}

const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  trigger = 'button',
  context = '',
  onClose,
  isOpen = false
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(isOpen);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    rating: 0,
    category: '',
    message: '',
    context: {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    {
      id: 'general',
      label: 'Genel Geri Bildirim',
      icon: MessageSquare,
      description: 'Genel deneyiminiz hakkında',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'personality_test',
      label: 'Kişilik Testi',
      icon: Heart,
      description: 'Kişilik testi deneyimi',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'feature',
      label: 'Özellik İsteği',
      icon: Lightbulb,
      description: 'Yeni özellik önerisi',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'improvement',
      label: 'İyileştirme',
      icon: Sparkles,
      description: 'Mevcut özellikleri iyileştirme',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'bug',
      label: 'Hata Bildirimi',
      icon: AlertTriangle,
      description: 'Karşılaştığınız sorunlar',
      color: 'from-red-500 to-red-600'
    }
  ];

  const ratingLabels = [
    '', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'
  ];

  const handleOpen = () => {
    setShowModal(true);
    setCurrentStep(1);
    setSubmitted(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentStep(1);
    setFeedback({
      type: 'general',
      rating: 0,
      category: '',
      message: '',
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!feedback.message.trim()) {
      toast.error('Lütfen geri bildiriminizi yazın.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, send to analytics service or backend
      console.log('Feedback submitted:', {
        ...feedback,
        userId: user?.uid,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      });

      setSubmitted(true);
      toast.success('Geri bildiriminiz alındı! Teşekkür ederiz.', {
        duration: 5000
      });

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Geri bildirim gönderilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTrigger = () => {
    if (trigger === 'float') {
      return (
        <motion.button
          onClick={handleOpen}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      );
    }

    if (trigger === 'button') {
      return (
        <Button
          onClick={handleOpen}
          variant="outline"
          className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Geri Bildirim
        </Button>
      );
    }

    return null;
  };

  const renderStepContent = () => {
    if (submitted) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">Teşekkürler!</h3>
          <p className="text-secondary">
            Geri bildiriminiz başarıyla gönderildi. Görüşleriniz bizim için çok değerli.
          </p>
        </motion.div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary mb-2">
                Geri Bildirim Türü Seçin
              </h3>
              <p className="text-secondary text-sm">
                Hangi konuda geri bildirim vermek istiyorsunuz?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {feedbackTypes.map((type) => (
                <motion.button
                  key={type.id}
                  onClick={() => {
                    setFeedback(prev => ({ ...prev, type: type.id as any }));
                    setCurrentStep(2);
                  }}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                      <type.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">{type.label}</h4>
                      <p className="text-sm text-secondary">{type.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                ←
              </Button>
              <div>
                <h3 className="text-xl font-bold text-primary">
                  Deneyiminizi Değerlendirin
                </h3>
                <p className="text-secondary text-sm">
                  Genel deneyiminizi 1-5 arasında puanlayın
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                  className="p-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= feedback.rating
                        ? 'text-[#d4af37] fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {feedback.rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Badge variant="outline" className="border-[#d4af37] text-[#d4af37]">
                  {ratingLabels[feedback.rating]}
                </Badge>
              </motion.div>
            )}

            <Button
              onClick={() => setCurrentStep(3)}
              disabled={feedback.rating === 0}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37]"
            >
              Devam Et
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                ←
              </Button>
              <div>
                <h3 className="text-xl font-bold text-primary">
                  Detaylı Geri Bildirim
                </h3>
                <p className="text-secondary text-sm">
                  Lütfen detaylarını paylaşın
                </p>
              </div>
            </div>

            <Textarea
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Geri bildiriminizi buraya yazın..."
              className="min-h-[120px]"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!feedback.message.trim() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderTrigger()}

      <AnimatePresence>
        {showModal && (
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
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-primary">
                      Geri Bildirim
                    </CardTitle>
                    <Button
                      onClick={handleClose}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Progress indicator */}
                  {!submitted && (
                    <div className="flex gap-2 mt-4">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            step <= currentStep
                              ? 'bg-[#d4af37]'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {renderStepContent()}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackSystem;