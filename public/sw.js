// OYUN Service Worker for Progressive Web App and Web Push Notifications (P12-05 / #167)
const CACHE_NAME = 'oyun-v1';
const STATIC_ASSETS = [
  '/',
  '/logo.svg',
  '/oyun-icon-192.png',
  '/oyun-icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue even if some optional assets are missing
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests from http/https schemes
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  // Leave cross-origin requests (Clerk, analytics, maps) to the browser
  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  // Network-first strategy with cache fallback for offline resilience
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache static asset copies
        if (
          response.status === 200 &&
          (event.request.url.includes('/_next/static/') ||
            event.request.url.endsWith('.png') ||
            event.request.url.endsWith('.svg') ||
            event.request.url.endsWith('.ico'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Only page navigations may fall back to the cached home page; serving HTML
        // for a failed API or asset request breaks the caller's JSON/asset parsing
        return caches
          .match(event.request)
          .then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('/') : undefined))
          .then((res) => res || Response.error());
      })
  );
});

// Web Push event for booking confirmations, reminders, and alerts
self.addEventListener('push', (event) => {
  let data = { title: 'OYUN Turf Booking', body: 'New update on your booking.', url: '/bookings' };
  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/oyun-icon-192.png',
    badge: '/oyun-icon-64.png',
    data: { url: data.url || '/bookings' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Navigate to booking ticket when player clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/bookings';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
