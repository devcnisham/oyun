'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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
