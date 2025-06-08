// Push Notifications System for AI LOVVE
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from '../firebase';

// Types for notification system
interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationSubscription {
  token: string | null;
  enabled: boolean;
  types: NotificationTypes;
}

interface NotificationTypes {
  chat_responses: boolean;
  package_recommendations: boolean;
  system_updates: boolean;
  promotional: boolean;
}

class PushNotificationManager {
  private messaging: Messaging | null = null;
  private token: string | null = null;
  private isSupported = false;
  private isInitialized = false;
  private subscription: NotificationSubscription | null = null;

  constructor() {
    this.checkSupport();
    this.initializeNotifications();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('🔔 Push notifications supported:', this.isSupported);
    return this.isSupported;
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private async initializeNotifications() {
    if (!this.isSupported) {
      console.warn('🔔 Push notifications not supported in this browser');
      return;
    }

    try {
      this.messaging = getMessaging(app);
      console.log('🔔 Firebase messaging initialized');
      
      // Set up foreground message listener
      this.setupForegroundMessageListener();
      
      // Check existing permissions and subscription
      await this.checkCurrentSubscription();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  /**
   * Request permission for push notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported || !this.messaging) {
      console.warn('🔔 Push notifications not available');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);

      if (permission === 'granted') {
        await this.getRegistrationToken();
        return true;
      } else {
        console.warn('🔔 Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM registration token
   */
  private async getRegistrationToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      // Your app's VAPID key from Firebase Console
      const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn('⚠️ VAPID key not configured');
        return null;
      }

      const token = await getToken(this.messaging, { vapidKey });
      
      if (token) {
        console.log('🔔 FCM Registration token:', token);
        this.token = token;
        await this.saveTokenToServer(token);
        return token;
      } else {
        console.warn('🔔 No FCM registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to server/Firestore
   */
  private async saveTokenToServer(token: string) {
    try {
      // Here you would typically save the token to your backend or Firestore
      // For now, we'll store it locally
      localStorage.setItem('fcm_token', token);
      console.log('💾 FCM token saved locally');
      
      // TODO: Send token to backend/Firestore for user-specific notifications
      // await saveUserNotificationToken(userId, token);
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Setup listener for foreground messages
   */
  private setupForegroundMessageListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('🔔 Foreground message received:', payload);
      
      // Show notification when app is in foreground
      this.showForegroundNotification(payload);
    });
  }

  /**
   * Show notification when app is in foreground
   */
  private showForegroundNotification(payload: any) {
    const { notification, data } = payload;
    
    if (!notification) return;

    const notificationOptions: NotificationOptions = {
      body: notification.body,
      icon: notification.icon || '/icons/icon.svg',
      badge: '/icons/icon.svg',
      image: notification.image,
      data: data,
      tag: data?.tag || 'ai-lovve-notification',
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/icon.svg'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };

    // Show notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, notificationOptions);
      
      notification.onclick = () => {
        console.log('🔔 Notification clicked');
        this.handleNotificationClick(payload);
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  /**
   * Handle notification click actions
   */
  private handleNotificationClick(payload: any) {
    const { data } = payload;
    
    // Focus the window
    window.focus();
    
    // Handle different notification types
    switch (data?.type) {
      case 'chat_response':
        // Navigate to specific chat
        if (data.chatId) {
          window.location.hash = `#/chat/${data.chatId}`;
        }
        break;
        
      case 'package_recommendation':
        // Navigate to package details
        if (data.packageId) {
          window.location.hash = `#/package/${data.packageId}`;
        }
        break;
        
      case 'system_update':
        // Show system update modal or navigate to updates
        console.log('🔔 System update notification clicked');
        break;
        
      default:
        // Default action - just focus the app
        console.log('🔔 Generic notification clicked');
        break;
    }
  }

  /**
   * Check current notification subscription status
   */
  private async checkCurrentSubscription() {
    try {
      const permission = Notification.permission;
      const savedToken = localStorage.getItem('fcm_token');
      const notificationTypes = this.getNotificationTypes();
      
      this.subscription = {
        token: savedToken,
        enabled: permission === 'granted',
        types: notificationTypes
      };
      
      console.log('🔔 Current subscription status:', this.subscription);
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
    }
  }

  /**
   * Get notification type preferences
   */
  private getNotificationTypes(): NotificationTypes {
    const saved = localStorage.getItem('notification_types');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('❌ Error parsing notification types:', error);
      }
    }
    
    // Default preferences
    return {
      chat_responses: true,
      package_recommendations: true,
      system_updates: true,
      promotional: false
    };
  }

  /**
   * Update notification type preferences
   */
  public updateNotificationTypes(types: Partial<NotificationTypes>) {
    const currentTypes = this.getNotificationTypes();
    const updatedTypes = { ...currentTypes, ...types };
    
    localStorage.setItem('notification_types', JSON.stringify(updatedTypes));
    
    if (this.subscription) {
      this.subscription.types = updatedTypes;
    }
    
    console.log('🔔 Notification types updated:', updatedTypes);
  }

  /**
   * Enable notifications
   */
  public async enableNotifications(): Promise<boolean> {
    const success = await this.requestPermission();
    
    if (success && this.subscription) {
      this.subscription.enabled = true;
    }
    
    return success;
  }

  /**
   * Disable notifications
   */
  public async disableNotifications() {
    try {
      // Clear token from server
      const token = this.token || localStorage.getItem('fcm_token');
      if (token) {
        // TODO: Remove token from backend/Firestore
        // await removeUserNotificationToken(userId, token);
      }
      
      // Clear local storage
      localStorage.removeItem('fcm_token');
      this.token = null;
      
      if (this.subscription) {
        this.subscription.enabled = false;
        this.subscription.token = null;
      }
      
      console.log('🔔 Notifications disabled');
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
    }
  }

  /**
   * Send test notification (for development)
   */
  public async sendTestNotification() {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('🔔 Cannot send test notification - not permitted');
      return;
    }

    const testNotification: PushNotificationPayload = {
      title: '✨ AI LOVVE Test Notification',
      body: 'Your magical honeymoon planning assistant is ready!',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: {
        type: 'test',
        timestamp: Date.now()
      },
      tag: 'test-notification',
      requireInteraction: false
    };

    const notification = new Notification(testNotification.title, {
      body: testNotification.body,
      icon: testNotification.icon,
      badge: testNotification.badge,
      data: testNotification.data,
      tag: testNotification.tag,
      requireInteraction: testNotification.requireInteraction
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
      notification.close();
    }, 3000);
  }

  /**
   * Get notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  /**
   * Get current subscription info
   */
  public getSubscription(): NotificationSubscription | null {
    return this.subscription;
  }

  /**
   * Check if notifications are supported
   */
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current FCM token
   */
  public getToken(): string | null {
    return this.token || localStorage.getItem('fcm_token');
  }

  /**
   * Refresh FCM token
   */
  public async refreshToken(): Promise<string | null> {
    if (!this.messaging) return null;
    
    try {
      // Clear current token
      localStorage.removeItem('fcm_token');
      this.token = null;
      
      // Get new token
      return await this.getRegistrationToken();
    } catch (error) {
      console.error('❌ Error refreshing FCM token:', error);
      return null;
    }
  }

  /**
   * Show custom notification
   */
  public showNotification(payload: PushNotificationPayload) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('🔔 Cannot show notification - not permitted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon.svg',
      badge: payload.badge || '/icons/icon.svg',
      image: payload.image,
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      actions: payload.actions
    };

    const notification = new Notification(payload.title, options);
    
    notification.onclick = () => {
      this.handleNotificationClick({ data: payload.data });
      notification.close();
    };

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!payload.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Utility functions
export const requestNotificationPermission = () => 
  pushNotificationManager.enableNotifications();

export const disableNotifications = () => 
  pushNotificationManager.disableNotifications();

export const getNotificationStatus = () => 
  pushNotificationManager.getPermissionStatus();

export const getNotificationSubscription = () => 
  pushNotificationManager.getSubscription();

export const updateNotificationPreferences = (types: Partial<NotificationTypes>) =>
  pushNotificationManager.updateNotificationTypes(types);

export const sendTestNotification = () =>
  pushNotificationManager.sendTestNotification();

export const showCustomNotification = (payload: PushNotificationPayload) =>
  pushNotificationManager.showNotification(payload);

// Auto-initialize when loaded
console.log('🔔 Push notification utilities loaded');

// Export types for use in other files
export type { 
  NotificationPermission, 
  PushNotificationPayload, 
  NotificationSubscription, 
  NotificationTypes,
  NotificationAction
};