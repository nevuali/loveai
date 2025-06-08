import { logger } from '../utils/logger';
import { smartRecommendationEngine } from './smartRecommendationEngine';
import { intelligentCacheSystem } from './intelligentCacheSystem';
import { realTimeDataService } from './realTimeDataService';

interface NotificationTrigger {
  id: string;
  type: 'behavior' | 'time' | 'price' | 'availability' | 'weather' | 'booking_window';
  conditions: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  cooldown: number; // ms
  maxDaily: number;
}

interface UserNotificationProfile {
  userId: string;
  preferences: {
    enableNotifications: boolean;
    allowedTypes: string[];
    quietHours: { start: string; end: string };
    frequency: 'low' | 'medium' | 'high';
    channels: ('push' | 'email' | 'sms')[];
  };
  behavior: {
    lastActivity: number;
    engagementScore: number;
    responseRate: number;
    averageSessionDuration: number;
    viewedPackages: string[];
    abandonedCart: boolean;
  };
  notificationHistory: ProactiveNotification[];
}

interface ProactiveNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'push' | 'email' | 'sms' | 'in_app';
  scheduledFor: number;
  sentAt?: number;
  delivered: boolean;
  opened: boolean;
  actionTaken: boolean;
  metadata: Record<string, any>;
  personalizedContent: {
    recommendations?: string[];
    dynamicPrice?: number;
    urgencyLevel?: string;
    weatherInfo?: any;
  };
}

interface NotificationAnalytics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  conversionRate: number;
  avgResponseTime: number;
  topPerformingTypes: Array<{ type: string; performance: number }>;
  userSegmentPerformance: Map<string, { sent: number; conversions: number }>;
}

class ProactiveNotificationEngine {
  private userProfiles = new Map<string, UserNotificationProfile>();
  private triggers = new Map<string, NotificationTrigger>();
  private scheduledNotifications = new Map<string, ProactiveNotification>();
  private analytics: NotificationAnalytics = {
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    clickThroughRate: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    topPerformingTypes: [],
    userSegmentPerformance: new Map()
  };

  constructor() {
    this.initializeDefaultTriggers();
    this.startNotificationEngine();
  }

  // Varsayılan trigger'ları başlat
  private initializeDefaultTriggers(): void {
    const triggers: NotificationTrigger[] = [
      {
        id: 'abandoned_browsing',
        type: 'behavior',
        conditions: {
          viewedPackages: { min: 2 },
          timeSinceLastView: { min: 3600000 }, // 1 hour
          hasNotBooked: true
        },
        priority: 'medium',
        cooldown: 24 * 60 * 60 * 1000, // 24 hours
        maxDaily: 1
      },
      {
        id: 'price_drop',
        type: 'price',
        conditions: {
          priceDropPercentage: { min: 10 },
          userInterest: { min: 0.7 }
        },
        priority: 'high',
        cooldown: 12 * 60 * 60 * 1000, // 12 hours
        maxDaily: 2
      },
      {
        id: 'limited_availability',
        type: 'availability',
        conditions: {
          remainingSpots: { max: 5 },
          userInterest: { min: 0.6 }
        },
        priority: 'urgent',
        cooldown: 6 * 60 * 60 * 1000, // 6 hours
        maxDaily: 1
      },
      {
        id: 'perfect_weather',
        type: 'weather',
        conditions: {
          destinationWeather: { good: true },
          userViewedDestination: true,
          timingOptimal: true
        },
        priority: 'medium',
        cooldown: 48 * 60 * 60 * 1000, // 48 hours
        maxDaily: 1
      },
      {
        id: 'booking_window_closing',
        type: 'booking_window',
        conditions: {
          daysUntilTrip: { max: 30 },
          priceIncreaseRisk: { min: 0.8 },
          userInterest: { min: 0.8 }
        },
        priority: 'urgent',
        cooldown: 24 * 60 * 60 * 1000, // 24 hours
        maxDaily: 1
      },
      {
        id: 'similar_users_booked',
        type: 'behavior',
        conditions: {
          similarUserBookings: { min: 3 },
          userProfileMatch: { min: 0.7 },
          packageViewed: true
        },
        priority: 'medium',
        cooldown: 36 * 60 * 60 * 1000, // 36 hours
        maxDaily: 1
      },
      {
        id: 'comeback_offer',
        type: 'time',
        conditions: {
          daysSinceLastVisit: { min: 7, max: 30 },
          previousEngagement: { min: 0.5 }
        },
        priority: 'medium',
        cooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxDaily: 1
      }
    ];

    triggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger);
    });

    logger.log('🔔 Notification triggers initialized:', triggers.length);
  }

  // Notification engine başlat
  private startNotificationEngine(): void {
    // Her 15 dakikada trigger'ları kontrol et
    setInterval(() => {
      this.processAllTriggers();
    }, 15 * 60 * 1000); // 15 minutes

    // Her dakika scheduled notification'ları kontrol et
    setInterval(() => {
      this.processScheduledNotifications();
    }, 60 * 1000); // 1 minute

    logger.log('🔔 Proactive notification engine started');
  }

  // Kullanıcı profili güncelle
  updateUserProfile(userId: string, data: {
    activity?: any;
    packageView?: string;
    booking?: string;
    preferences?: Partial<UserNotificationProfile['preferences']>;
  }): void {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = this.createDefaultProfile(userId);
    }

    // Activity update
    if (data.activity) {
      profile.behavior.lastActivity = Date.now();
      profile.behavior.averageSessionDuration = 
        (profile.behavior.averageSessionDuration + (data.activity.duration || 300000)) / 2;
    }

    // Package view update
    if (data.packageView) {
      if (!profile.behavior.viewedPackages.includes(data.packageView)) {
        profile.behavior.viewedPackages.push(data.packageView);
        // Son 10'u tut
        if (profile.behavior.viewedPackages.length > 10) {
          profile.behavior.viewedPackages.shift();
        }
      }
    }

    // Booking update
    if (data.booking) {
      profile.behavior.abandonedCart = false;
      profile.behavior.engagementScore = Math.min(1, profile.behavior.engagementScore + 0.2);
    }

    // Preferences update
    if (data.preferences) {
      profile.preferences = { ...profile.preferences, ...data.preferences };
    }

    this.userProfiles.set(userId, profile);
  }

  // Varsayılan profil oluştur
  private createDefaultProfile(userId: string): UserNotificationProfile {
    return {
      userId,
      preferences: {
        enableNotifications: true,
        allowedTypes: ['behavior', 'price', 'availability'],
        quietHours: { start: '22:00', end: '08:00' },
        frequency: 'medium',
        channels: ['push', 'in_app']
      },
      behavior: {
        lastActivity: Date.now(),
        engagementScore: 0.5,
        responseRate: 0.3,
        averageSessionDuration: 300000, // 5 min
        viewedPackages: [],
        abandonedCart: false
      },
      notificationHistory: []
    };
  }

  // Tüm trigger'ları işle
  private async processAllTriggers(): Promise<void> {
    logger.log('🔔 Processing all notification triggers...');

    for (const [userId, profile] of this.userProfiles) {
      if (!profile.preferences.enableNotifications) continue;

      for (const [triggerId, trigger] of this.triggers) {
        if (!profile.preferences.allowedTypes.includes(trigger.type)) continue;

        // Cooldown kontrolü
        if (this.isInCooldown(userId, triggerId)) continue;

        // Daily limit kontrolü
        if (this.hasReachedDailyLimit(userId, triggerId, trigger.maxDaily)) continue;

        // Quiet hours kontrolü
        if (this.isInQuietHours(profile.preferences.quietHours)) continue;

        try {
          const shouldTrigger = await this.evaluateTrigger(userId, trigger, profile);
          if (shouldTrigger) {
            await this.createNotification(userId, trigger, profile);
          }
        } catch (error) {
          logger.error(`❌ Error processing trigger ${triggerId} for user ${userId}:`, error);
        }
      }
    }
  }

  // Trigger değerlendir
  private async evaluateTrigger(
    userId: string, 
    trigger: NotificationTrigger, 
    profile: UserNotificationProfile
  ): Promise<boolean> {
    const conditions = trigger.conditions;

    switch (trigger.id) {
      case 'abandoned_browsing':
        return this.evaluateAbandonedBrowsing(profile, conditions);
      
      case 'price_drop':
        return await this.evaluatePriceDrop(userId, profile, conditions);
      
      case 'limited_availability':
        return await this.evaluateLimitedAvailability(userId, profile, conditions);
      
      case 'perfect_weather':
        return await this.evaluatePerfectWeather(userId, profile, conditions);
      
      case 'booking_window_closing':
        return this.evaluateBookingWindow(profile, conditions);
      
      case 'similar_users_booked':
        return await this.evaluateSimilarUsersBooked(userId, profile, conditions);
      
      case 'comeback_offer':
        return this.evaluateComebackOffer(profile, conditions);
      
      default:
        return false;
    }
  }

  // Abandoned browsing değerlendir
  private evaluateAbandonedBrowsing(profile: UserNotificationProfile, conditions: any): boolean {
    const timeSinceLastActivity = Date.now() - profile.behavior.lastActivity;
    const hasViewedEnoughPackages = profile.behavior.viewedPackages.length >= conditions.viewedPackages.min;
    const enoughTimePassed = timeSinceLastActivity >= conditions.timeSinceLastView.min;
    const hasNotBooked = !profile.behavior.abandonedCart; // Simplified logic

    return hasViewedEnoughPackages && enoughTimePassed && hasNotBooked;
  }

  // Price drop değerlendir
  private async evaluatePriceDrop(userId: string, profile: UserNotificationProfile, conditions: any): Promise<boolean> {
    if (profile.behavior.viewedPackages.length === 0) return false;

    // Simulated price drop logic
    const userInterest = profile.behavior.engagementScore;
    const hasHighInterest = userInterest >= conditions.userInterest.min;
    
    // Real implementation would check actual price changes
    const hasPriceDrop = Math.random() > 0.8; // 20% chance simulation

    return hasHighInterest && hasPriceDrop;
  }

  // Limited availability değerlendir
  private async evaluateLimitedAvailability(userId: string, profile: UserNotificationProfile, conditions: any): Promise<boolean> {
    if (profile.behavior.viewedPackages.length === 0) return false;

    const userInterest = profile.behavior.engagementScore;
    const hasHighInterest = userInterest >= conditions.userInterest.min;
    
    // Simulated availability check
    const hasLimitedAvailability = Math.random() > 0.9; // 10% chance simulation

    return hasHighInterest && hasLimitedAvailability;
  }

  // Perfect weather değerlendir
  private async evaluatePerfectWeather(userId: string, profile: UserNotificationProfile, conditions: any): Promise<boolean> {
    if (profile.behavior.viewedPackages.length === 0) return false;

    try {
      // Get weather data for viewed destinations
      const destinations = profile.behavior.viewedPackages.slice(0, 3); // Top 3
      
      for (const destination of destinations) {
        const weatherData = await realTimeDataService.getComprehensiveTravelData(destination);
        
        if (weatherData?.weather?.current) {
          const temp = weatherData.weather.current.temperature;
          const condition = weatherData.weather.current.condition.toLowerCase();
          
          // Good weather conditions
          if (temp >= 20 && temp <= 30 && 
              (condition.includes('sunny') || condition.includes('clear'))) {
            return true;
          }
        }
      }
    } catch (error) {
      logger.error('❌ Weather evaluation failed:', error);
    }

    return false;
  }

  // Booking window değerlendir
  private evaluateBookingWindow(profile: UserNotificationProfile, conditions: any): boolean {
    if (profile.behavior.viewedPackages.length === 0) return false;

    const userInterest = profile.behavior.engagementScore;
    const hasHighInterest = userInterest >= conditions.userInterest.min;
    
    // Simulated booking window logic
    const isInBookingWindow = Math.random() > 0.7; // 30% chance simulation

    return hasHighInterest && isInBookingWindow;
  }

  // Similar users booked değerlendir
  private async evaluateSimilarUsersBooked(userId: string, profile: UserNotificationProfile, conditions: any): Promise<boolean> {
    if (profile.behavior.viewedPackages.length === 0) return false;

    const userInterest = profile.behavior.engagementScore;
    const hasHighInterest = userInterest >= conditions.userProfileMatch.min;
    
    // Simulated similar user booking logic
    const hasSimilarBookings = Math.random() > 0.8; // 20% chance simulation

    return hasHighInterest && hasSimilarBookings;
  }

  // Comeback offer değerlendir
  private evaluateComebackOffer(profile: UserNotificationProfile, conditions: any): boolean {
    const daysSinceLastActivity = (Date.now() - profile.behavior.lastActivity) / (24 * 60 * 60 * 1000);
    const isInTimeRange = daysSinceLastActivity >= conditions.daysSinceLastVisit.min && 
                         daysSinceLastActivity <= conditions.daysSinceLastVisit.max;
    const hadPreviousEngagement = profile.behavior.engagementScore >= conditions.previousEngagement.min;

    return isInTimeRange && hadPreviousEngagement;
  }

  // Notification oluştur
  private async createNotification(
    userId: string, 
    trigger: NotificationTrigger, 
    profile: UserNotificationProfile
  ): Promise<void> {
    const recommendations = smartRecommendationEngine.generateSmartRecommendations(
      userId,
      'proactive notification',
      { conversationPhase: 'proactive', urgencyLevel: trigger.priority }
    );

    const notification: ProactiveNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: trigger.id,
      title: this.generateNotificationTitle(trigger.id, profile, recommendations),
      message: this.generateNotificationMessage(trigger.id, profile, recommendations),
      priority: trigger.priority,
      channel: this.selectOptimalChannel(profile),
      scheduledFor: this.calculateOptimalTime(profile),
      delivered: false,
      opened: false,
      actionTaken: false,
      metadata: {
        triggerId: trigger.id,
        recommendations: recommendations.packages.slice(0, 3),
        generatedAt: Date.now()
      },
      personalizedContent: {
        recommendations: recommendations.packages.map(p => p.packageId),
        urgencyLevel: recommendations.analyticsData.userSegment,
        weatherInfo: trigger.type === 'weather' ? await this.getWeatherInfo(profile) : undefined
      }
    };

    // Action URL ve text ekle
    if (recommendations.packages.length > 0) {
      notification.actionUrl = `/package/${recommendations.packages[0].packageId}`;
      notification.actionText = 'Detayları Gör';
    }

    this.scheduledNotifications.set(notification.id, notification);
    
    // User profile'a ekle
    profile.notificationHistory.push(notification);
    if (profile.notificationHistory.length > 50) {
      profile.notificationHistory.shift();
    }

    logger.log(`🔔 Notification created: ${notification.title} for user ${userId}`);
  }

  // Notification title oluştur
  private generateNotificationTitle(triggerId: string, profile: UserNotificationProfile, recommendations: any): string {
    const templates = {
      abandoned_browsing: [
        "Baktığınız paketler hala mevcut! 💕",
        "Hayalinizdeki balayı bekliyor ✨",
        "O muhteşem paketleri unutmayın 🏝️"
      ],
      price_drop: [
        "Harika haber! Fiyatlar düştü 🎉",
        "Özel indirim fırsatı sizin için 💎",
        "Bu fiyatı kaçırmayın! ⭐"
      ],
      limited_availability: [
        "Son yerler! Acele edin 🔥",
        "Sadece birkaç yer kaldı ⚡",
        "Bu fırsat kaçıyor! 🚨"
      ],
      perfect_weather: [
        "Hava durumu mükemmel! ☀️",
        "Şimdi gitmek için ideal zaman 🌤️",
        "Güneşli günler sizi bekliyor 🌞"
      ],
      booking_window_closing: [
        "Rezervasyon zamanı daralıyor ⏰",
        "Son rezervasyon fırsatı 📅",
        "Geç kalmadan rezerve edin! ⏰"
      ],
      similar_users_booked: [
        "Sizin gibi çiftler bunu seçti 👫",
        "Popüler seçim: Çiftlerin favorisi 💕",
        "Benzeri profildeki çiftlerin tercihi ✨"
      ],
      comeback_offer: [
        "Sizi özledik! Özel teklifimiz var 💕",
        "Hoş geldin hediyesi sizin için 🎁",
        "Geri dönüş sürprizi! ✨"
      ]
    };

    const titleTemplates = templates[triggerId as keyof typeof templates] || ["Özel teklifimiz var!"];
    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }

  // Notification message oluştur
  private generateNotificationMessage(triggerId: string, profile: UserNotificationProfile, recommendations: any): string {
    const topPackage = recommendations.packages[0];
    
    const messages = {
      abandoned_browsing: [
        `${topPackage?.packageId || 'Favori paketiniz'} hala mevcut! Benzersiz deneyimi kaçırmayın.`,
        `Baktığınız o harika destinasyon sizi bekliyor. Hemen keşfedin!`,
        `Hayalinizdeki balayı planı yarım kaldı. Devam edelim mi?`
      ],
      price_drop: [
        `${topPackage?.packageId || 'Seçtiğiniz paket'} şimdi daha uygun fiyatta! %15 tasarruf edin.`,
        `Müjde! İlgilendiğiniz paket şimdi özel indirimde.`,
        `Fiyat düşüşü fırsatı! Şimdi rezerve edin, sonra pişman olmayın.`
      ],
      limited_availability: [
        `${topPackage?.packageId || 'Bu paket'} için sadece 3 yer kaldı! Acele edin.`,
        `Son rezervasyon fırsatı! Bu popüler paket tükenmek üzere.`,
        `Çok az yer kaldı! Hemen rezerve edin veya kaçırın.`
      ],
      perfect_weather: [
        `${topPackage?.packageId || 'Destinasyonunuz'}'da hava durumu mükemmel! Şimdi gitmek için ideal zaman.`,
        `Güneşli günler başladı! Bu muhteşem destinasyonu şimdi keşfedin.`,
        `Mükemmel hava koşulları sizi bekliyor. Kaçırmayın!`
      ],
      booking_window_closing: [
        `${topPackage?.packageId || 'Bu paket'} için rezervasyon zamanı daralıyor. Son 5 gün!`,
        `Erken rezervasyon avantajı bitiyor. Hemen hareket edin!`,
        `Bu fiyatlarla sadece 3 gün daha rezerve edebilirsiniz.`
      ],
      similar_users_booked: [
        `Sizin gibi çiftler ${topPackage?.packageId || 'bu paketi'} çok beğendi ve rezerve etti!`,
        `Benzer profildeki 50+ çift bu destinasyonu tercih etti.`,
        `Bu paket çiftlerin %95'i tarafından öneriliyor!`
      ],
      comeback_offer: [
        `Hoş geldin hediyesi: ${topPackage?.packageId || 'Özel paketimiz'} %20 indirimle sizin için!`,
        `Özlediğimiz misafirimiz için özel fırsat. Sürprizimizi keşfedin!`,
        `Size özel geri dönüş teklifi hazırladık. Kaçırmayın!`
      ]
    };

    const messageTemplates = messages[triggerId as keyof typeof messages] || ["Özel teklifimizi kaçırmayın!"];
    return messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
  }

  // Optimal kanal seç
  private selectOptimalChannel(profile: UserNotificationProfile): 'push' | 'email' | 'sms' | 'in_app' {
    const allowedChannels = profile.preferences.channels;
    
    // User response rate'e göre seç
    if (profile.behavior.responseRate > 0.7 && allowedChannels.includes('push')) {
      return 'push';
    } else if (profile.behavior.responseRate > 0.4 && allowedChannels.includes('email')) {
      return 'email';
    } else if (allowedChannels.includes('in_app')) {
      return 'in_app';
    }

    return allowedChannels[0] as any || 'push';
  }

  // Optimal zamanı hesapla
  private calculateOptimalTime(profile: UserNotificationProfile): number {
    const now = new Date();
    const hour = now.getHours();
    
    // Quiet hours kontrolü
    const quietStart = parseInt(profile.preferences.quietHours.start.split(':')[0]);
    const quietEnd = parseInt(profile.preferences.quietHours.end.split(':')[0]);
    
    let optimalTime = Date.now();
    
    // Eğer quiet hours içindeyse, quiet hours bitene kadar bekle
    if (hour >= quietStart || hour < quietEnd) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(quietEnd, 0, 0, 0);
      optimalTime = tomorrow.getTime();
    } else {
      // Optimal saatler: 10-12, 14-17, 19-21
      if (hour < 10) {
        now.setHours(10, 0, 0, 0);
        optimalTime = now.getTime();
      } else if (hour > 21) {
        now.setHours(10, 0, 0, 0);
        now.setDate(now.getDate() + 1);
        optimalTime = now.getTime();
      }
      // Diğer saatlerde hemen gönder
    }

    return optimalTime;
  }

  // Helper methods
  private isInCooldown(userId: string, triggerId: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;

    const lastNotification = profile.notificationHistory
      .filter(n => n.type === triggerId)
      .sort((a, b) => b.scheduledFor - a.scheduledFor)[0];

    if (!lastNotification) return false;

    return (Date.now() - lastNotification.scheduledFor) < trigger.cooldown;
  }

  private hasReachedDailyLimit(userId: string, triggerId: string, maxDaily: number): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayNotifications = profile.notificationHistory
      .filter(n => n.type === triggerId && n.scheduledFor >= todayStart);

    return todayNotifications.length >= maxDaily;
  }

  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime > endTime) { // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private async getWeatherInfo(profile: UserNotificationProfile): Promise<any> {
    if (profile.behavior.viewedPackages.length === 0) return null;

    try {
      const destination = profile.behavior.viewedPackages[0];
      const weatherData = await realTimeDataService.getComprehensiveTravelData(destination);
      return weatherData?.weather;
    } catch (error) {
      logger.error('❌ Weather info fetch failed:', error);
      return null;
    }
  }

  // Scheduled notification'ları işle
  private async processScheduledNotifications(): Promise<void> {
    const now = Date.now();
    
    for (const [notificationId, notification] of this.scheduledNotifications) {
      if (notification.scheduledFor <= now && !notification.delivered) {
        try {
          await this.deliverNotification(notification);
          notification.delivered = true;
          notification.sentAt = now;
          
          this.analytics.totalSent++;
          logger.log(`🔔 Notification delivered: ${notification.title}`);
        } catch (error) {
          logger.error(`❌ Failed to deliver notification ${notificationId}:`, error);
        }
      }
    }

    // Eski notification'ları temizle (7 gün)
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    for (const [notificationId, notification] of this.scheduledNotifications) {
      if (notification.scheduledFor < weekAgo) {
        this.scheduledNotifications.delete(notificationId);
      }
    }
  }

  // Notification gönder
  private async deliverNotification(notification: ProactiveNotification): Promise<void> {
    // Bu gerçek implementation'da push notification, email, SMS servisleri çağrılacak
    logger.log(`📱 Delivering ${notification.channel} notification to ${notification.userId}: ${notification.title}`);
    
    // Simulated delivery
    const deliverySuccess = Math.random() > 0.05; // 95% success rate
    
    if (deliverySuccess) {
      this.analytics.deliveryRate = ((this.analytics.deliveryRate * this.analytics.totalSent) + 1) / (this.analytics.totalSent + 1);
    }
  }

  // Public methods
  recordNotificationInteraction(notificationId: string, action: 'opened' | 'clicked' | 'dismissed'): void {
    const notification = this.scheduledNotifications.get(notificationId);
    if (!notification) return;

    switch (action) {
      case 'opened':
        notification.opened = true;
        this.analytics.openRate = ((this.analytics.openRate * this.analytics.totalSent) + 1) / (this.analytics.totalSent + 1);
        break;
      case 'clicked':
        notification.actionTaken = true;
        this.analytics.clickThroughRate = ((this.analytics.clickThroughRate * this.analytics.totalSent) + 1) / (this.analytics.totalSent + 1);
        break;
    }

    // Update user profile
    const profile = this.userProfiles.get(notification.userId);
    if (profile && action !== 'dismissed') {
      profile.behavior.responseRate = ((profile.behavior.responseRate * 10) + 1) / 11; // Rolling average
    }

    logger.log(`🔔 Notification interaction recorded: ${action} for ${notificationId}`);
  }

  getNotificationAnalytics(): NotificationAnalytics {
    return { ...this.analytics };
  }

  getUserNotifications(userId: string, limit: number = 10): ProactiveNotification[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    return profile.notificationHistory
      .sort((a, b) => b.scheduledFor - a.scheduledFor)
      .slice(0, limit);
  }

  updateNotificationPreferences(userId: string, preferences: Partial<UserNotificationProfile['preferences']>): void {
    this.updateUserProfile(userId, { preferences });
    logger.log(`🔔 Notification preferences updated for user ${userId}`);
  }
}

export const proactiveNotificationEngine = new ProactiveNotificationEngine();