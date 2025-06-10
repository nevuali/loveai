/**
 * 🧪 Kişilik Testi Entegrasyon Test Modülü
 * Gerçek sistem bileşenleriyle entegrasyonu test eder
 */

import { personalityService, PersonalityProfile } from '../services/personalityService';
import { logger } from './logger';

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class PersonalityIntegrationTester {
  private testUserId: string;
  private testProfile: PersonalityProfile;

  constructor() {
    this.testUserId = `test-user-${Date.now()}`;
    this.testProfile = {
      personalityType: 'luxury_seeker',
      budgetRange: 'luxury',
      travelStyle: 'relaxation',
      durationPreference: '7-10',
      priorities: ['maximum_comfort', 'luxury_lifestyle', 'relaxation'],
      socialMediaStyle: 'luxury_lifestyle',
      energyStyle: 'relaxation',
      mainPriority: 'maximum_comfort',
      aiPersonality: 'sophisticated, elegant, exclusive language. Focus on premium experiences, VIP services, and bespoke recommendations. Use terms like \'curated\', \'exclusive\', \'premium\'. Emphasize premium quality, exclusive experiences, and high-end services.',
      profileScore: 95
    };
  }

  /**
   * 🎯 Tam entegrasyon testi - tüm süreci test eder
   */
  async runFullIntegrationTest(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log('🧪 Kişilik Testi Entegrasyon Testi Başlatılıyor...');
    
    // Test 1: Profil kaydetme
    results.push(await this.testProfileSaving());
    
    // Test 2: Profil okuma
    results.push(await this.testProfileReading());
    
    // Test 3: Onboarding durumu kontrolü
    results.push(await this.testOnboardingStatus());
    
    // Test 4: AI prompt oluşturma
    results.push(await this.testAIPromptGeneration());
    
    // Test 5: Profil skoru güncelleme
    results.push(await this.testProfileScoreUpdate());
    
    // Test 6: Uyumluluk skoru hesaplama
    results.push(await this.testCompatibilityScore());
    
    this.printTestResults(results);
    return results;
  }

  /**
   * 💾 Profil kaydetme testi
   */
  private async testProfileSaving(): Promise<TestResult> {
    try {
      logger.log('📝 Test: Profil kaydetme');
      
      await personalityService.savePersonalityProfile(this.testUserId, this.testProfile);
      
      return {
        success: true,
        message: 'Profil başarıyla kaydedildi',
        data: { userId: this.testUserId, profileType: this.testProfile.personalityType }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Profil kaydetme hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 📖 Profil okuma testi
   */
  private async testProfileReading(): Promise<TestResult> {
    try {
      logger.log('📖 Test: Profil okuma');
      
      const savedProfile = await personalityService.getPersonalityProfile(this.testUserId);
      
      if (!savedProfile) {
        return {
          success: false,
          message: 'Kaydedilen profil bulunamadı',
          error: 'Profile not found'
        };
      }
      
      if (savedProfile.personalityType !== this.testProfile.personalityType) {
        return {
          success: false,
          message: 'Profil verileri eşleşmiyor',
          error: `Expected ${this.testProfile.personalityType}, got ${savedProfile.personalityType}`
        };
      }
      
      return {
        success: true,
        message: 'Profil başarıyla okundu',
        data: savedProfile
      };
    } catch (error) {
      return {
        success: false,
        message: 'Profil okuma hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 🎯 Onboarding durumu testi
   */
  private async testOnboardingStatus(): Promise<TestResult> {
    try {
      logger.log('🎯 Test: Onboarding durumu');
      
      const hasCompleted = await personalityService.hasCompletedOnboarding(this.testUserId);
      
      if (!hasCompleted) {
        return {
          success: false,
          message: 'Onboarding durumu yanlış - tamamlanmış olmalı',
          error: 'hasCompletedOnboarding returned false'
        };
      }
      
      return {
        success: true,
        message: 'Onboarding durumu doğru tespit edildi',
        data: { hasCompleted }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Onboarding durumu kontrol hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 🤖 AI prompt oluşturma testi
   */
  private async testAIPromptGeneration(): Promise<TestResult> {
    try {
      logger.log('🤖 Test: AI prompt oluşturma');
      
      const aiPrompt = personalityService.generateAISystemPrompt(this.testProfile);
      
      if (!aiPrompt || aiPrompt.length < 100) {
        return {
          success: false,
          message: 'AI prompt çok kısa veya boş',
          error: `Prompt length: ${aiPrompt.length}`
        };
      }
      
      // Profil bilgilerinin prompt'ta olup olmadığını kontrol et
      const requiredInfo = [
        this.testProfile.personalityType,
        this.testProfile.budgetRange,
        this.testProfile.travelStyle,
        this.testProfile.mainPriority
      ];
      
      const missingInfo = requiredInfo.filter(info => !aiPrompt.includes(info));
      
      if (missingInfo.length > 0) {
        return {
          success: false,
          message: 'AI prompt\'ta eksik bilgiler var',
          error: `Missing: ${missingInfo.join(', ')}`
        };
      }
      
      return {
        success: true,
        message: 'AI prompt başarıyla oluşturuldu',
        data: { 
          promptLength: aiPrompt.length,
          containsPersonalityType: aiPrompt.includes(this.testProfile.personalityType)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI prompt oluşturma hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 📊 Profil skoru güncelleme testi
   */
  private async testProfileScoreUpdate(): Promise<TestResult> {
    try {
      logger.log('📊 Test: Profil skoru güncelleme');
      
      const newScore = 88;
      await personalityService.updateProfileScore(this.testUserId, newScore);
      
      // Güncellenmiş profili oku
      const updatedProfile = await personalityService.getPersonalityProfile(this.testUserId);
      
      if (!updatedProfile || updatedProfile.profileScore !== newScore) {
        return {
          success: false,
          message: 'Profil skoru güncellenemedi',
          error: `Expected ${newScore}, got ${updatedProfile?.profileScore}`
        };
      }
      
      return {
        success: true,
        message: 'Profil skoru başarıyla güncellendi',
        data: { oldScore: this.testProfile.profileScore, newScore }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Profil skoru güncelleme hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 💕 Uyumluluk skoru testi
   */
  private async testCompatibilityScore(): Promise<TestResult> {
    try {
      logger.log('💕 Test: Uyumluluk skoru hesaplama');
      
      // İkinci profil oluştur
      const partnerProfile: PersonalityProfile = {
        ...this.testProfile,
        personalityType: 'romantic_dreamer', // Farklı tip
        budgetRange: 'luxury', // Aynı bütçe
        travelStyle: 'relaxation' // Aynı stil
      };
      
      const compatibilityScore = personalityService.calculateCompatibilityScore(
        this.testProfile, 
        partnerProfile
      );
      
      if (compatibilityScore < 0 || compatibilityScore > 100) {
        return {
          success: false,
          message: 'Uyumluluk skoru geçersiz aralıkta',
          error: `Score out of range: ${compatibilityScore}`
        };
      }
      
      return {
        success: true,
        message: 'Uyumluluk skoru başarıyla hesaplandı',
        data: { 
          score: compatibilityScore,
          profile1: this.testProfile.personalityType,
          profile2: partnerProfile.personalityType
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Uyumluluk skoru hesaplama hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * 📋 Test sonuçlarını yazdır
   */
  private printTestResults(results: TestResult[]): void {
    console.log('\n📊 Entegrasyon Test Sonuçları:');
    console.log('=====================================');
    
    let passedTests = 0;
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      const status = result.success ? 'BAŞARILI' : 'BAŞARISIZ';
      
      console.log(`${icon} Test ${index + 1}: ${result.message} - ${status}`);
      
      if (result.success) {
        passedTests++;
        if (result.data) {
          console.log(`   📊 Veri:`, result.data);
        }
      } else {
        console.log(`   ❌ Hata:`, result.error);
      }
    });
    
    const successRate = Math.round((passedTests / results.length) * 100);
    console.log(`\n🎯 Başarı Oranı: ${passedTests}/${results.length} (${successRate}%)`);
    
    if (successRate === 100) {
      console.log('🎉 TÜM ENTEGRASYON TESTLERİ BAŞARILI!');
    } else if (successRate >= 80) {
      console.log('⚠️ Çoğu test başarılı, bazı sorunlar var.');
    } else {
      console.log('❌ Ciddi entegrasyon sorunları tespit edildi.');
    }
  }

  /**
   * 🧹 Test verilerini temizle
   */
  async cleanup(): Promise<void> {
    try {
      // Test kullanıcısının verilerini temizle (gerçek implementasyonda)
      logger.log('🧹 Test verileri temizleniyor...');
      // Bu noktada test kullanıcısının Firestore verilerini silebiliriz
    } catch (error) {
      logger.error('Test temizleme hatası:', error);
    }
  }
}

/**
 * 🚀 Test runner fonksiyonu
 */
export async function runPersonalityIntegrationTests(): Promise<TestResult[]> {
  const tester = new PersonalityIntegrationTester();
  
  try {
    const results = await tester.runFullIntegrationTest();
    return results;
  } finally {
    await tester.cleanup();
  }
}

/**
 * 🎯 Browser console'dan çalıştırmak için global fonksiyon
 */
if (typeof window !== 'undefined') {
  (window as any).testPersonalityIntegration = runPersonalityIntegrationTests;
}