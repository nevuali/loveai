import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserSettings {
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
  profileVisible: boolean;
  dataCollection: boolean;
  theme: 'light' | 'dark' | 'system';
  conversationHistory: boolean;
  updatedAt: Date;
}

export const defaultSettings: UserSettings = {
  notifications: true,
  emailUpdates: false,
  language: 'English',
  profileVisible: true,
  dataCollection: true,
  theme: 'dark',
  conversationHistory: true,
  updatedAt: new Date()
};

class SettingsService {
  private getSettingsDocRef(userId: string) {
    return doc(db, 'users', userId, 'settings', 'preferences');
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      console.log('🔧 Loading user settings for:', userId);
      
      const settingsRef = this.getSettingsDocRef(userId);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Settings loaded from Firestore:', data);
        
        return {
          ...defaultSettings,
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      } else {
        console.log('📝 No settings found, creating default settings');
        await this.createDefaultSettings(userId);
        return defaultSettings;
      }
    } catch (error) {
      console.error('❌ Error loading user settings:', error);
      return defaultSettings;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    try {
      console.log('🔧 Updating user settings:', { userId, settings });
      
      const settingsRef = this.getSettingsDocRef(userId);
      const updateData = {
        ...settings,
        updatedAt: new Date()
      };
      
      await updateDoc(settingsRef, updateData);
      console.log('✅ Settings updated successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      return false;
    }
  }

  async updateSingleSetting(userId: string, key: keyof UserSettings, value: any): Promise<boolean> {
    try {
      console.log('🔧 Updating single setting:', { userId, key, value });
      console.log('🔧 Firebase connection check:', {
        dbInstance: !!db,
        userId: userId,
        settingsPath: `users/${userId}/settings/preferences`
      });
      
      const settingsRef = this.getSettingsDocRef(userId);
      console.log('🔧 Document reference created:', settingsRef.path);
      
      // First check if document exists
      const docSnap = await getDoc(settingsRef);
      
      if (!docSnap.exists()) {
        console.log('📝 Document does not exist, creating with default settings first');
        await this.createDefaultSettings(userId);
      }
      
      const updateData = {
        [key]: value,
        updatedAt: new Date()
      };
      
      console.log('🔧 Update data prepared:', updateData);
      
      await updateDoc(settingsRef, updateData);
      console.log('✅ Single setting updated successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error updating single setting:', error);
      console.error('❌ Detailed error info:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
        userId,
        key,
        value
      });
      
      // Check specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED - Check Firestore security rules');
        console.error('💡 Tip: Make sure you are authenticated and have write access');
      } else if (error.code === 'unavailable') {
        console.error('🌐 FIREBASE UNAVAILABLE - Check network connection');
      } else if (error.code === 'not-found') {
        console.error('📁 DOCUMENT NOT FOUND - Document path may be incorrect');
        // Try to create the document if it doesn't exist
        try {
          console.log('🔄 Attempting to create missing document...');
          await this.createDefaultSettings(userId);
          // Retry the update
          const retryData = {
            [key]: value,
            updatedAt: new Date()
          };
          await updateDoc(this.getSettingsDocRef(userId), retryData);
          console.log('✅ Document created and setting updated successfully');
          return true;
        } catch (retryError) {
          console.error('❌ Failed to create document and retry:', retryError);
        }
      }
      
      return false;
    }
  }

  private async createDefaultSettings(userId: string): Promise<void> {
    try {
      const settingsRef = this.getSettingsDocRef(userId);
      await setDoc(settingsRef, defaultSettings);
      console.log('✅ Default settings created');
    } catch (error) {
      console.error('❌ Error creating default settings:', error);
    }
  }

  async resetSettings(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Resetting settings to default for:', userId);
      
      const settingsRef = this.getSettingsDocRef(userId);
      await setDoc(settingsRef, defaultSettings);
      
      console.log('✅ Settings reset to default');
      return true;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService(); 