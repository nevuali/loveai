import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    dataCollection: boolean;
  };
  theme: {
    darkMode: boolean;
    language: string;
  };
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export const defaultSettings: UserSettings = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    marketing: true,
  },
  privacy: {
    profileVisible: true,
    activityVisible: false,
    dataCollection: true,
  },
  theme: {
    darkMode: true,
    language: 'English',
  }
};

export class SettingsService {
  // Auth state kontrol helper
  private static async ensureAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(true);
        return;
      }
      
      // Auth state değişikliğini dinle
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(!!user);
      });
      
      // 2 saniye timeout
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 2000);
    });
  }

  // Kullanıcı ayarlarını getir
  static async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      // Auth durumunu kontrol et
      const isAuthenticated = await this.ensureAuth();
      if (!isAuthenticated) {
        console.warn('User not authenticated, returning default settings');
        return defaultSettings;
      }

      const settingsRef = doc(db, 'userSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as UserSettings;
      } else {
        // Ayarlar yoksa varsayılan ayarları oluştur
        await this.createDefaultSettings(userId);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return defaultSettings;
    }
  }

  // Varsayılan ayarları oluştur
  static async createDefaultSettings(userId: string): Promise<void> {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      const settingsWithTimestamp = {
        ...defaultSettings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(settingsRef, settingsWithTimestamp);
    } catch (error) {
      console.error('Error creating default settings:', error);
      throw error;
    }
  }

  // Ayarları güncelle
  static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      const updateData = {
        ...settings,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(settingsRef, updateData);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Belirli bir ayar kategorisini güncelle
  static async updateSettingCategory(
    userId: string, 
    category: keyof UserSettings, 
    categoryData: any
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      const updateData = {
        [category]: categoryData,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(settingsRef, updateData);
    } catch (error) {
      console.error(`Error updating ${category} settings:`, error);
      throw error;
    }
  }

  // Tek bir ayarı değiştir
  static async toggleSetting(
    userId: string,
    category: keyof UserSettings,
    setting: string,
    value: boolean
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      const updateData = {
        [`${category}.${setting}`]: value,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(settingsRef, updateData);
    } catch (error) {
      console.error(`Error toggling ${category}.${setting}:`, error);
      throw error;
    }
  }

  // Ayarlarda gerçek zamanlı dinleme
  static subscribeToUserSettings(
    userId: string, 
    callback: (settings: UserSettings) => void
  ): () => void {
    let retryCount = 0;
    const maxRetries = 3;
    
    const createSubscription = (): (() => void) => {
      // Auth kontrolü
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        console.warn('Auth mismatch or no current user, calling callback with defaults', {
          currentUserUid: auth.currentUser?.uid,
          requestedUserId: userId
        });
        callback(defaultSettings);
        return () => {}; // Empty unsubscribe function
      }

      const settingsRef = doc(db, 'userSettings', userId);
      
      return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as UserSettings);
        } else {
          // Ayarlar yoksa varsayılan ayarları oluştur
          this.createDefaultSettings(userId).then(() => {
            callback(defaultSettings);
          }).catch((error) => {
            console.error('Error creating default settings:', error);
            callback(defaultSettings);
          });
        }
      }, (error) => {
        console.error('Error listening to settings changes:', error);
        
        // Permission denied error'ında retry yap
        if (error.code === 'permission-denied' && retryCount < maxRetries) {
          retryCount++;
          console.warn(`Permission denied, retrying (${retryCount}/${maxRetries})...`);
          
          // 1 saniye bekle ve tekrar dene
          setTimeout(() => {
            if (auth.currentUser) {
              createSubscription();
            } else {
              callback(defaultSettings);
            }
          }, 1000 * retryCount);
          
          return;
        }
        
        // Hata durumunda sessizce default settings'i callback et
        callback(defaultSettings);
        
        // Debug info
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for user settings. User may need to re-authenticate.');
          console.warn('Current auth state:', {
            currentUser: !!auth.currentUser,
            requestedUserId: userId,
            currentUserId: auth.currentUser?.uid,
            retryCount
          });
        }
      });
    };

    return createSubscription();
  }

  // Kullanıcı verilerini dışa aktar
  static async exportUserData(userId: string): Promise<any> {
    try {
      const settingsRef = doc(db, 'userSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      // Diğer kullanıcı verilerini de ekleyebiliriz
      const userData = {
        settings: settingsDoc.exists() ? settingsDoc.data() : defaultSettings,
        exportedAt: new Date().toISOString(),
        userId: userId
      };
      
      return userData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Hesap silme işlemi
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Önce ayarları sil
      const settingsRef = doc(db, 'userSettings', userId);
      await setDoc(settingsRef, {
        deleted: true,
        deletedAt: Timestamp.now()
      });
      
      // Diğer kullanıcı verilerini de silme işlemi buraya eklenebilir
      console.log(`Account deletion initiated for user: ${userId}`);
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  // Bildirim tercihlerini al
  static async getNotificationPreferences(userId: string): Promise<UserSettings['notifications']> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.notifications;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return defaultSettings.notifications;
    }
  }

  // Gizlilik ayarlarını al  
  static async getPrivacySettings(userId: string): Promise<UserSettings['privacy']> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings.privacy;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      return defaultSettings.privacy;
    }
  }
} 