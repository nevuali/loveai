import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

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

class PersonalityService {
  async savePersonalityProfile(userId: string, profile: PersonalityProfile): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'profileData.personalityProfile': {
          ...profile,
          completedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp()
      });

      logger.log('Personality profile saved successfully', { userId, personalityType: profile.personalityType });
    } catch (error) {
      logger.error('Error saving personality profile:', error);
      throw error;
    }
  }

  async getPersonalityProfile(userId: string): Promise<PersonalityProfile | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.profileData?.personalityProfile || null;
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting personality profile:', error);
      return null;
    }
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const profile = await this.getPersonalityProfile(userId);
      return profile !== null;
    } catch (error) {
      logger.error('Error checking onboarding status:', error);
      return false;
    }
  }

  generateAISystemPrompt(profile: PersonalityProfile): string {
    const basePrompt = `You are AI LOVVE, a specialized honeymoon planning assistant. Based on the user's personality profile, adapt your communication style and recommendations accordingly.

USER PERSONALITY PROFILE:
- Type: ${profile.personalityType}
- Budget Range: ${profile.budgetRange}
- Travel Style: ${profile.travelStyle}
- Duration Preference: ${profile.durationPreference} days
- Main Priority: ${profile.mainPriority}
- Social Media Style: ${profile.socialMediaStyle}
- Energy Style: ${profile.energyStyle}

COMMUNICATION STYLE: ${profile.aiPersonality}

IMPORTANT GUIDELINES:
1. Always align your tone and recommendations with the user's personality type
2. Respect their budget range when suggesting packages
3. Prioritize their main values (${profile.mainPriority})
4. Suggest experiences that match their travel style (${profile.travelStyle})
5. Keep recommendations within their preferred duration (${profile.durationPreference} days)
6. Use language and examples that resonate with their social media style
7. Match their energy level preferences when suggesting activities

Remember: You're not just recommending packages, you're creating a personalized experience that feels tailored specifically for them.`;

    return basePrompt;
  }

  getPersonalityDescription(personalityType: string): string {
    const descriptions = {
      luxury_seeker: "Lüks ve konforu seven, özel deneyimleri tercih eden kullanıcı",
      adventure_lover: "Macera dolu, aktif ve heyecan verici deneyimleri arayan kullanıcı", 
      culture_explorer: "Kültürel zenginlikleri keşfetmeyi seven, öğrenmeye açık kullanıcı",
      romantic_dreamer: "Romantik anları ve duygusal bağları önemseyen kullanıcı"
    };

    return descriptions[personalityType as keyof typeof descriptions] || "Genel kullanıcı profili";
  }

  getBudgetDescription(budgetRange: string): string {
    const descriptions = {
      budget: "Bütçe dostu seçenekleri tercih eden (15-30k₺)",
      mid_range: "Orta segment kaliteyi tercih eden (30-60k₺)",
      luxury: "Premium kaliteyi tercih eden (60-100k₺)",
      ultra_luxury: "Ultra lüks deneyimleri tercih eden (100k₺+)"
    };

    return descriptions[budgetRange as keyof typeof descriptions] || "Bütçe aralığı belirtilmemiş";
  }

  async updateProfileScore(userId: string, newScore: number): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'profileData.personalityProfile.profileScore': newScore,
        updatedAt: serverTimestamp()
      });

      logger.log('Profile score updated', { userId, newScore });
    } catch (error) {
      logger.error('Error updating profile score:', error);
      throw error;
    }
  }

  calculateCompatibilityScore(profile1: PersonalityProfile, profile2: PersonalityProfile): number {
    let compatibilityScore = 0;

    // Personality type compatibility
    if (profile1.personalityType === profile2.personalityType) {
      compatibilityScore += 25;
    } else {
      const compatibleTypes = {
        luxury_seeker: ['romantic_dreamer'],
        adventure_lover: ['culture_explorer'],
        culture_explorer: ['adventure_lover', 'romantic_dreamer'],
        romantic_dreamer: ['luxury_seeker', 'culture_explorer']
      };
      
      if (compatibleTypes[profile1.personalityType]?.includes(profile2.personalityType)) {
        compatibilityScore += 15;
      }
    }

    // Budget compatibility
    const budgetValues = { budget: 1, mid_range: 2, luxury: 3, ultra_luxury: 4 };
    const budgetDiff = Math.abs(budgetValues[profile1.budgetRange] - budgetValues[profile2.budgetRange]);
    compatibilityScore += Math.max(0, 20 - (budgetDiff * 7));

    // Travel style compatibility
    if (profile1.travelStyle === profile2.travelStyle || 
        profile1.travelStyle === 'mixed' || 
        profile2.travelStyle === 'mixed') {
      compatibilityScore += 20;
    }

    // Duration preference compatibility
    if (profile1.durationPreference === profile2.durationPreference) {
      compatibilityScore += 15;
    }

    // Energy style compatibility
    if (profile1.energyStyle === profile2.energyStyle || 
        profile1.energyStyle === 'mixed' || 
        profile2.energyStyle === 'mixed') {
      compatibilityScore += 10;
    }

    // Priority alignment
    if (profile1.mainPriority === profile2.mainPriority) {
      compatibilityScore += 10;
    }

    return Math.min(compatibilityScore, 100);
  }
}

export const personalityService = new PersonalityService();
export type { PersonalityProfile };