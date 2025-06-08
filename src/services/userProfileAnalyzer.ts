import { logger } from '../utils/logger';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PersonalityTrait {
  adventurous: number; // 0-10
  luxury: number; // 0-10
  cultural: number; // 0-10
  romantic: number; // 0-10
  active: number; // 0-10
  social: number; // 0-10
  budget_conscious: number; // 0-10
  spontaneous: number; // 0-10
}

export interface TravelPreferences {
  destinations: string[];
  budgetRange: { min: number; max: number };
  duration: { min: number; max: number };
  travelStyle: ('luxury' | 'adventure' | 'cultural' | 'romantic' | 'beach' | 'city')[];
  accommodationType: ('hotel' | 'resort' | 'villa' | 'boutique' | 'suite')[];
  seasonPreference: ('spring' | 'summer' | 'autumn' | 'winter')[];
  activities: string[];
  specialRequests: string[];
}

export interface UserProfile {
  userId: string;
  personalInfo: {
    relationshipStatus: 'engaged' | 'married' | 'dating';
    travelExperience: 'beginner' | 'moderate' | 'experienced' | 'expert';
    languages: string[];
    specialOccasions: string[];
  };
  personality: PersonalityTrait;
  preferences: TravelPreferences;
  completionScore: number; // 0-100
  lastUpdated: number;
  analysisComplete: boolean;
}

export interface ProfileQuestion {
  id: string;
  category: 'personality' | 'preferences' | 'demographics';
  question: string;
  type: 'multiple_choice' | 'slider' | 'text' | 'multi_select';
  options?: string[];
  weight: number; // Importance for analysis
  traits: Partial<PersonalityTrait>; // Which traits this affects
}

class UserProfileAnalyzer {
  private questions: ProfileQuestion[] = [
    // Personality Questions
    {
      id: 'adventure_level',
      category: 'personality',
      question: 'Tatilde hangi tür deneyimleri tercih edersiniz?',
      type: 'multiple_choice',
      options: [
        'Güvenli ve tanıdık yerler',
        'Orta seviye macera',
        'Yeni ve heyecanlı deneyimler',
        'Ekstrem maceralar'
      ],
      weight: 0.9,
      traits: { adventurous: 1 }
    },
    {
      id: 'luxury_preference',
      category: 'personality',
      question: 'Lüks konusunda hangi seviyeyi tercih edersiniz?',
      type: 'multiple_choice',
      options: [
        'Basit ve rahat',
        'Konforlu',
        'Lüks deneyimler',
        'Ultra lüks hizmet'
      ],
      weight: 0.8,
      traits: { luxury: 1 }
    },
    {
      id: 'cultural_interest',
      category: 'personality',
      question: 'Yerel kültür ve tarih ne kadar ilginizi çeker?',
      type: 'slider',
      weight: 0.7,
      traits: { cultural: 1 }
    },
    {
      id: 'romantic_activities',
      category: 'personality',
      question: 'Romantik aktiviteler ne kadar önemli?',
      type: 'slider',
      weight: 0.9,
      traits: { romantic: 1 }
    },
    {
      id: 'activity_level',
      category: 'personality',
      question: 'Tatilde ne kadar aktif olmak istersiniz?',
      type: 'multiple_choice',
      options: [
        'Dinlenmek ve rahatlık',
        'Hafif aktiviteler',
        'Orta seviye aktiviteler',
        'Çok aktif program'
      ],
      weight: 0.8,
      traits: { active: 1 }
    },
    
    // Preference Questions
    {
      id: 'budget_range',
      category: 'preferences',
      question: 'Balayınız için bütçe aralığınız nedir?',
      type: 'multiple_choice',
      options: [
        '10.000₺ - 25.000₺',
        '25.000₺ - 50.000₺',
        '50.000₺ - 100.000₺',
        '100.000₺+'
      ],
      weight: 0.9,
      traits: { budget_conscious: -1, luxury: 0.5 }
    },
    {
      id: 'destination_type',
      category: 'preferences',
      question: 'Hangi tür destinasyonları tercih edersiniz?',
      type: 'multi_select',
      options: [
        'Plajlar ve adalar',
        'Büyük şehirler',
        'Dağ ve doğa',
        'Tarihi yerler',
        'Egzotik lokasyonlar',
        'Avrupa şehirleri'
      ],
      weight: 0.8,
      traits: { cultural: 0.3, adventurous: 0.4 }
    },
    {
      id: 'duration_preference',
      category: 'preferences',
      question: 'İdeal balayı süreniz kaç gün?',
      type: 'multiple_choice',
      options: [
        '3-5 gün',
        '1 hafta',
        '10-14 gün',
        '2 hafta+'
      ],
      weight: 0.6,
      traits: { spontaneous: -0.3 }
    },
    {
      id: 'accommodation_type',
      category: 'preferences',
      question: 'Hangi tür konaklama tercih edersiniz?',
      type: 'multiple_choice',
      options: [
        'Butik otel',
        'Lüks resort',
        'Özel villa',
        'Tarihi otel',
        'Spa resort'
      ],
      weight: 0.7,
      traits: { luxury: 0.6, romantic: 0.4 }
    },
    
    // Demographics
    {
      id: 'relationship_status',
      category: 'demographics',
      question: 'İlişki durumunuz nedir?',
      type: 'multiple_choice',
      options: [
        'Nişanlı',
        'Yeni evli',
        'Evlilik yıldönümü',
        'Özel gün kutlaması'
      ],
      weight: 0.5,
      traits: { romantic: 0.3 }
    },
    {
      id: 'travel_experience',
      category: 'demographics',
      question: 'Seyahat deneyiminiz nasıl?',
      type: 'multiple_choice',
      options: [
        'İlk büyük seyahatim',
        'Orta seviye deneyim',
        'Deneyimli gezgin',
        'Sık seyahat eden'
      ],
      weight: 0.6,
      traits: { adventurous: 0.4, cultural: 0.3 }
    }
  ];

  async analyzeUserResponses(userId: string, responses: Record<string, any>): Promise<UserProfile> {
    try {
      logger.info('Analyzing user responses', { userId, responseCount: Object.keys(responses).length });

      // Initialize personality traits
      const personality: PersonalityTrait = {
        adventurous: 5,
        luxury: 5,
        cultural: 5,
        romantic: 5,
        active: 5,
        social: 5,
        budget_conscious: 5,
        spontaneous: 5
      };

      // Analyze responses and update personality
      for (const [questionId, response] of Object.entries(responses)) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) continue;

        const impact = this.calculateTraitImpact(question, response);
        
        // Apply trait changes
        for (const [trait, change] of Object.entries(impact)) {
          if (trait in personality) {
            personality[trait as keyof PersonalityTrait] = Math.max(0, Math.min(10, 
              personality[trait as keyof PersonalityTrait] + change * question.weight
            ));
          }
        }
      }

      // Extract preferences from responses
      const preferences = this.extractPreferences(responses);
      
      // Calculate completion score
      const completionScore = (Object.keys(responses).length / this.questions.length) * 100;

      const profile: UserProfile = {
        userId,
        personalInfo: {
          relationshipStatus: responses.relationship_status || 'engaged',
          travelExperience: responses.travel_experience || 'moderate',
          languages: ['tr'],
          specialOccasions: []
        },
        personality,
        preferences,
        completionScore,
        lastUpdated: Date.now(),
        analysisComplete: completionScore >= 70
      };

      // Save to Firestore
      await this.saveProfile(profile);
      
      logger.info('User profile analysis completed', { userId, completionScore });
      return profile;

    } catch (error) {
      logger.error('Error analyzing user responses', { userId, error });
      throw error;
    }
  }

  private calculateTraitImpact(question: ProfileQuestion, response: any): Partial<PersonalityTrait> {
    const impact: Partial<PersonalityTrait> = {};

    if (question.type === 'multiple_choice') {
      const optionIndex = question.options?.indexOf(response) ?? -1;
      if (optionIndex !== -1) {
        const intensity = (optionIndex / (question.options!.length - 1)) * 10;
        
        for (const [trait, multiplier] of Object.entries(question.traits)) {
          impact[trait as keyof PersonalityTrait] = intensity * multiplier;
        }
      }
    } else if (question.type === 'slider') {
      const value = Number(response) || 5;
      for (const [trait, multiplier] of Object.entries(question.traits)) {
        impact[trait as keyof PersonalityTrait] = value * multiplier;
      }
    } else if (question.type === 'multi_select') {
      const selections = Array.isArray(response) ? response : [response];
      const intensity = Math.min(10, selections.length * 2);
      
      for (const [trait, multiplier] of Object.entries(question.traits)) {
        impact[trait as keyof PersonalityTrait] = intensity * multiplier;
      }
    }

    return impact;
  }

  private extractPreferences(responses: Record<string, any>): TravelPreferences {
    // Extract budget range
    const budgetMapping: Record<string, { min: number; max: number }> = {
      '10.000₺ - 25.000₺': { min: 10000, max: 25000 },
      '25.000₺ - 50.000₺': { min: 25000, max: 50000 },
      '50.000₺ - 100.000₺': { min: 50000, max: 100000 },
      '100.000₺+': { min: 100000, max: 200000 }
    };

    // Extract duration
    const durationMapping: Record<string, { min: number; max: number }> = {
      '3-5 gün': { min: 3, max: 5 },
      '1 hafta': { min: 7, max: 7 },
      '10-14 gün': { min: 10, max: 14 },
      '2 hafta+': { min: 14, max: 21 }
    };

    return {
      destinations: Array.isArray(responses.destination_type) ? responses.destination_type : [],
      budgetRange: budgetMapping[responses.budget_range] || { min: 25000, max: 50000 },
      duration: durationMapping[responses.duration_preference] || { min: 7, max: 10 },
      travelStyle: this.mapToTravelStyles(responses),
      accommodationType: responses.accommodation_type ? [responses.accommodation_type] : ['hotel'],
      seasonPreference: ['spring', 'summer'],
      activities: [],
      specialRequests: []
    };
  }

  private mapToTravelStyles(responses: Record<string, any>): ('luxury' | 'adventure' | 'cultural' | 'romantic' | 'beach' | 'city')[] {
    const styles: ('luxury' | 'adventure' | 'cultural' | 'romantic' | 'beach' | 'city')[] = [];
    
    if (responses.luxury_preference && responses.luxury_preference.includes('lüks')) {
      styles.push('luxury');
    }
    if (responses.adventure_level && responses.adventure_level.includes('macera')) {
      styles.push('adventure');
    }
    if (responses.destination_type) {
      const destinations = Array.isArray(responses.destination_type) ? responses.destination_type : [responses.destination_type];
      if (destinations.some((d: string) => d.includes('Plaj'))) styles.push('beach');
      if (destinations.some((d: string) => d.includes('şehir'))) styles.push('city');
      if (destinations.some((d: string) => d.includes('Tarihi'))) styles.push('cultural');
    }
    
    styles.push('romantic'); // Always add romantic for honeymoon
    
    return styles;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'userProfiles', profile.userId);
      await setDoc(userRef, profile, { merge: true });
      logger.info('User profile saved successfully', { userId: profile.userId });
    } catch (error) {
      logger.error('Error saving user profile', { userId: profile.userId, error });
      throw error;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const doc_snap = await getDoc(userRef);
      
      if (doc_snap.exists()) {
        return doc_snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      logger.error('Error getting user profile', { userId, error });
      return null;
    }
  }

  getQuestions(): ProfileQuestion[] {
    return this.questions;
  }

  getQuestionsByCategory(category: 'personality' | 'preferences' | 'demographics'): ProfileQuestion[] {
    return this.questions.filter(q => q.category === category);
  }

  generatePersonalityInsights(personality: PersonalityTrait): string[] {
    const insights: string[] = [];

    if (personality.adventurous > 7) {
      insights.push("🎒 Macera arayan bir kişiliğiniz var! Yeni yerler keşfetmeyi seviyorsunuz.");
    }
    if (personality.luxury > 7) {
      insights.push("✨ Lüks deneyimleri tercih ediyorsunuz. Konfor sizin için önemli.");
    }
    if (personality.romantic > 8) {
      insights.push("💕 Son derece romantik bir ruhunuz var! Özel anlar yaratmayı seviyorsunuz.");
    }
    if (personality.cultural > 7) {
      insights.push("🏛️ Kültür ve tarih konularında meraklısınız. Yerel deneyimler sizi cezbediyor.");
    }
    if (personality.active > 7) {
      insights.push("🏃‍♂️ Aktif bir tatil tarzınız var. Hareket halinde olmayı seviyorsunuz.");
    }

    return insights;
  }
}

export const userProfileAnalyzer = new UserProfileAnalyzer();