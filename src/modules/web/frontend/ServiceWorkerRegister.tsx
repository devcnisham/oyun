'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') {
      // A previous local production preview may have registered OYUN's offline worker.
      // Development must always read current modules, never an older offline copy.
      void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(
        registrations.filter(registration => {
          const worker = registration.active ?? registration.waiting ?? registration.installing;
          return worker?.scriptURL === new URL('/sw.js', window.location.origin).href;
        }).map(registration => registration.unregister())
      )).catch(() => {});
      if ('caches' in window) void caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('oyun-')).map(key => caches.delete(key)))).catch(() => {});
      return;
    }
    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Periodic check for SW updates
            reg.onupdatefound = () => {
              const installing = reg.installing;
              if (installing) {
                installing.onstatechange = () => {
                  if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available
                  }
                };
              }
            };
          })
          .catch(() => {
            // Service worker registration optional/silent failure
          });
      });
    }
  }, []);

  return null;
}
