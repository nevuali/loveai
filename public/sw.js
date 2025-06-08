// Service Worker for AI LOVVE PWA - Ultra High-Performance Cache Strategy
const CACHE_VERSION = '3.0.0';
const CACHE_NAME = `ai-lovve-v${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const FONT_CACHE = `${CACHE_NAME}-fonts`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;
const API_CACHE = `${CACHE_NAME}-api`;
const FIREBASE_CACHE = `${CACHE_NAME}-firebase`;
const PACKAGE_CACHE = `${CACHE_NAME}-packages`;

// Maximum cache sizes - Increased for better performance
const MAX_DYNAMIC_ITEMS = 100;
const MAX_IMAGE_ITEMS = 60;
const MAX_API_ITEMS = 40;
const MAX_FIREBASE_ITEMS = 100;
const MAX_PACKAGE_ITEMS = 50;

// Cache duration (in milliseconds) - Optimized for performance
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  FONTS: 365 * 24 * 60 * 60 * 1000, // 1 year
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 15 * 60 * 1000, // 15 minutes (increased from 5)
  FIREBASE: 30 * 60 * 1000, // 30 minutes
  PACKAGES: 60 * 60 * 1000 // 1 hour
};

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg', 
  '/icons/icon.svg',
  '/og-image.svg'
];

// Critical resources to preload
const CRITICAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&display=swap'
];

// Utility functions
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`🧹 Trimmed cache ${cacheName}: removed ${keysToDelete.length} items`);
  }
};

const isExpired = (cachedResponse, maxAge) => {
  const cachedDate = cachedResponse.headers.get('sw-cache-timestamp');
  if (!cachedDate) return true;
  return Date.now() - parseInt(cachedDate) > maxAge;
};

const addTimestampToResponse = (response) => {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cache-timestamp': Date.now().toString()
    }
  });
  return newResponse;
};

// Install event - cache static assets and critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('📦 Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Cache critical resources
      caches.open(FONT_CACHE)
        .then((cache) => {
          console.log('📦 Caching critical resources');
          return cache.addAll(CRITICAL_RESOURCES);
        })
    ])
    .then(() => {
      console.log('✅ All critical assets cached');
      self.skipWaiting();
    })
    .catch((error) => {
      console.error('❌ Error caching critical assets:', error);
    })
  );
});

// Activate event - clean up old caches and setup periodic cleanup
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE, IMAGE_CACHE, API_CACHE, FIREBASE_CACHE, PACKAGE_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (!validCaches.includes(cacheName)) {
                console.log('🗑️ Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        }),
      
      // Trim existing caches to size limits
      trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS),
      trimCache(IMAGE_CACHE, MAX_IMAGE_ITEMS),
      trimCache(API_CACHE, MAX_API_ITEMS),
      trimCache(FIREBASE_CACHE, MAX_FIREBASE_ITEMS),
      trimCache(PACKAGE_CACHE, MAX_PACKAGE_ITEMS)
    ])
    .then(() => {
      console.log('✅ Service Worker activated and caches optimized');
      self.clients.claim();
    })
  );
});

// Advanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension and non-HTTP requests
  if (url.protocol === 'chrome-extension:' || !url.protocol.startsWith('http')) {
    return;
  }

  // Determine cache strategy based on resource type - Optimized
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, CACHE_DURATION.STATIC));
  } else if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE, CACHE_DURATION.FONTS));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, CACHE_DURATION.IMAGES));
  } else if (isFirebaseRequest(url)) {
    event.respondWith(networkFirst(request, FIREBASE_CACHE, CACHE_DURATION.FIREBASE));
  } else if (isPackageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, PACKAGE_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE, CACHE_DURATION.API));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, CACHE_DURATION.DYNAMIC));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Helper functions to identify request types
const isStaticAsset = (url) => {
  return url.pathname.match(/\.(js|css|html|ico|svg)$/);
};

const isFontRequest = (url) => {
  return url.hostname === 'fonts.googleapis.com' || 
         url.hostname === 'fonts.gstatic.com' ||
         url.pathname.match(/\.(woff|woff2|ttf|eot)$/);
};

const isImageRequest = (url) => {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ||
         url.hostname === 'images.unsplash.com';
};

const isAPIRequest = (url) => {
  return url.pathname.includes('/api/') ||
         url.hostname.includes('gemini');
};

const isFirebaseRequest = (url) => {
  return url.hostname.includes('firebase') || 
         url.hostname.includes('firestore') ||
         url.hostname.includes('googleapis.com') ||
         url.hostname.includes('cloudfunctions.net');
};

const isPackageRequest = (url) => {
  return url.pathname.includes('package') ||
         url.pathname.includes('honeymoon') ||
         url.search.includes('package');
};

const isNavigationRequest = (request) => {
  return request.destination === 'document';
};

// Cache strategies
const cacheFirst = async (request, cacheName, maxAge) => {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      console.log('📦 Cache first - serving from cache:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      const responseWithTimestamp = addTimestampToResponse(networkResponse.clone());
      await cache.put(request, responseWithTimestamp);
      console.log('📦 Cache first - cached fresh response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('📦 Cache first - network failed, serving stale cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    if (isNavigationRequest(request)) {
      return getOfflinePage();
    }

    throw error;
  }
};

const networkFirst = async (request, cacheName, maxAge) => {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      const responseWithTimestamp = addTimestampToResponse(networkResponse.clone());
      await cache.put(request, responseWithTimestamp);
      
      // Trim cache to maintain size limits
      if (cacheName === API_CACHE) {
        await trimCache(cacheName, MAX_API_ITEMS);
      }
      
      console.log('🌐 Network first - fresh response cached:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network first - network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      console.log('📦 Network first - serving from cache:', request.url);
      return cachedResponse;
    }

    if (isNavigationRequest(request)) {
      return getOfflinePage();
    }

    throw error;
  }
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.status === 200) {
        const cache = await caches.open(cacheName);
        const responseWithTimestamp = addTimestampToResponse(networkResponse.clone());
        await cache.put(request, responseWithTimestamp);
        await trimCache(cacheName, MAX_DYNAMIC_ITEMS);
        console.log('🔄 Stale while revalidate - background update:', request.url);
      }
      return networkResponse;
    })
    .catch(() => {
      console.log('🔄 Stale while revalidate - network failed for:', request.url);
    });

  if (cachedResponse) {
    console.log('📦 Stale while revalidate - serving stale:', request.url);
    return cachedResponse;
  }

  try {
    return await fetchPromise;
  } catch (error) {
    if (isNavigationRequest(request)) {
      return getOfflinePage();
    }
    throw error;
  }
};

const getOfflinePage = () => {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>AI LOVVE - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Google Sans', system-ui, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%);
          color: white;
          text-align: center;
          padding: 1rem;
        }
        .offline-content {
          padding: 3rem 2rem;
          border-radius: 2rem;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 100%;
        }
        .emoji { font-size: 5rem; margin-bottom: 1.5rem; animation: pulse 2s infinite; }
        h1 { 
          margin: 0 0 1rem 0; 
          font-size: 2rem; 
          background: linear-gradient(135deg, #d4af37, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        p { margin-bottom: 1rem; opacity: 0.8; line-height: 1.5; }
        .retry-btn {
          background: linear-gradient(135deg, #d4af37, #ffd700);
          color: #1f1f1f;
          border: none;
          padding: 1rem 2rem;
          border-radius: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          font-weight: 600;
          transition: transform 0.3s ease;
          font-size: 1rem;
        }
        .retry-btn:hover { transform: translateY(-2px); }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    </head>
    <body>
      <div class="offline-content">
        <div class="emoji">💫</div>
        <h1>AI LOVVE</h1>
        <p>You're currently offline</p>
        <p>Your romantic journey continues when you're back online.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Reconnect to Love
        </button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};

// Background sync for chat messages and offline data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatData());
  } else if (event.tag === 'offline-data-sync') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingData());
  }
});

// Sync chat data when back online
const syncChatData = async () => {
  try {
    console.log('🔄 Syncing chat data...');
    
    // Get pending chat data from IndexedDB or localStorage
    const pendingData = await getPendingSyncData();
    
    if (pendingData && pendingData.length > 0) {
      // Send to Firebase/backend
      for (const item of pendingData) {
        try {
          await syncSingleItem(item);
          await removeSyncItem(item.id);
          console.log('✅ Synced chat item:', item.id);
        } catch (error) {
          console.error('❌ Failed to sync item:', item.id, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Chat sync failed:', error);
  }
};

// Sync offline data
const syncOfflineData = async () => {
  try {
    console.log('🔄 Syncing offline data...');
    
    // Update cached user data
    await updateUserDataCache();
    
    // Refresh package cache
    await refreshPackageCache();
    
    console.log('✅ Offline data sync completed');
  } catch (error) {
    console.error('❌ Offline data sync failed:', error);
  }
};

// Sync all pending data
const syncPendingData = async () => {
  try {
    await Promise.all([
      syncChatData(),
      syncOfflineData()
    ]);
    console.log('✅ All pending data synced');
  } catch (error) {
    console.error('❌ Pending data sync failed:', error);
  }
};

// Helper functions for sync operations
const getPendingSyncData = async () => {
  try {
    // Try to get from localStorage (simplified approach)
    const data = self.localStorage?.getItem('ailovve_offline_sync_queue');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Failed to get pending sync data:', error);
    return [];
  }
};

const syncSingleItem = async (item) => {
  // This would make actual API calls to Firebase/backend
  console.log('🔄 Syncing item:', item.type, item.action);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return true;
};

const removeSyncItem = async (itemId) => {
  try {
    const data = await getPendingSyncData();
    const filtered = data.filter(item => item.id !== itemId);
    self.localStorage?.setItem('ailovve_offline_sync_queue', JSON.stringify(filtered));
  } catch (error) {
    console.error('❌ Failed to remove sync item:', error);
  }
};

const updateUserDataCache = async () => {
  // Cache user settings and profile data
  console.log('📦 Updating user data cache...');
};

const refreshPackageCache = async () => {
  // Refresh honeymoon package cache
  console.log('📦 Refreshing package cache...');
};

// Push notifications (when implemented)
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New message from AI LOVVE',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'ai-lovve-notification',
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('AI LOVVE', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('✅ Service Worker loaded successfully');