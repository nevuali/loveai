import { logger } from '../utils/logger';
import { voiceAI } from '../services/voiceAI';
import { intelligentCacheSystem } from '../services/intelligentCacheSystem';
import { smartRecommendationEngine } from '../services/smartRecommendationEngine';
import { proactiveNotificationEngine } from '../services/proactiveNotificationEngine';
import { autoBookingAssistant } from '../services/autoBookingAssistant';
import { dynamicPricingEngine } from '../services/dynamicPricingEngine';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

class AISystemsIntegrationTest {
  private testResults: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  // Test suite başlat
  startTestSuite(suiteName: string): void {
    this.currentSuite = {
      suiteName,
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    };
    
    console.log(`\n🧪 Starting test suite: ${suiteName}`);
    console.log('='.repeat(50));
  }

  // Test suite bitir
  endTestSuite(): void {
    if (!this.currentSuite) return;

    this.testResults.push(this.currentSuite);
    
    console.log(`\n📊 Test Suite Results: ${this.currentSuite.suiteName}`);
    console.log(`✅ Passed: ${this.currentSuite.passedTests}`);
    console.log(`❌ Failed: ${this.currentSuite.failedTests}`);
    console.log(`⏱️ Total Duration: ${this.currentSuite.totalDuration}ms`);
    console.log('='.repeat(50));

    this.currentSuite = null;
  }

  // Test çalıştır
  async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Running: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        success: true,
        duration,
        details: result
      };

      if (this.currentSuite) {
        this.currentSuite.results.push(testResult);
        this.currentSuite.totalTests++;
        this.currentSuite.passedTests++;
        this.currentSuite.totalDuration += duration;
      }

      console.log(`✅ ${testName} - ${duration}ms`);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testName,
        success: false,
        duration,
        details: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      if (this.currentSuite) {
        this.currentSuite.results.push(testResult);
        this.currentSuite.totalTests++;
        this.currentSuite.failedTests++;
        this.currentSuite.totalDuration += duration;
      }

      console.log(`❌ ${testName} - ${error}`);
      return testResult;
    }
  }

  // 1. Intelligent Cache System Test
  async testIntelligentCacheSystem(): Promise<void> {
    this.startTestSuite('Intelligent Cache System');

    // Test 1: Cache Miss
    await this.runTest('Cache Miss Test', async () => {
      const result = intelligentCacheSystem.findSmartCache('test query', 'test_user', 'tr');
      if (result !== null) throw new Error('Expected cache miss but got hit');
      return { cacheMiss: true };
    });

    // Test 2: Cache Add and Hit
    await this.runTest('Cache Add and Hit Test', async () => {
      intelligentCacheSystem.addSmartCache(
        'Bali paket önerisi', 
        'Bali için muhteşem paketlerimiz var! **SHOW_PACKAGES:bali**',
        'test_user',
        'tr',
        500,
        ['package-request', 'destination-bali']
      );

      const result = intelligentCacheSystem.findSmartCache('Bali paket önerisi', 'test_user', 'tr');
      if (!result) throw new Error('Expected cache hit but got miss');
      
      return { 
        cacheHit: true, 
        response: result.response,
        tags: result.contextTags 
      };
    });

    // Test 3: Semantic Similarity
    await this.runTest('Semantic Similarity Test', async () => {
      const result = intelligentCacheSystem.findSmartCache('Bali için paket önerir misiniz', 'test_user', 'tr');
      if (!result) throw new Error('Expected semantic cache hit');
      
      return { 
        semanticHit: true, 
        similarity: result.similarity,
        originalQuery: 'Bali paket önerisi',
        newQuery: 'Bali için paket önerir misiniz'
      };
    });

    // Test 4: Cache Quality Update
    await this.runTest('Cache Quality Update Test', async () => {
      intelligentCacheSystem.updateCacheQuality('Bali paket önerisi', 'test_user', 'tr', 'positive');
      const stats = intelligentCacheSystem.getCacheStats();
      
      return {
        cacheSize: stats.size,
        userSatisfaction: stats.userSatisfaction
      };
    });

    this.endTestSuite();
  }

  // 2. Smart Recommendation Engine Test
  async testSmartRecommendationEngine(): Promise<void> {
    this.startTestSuite('Smart Recommendation Engine');

    // Test 1: User Profile Creation
    await this.runTest('User Profile Creation Test', async () => {
      smartRecommendationEngine.updateUserProfile('test_user', {
        query: 'Bali balayı paketleri',
        sessionDuration: 300000
      });

      const profile = smartRecommendationEngine.getUserProfile('test_user');
      if (!profile) throw new Error('User profile not created');

      return {
        profileCreated: true,
        userId: profile.userId,
        preferences: profile.preferences
      };
    });

    // Test 2: Smart Recommendations
    await this.runTest('Smart Recommendations Test', async () => {
      const recommendations = smartRecommendationEngine.generateSmartRecommendations(
        'test_user',
        'Bali için lüks balayı paketi önerisi',
        { conversationPhase: 'exploration', urgencyLevel: 'medium' }
      );

      if (recommendations.packages.length === 0) {
        throw new Error('No recommendations generated');
      }

      return {
        packageCount: recommendations.packages.length,
        topPackage: recommendations.packages[0],
        strategy: recommendations.strategy,
        timing: recommendations.timing,
        personalizationFactors: recommendations.personalizationFactors
      };
    });

    // Test 3: User Behavior Learning
    await this.runTest('User Behavior Learning Test', async () => {
      smartRecommendationEngine.updateUserProfile('test_user', {
        clickedPackage: 'romantic-bali',
        feedback: 'positive'
      });

      const updatedProfile = smartRecommendationEngine.getUserProfile('test_user');
      if (!updatedProfile) throw new Error('Profile not found');

      return {
        clickedPackages: updatedProfile.behavior.clickedPackages,
        satisfactionRate: updatedProfile.analytics.satisfactionRate,
        engagementLevel: updatedProfile.analytics.engagementLevel
      };
    });

    // Test 4: Recommendation Feedback
    await this.runTest('Recommendation Feedback Test', async () => {
      smartRecommendationEngine.recordRecommendationFeedback(
        'test_user',
        'romantic-bali',
        'click',
        'positive'
      );

      const analytics = smartRecommendationEngine.getRecommendationAnalytics();
      
      return {
        totalRecommendations: analytics.totalRecommendations,
        clickThroughRate: analytics.clickThroughRate,
        conversionRate: analytics.conversionRate
      };
    });

    this.endTestSuite();
  }

  // 3. Proactive Notification Engine Test
  async testProactiveNotificationEngine(): Promise<void> {
    this.startTestSuite('Proactive Notification Engine');

    // Test 1: User Profile Update
    await this.runTest('User Profile Update Test', async () => {
      proactiveNotificationEngine.updateUserProfile('test_user', {
        packageView: 'santorini-sunset',
        activity: { duration: 600000 }
      });

      return { profileUpdated: true };
    });

    // Test 2: Notification Preferences
    await this.runTest('Notification Preferences Test', async () => {
      proactiveNotificationEngine.updateNotificationPreferences('test_user', {
        enableNotifications: true,
        allowedTypes: ['behavior', 'price', 'availability'],
        frequency: 'medium'
      });

      return { preferencesUpdated: true };
    });

    // Test 3: Get User Notifications
    await this.runTest('Get User Notifications Test', async () => {
      const notifications = proactiveNotificationEngine.getUserNotifications('test_user', 5);
      
      return {
        notificationCount: notifications.length,
        notifications: notifications.map(n => ({
          type: n.type,
          title: n.title,
          priority: n.priority
        }))
      };
    });

    // Test 4: Notification Analytics
    await this.runTest('Notification Analytics Test', async () => {
      const analytics = proactiveNotificationEngine.getNotificationAnalytics();
      
      return {
        totalSent: analytics.totalSent,
        deliveryRate: analytics.deliveryRate,
        openRate: analytics.openRate,
        clickThroughRate: analytics.clickThroughRate
      };
    });

    this.endTestSuite();
  }

  // 4. Auto-Booking Assistant Test
  async testAutoBookingAssistant(): Promise<void> {
    this.startTestSuite('Auto-Booking Assistant');

    // Test 1: Booking Intent Extraction
    await this.runTest('Booking Intent Extraction Test', async () => {
      const intent = autoBookingAssistant.extractBookingIntent(
        'test_user',
        'test_session',
        'Bali paketi için rezervasyon yapmak istiyorum'
      );

      if (!intent) throw new Error('Failed to extract booking intent');

      return {
        intentExtracted: true,
        confidence: intent.confidence,
        preferences: intent.preferences,
        extractedMessage: intent.extractedFromMessage
      };
    });

    // Test 2: Auto-Booking Session Start
    await this.runTest('Auto-Booking Session Start Test', async () => {
      const intent = autoBookingAssistant.extractBookingIntent(
        'test_user',
        'test_session',
        'Santorini paketi rezerve etmek istiyorum'
      );

      if (!intent) throw new Error('Intent extraction failed');

      const session = autoBookingAssistant.startAutoBookingSession(
        'test_user',
        intent,
        'santorini-sunset'
      );

      return {
        sessionStarted: true,
        sessionId: session.id,
        currentStep: session.currentStep,
        steps: session.steps.map(s => s.userFriendlyName),
        personality: session.assistantPersonality,
        totalEstimatedTime: session.totalEstimatedTime
      };
    });

    // Test 3: Step Response Generation
    await this.runTest('Step Response Generation Test', async () => {
      const activeSession = autoBookingAssistant.getActiveSession('test_user');
      if (!activeSession) throw new Error('No active session found');

      const response = autoBookingAssistant.generateStepResponse(activeSession.id, 'evet, bu paketi onaylıyorum');

      return {
        stepResponse: response,
        currentStep: activeSession.currentStep,
        completionPercentage: activeSession.completionPercentage
      };
    });

    // Test 4: Booking Analytics
    await this.runTest('Booking Analytics Test', async () => {
      const analytics = autoBookingAssistant.getBookingAnalytics();
      
      return {
        totalSessions: analytics.totalSessions,
        completionRate: analytics.completionRate,
        averageTimeToComplete: analytics.averageTimeToComplete
      };
    });

    this.endTestSuite();
  }

  // 5. Dynamic Pricing Engine Test
  async testDynamicPricingEngine(): Promise<void> {
    this.startTestSuite('Dynamic Pricing Engine');

    // Test 1: Dynamic Price Calculation
    await this.runTest('Dynamic Price Calculation Test', async () => {
      const dynamicPrice = await dynamicPricingEngine.calculateDynamicPrice(
        'romantic-bali',
        'test_user',
        {
          basePrice: 3500,
          destination: 'bali',
          travelDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days ahead
          bookingDate: new Date()
        }
      );

      return {
        packageId: dynamicPrice.packageId,
        basePrice: dynamicPrice.basePrice,
        currentPrice: dynamicPrice.currentPrice,
        adjustmentPercentage: dynamicPrice.adjustmentPercentage,
        factors: dynamicPrice.factors.map(f => ({
          name: f.name,
          weight: f.weight,
          impact: f.impact
        })),
        urgencyLevel: dynamicPrice.urgencyLevel,
        reason: dynamicPrice.reason,
        confidence: dynamicPrice.confidence
      };
    });

    // Test 2: Price Interaction Recording
    await this.runTest('Price Interaction Recording Test', async () => {
      dynamicPricingEngine.recordPriceInteraction(
        'test_user',
        'romantic-bali',
        3150,
        'interested'
      );

      const userProfile = dynamicPricingEngine.getUserPricingProfilePublic('test_user');
      if (!userProfile) throw new Error('User pricing profile not found');

      return {
        priceElasticity: userProfile.priceElasticity,
        conversionProbability: userProfile.conversionProbability,
        segmentProfile: userProfile.segmentProfile,
        interactionHistoryLength: userProfile.priceInteractionHistory.length
      };
    });

    // Test 3: Pricing Strategies
    await this.runTest('Pricing Strategies Test', async () => {
      const strategies = dynamicPricingEngine.getPricingStrategies();
      const activeStrategies = strategies.filter(s => s.active);

      return {
        totalStrategies: strategies.length,
        activeStrategies: activeStrategies.length,
        strategyNames: activeStrategies.map(s => s.name)
      };
    });

    // Test 4: Market Conditions
    await this.runTest('Market Conditions Test', async () => {
      const marketCondition = dynamicPricingEngine.getMarketCondition('bali');

      return {
        destination: marketCondition?.destination,
        seasonality: marketCondition?.seasonality,
        demand: marketCondition?.demand,
        weatherImpact: marketCondition?.weatherImpact,
        eventsCount: marketCondition?.events.length
      };
    });

    // Test 5: Price Optimization Recommendations
    await this.runTest('Price Optimization Recommendations Test', async () => {
      const recommendations = dynamicPricingEngine.getPriceOptimizationRecommendations('romantic-bali');

      return {
        currentPerformance: recommendations.currentPerformance,
        recommendationsCount: recommendations.recommendations.length,
        topRecommendation: recommendations.recommendations[0]
      };
    });

    this.endTestSuite();
  }

  // 6. Voice AI Test (Browser dependent)
  async testVoiceAI(): Promise<void> {
    this.startTestSuite('Voice AI System');

    // Test 1: Voice Support Check
    await this.runTest('Voice Support Check Test', async () => {
      const support = voiceAI.checkVoiceSupport();
      
      return {
        speechRecognition: support.speechRecognition,
        speechSynthesis: support.speechSynthesis,
        availableVoices: support.voiceList.length,
        voiceList: support.voiceList.slice(0, 3) // First 3 voices
      };
    });

    // Test 2: Voice Preferences
    await this.runTest('Voice Preferences Test', async () => {
      voiceAI.updateUserVoicePreferences('test_user', {
        language: 'tr',
        speed: 0.9,
        pitch: 1.0,
        voice: 'female'
      });

      const preferences = voiceAI.getUserVoicePreferences('test_user');
      if (!preferences) throw new Error('Voice preferences not saved');

      return {
        preferencesSet: true,
        language: preferences.language,
        speed: preferences.speed,
        voice: preferences.voice
      };
    });

    // Test 3: Voice Analytics
    await this.runTest('Voice Analytics Test', async () => {
      const analytics = voiceAI.getVoiceAnalytics();
      
      return {
        totalInteractions: analytics.totalInteractions,
        avgConfidence: analytics.avgConfidence,
        avgDuration: analytics.avgDuration,
        topCommands: analytics.topCommands
      };
    });

    // Test 4: Voice History
    await this.runTest('Voice History Test', async () => {
      const history = voiceAI.getUserVoiceHistory('test_user');
      
      return {
        historyLength: history.length,
        interactions: history.map(h => ({
          transcription: h.transcription,
          confidence: h.confidence,
          duration: h.duration
        }))
      };
    });

    this.endTestSuite();
  }

  // 7. Integration Test (All Systems Together)
  async testSystemIntegration(): Promise<void> {
    this.startTestSuite('System Integration');

    // Test 1: Complete User Journey
    await this.runTest('Complete User Journey Test', async () => {
      const userId = 'integration_test_user';
      const journey: any = {};

      // 1. User browses packages
      journey.step1 = 'User views packages';
      smartRecommendationEngine.updateUserProfile(userId, {
        query: 'Lüks Bali balayı paketi arıyorum',
        sessionDuration: 400000
      });

      // 2. Get smart recommendations
      journey.step2 = 'Smart recommendations';
      const recommendations = smartRecommendationEngine.generateSmartRecommendations(
        userId,
        'Bali lüks paket önerisi',
        { conversationPhase: 'exploration', urgencyLevel: 'medium' }
      );
      journey.recommendationsCount = recommendations.packages.length;

      // 3. Get dynamic pricing
      journey.step3 = 'Dynamic pricing';
      const pricing = await dynamicPricingEngine.calculateDynamicPrice(
        'romantic-bali',
        userId,
        {
          basePrice: 3500,
          destination: 'bali',
          travelDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          bookingDate: new Date()
        }
      );
      journey.finalPrice = pricing.currentPrice;
      journey.priceAdjustment = pricing.adjustmentPercentage;

      // 4. Start booking process
      journey.step4 = 'Auto-booking';
      const intent = autoBookingAssistant.extractBookingIntent(
        userId,
        'integration_session',
        'Bu Bali paketini rezerve etmek istiyorum'
      );
      
      if (intent) {
        const bookingSession = autoBookingAssistant.startAutoBookingSession(
          userId,
          intent,
          'romantic-bali'
        );
        journey.bookingSessionId = bookingSession.id;
        journey.bookingSteps = bookingSession.steps.length;
      }

      // 5. Cache interaction
      journey.step5 = 'Cache optimization';
      intelligentCacheSystem.addSmartCache(
        'Bali lüks paket önerisi',
        `Mükemmel! ${pricing.currentPrice} USD fiyatla harika Bali paketi. **SHOW_PACKAGES:bali**`,
        userId,
        'tr',
        300,
        ['package-request', 'luxury', 'bali']
      );

      return journey;
    });

    // Test 2: Cross-System Data Flow
    await this.runTest('Cross-System Data Flow Test', async () => {
      const userId = 'data_flow_test_user';
      const dataFlow: any = {};

      // User interaction in recommendation engine affects pricing
      smartRecommendationEngine.updateUserProfile(userId, {
        clickedPackage: 'luxury-package',
        feedback: 'positive'
      });

      const userProfile = smartRecommendationEngine.getUserProfile(userId);
      dataFlow.recommendationProfile = {
        engagementLevel: userProfile?.analytics.engagementLevel,
        satisfactionRate: userProfile?.analytics.satisfactionRate
      };

      // This should influence pricing profile
      const pricingProfile = dynamicPricingEngine.getUserPricingProfilePublic(userId);
      dataFlow.pricingProfile = pricingProfile ? {
        priceElasticity: pricingProfile.priceElasticity,
        segment: pricingProfile.segmentProfile.segment
      } : null;

      // Notification system should be aware of user behavior
      proactiveNotificationEngine.updateUserProfile(userId, {
        packageView: 'luxury-package',
        activity: { duration: 800000 }
      });

      dataFlow.notificationProfile = 'Updated with package view';

      return dataFlow;
    });

    // Test 3: Performance Integration
    await this.runTest('Performance Integration Test', async () => {
      const userId = 'performance_test_user';
      const startTime = Date.now();

      // Simulate rapid consecutive calls
      const tasks = await Promise.all([
        smartRecommendationEngine.generateSmartRecommendations(userId, 'Paris honeymoon package'),
        dynamicPricingEngine.calculateDynamicPrice('paris-luxury', userId),
        intelligentCacheSystem.findSmartCache('Paris package', userId, 'tr'),
        autoBookingAssistant.extractBookingIntent(userId, 'perf_session', 'Paris için rezervasyon istiyorum')
      ]);

      const totalTime = Date.now() - startTime;

      return {
        totalExecutionTime: totalTime,
        tasksCompleted: tasks.length,
        averageTimePerTask: totalTime / tasks.length,
        allTasksSuccessful: tasks.every(task => task !== null)
      };
    });

    this.endTestSuite();
  }

  // Test runner - tüm testleri çalıştır
  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting AI Systems Integration Tests');
    console.log('=' .repeat(60));
    console.log(`Start Time: ${new Date().toISOString()}`);
    
    const overallStartTime = Date.now();

    try {
      // Test each system
      await this.testIntelligentCacheSystem();
      await this.testSmartRecommendationEngine();
      await this.testProactiveNotificationEngine();
      await this.testAutoBookingAssistant();
      await this.testDynamicPricingEngine();
      await this.testVoiceAI();
      await this.testSystemIntegration();

      const overallDuration = Date.now() - overallStartTime;

      // Final report
      this.generateFinalReport(overallDuration);

    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }

  // Final report oluştur
  generateFinalReport(overallDuration: number): void {
    console.log('\n📋 FINAL TEST REPORT');
    console.log('=' .repeat(60));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    this.testResults.forEach(suite => {
      console.log(`\n📁 ${suite.suiteName}:`);
      console.log(`   ✅ Passed: ${suite.passedTests}/${suite.totalTests}`);
      console.log(`   ❌ Failed: ${suite.failedTests}/${suite.totalTests}`);
      console.log(`   ⏱️ Duration: ${suite.totalDuration}ms`);

      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;

      // Show failed tests
      if (suite.failedTests > 0) {
        console.log('   🔍 Failed Tests:');
        suite.results
          .filter(r => !r.success)
          .forEach(r => console.log(`      - ${r.testName}: ${r.error}`));
      }
    });

    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0';

    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Total Duration: ${overallDuration}ms`);
    console.log(`   End Time: ${new Date().toISOString()}`);

    // Performance analysis
    if (totalPassed > 0) {
      console.log('\n⚡ PERFORMANCE ANALYSIS:');
      console.log(`   Average Test Duration: ${Math.round(overallDuration / totalTests)}ms`);
      console.log(`   Systems Integration: ${totalTests >= 20 ? '✅ Complete' : '⚠️ Partial'}`);
      console.log(`   Ready for Production: ${successRate >= '90' ? '✅ Yes' : '❌ No'}`);
    }

    console.log('\n' + '=' .repeat(60));
  }

  // Specific test methods for individual systems
  async testSpecificSystem(systemName: string): Promise<void> {
    console.log(`\n🔧 Testing specific system: ${systemName}`);
    
    switch (systemName.toLowerCase()) {
      case 'cache':
        await this.testIntelligentCacheSystem();
        break;
      case 'recommendations':
        await this.testSmartRecommendationEngine();
        break;
      case 'notifications':
        await this.testProactiveNotificationEngine();
        break;
      case 'booking':
        await this.testAutoBookingAssistant();
        break;
      case 'pricing':
        await this.testDynamicPricingEngine();
        break;
      case 'voice':
        await this.testVoiceAI();
        break;
      case 'integration':
        await this.testSystemIntegration();
        break;
      default:
        console.log(`❌ Unknown system: ${systemName}`);
        console.log('Available systems: cache, recommendations, notifications, booking, pricing, voice, integration');
    }
  }
}

// Export test instance
export const aiSystemsTest = new AISystemsIntegrationTest();

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 AI Systems Test Suite loaded in browser');
  console.log('Run tests with: aiSystemsTest.runAllTests()');
} else {
  // Node environment
  console.log('🖥️ AI Systems Test Suite loaded in Node.js');
}