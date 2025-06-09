import { personalityService } from '../services/personalityService';

// Test helper functions for personality system
export class PersonalityTestHelpers {
  
  // Reset user's onboarding status (for testing)
  static async resetUserOnboarding(userId: string): Promise<void> {
    try {
      // This would remove the personality profile from Firestore
      // Implementation depends on your Firestore structure
      console.log(`Resetting onboarding for user: ${userId}`);
      // In a real scenario, you'd delete the personalityProfile field
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  // Force trigger onboarding for testing
  static async triggerOnboardingForUser(userId: string): Promise<void> {
    try {
      // This would set needsOnboarding to true for a user
      console.log(`Triggering onboarding for user: ${userId}`);
    } catch (error) {
      console.error('Error triggering onboarding:', error);
    }
  }

  // Create test personality profiles
  static createTestProfiles() {
    return {
      luxurySeeker: {
        personalityType: 'luxury_seeker' as const,
        budgetRange: 'luxury' as const,
        travelStyle: 'relaxation' as const,
        durationPreference: '7-10' as const,
        priorities: ['maximum_comfort', 'luxury_lifestyle', 'relaxation'],
        socialMediaStyle: 'luxury_lifestyle',
        energyStyle: 'relaxation',
        mainPriority: 'maximum_comfort',
        aiPersonality: 'sophisticated, elegant, exclusive language. Focus on premium experiences, VIP services, and bespoke recommendations.',
        profileScore: 95
      },
      adventureLover: {
        personalityType: 'adventure_lover' as const,
        budgetRange: 'mid_range' as const,
        travelStyle: 'adventure' as const,
        durationPreference: '5-7' as const,
        priorities: ['new_discoveries', 'adventure_seeker', 'active'],
        socialMediaStyle: 'adventure_seeker',
        energyStyle: 'active',
        mainPriority: 'new_discoveries',
        aiPersonality: 'energetic, exciting, adventurous tone. Emphasize unique experiences, active adventures, and thrilling discoveries.',
        profileScore: 88
      },
      cultureExplorer: {
        personalityType: 'culture_explorer' as const,
        budgetRange: 'mid_range' as const,
        travelStyle: 'cultural' as const,
        durationPreference: '7-10' as const,
        priorities: ['new_discoveries', 'culture_enthusiast', 'cultural'],
        socialMediaStyle: 'culture_enthusiast',
        energyStyle: 'cultural',
        mainPriority: 'new_discoveries',
        aiPersonality: 'knowledgeable, informative, culturally rich. Focus on historical significance, local traditions, and authentic experiences.',
        profileScore: 90
      },
      romanticDreamer: {
        personalityType: 'romantic_dreamer' as const,
        budgetRange: 'luxury' as const,
        travelStyle: 'relaxation' as const,
        durationPreference: '5-7' as const,
        priorities: ['romantic_connection', 'romantic_moments', 'relaxation'],
        socialMediaStyle: 'romantic_moments',
        energyStyle: 'relaxation',
        mainPriority: 'romantic_connection',
        aiPersonality: 'warm, romantic, intimate tone. Emphasize romantic settings, intimate experiences, and emotional connections.',
        profileScore: 92
      }
    };
  }

  // Get random test answers for quick testing
  static getRandomTestAnswers() {
    const visionOptions = [
      { style: 'relaxation', personality: 'romantic_dreamer' },
      { style: 'adventure', personality: 'adventure_lover' },
      { style: 'cultural', personality: 'culture_explorer' },
      { style: 'relaxation', personality: 'luxury_seeker' }
    ];

    const socialMediaOptions = ['luxury_lifestyle', 'adventure_seeker', 'culture_enthusiast', 'romantic_moments'];
    const budgetOptions = ['budget', 'mid_range', 'luxury', 'ultra_luxury'];
    const durationOptions = ['3-5', '5-7', '7-10', '10+'];
    const energyOptions = ['relaxation', 'active', 'cultural', 'mixed'];
    const priorityOptions = ['unforgettable_memories', 'maximum_comfort', 'new_discoveries', 'romantic_connection'];

    return {
      honeymoon_vision: visionOptions[Math.floor(Math.random() * visionOptions.length)],
      social_media: socialMediaOptions[Math.floor(Math.random() * socialMediaOptions.length)],
      budget: budgetOptions[Math.floor(Math.random() * budgetOptions.length)],
      duration: durationOptions[Math.floor(Math.random() * durationOptions.length)],
      energy_style: energyOptions[Math.floor(Math.random() * energyOptions.length)],
      priority: priorityOptions[Math.floor(Math.random() * priorityOptions.length)]
    };
  }

  // Simulate completing the test quickly
  static simulateTestCompletion() {
    return new Promise((resolve) => {
      const answers = this.getRandomTestAnswers();
      setTimeout(() => {
        resolve(answers);
      }, 1000); // Simulate 1 second completion
    });
  }

  // Test all personality types
  static async testAllPersonalityTypes() {
    const profiles = this.createTestProfiles();
    
    console.log('🧪 Testing all personality types:');
    
    Object.entries(profiles).forEach(([key, profile]) => {
      console.log(`\n${key}:`, {
        type: profile.personalityType,
        budget: profile.budgetRange,
        style: profile.travelStyle,
        score: profile.profileScore
      });
    });
    
    return profiles;
  }

  // Validate personality profile structure
  static validateProfile(profile: any): boolean {
    const requiredFields = [
      'personalityType',
      'budgetRange', 
      'travelStyle',
      'durationPreference',
      'priorities',
      'socialMediaStyle',
      'energyStyle',
      'mainPriority',
      'aiPersonality',
      'profileScore'
    ];

    const missingFields = requiredFields.filter(field => !(field in profile));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing fields in profile:', missingFields);
      return false;
    }

    console.log('✅ Profile validation passed');
    return true;
  }
}

export default PersonalityTestHelpers;