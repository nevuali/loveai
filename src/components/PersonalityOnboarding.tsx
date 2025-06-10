import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Sparkles, MapPin, Camera, DollarSign, Clock, Battery, Target,
  ArrowRight, ArrowLeft, Check, Star, Crown, Mountain, Building, Bot
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

interface PersonalityOnboardingProps {
  onComplete: (profile: PersonalityProfile) => void;
  onSkip: () => void;
}

interface PersonalityProfile {
  personalityType: 'luxury_seeker' | 'adventure_lover' | 'culture_explorer' | 'romantic_dreamer';
  budgetRange: 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury';
  travelStyle: 'relaxation' | 'adventure' | 'cultural' | 'mixed';
  durationPreference: '3-5' | '5-7' | '7-10' | '10+';
  priorities: string[];
  socialMediaStyle: string;
  energyStyle: string;
  mainPriority: string;
  aiPersonality: string;
  profileScore: number;
}

interface Question {
  id: string;
  title: string;
  description: string;
  icon: any;
  options: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    value: any;
  }>;
}

const PersonalityOnboarding: React.FC<PersonalityOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [profileResult, setProfileResult] = useState<PersonalityProfile | null>(null);

  const questions: Question[] = [
    {
      id: 'honeymoon_vision',
      title: 'Hayalinizdeki balayı hangi kelime grubuna daha yakın?',
      description: 'Size en çok hitap eden balayı stilini seçin',
      icon: Heart,
      options: [
        {
          id: 'beach',
          title: 'Plaj & Güneş',
          description: 'Plaj, güneş, cocktail',
          icon: '🏖️',
          value: { style: 'relaxation', personality: 'romantic_dreamer' }
        },
        {
          id: 'adventure',
          title: 'Macera & Keşif',
          description: 'Macera, keşif, doğa',
          icon: '🏔️',
          value: { style: 'adventure', personality: 'adventure_lover' }
        },
        {
          id: 'culture',
          title: 'Sanat & Tarih',
          description: 'Sanat, tarih, kültür',
          icon: '🏛️',
          value: { style: 'cultural', personality: 'culture_explorer' }
        },
        {
          id: 'luxury',
          title: 'Lüks & Konfor',
          description: 'Lüks, konfor, VIP',
          icon: '💎',
          value: { style: 'relaxation', personality: 'luxury_seeker' }
        }
      ]
    },
    {
      id: 'social_media',
      title: 'Balayından hangi tür fotoğrafları paylaşırdınız?',
      description: 'Sosyal medya stilinizi yansıtan seçeneği tercih edin',
      icon: Camera,
      options: [
        {
          id: 'luxury_photos',
          title: 'Lüks Restaurant & Suite',
          description: 'Premium mekanlar, VIP deneyimler',
          icon: '🥂',
          value: 'luxury_lifestyle'
        },
        {
          id: 'adventure_photos',
          title: 'Macera Anları',
          description: 'Ekstrem sporlar, doğa maceraları',
          icon: '🧗',
          value: 'adventure_seeker'
        },
        {
          id: 'culture_photos',
          title: 'Tarihi Yerler',
          description: 'Müzeler, yerel deneyimler',
          icon: '🕌',
          value: 'culture_enthusiast'
        },
        {
          id: 'romantic_photos',
          title: 'Romantik Anlar',
          description: 'Çift fotoğrafları, romantik mekanlar',
          icon: '💕',
          value: 'romantic_moments'
        }
      ]
    },
    {
      id: 'budget',
      title: 'Balayı için düşündüğünüz bütçe aralığı?',
      description: 'Size uygun bütçe kategorisini seçin',
      icon: DollarSign,
      options: [
        {
          id: 'budget_friendly',
          title: '15-30k₺',
          description: 'Akıllı seçimler, değer odaklı',
          icon: '💚',
          value: 'budget'
        },
        {
          id: 'mid_range',
          title: '30-60k₺',
          description: 'Konforlu deneyim, orta segment',
          icon: '💛',
          value: 'mid_range'
        },
        {
          id: 'luxury',
          title: '60-100k₺',
          description: 'Premium kalite, üst segment',
          icon: '🧡',
          value: 'luxury'
        },
        {
          id: 'ultra_luxury',
          title: '100k₺+',
          description: 'Sınırsız lüks, VIP deneyim',
          icon: '💜',
          value: 'ultra_luxury'
        }
      ]
    },
    {
      id: 'duration',
      title: 'İdeal balayı süresi?',
      description: 'Balayınızın ne kadar sürmesini istiyorsunuz',
      icon: Clock,
      options: [
        {
          id: 'short',
          title: '3-5 gün',
          description: 'Kısa kaçamak, yoğun program',
          icon: '⚡',
          value: '3-5'
        },
        {
          id: 'classic',
          title: '5-7 gün',
          description: 'Klasik balayı süresi',
          icon: '⭐',
          value: '5-7'
        },
        {
          id: 'extended',
          title: '7-10 gün',
          description: 'Uzun tatil, rahat keşif',
          icon: '🌟',
          value: '7-10'
        },
        {
          id: 'world_tour',
          title: '10+ gün',
          description: 'Dünya turu, sınırsız deneyim',
          icon: '🚀',
          value: '10+'
        }
      ]
    },
    {
      id: 'energy_style',
      title: 'Tatilde nasıl dinlenirsiniz?',
      description: 'Enerji stilinizi en iyi yansıtan seçenek',
      icon: Battery,
      options: [
        {
          id: 'relaxation',
          title: 'Sakin & Huzurlu',
          description: 'Spa, havuz kenarı, okuma',
          icon: '🧘',
          value: 'relaxation'
        },
        {
          id: 'active',
          title: 'Aktif & Enerjik',
          description: 'Tur, aktivite, gezme',
          icon: '🚁',
          value: 'active'
        },
        {
          id: 'cultural',
          title: 'Kültürel & Öğretici',
          description: 'Müze, gösteri, yerel yaşam',
          icon: '🎭',
          value: 'cultural'
        },
        {
          id: 'mixed',
          title: 'Karışık',
          description: 'Bazen aktif, bazen pasif',
          icon: '🔀',
          value: 'mixed'
        }
      ]
    },
    {
      id: 'priority',
      title: 'Balayında en önemli olan?',
      description: 'Sizin için en değerli olan deneyim',
      icon: Target,
      options: [
        {
          id: 'memories',
          title: 'Unutulmaz Anılar',
          description: 'Ömür boyu hatırlayacağınız deneyimler',
          icon: '💫',
          value: 'unforgettable_memories'
        },
        {
          id: 'comfort',
          title: 'Maksimum Konfor',
          description: 'Rahat, stressiz, mükemmel hizmet',
          icon: '🛏️',
          value: 'maximum_comfort'
        },
        {
          id: 'discovery',
          title: 'Yeni Keşifler',
          description: 'Yeni yerler, kültürler, deneyimler',
          icon: '🗺️',
          value: 'new_discoveries'
        },
        {
          id: 'romance',
          title: 'Romantik Bağ',
          description: 'Birlikte kaliteli zaman, romantizm',
          icon: '💝',
          value: 'romantic_connection'
        }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300);
    } else {
      analyzeProfile();
    }
  };

  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const profile = generateProfile(answers);
    setProfileResult(profile);
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const generateProfile = useCallback((answers: Record<string, any>): PersonalityProfile => {
    const personalityType = answers.honeymoon_vision?.personality || 'romantic_dreamer';
    const budgetRange = answers.budget || 'mid_range';
    const travelStyle = answers.honeymoon_vision?.style || 'mixed';
    const durationPreference = answers.duration || '5-7';
    const socialMediaStyle = answers.social_media || 'romantic_moments';
    const energyStyle = answers.energy_style || 'mixed';
    const mainPriority = answers.priority || 'romantic_connection';

    const aiPersonality = generateAIPersonality(personalityType, budgetRange, travelStyle, mainPriority);
    const profileScore = calculateProfileScore(personalityType, budgetRange, mainPriority);

    return {
      personalityType,
      budgetRange,
      travelStyle,
      durationPreference,
      priorities: [mainPriority, socialMediaStyle, energyStyle],
      socialMediaStyle,
      energyStyle,
      mainPriority,
      aiPersonality,
      profileScore
    };
  }, []);

  const generateAIPersonality = (personality: string, budget: string, style: string, priority: string): string => {
    const personalities = {
      luxury_seeker: "sophisticated, elegant, exclusive language. Focus on premium experiences, VIP services, and bespoke recommendations. Use terms like 'curated', 'exclusive', 'premium'.",
      adventure_lover: "energetic, exciting, adventurous tone. Emphasize unique experiences, active adventures, and thrilling discoveries. Use terms like 'thrilling', 'unforgettable', 'extraordinary'.",
      culture_explorer: "knowledgeable, informative, culturally rich. Focus on historical significance, local traditions, and authentic experiences. Use terms like 'authentic', 'traditional', 'enriching'.",
      romantic_dreamer: "warm, romantic, intimate tone. Emphasize romantic settings, intimate experiences, and emotional connections. Use terms like 'magical', 'intimate', 'enchanting'."
    };

    const budgetModifiers = {
      budget: "Focus on value, smart choices, and budget-friendly options without compromising quality.",
      mid_range: "Balance between quality and cost, offering comfortable experiences with good value.",
      luxury: "Emphasize premium quality, exclusive experiences, and high-end services.",
      ultra_luxury: "Focus on the absolute best, VIP treatment, and no-expense-spared experiences."
    };

    return `${personalities[personality as keyof typeof personalities]} ${budgetModifiers[budget as keyof typeof budgetModifiers]}`;
  };

  const calculateProfileScore = (personality: string, budget: string, priority: string): number => {
    let score = 70;
    
    if (personality === 'luxury_seeker' || personality === 'culture_explorer') score += 10;
    if (budget === 'luxury' || budget === 'ultra_luxury') score += 15;
    if (priority === 'unforgettable_memories' || priority === 'new_discoveries') score += 5;
    
    return Math.min(score, 100);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getPersonalityInfo = (personalityType: string) => {
    const personalities = {
      luxury_seeker: {
        title: 'Lüks Arayıcısı',
        icon: '💎',
        description: 'Premium deneyimleri seven, konforu önceleyen ve özel hizmetleri tercih eden kişilik',
        traits: ['VIP deneyimler', 'Premium konfor', 'Özel hizmetler', 'Seçkin mekanlar'],
        aiStyle: 'Size lüks ve premium deneyimler sunacağım. En özel balayı paketlerini ve VIP hizmetleri önereceğim.'
      },
      adventure_lover: {
        title: 'Macera Tutkunları',
        icon: '🗻',
        description: 'Heyecan verici deneyimleri seven, aktif olmayı tercih eden ve sınırlarını zorlayan kişilik',
        traits: ['Adrenalin sporları', 'Doğa aktiviteleri', 'Keşif turlari', 'Benzersiz deneyimler'],
        aiStyle: 'Size heyecan verici maceralar ve aktif deneyimler sunacağım. En çok adrenalini hissedeceğiniz paketleri önereceğim.'
      },
      culture_explorer: {
        title: 'Kültür Kaşifi',
        icon: '🏛️',
        description: 'Farklı kültürleri keşfetmeyi seven, öğrenmeye açık ve otantik deneyimleri tercih eden kişilik',
        traits: ['Tarihi yerler', 'Yerel deneyimler', 'Müze ve sanat', 'Geleneksel mutfak'],
        aiStyle: 'Size kültürel zenginlikler ve otantik deneyimler sunacağım. En değerli tarihi ve sanatsal yerleri önereceğim.'
      },
      romantic_dreamer: {
        title: 'Romantik Rüyacı',
        icon: '💕',
        description: 'Romantik anları önemseyen, duygusal bağlantıyı güçlendiren ve özel anılar yaratmayı seven kişilik',
        traits: ['Romantik akşam yemekleri', 'Günbatımı manzaraları', 'Çift aktiviteleri', 'İntim deneyimler'],
        aiStyle: 'Size en romantik anları ve duygusal bağlantıyı güçlendirecek deneyimleri sunacağım. Aşkınızı perçinleyecek özel anlar yaratacağım.'
      }
    };

    return personalities[personalityType as keyof typeof personalities] || personalities.romantic_dreamer;
  };

  const getBudgetInfo = (budgetRange: string) => {
    const budgets = {
      budget: { title: 'Akıllı Seçimler', range: '15-30k₺', description: 'Kaliteyi koruyarak bütçe dostu seçenekler' },
      mid_range: { title: 'Konforlu Deneyim', range: '30-60k₺', description: 'Kalite ve konfor dengesinde orta segment' },
      luxury: { title: 'Premium Kalite', range: '60-100k₺', description: 'Üst düzey hizmet ve lüks deneyimler' },
      ultra_luxury: { title: 'Sınırsız Lüks', range: '100k₺+', description: 'En üst seviye VIP deneyimler' }
    };

    return budgets[budgetRange as keyof typeof budgets] || budgets.mid_range;
  };

  const handleContinue = () => {
    if (profileResult) {
      onComplete(profileResult);
    }
  };

  if (showResults && profileResult) {
    const personalityInfo = getPersonalityInfo(profileResult.personalityType);
    const budgetInfo = getBudgetInfo(profileResult.budgetRange);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <Card className="glass-card border-0 shadow-2xl backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  {personalityInfo.icon}
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Tebrikler!</h1>
                <p className="text-pink-100 text-lg">Kişilik analiziniz tamamlandı</p>
              </div>

              {/* Results */}
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Sen bir <span className="text-pink-600">{personalityInfo.title}</span>'sın!
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {personalityInfo.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Personality Traits */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-500" />
                      Senin Tarzın
                    </h3>
                    <div className="space-y-3">
                      {personalityInfo.traits.map((trait, index) => (
                        <motion.div
                          key={trait}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl"
                        >
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          <span className="text-gray-700">{trait}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Budget & Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      Tercihlerin
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">{budgetInfo.title}</span>
                        </div>
                        <p className="text-sm text-gray-600">{budgetInfo.range}</p>
                        <p className="text-sm text-gray-500 mt-1">{budgetInfo.description}</p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900">Süre Tercihi</span>
                        </div>
                        <p className="text-sm text-gray-600">{profileResult.durationPreference} gün</p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-gray-900">Profil Skoru</span>
                        </div>
                        <p className="text-sm text-gray-600">{profileResult.profileScore}/100</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Preview */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        AI LOVVE Artık Senin İçin Özelleşti! ✨
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {personalityInfo.aiStyle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    Harika! Sohbete Başla
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Sparkles className="w-16 h-16 text-pink-500" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Profilin Analiz Ediliyor</h3>
          <p className="text-gray-600 mb-6">Size özel AI deneyiminiz hazırlanıyor...</p>
          <div className="w-64 mx-auto">
            <Progress value={85} className="h-2" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Kişilik Analizi
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Size özel balayı deneyimi için birkaç soru
          </p>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Soru {currentStep + 1} / {questions.length}</span>
              <span>%{Math.round(progress)} tamamlandı</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-0 shadow-xl backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                    <currentQuestion.icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-gray-600">
                    {currentQuestion.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAnswer(option.value)}
                      className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{option.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">
                            {option.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {option.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Önceki
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Şimdilik Geç
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(PersonalityOnboarding);