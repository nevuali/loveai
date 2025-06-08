// Firebase Cloud Messaging Service Worker for AI LOVVE
// This file handles background push notifications

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Firebase configuration (same as in main app)
const firebaseConfig = {
  apiKey: "AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY",
  authDomain: "ailovve.firebaseapp.com",
  projectId: "ailovve",
  storageBucket: "ailovve.appspot.com",
  messagingSenderId: "67784907260",
  appId: "1:67784907260:web:bdde3514cea143949ffa79",
  measurementId: "G-70KJQL4737"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[Service Worker] Received background message:', payload);

  const { notification, data } = payload;
  
  if (!notification) {
    console.warn('[Service Worker] No notification in payload');
    return;
  }

  // Customize notification options
  const notificationTitle = notification.title || 'AI LOVVE';
  const notificationOptions = {
    body: notification.body || 'You have a new message',
    icon: notification.icon || '/icons/icon.svg',
    badge: '/icons/icon.svg',
    image: notification.image,
    data: {
      ...data,
      click_action: data?.click_action || '/',
      timestamp: Date.now()
    },
    tag: data?.tag || 'ai-lovve-notification',
    requireInteraction: data?.requireInteraction === 'true',
    silent: data?.silent === 'true',
    actions: getNotificationActions(data?.type),
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    renotify: true // Show notification even if tag exists
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  if (action === 'close') {
    // User clicked close action, do nothing
    return;
  }

  // Handle the click - open/focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Determine the URL to navigate to
        let urlToOpen = data.click_action || '/';
        
        // Handle specific notification types
        switch (data.type) {
          case 'chat_response':
            if (data.chatId) {
              urlToOpen = `/#/chat/${data.chatId}`;
            }
            break;
          case 'package_recommendation':
            if (data.packageId) {
              urlToOpen = `/#/package/${data.packageId}`;
            }
            break;
          case 'system_update':
            urlToOpen = '/#/settings';
            break;
          default:
            urlToOpen = '/';
            break;
        }

        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window and navigate
            return client.focus().then(function() {
              // Navigate to the appropriate page
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              } else {
                // Fallback: post message to client to handle navigation
                return client.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  url: urlToOpen,
                  data: data
                });
              }
            });
          }
        }

        // No existing window found, open a new one
        return clients.openWindow(self.location.origin + urlToOpen);
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Track notification dismissal if needed
  // You could send analytics data here
  
  // Perform any cleanup if needed
});

// Get notification actions based on type
function getNotificationActions(type) {
  const commonActions = [
    {
      action: 'view',
      title: 'View',
      icon: '/icons/icon.svg'
    },
    {
      action: 'close',
      title: 'Close'
    }
  ];

  switch (type) {
    case 'chat_response':
      return [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/icon.svg'
        },
        ...commonActions
      ];
      
    case 'package_recommendation':
      return [
        {
          action: 'save',
          title: 'Save Package',
          icon: '/icons/icon.svg'
        },
        ...commonActions
      ];
      
    default:
      return commonActions;
  }
}

// Handle push event (for custom data without notification)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.warn('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);
    
    // Handle custom push data that doesn't have notification
    if (!data.notification) {
      // This could be for silent updates, cache invalidation, etc.
      handleSilentPush(data);
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

// Handle silent push notifications (no UI notification)
function handleSilentPush(data) {
  console.log('[Service Worker] Handling silent push:', data);
  
  switch (data.type) {
    case 'cache_update':
      // Update cache
      updateCache(data.resources);
      break;
      
    case 'sync_data':
      // Sync user data
      syncUserData(data.userId);
      break;
      
    case 'invalidate_cache':
      // Clear specific cache
      invalidateCache(data.cacheKey);
      break;
      
    default:
      console.log('[Service Worker] Unknown silent push type:', data.type);
      break;
  }
}

// Cache management functions
async function updateCache(resources) {
  if (!resources || !Array.isArray(resources)) return;
  
  try {
    const cache = await caches.open('ai-lovve-v1');
    await cache.addAll(resources);
    console.log('[Service Worker] Cache updated with resources:', resources);
  } catch (error) {
    console.error('[Service Worker] Error updating cache:', error);
  }
}

async function invalidateCache(cacheKey) {
  if (!cacheKey) return;
  
  try {
    const deleted = await caches.delete(cacheKey);
    console.log('[Service Worker] Cache invalidated:', cacheKey, deleted);
  } catch (error) {
    console.error('[Service Worker] Error invalidating cache:', error);
  }
}

// Sync user data (placeholder)
function syncUserData(userId) {
  if (!userId) return;
  
  console.log('[Service Worker] Syncing data for user:', userId);
  // Implementation would depend on your backend API
}

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        version: '1.0.0'
      });
      break;
      
    case 'SHOW_NOTIFICATION':
      if (payload) {
        self.registration.showNotification(payload.title, payload.options);
      }
      break;
      
    default:
      console.log('[Service Worker] Unknown message type:', type);
      break;
  }
});

console.log('[Service Worker] Firebase messaging service worker loaded');