import type { MetadataRoute } from 'next';

// Lets phones install OYUN to the home screen and open it full-screen like an app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OYUN — Turf Booking',
    short_name: 'OYUN',
    description: 'Book football turfs near you in seconds.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#d31027',
    categories: ['sports', 'lifestyle'],
    icons: [
      { src: '/oyun-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/oyun-icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/oyun-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Book a turf', url: '/arenas' },
      { name: 'My bookings', url: '/bookings' },
    ],
  };
}
