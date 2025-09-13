// Auto-generated cache version - this will be replaced during build
const CACHE_VERSION = '1757723511533';
const CACHE_NAME = `ldc-game-${CACHE_VERSION}`;

console.log(`SW: Cache version ${CACHE_VERSION}`);

const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/assets/splash_screens/icon.png'
];

/**
 * Controlla se è disponibile una nuova versione dell'applicazione
 */
async function checkForAppUpdate() {
  try {
    // Fetch del manifest con cache busting per ottenere la versione più recente
    const response = await fetch('/manifest.json?t=' + Date.now(), {
      cache: 'no-cache'
    });

    if (!response.ok) {
      return false;
    }

    const manifest = await response.json();
    const serverVersion = manifest.version;

    // Se il manifest ha una versione diversa, c'è un aggiornamento
    if (serverVersion && serverVersion !== CACHE_VERSION) {
      console.log('SW: New version detected:', serverVersion, 'vs current:', CACHE_VERSION);
      return true;
    }

    return false;
  } catch (error) {
    console.error('SW: Error checking for updates:', error);
    return false;
  }
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        // Cache essential resources first
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip worker files from caching to allow cache busting
  if (request.url.includes('worker') || request.url.includes('.worker.')) {
    console.log('SW: Bypassing cache for worker file:', request.url);
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = networkResponse.clone();

            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return a fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            // For other requests, just fail
            return new Response('Offline', { status: 408 });
          });
      })
  );
});

// Activate event - clean up old caches and notify clients of updates
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new service worker');

  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        const deletionPromises = cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('ldc-game-')) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        return Promise.all(deletionPromises);
      }),
      // Clear any cached worker files to force fresh reload
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          const workerDeletions = requests
            .filter(req => req.url.includes('worker') || req.url.includes('.worker.'))
            .map(req => {
              console.log('SW: Clearing cached worker file:', req.url);
              return cache.delete(req);
            });
          return Promise.all(workerDeletions);
        });
      })
    ]).then(() => {
      console.log('SW: Cache cleanup completed');
    })
      .then(() => {
        // Take control of all pages immediately
        console.log('SW: Taking control of all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that a new version is available
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            payload: {
              version: CACHE_VERSION,
              message: 'Una nuova versione è disponibile!'
            }
          });
        });
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued operations when coming back online
    console.log('Background sync triggered');

    // In a real implementation, this would process the sync queue
    // from localStorage and send pending operations to the server
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Esplora',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Chiudi'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message listener for commands from the main app
self.addEventListener('message', (event) => {
  console.log('SW: Received message:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    console.log('SW: Skipping waiting and activating immediately');
    self.skipWaiting();
  } else if (event.data?.type === 'FORCE_UPDATE') {
    console.log('SW: Force updating cache');

    // Clear all caches and restart
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          const deletionPromises = cacheNames.map((cacheName) => {
            if (cacheName.startsWith('ldc-game-')) {
              console.log('SW: Force deleting cache:', cacheName);
              return caches.delete(cacheName);
            }
          });
          return Promise.all(deletionPromises);
        })
        .then(() => {
          // Notify client that cache has been cleared
          event.ports[0]?.postMessage({
            type: 'CACHE_CLEARED',
            message: 'Cache aggiornata con successo!'
          });
        })
    );
  } else if (event.data?.type === 'CHECK_VERSION') {
    console.log('SW: Checking for version updates');

    // Verifica se c'è una nuova versione disponibile
    event.waitUntil(
      checkForAppUpdate()
        .then((hasUpdate) => {
          event.ports[0]?.postMessage({
            type: 'VERSION_CHECK_RESULT',
            hasUpdate,
            currentVersion: CACHE_VERSION
          });
        })
        .catch((error) => {
          console.error('SW: Version check failed:', error);
          event.ports[0]?.postMessage({
            type: 'VERSION_CHECK_RESULT',
            hasUpdate: false,
            error: error.message
          });
        })
    );
  } else if (event.data?.type === 'GET_VERSION_INFO') {
    // Restituisce informazioni sulla versione corrente
    event.ports[0]?.postMessage({
      type: 'VERSION_INFO',
      version: CACHE_VERSION,
      cacheName: CACHE_NAME
    });
  }
});
