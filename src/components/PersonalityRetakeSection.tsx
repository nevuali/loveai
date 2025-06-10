import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, User, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Sparkles, Crown, Mountain, Building, Heart
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { personalityService } from '../services/personalityService';
import { toast } from 'sonner';

interface PersonalityProfile {
  personalityType: 'luxury_seeker' | 'adventure_lover' | 'culture_explorer' | 'romantic_dreamer';
  budgetRange: 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury';
  travelStyle: 'relaxation' | 'adventure' | 'cultural' | 'mixed';
  durationPreference: '3-5' | '5-7' | '7-10' | '10+';
  createdAt: string;
  profileScore: number;
}

const PersonalityRetakeSection: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    loadPersonalityProfile();
  }, [loadPersonalityProfile]);

  const loadPersonalityProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const userProfile = await personalityService.getPersonalityProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading personality profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const handleRetakeTest = async () => {
    if (!user?.uid) return;
    
    setRetaking(true);
    try {
      // Mevcut profili sil
      await personalityService.clearPersonalityProfile(user.uid);
      
      toast.success('Kişilik profili sıfırlandı. Ana sayfaya yönlendiriliyorsunuz...', {
        duration: 3000
      });
      
      // 2 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing personality profile:', error);
      toast.error('Profil sıfırlanırken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setRetaking(false);
    }
  };

  const getPersonalityInfo = (type: string) => {
    switch (type) {
      case 'luxury_seeker':
        return {
          title: 'Lüks Arayıcısı',
          icon: '👑',
          color: 'from-yellow-500 to-yellow-600',
          description: 'Konfor ve prestiji seven, premium deneyimleri tercih eden'
        };
      case 'adventure_lover':
        return {
          title: 'Macera Tutkunu',
          icon: '🏔️',
          color: 'from-green-500 to-green-600',
          description: 'Heyecan arayan, yeni deneyimleri seven, aktif gezgin'
        };
      case 'culture_explorer':
        return {
          title: 'Kültür Kaşifi',
          icon: '🏛️',
          color: 'from-purple-500 to-purple-600',
          description: 'Tarihi ve kültürel değerleri keşfetmeyi seven'
        };
      case 'romantic_dreamer':
        return {
          title: 'Romantik Hayalperest',
          icon: '❤️',
          color: 'from-pink-500 to-pink-600',
          description: 'Duygusal bağ kuran, romantik anları yaşamayı seven'
        };
      default:
        return {
          title: 'Bilinmeyen',
          icon: '❓',
          color: 'from-gray-500 to-gray-600',
          description: 'Profil bilgisi bulunamadı'
        };
    }
  };

  const getBudgetInfo = (budget: string) => {
    switch (budget) {
      case 'budget':
        return { label: 'Ekonomik', color: 'bg-green-100 text-green-800' };
      case 'mid_range':
        return { label: 'Orta Seviye', color: 'bg-blue-100 text-blue-800' };
      case 'luxury':
        return { label: 'Lüks', color: 'bg-purple-100 text-purple-800' };
      case 'ultra_luxury':
        return { label: 'Ultra Lüks', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: 'Belirsiz', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getDaysSinceProfile = () => {
    if (!profile?.createdAt) return 0;
    const created = new Date(profile.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#d4af37]/20 border-t-[#d4af37]"></div>
          <span className="ml-3 text-secondary">Profil bilgisi yükleniyor...</span>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Kişilik Profili Bulunamadı</h3>
          <p className="text-secondary mb-4">
            Henüz kişilik testini tamamlamamışsınız.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37]"
          >
            Testi Şimdi Yapın
          </Button>
        </CardContent>
      </Card>
    );
  }

  const personalityInfo = getPersonalityInfo(profile.personalityType);
  const budgetInfo = getBudgetInfo(profile.budgetRange);
  const daysSince = getDaysSinceProfile();

  return (
    <div className="space-y-6">
      {/* Mevcut Profil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#d4af37]" />
            Mevcut Kişilik Profiliniz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <div className="text-4xl">{personalityInfo.icon}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary">{personalityInfo.title}</h3>
              <p className="text-secondary text-sm">{personalityInfo.description}</p>
            </div>
            <div className="text-right">
              <Badge className={budgetInfo.color}>
                {budgetInfo.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <Calendar className="w-5 h-5 text-[#d4af37] mx-auto mb-1" />
              <p className="text-sm text-secondary">Profil Oluşturulma</p>
              <p className="font-semibold text-primary">{daysSince} gün önce</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <TrendingUp className="w-5 h-5 text-[#d4af37] mx-auto mb-1" />
              <p className="text-sm text-secondary">Profil Skoru</p>
              <p className="font-semibold text-primary">{profile.profileScore}/100</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-sm text-secondary">Durum</p>
              <p className="font-semibold text-green-600">Aktif</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yeniden Yapma Seçeneği */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#d4af37]" />
            Kişilik Testini Yeniden Yap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Dikkat: Bu işlem geri alınamaz
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Kişilik testini yeniden yaptığınızda, mevcut profiliniz silinecek ve 
                  AI asistanınız yeni profilinize göre yeniden kişiselleştirilecektir.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-primary">Ne zaman yeniden yapmalıyım?</h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                Profiliniz 6 aydan eski ise
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Tercihleriniz değiştiyse
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                AI önerilerini iyileştirmek istiyorsanız
              </li>
            </ul>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleRetakeTest}
              disabled={retaking}
              variant="outline"
              className="w-full border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white"
            >
              {retaking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Profil Sıfırlanıyor...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Kişilik Testini Yeniden Yap
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalityRetakeSection;