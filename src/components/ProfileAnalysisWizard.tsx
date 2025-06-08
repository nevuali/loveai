import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Heart, Users, MapPin, Calendar, DollarSign, Activity, Sparkles, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '../contexts/AuthContext';
import { userProfileAnalyzer, ProfileQuestion, UserProfile } from '../services/userProfileAnalyzer';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';

interface ProfileAnalysisWizardProps {
  onComplete: (profile: UserProfile) => void;
  onClose: () => void;
}

const ProfileAnalysisWizard: React.FC<ProfileAnalysisWizardProps> = ({ onComplete, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [questions, setQuestions] = useState<ProfileQuestion[]>([]);

  useEffect(() => {
    const allQuestions = userProfileAnalyzer.getQuestions();
    setQuestions(allQuestions);
  }, []);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleResponse = (value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.uid) {
      toast.error('Kullanıcı oturumu bulunamadı');
      return;
    }

    setIsAnalyzing(true);
    try {
      logger.info('Starting profile analysis', { userId: user.uid, responses });
      const profile = await userProfileAnalyzer.analyzeUserResponses(user.uid, responses);
      toast.success('Profiliniz başarıyla analiz edildi! 🎉');
      onComplete(profile);
    } catch (error) {
      logger.error('Profile analysis failed', { error });
      toast.error('Profil analizi sırasında hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={responses[currentQuestion.id] === option ? "default" : "outline"}
                  className={`w-full p-4 h-auto text-left justify-start ${
                    responses[currentQuestion.id] === option 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                      : 'hover:bg-pink-50 border-pink-200'
                  }`}
                  onClick={() => handleResponse(option)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      responses[currentQuestion.id] === option 
                        ? 'bg-white border-white' 
                        : 'border-pink-300'
                    }`}>
                      {responses[currentQuestion.id] === option && (
                        <Check className="w-3 h-3 text-pink-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">
                {responses[currentQuestion.id] || 5}
              </div>
              <div className="text-sm text-gray-600">
                1: Hiç önemli değil - 10: Çok önemli
              </div>
            </div>
            <Slider
              value={[responses[currentQuestion.id] || 5]}
              onValueChange={([value]) => handleResponse(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Hiç önemli değil</span>
              <span>Orta</span>
              <span>Çok önemli</span>
            </div>
          </div>
        );

      case 'multi_select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className={`w-full p-4 h-auto text-left justify-start ${
                    (responses[currentQuestion.id] || []).includes(option)
                      ? 'bg-pink-50 border-pink-300 text-pink-700' 
                      : 'hover:bg-pink-50 border-pink-200'
                  }`}
                  onClick={() => {
                    const current = responses[currentQuestion.id] || [];
                    const updated = current.includes(option)
                      ? current.filter((item: string) => item !== option)
                      : [...current, option];
                    handleResponse(updated);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 ${
                      (responses[currentQuestion.id] || []).includes(option)
                        ? 'bg-pink-500 border-pink-500' 
                        : 'border-pink-300'
                    }`}>
                      {(responses[currentQuestion.id] || []).includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personality': return Users;
      case 'preferences': return Heart;
      case 'demographics': return MapPin;
      default: return Star;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personality': return 'from-purple-500 to-purple-600';
      case 'preferences': return 'from-pink-500 to-rose-500';
      case 'demographics': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Sparkles className="w-16 h-16 text-pink-500" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Profiliniz Analiz Ediliyor</h3>
            <p className="text-gray-600 mb-4">
              Cevaplarınız değerlendiriliyor ve size özel balayı önerileri hazırlanıyor...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentQuestion && (
                <>
                  {React.createElement(getCategoryIcon(currentQuestion.category), {
                    className: `w-8 h-8 p-1.5 rounded-lg bg-gradient-to-r ${getCategoryColor(currentQuestion.category)} text-white`
                  })}
                  <div>
                    <CardTitle className="text-lg">
                      Profil Analizi
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Soru {currentStep + 1} / {questions.length}
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">
                    {currentQuestion.question}
                  </h3>
                  {currentQuestion.type === 'multi_select' && (
                    <p className="text-sm text-gray-600">
                      Birden fazla seçenek seçebilirsiniz
                    </p>
                  )}
                </div>

                {renderQuestionInput()}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Önceki</span>
            </Button>

            <div className="text-sm text-gray-500">
              {Math.round(progress)}% tamamlandı
            </div>

            <Button
              onClick={nextStep}
              disabled={!responses[currentQuestion?.id]}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center space-x-2"
            >
              <span>
                {currentStep === questions.length - 1 ? 'Tamamla' : 'Sonraki'}
              </span>
              {currentStep === questions.length - 1 ? (
                <Trophy className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileAnalysisWizard;