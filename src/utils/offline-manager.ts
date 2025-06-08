// Offline Mode Support for AI LOVVE
// Manages offline functionality, cache strategies, and data synchronization

interface OfflineData {
  chats: any[];
  messages: any[];
  userSettings: any;
  packageCache: any[];
  lastSync: number;
}

interface SyncQueueItem {
  id: string;
  type: 'chat' | 'message' | 'settings' | 'analytics';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineStatus {
  isOnline: boolean;
  lastOnline: number;
  syncInProgress: boolean;
  pendingSyncCount: number;
  cacheSize: number;
}

class OfflineManager {
  private isOnline = navigator.onLine;
  private syncQueue: SyncQueueItem[] = [];
  private isInitialized = false;
  private syncInProgress = false;
  private maxRetries = 3;
  private syncTimeout = 30000; // 30 seconds
  private cachePrefix = 'ailovve_offline_';

  constructor() {
    this.initializeOfflineSupport();
  }

  /**
   * Initialize offline support and event listeners
   */
  private async initializeOfflineSupport() {
    try {
      // Load existing sync queue
      await this.loadSyncQueue();
      
      // Setup network event listeners
      this.setupNetworkListeners();
      
      // Setup periodic sync attempts
      this.setupPeriodicSync();
      
      // Setup storage event listeners for cross-tab sync
      this.setupStorageListeners();
      
      this.isInitialized = true;
      console.log('🔄 Offline manager initialized');
      
      // Attempt initial sync if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('❌ Failed to initialize offline manager:', error);
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored - going online');
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Connection lost - going offline');
      this.isOnline = false;
      this.onConnectionLost();
    });

    // Check connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        console.log('🔄 Connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  /**
   * Setup periodic sync attempts
   */
  private setupPeriodicSync() {
    // Attempt sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0 && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, 30000);

    // Background sync registration (if supported)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('background-sync');
      }).catch(error => {
        console.warn('Background sync not supported:', error);
      });
    }
  }

  /**
   * Setup storage event listeners for cross-tab communication
   */
  private setupStorageListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key === `${this.cachePrefix}sync_queue`) {
        // Another tab updated the sync queue
        this.loadSyncQueue();
      }
    });
  }

  /**
   * Handle connection restored
   */
  private async onConnectionRestored() {
    try {
      // Update last online timestamp
      localStorage.setItem(`${this.cachePrefix}last_online`, Date.now().toString());
      
      // Attempt to sync pending data
      await this.processSyncQueue();
      
      // Refresh cached data if stale
      await this.refreshStaleCache();
      
      // Notify user if needed
      this.notifyConnectionRestored();
      
    } catch (error) {
      console.error('❌ Error handling connection restore:', error);
    }
  }

  /**
   * Handle connection lost
   */
  private onConnectionLost() {
    // Save current state
    this.saveOfflineState();
    
    // Notify user about offline mode
    this.notifyOfflineMode();
  }

  /**
   * Cache data for offline use
   */
  public async cacheData(key: string, data: any, expiryMs: number = 86400000): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiryMs
      };
      
      localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify(cacheItem));
      console.log(`💾 Cached data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to cache data for key ${key}:`, error);
      
      // Try to free up space by removing old cache
      this.cleanupOldCache();
      
      // Retry once
      try {
        localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          expiry: Date.now() + expiryMs
        }));
      } catch (retryError) {
        console.error(`❌ Failed to cache data after cleanup:`, retryError);
      }
    }
  }

  /**
   * Retrieve cached data
   */
  public getCachedData<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.cachePrefix}${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheItem.expiry) {
        localStorage.removeItem(`${this.cachePrefix}${key}`);
        return null;
      }

      return cacheItem.data as T;
    } catch (error) {
      console.error(`❌ Failed to retrieve cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Queue data for sync when online
   */
  public queueForSync(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(syncItem);
    this.saveSyncQueue();

    console.log(`📤 Queued for sync: ${syncItem.type} ${syncItem.action}`, syncItem);

    // Attempt immediate sync if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0 || !this.isOnline) {
      return;
    }

    console.log(`🔄 Processing sync queue with ${this.syncQueue.length} items`);
    this.syncInProgress = true;

    const processingQueue = [...this.syncQueue];
    const successfulSyncs: string[] = [];

    for (const item of processingQueue) {
      try {
        const success = await this.syncItem(item);
        
        if (success) {
          successfulSyncs.push(item.id);
          console.log(`✅ Synced: ${item.type} ${item.action}`);
        } else {
          // Increment retry count
          item.retryCount++;
          
          if (item.retryCount >= this.maxRetries) {
            console.error(`❌ Max retries reached for sync item:`, item);
            successfulSyncs.push(item.id); // Remove from queue
          }
        }
      } catch (error) {
        console.error(`❌ Sync error for item ${item.id}:`, error);
        item.retryCount++;
        
        if (item.retryCount >= this.maxRetries) {
          successfulSyncs.push(item.id); // Remove failed items
        }
      }
    }

    // Remove successfully synced items
    this.syncQueue = this.syncQueue.filter(item => !successfulSyncs.includes(item.id));
    this.saveSyncQueue();

    this.syncInProgress = false;
    console.log(`🔄 Sync completed. Remaining items: ${this.syncQueue.length}`);
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      // Simulate API calls - replace with actual Firebase/backend calls
      switch (item.type) {
        case 'chat':
          return await this.syncChat(item);
        case 'message':
          return await this.syncMessage(item);
        case 'settings':
          return await this.syncSettings(item);
        case 'analytics':
          return await this.syncAnalytics(item);
        default:
          console.warn(`Unknown sync type: ${item.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error syncing item ${item.id}:`, error);
      return false;
    }
  }

  /**
   * Sync chat data
   */
  private async syncChat(item: SyncQueueItem): Promise<boolean> {
    try {
      // This would make actual API calls to your backend/Firebase
      console.log(`🔄 Syncing chat ${item.action}:`, item.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return true for successful sync
      return true;
    } catch (error) {
      console.error('❌ Chat sync failed:', error);
      return false;
    }
  }

  /**
   * Sync message data
   */
  private async syncMessage(item: SyncQueueItem): Promise<boolean> {
    try {
      console.log(`🔄 Syncing message ${item.action}:`, item.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return true;
    } catch (error) {
      console.error('❌ Message sync failed:', error);
      return false;
    }
  }

  /**
   * Sync settings data
   */
  private async syncSettings(item: SyncQueueItem): Promise<boolean> {
    try {
      console.log(`🔄 Syncing settings ${item.action}:`, item.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('❌ Settings sync failed:', error);
      return false;
    }
  }

  /**
   * Sync analytics data
   */
  private async syncAnalytics(item: SyncQueueItem): Promise<boolean> {
    try {
      console.log(`🔄 Syncing analytics ${item.action}:`, item.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
      return true;
    } catch (error) {
      console.error('❌ Analytics sync failed:', error);
      return false;
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveSyncQueue(): void {
    try {
      localStorage.setItem(`${this.cachePrefix}sync_queue`, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const saved = localStorage.getItem(`${this.cachePrefix}sync_queue`);
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log(`📤 Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save current application state for offline use
   */
  private saveOfflineState(): void {
    try {
      const offlineData: OfflineData = {
        chats: JSON.parse(localStorage.getItem('ailovve_chats_backup') || '[]'),
        messages: [],
        userSettings: JSON.parse(localStorage.getItem('ailovve_user_settings') || '{}'),
        packageCache: JSON.parse(localStorage.getItem('ailovve_package_cache') || '[]'),
        lastSync: Date.now()
      };

      localStorage.setItem(`${this.cachePrefix}state`, JSON.stringify(offlineData));
      console.log('💾 Offline state saved');
    } catch (error) {
      console.error('❌ Failed to save offline state:', error);
    }
  }

  /**
   * Refresh stale cache data
   */
  private async refreshStaleCache(): Promise<void> {
    try {
      const lastSync = localStorage.getItem(`${this.cachePrefix}last_sync`);
      const staleCutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

      if (!lastSync || parseInt(lastSync) < staleCutoff) {
        console.log('🔄 Refreshing stale cache data');
        
        // Clear old cache
        this.cleanupOldCache();
        
        // Update last sync timestamp
        localStorage.setItem(`${this.cachePrefix}last_sync`, Date.now().toString());
      }
    } catch (error) {
      console.error('❌ Failed to refresh stale cache:', error);
    }
  }

  /**
   * Cleanup old cache entries
   */
  private cleanupOldCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let removedCount = 0;
      
      for (const key of cacheKeys) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheItem = JSON.parse(cached);
            
            // Remove expired items
            if (cacheItem.expiry && Date.now() > cacheItem.expiry) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted cache items
          localStorage.removeItem(key);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} old cache entries`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old cache:', error);
    }
  }

  /**
   * Get offline status
   */
  public getStatus(): OfflineStatus {
    const lastOnline = localStorage.getItem(`${this.cachePrefix}last_online`);
    
    return {
      isOnline: this.isOnline,
      lastOnline: lastOnline ? parseInt(lastOnline) : Date.now(),
      syncInProgress: this.syncInProgress,
      pendingSyncCount: this.syncQueue.length,
      cacheSize: this.getCacheSize()
    };
  }

  /**
   * Get cache size in bytes (approximation)
   */
  private getCacheSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        if (key.startsWith(this.cachePrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('❌ Failed to calculate cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all offline data
   */
  public clearOfflineData(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      for (const key of cacheKeys) {
        localStorage.removeItem(key);
      }
      
      this.syncQueue = [];
      console.log('🗑️ All offline data cleared');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  /**
   * Force sync now (manual trigger)
   */
  public async forceSyncNow(): Promise<boolean> {
    if (!this.isOnline) {
      console.warn('⚠️ Cannot force sync - offline');
      return false;
    }

    try {
      await this.processSyncQueue();
      return true;
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      return false;
    }
  }

  /**
   * Check if feature is available offline
   */
  public isFeatureAvailableOffline(feature: string): boolean {
    const offlineFeatures = [
      'chat_history',
      'view_messages',
      'basic_settings',
      'cached_packages',
      'user_profile'
    ];
    
    return offlineFeatures.includes(feature);
  }

  /**
   * Notify user about connection restored
   */
  private notifyConnectionRestored(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌐 Connection Restored', {
        body: 'AI LOVVE is back online. Syncing your data...',
        icon: '/icons/icon.svg',
        tag: 'connection-restored'
      });
    }
  }

  /**
   * Notify user about offline mode
   */
  private notifyOfflineMode(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📱 Offline Mode', {
        body: 'AI LOVVE is now in offline mode. Some features may be limited.',
        icon: '/icons/icon.svg',
        tag: 'offline-mode'
      });
    }
  }

  /**
   * Enable offline mode for specific features
   */
  public enableOfflineMode(): void {
    console.log('📱 Offline mode enabled');
    
    // Cache current user data
    this.saveOfflineState();
    
    // Setup offline-specific behaviors
    document.body.classList.add('offline-mode');
  }

  /**
   * Disable offline mode
   */
  public disableOfflineMode(): void {
    console.log('🌐 Offline mode disabled');
    
    // Remove offline-specific behaviors
    document.body.classList.remove('offline-mode');
    
    // Attempt to sync
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Utility functions
export const cacheForOffline = (key: string, data: any, expiryMs?: number) =>
  offlineManager.cacheData(key, data, expiryMs);

export const getCachedData = <T>(key: string): T | null =>
  offlineManager.getCachedData<T>(key);

export const queueForSync = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) =>
  offlineManager.queueForSync(item);

export const getOfflineStatus = () =>
  offlineManager.getStatus();

export const isOfflineFeatureAvailable = (feature: string) =>
  offlineManager.isFeatureAvailableOffline(feature);

export const forceSyncNow = () =>
  offlineManager.forceSyncNow();

export const clearOfflineData = () =>
  offlineManager.clearOfflineData();

console.log('📱 Offline manager utilities loaded');

// Export types
export type { OfflineData, SyncQueueItem, OfflineStatus };