import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Calendar, DollarSign, Users, Plane, Hotel, Activity, Heart, Sparkles, Star, Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '../contexts/AuthContext';
import { userProfileAnalyzer, UserProfile } from '../services/userProfileAnalyzer';
import { packageService, HoneymoonPackage } from '../services/packageService';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';
import { format, addDays, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CustomHoneymoonPlan {
  destinations: string[];
  startDate: Date | null;
  endDate: Date | null;
  budget: { min: number; max: number };
  travelers: number;
  accommodationType: string[];
  activities: string[];
  specialRequests: string;
  mealPreferences: string[];
  transportationPreference: string;
  roomType: string;
  specialOccasions: string[];
}

interface HoneymoonPlannerWizardProps {
  userProfile?: UserProfile;
  onComplete: (plan: CustomHoneymoonPlan, recommendations: HoneymoonPackage[]) => void;
  onClose: () => void;
}

const HoneymoonPlannerWizard: React.FC<HoneymoonPlannerWizardProps> = ({ 
  userProfile, 
  onComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [honeymoonPlan, setHoneymoonPlan] = useState<CustomHoneymoonPlan>({
    destinations: [],
    startDate: null,
    endDate: null,
    budget: { min: 25000, max: 50000 },
    travelers: 2,
    accommodationType: [],
    activities: [],
    specialRequests: '',
    mealPreferences: [],
    transportationPreference: '',
    roomType: '',
    specialOccasions: []
  });

  const steps = [
    { 
      id: 'destinations', 
      title: 'Where Do You Want to Go?', 
      icon: MapPin,
      description: 'Select your dream destinations'
    },
    { 
      id: 'dates', 
      title: 'Select Your Dates', 
      icon: Calendar,
      description: 'Select your travel dates'
    },
    { 
      id: 'budget', 
      title: 'Set Your Budget', 
      icon: DollarSign,
      description: 'Set your spending limit'
    },
    { 
      id: 'accommodation', 
      title: 'Accommodation Preference', 
      icon: Hotel,
      description: 'Where do you want to stay?'
    },
    { 
      id: 'activities', 
      title: 'Activities', 
      icon: Activity,
      description: 'What experiences do you want to have?'
    },
    { 
      id: 'details', 
      title: 'Details', 
      icon: Heart,
      description: 'Special Requests'
    }
  ];

  const destinationOptions = [
    { name: 'Cappadocia', type: 'domestic', popular: true },
    { name: 'Antalya', type: 'domestic', popular: true },
    { name: 'Istanbul', type: 'domestic', popular: true },
    { name: 'Çeşme', type: 'domestic', popular: false },
    { name: 'Bodrum', type: 'domestic', popular: true },
    { name: 'Phuket', type: 'international', popular: true },
    { name: 'Bali', type: 'international', popular: true },
    { name: 'Sri Lanka', type: 'international', popular: true },
    { name: 'Maldives', type: 'international', popular: true },
    { name: 'Paris', type: 'international', popular: true },
    { name: 'Santorini', type: 'international', popular: true },
    { name: 'Dubai', type: 'international', popular: true }
  ];

  const accommodationTypes = [
    'Luxury Resort',
    'Boutique Hotel',
    'Private Villa',
    'Spa Resort',
    'Beach Hotel',
    'City Hotel',
    'Historic Hotel',
    'Eco Lodge'
  ];

  const activityOptions = [
    'Romantic Dinner',
    'Spa & Wellness',
    'Couples Massage',
    'Sunset Cruise',
    'Cultural Tours',
    'Adventure Activities',
    'Beach Activities',
    'Photography Session',
    'Local Experiences',
    'Nightlife',
    'Shopping',
    'Sightseeing Tours'
  ];

  const budgetRanges = [
    { label: '15.000₺ - 30.000₺', min: 15000, max: 30000 },
    { label: '30.000₺ - 50.000₺', min: 30000, max: 50000 },
    { label: '50.000₺ - 75.000₺', min: 50000, max: 75000 },
    { label: '75.000₺ - 100.000₺', min: 75000, max: 100000 },
    { label: '100.000₺ - 150.000₺', min: 100000, max: 150000 },
    { label: '150.000₺+', min: 150000, max: 300000 }
  ];

  useEffect(() => {
    // Initialize with user profile preferences if available
    if (userProfile) {
      setHoneymoonPlan(prev => ({
        ...prev,
        budget: userProfile.preferences.budgetRange,
        accommodationType: userProfile.preferences.accommodationType,
        activities: userProfile.preferences.activities
      }));
    }
  }, [userProfile]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
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
    setIsGenerating(true);
    try {
      logger.info('Generating honeymoon recommendations', { plan: honeymoonPlan });
      
      // Generate personalized recommendations based on the plan
      const recommendations = await generateRecommendations(honeymoonPlan);
      
      toast.success('Balayı planınız oluşturuldu! 🎉');
      onComplete(honeymoonPlan, recommendations);
    } catch (error) {
      logger.error('Error generating honeymoon plan', { error });
      toast.error('Plan oluşturulurken hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecommendations = async (plan: CustomHoneymoonPlan): Promise<HoneymoonPackage[]> => {
    // Get all packages and filter based on user preferences
    const allPackages = await packageService.getPackages();
    
    return allPackages.filter(pkg => {
      // Filter by destination
      const matchesDestination = plan.destinations.length === 0 || 
        plan.destinations.some(dest => 
          pkg.location.toLowerCase().includes(dest.toLowerCase()) ||
          pkg.title.toLowerCase().includes(dest.toLowerCase())
        );

      // Filter by budget
      const matchesBudget = pkg.price >= plan.budget.min && pkg.price <= plan.budget.max;

      // Filter by accommodation type (if specified)
      const matchesAccommodation = plan.accommodationType.length === 0 ||
        plan.accommodationType.some(type => 
          pkg.accommodationType?.toLowerCase().includes(type.toLowerCase())
        );

      return matchesDestination && matchesBudget && matchesAccommodation;
    }).slice(0, 6); // Return top 6 matches
  };

  const updatePlan = (field: keyof CustomHoneymoonPlan, value: any) => {
    setHoneymoonPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const addCustomDestination = (destination: string) => {
    if (destination && !honeymoonPlan.destinations.includes(destination)) {
      updatePlan('destinations', [...honeymoonPlan.destinations, destination]);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'destinations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {destinationOptions.map((dest) => (
                <motion.div
                  key={dest.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={honeymoonPlan.destinations.includes(dest.name) ? "default" : "outline"}
                    className={`w-full h-20 flex flex-col items-center justify-center space-y-1 ${
                      honeymoonPlan.destinations.includes(dest.name)
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                        : 'hover:bg-pink-50 border-pink-200'
                    }`}
                    onClick={() => updatePlan('destinations', 
                      toggleArrayItem(honeymoonPlan.destinations, dest.name)
                    )}
                  >
                    <span className="text-sm font-medium">{dest.name}</span>
                    {dest.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Popüler
                      </Badge>
                    )}
                    {dest.type === 'international' && (
                      <Plane className="w-3 h-3 opacity-60" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">
                Başka bir destinasyon ekleyin:
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Destinasyon adı..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomDestination((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addCustomDestination(input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {honeymoonPlan.destinations.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seçilen destinasyonlar:
                </label>
                <div className="flex flex-wrap gap-2">
                  {honeymoonPlan.destinations.map((dest) => (
                    <Badge
                      key={dest}
                      variant="secondary"
                      className="flex items-center space-x-1 bg-pink-100 text-pink-700"
                    >
                      <span>{dest}</span>
                      <button
                        onClick={() => updatePlan('destinations',
                          honeymoonPlan.destinations.filter(d => d !== dest)
                        )}
                        className="ml-1 hover:bg-pink-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'dates':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gidiş Tarihi
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      {honeymoonPlan.startDate 
                        ? format(honeymoonPlan.startDate, 'dd MMMM yyyy', { locale: tr })
                        : 'Tarih seçin'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarComponent
                      mode="single"
                      selected={honeymoonPlan.startDate || undefined}
                      onSelect={(date) => updatePlan('startDate', date)}
                      disabled={(date) => date < new Date()}
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Dönüş Tarihi
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      {honeymoonPlan.endDate 
                        ? format(honeymoonPlan.endDate, 'dd MMMM yyyy', { locale: tr })
                        : 'Tarih seçin'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarComponent
                      mode="single"
                      selected={honeymoonPlan.endDate || undefined}
                      onSelect={(date) => updatePlan('endDate', date)}
                      disabled={(date) => 
                        date < new Date() || 
                        (honeymoonPlan.startDate && date <= honeymoonPlan.startDate)
                      }
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {honeymoonPlan.startDate && honeymoonPlan.endDate && (
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600 mb-1">
                  {differenceInDays(honeymoonPlan.endDate, honeymoonPlan.startDate)} Gün
                </div>
                <div className="text-sm text-gray-600">
                  Toplam tatil süresi
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[7, 10, 14].map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => {
                    const start = new Date();
                    start.setDate(start.getDate() + 30); // 30 days from now
                    const end = addDays(start, days);
                    updatePlan('startDate', start);
                    updatePlan('endDate', end);
                  }}
                >
                  <span className="font-semibold">{days} Gün</span>
                  <span className="text-xs text-gray-600">Önerilen</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-6">
            <div className="grid gap-3">
              {budgetRanges.map((range) => (
                <Button
                  key={range.label}
                  variant={
                    honeymoonPlan.budget.min === range.min && 
                    honeymoonPlan.budget.max === range.max 
                      ? "default" : "outline"
                  }
                  className={`w-full p-4 h-auto text-left justify-between ${
                    honeymoonPlan.budget.min === range.min && 
                    honeymoonPlan.budget.max === range.max
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'hover:bg-pink-50 border-pink-200'
                  }`}
                  onClick={() => updatePlan('budget', { min: range.min, max: range.max })}
                >
                  <span className="font-medium">{range.label}</span>
                  {honeymoonPlan.budget.min === range.min && 
                   honeymoonPlan.budget.max === range.max && (
                    <Check className="w-5 h-5" />
                  )}
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-4">
                Özel Bütçe Aralığı
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                  <Input
                    type="number"
                    placeholder="Min bütçe"
                    value={honeymoonPlan.budget.min}
                    onChange={(e) => updatePlan('budget', {
                      ...honeymoonPlan.budget,
                      min: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Maksimum</label>
                  <Input
                    type="number"
                    placeholder="Max bütçe"
                    value={honeymoonPlan.budget.max}
                    onChange={(e) => updatePlan('budget', {
                      ...honeymoonPlan.budget,
                      max: Number(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'accommodation':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {accommodationTypes.map((type) => (
                <Button
                  key={type}
                  variant={honeymoonPlan.accommodationType.includes(type) ? "default" : "outline"}
                  className={`w-full h-16 ${
                    honeymoonPlan.accommodationType.includes(type)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'hover:bg-pink-50 border-pink-200'
                  }`}
                  onClick={() => updatePlan('accommodationType',
                    toggleArrayItem(honeymoonPlan.accommodationType, type)
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Oda Tipi Tercihi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Deniz Manzaralı', 'Bahçe Manzaralı', 'Suite', 'Villa'].map((room) => (
                    <Button
                      key={room}
                      variant={honeymoonPlan.roomType === room ? "default" : "outline"}
                      className={honeymoonPlan.roomType === room 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                        : 'hover:bg-pink-50 border-pink-200'
                      }
                      onClick={() => updatePlan('roomType', room)}
                    >
                      {room}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activityOptions.map((activity) => (
                <Button
                  key={activity}
                  variant={honeymoonPlan.activities.includes(activity) ? "default" : "outline"}
                  className={`w-full h-16 text-sm ${
                    honeymoonPlan.activities.includes(activity)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'hover:bg-pink-50 border-pink-200'
                  }`}
                  onClick={() => updatePlan('activities',
                    toggleArrayItem(honeymoonPlan.activities, activity)
                  )}
                >
                  {activity}
                </Button>
              ))}
            </div>

            {honeymoonPlan.activities.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seçilen aktiviteler:
                </label>
                <div className="flex flex-wrap gap-2">
                  {honeymoonPlan.activities.map((activity) => (
                    <Badge
                      key={activity}
                      variant="secondary"
                      className="bg-pink-100 text-pink-700"
                    >
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Özel İstekler
              </label>
              <Textarea
                placeholder="Özel gün kutlaması, diyet kısıtlamaları, erişilebilirlik ihtiyaçları vb..."
                value={honeymoonPlan.specialRequests}
                onChange={(e) => updatePlan('specialRequests', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Yemek Tercihleri
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Her Şey Dahil', 'Yarım Pansiyon', 'Sadece Kahvaltı', 'Oda Servisi'].map((meal) => (
                  <Button
                    key={meal}
                    variant={honeymoonPlan.mealPreferences.includes(meal) ? "default" : "outline"}
                    className={honeymoonPlan.mealPreferences.includes(meal)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'hover:bg-pink-50 border-pink-200'
                    }
                    onClick={() => updatePlan('mealPreferences',
                      toggleArrayItem(honeymoonPlan.mealPreferences, meal)
                    )}
                  >
                    {meal}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ulaşım Tercihi
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Uçak', 'Özel Transfer', 'Kiralık Araç', 'Dahil Değil'].map((transport) => (
                  <Button
                    key={transport}
                    variant={honeymoonPlan.transportationPreference === transport ? "default" : "outline"}
                    className={honeymoonPlan.transportationPreference === transport
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'hover:bg-pink-50 border-pink-200'
                    }
                    onClick={() => updatePlan('transportationPreference', transport)}
                  >
                    {transport}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isGenerating) {
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
              <Heart className="w-16 h-16 text-pink-500" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Your Honeymoon Plan is Being Prepared</h3>
            <p className="text-gray-600 mb-4">
              Personalized recommendations are being created for you...
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

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {React.createElement(currentStepData.icon, {
                className: "w-8 h-8 p-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              })}
              <div>
                <CardTitle className="text-xl">
                  {currentStepData.title}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} / {steps.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
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
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center space-x-2"
            >
              <span>
                {currentStep === steps.length - 1 ? 'Planı Oluştur' : 'Sonraki'}
              </span>
              {currentStep === steps.length - 1 ? (
                <Sparkles className="w-4 h-4" />
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

export default HoneymoonPlannerWizard;