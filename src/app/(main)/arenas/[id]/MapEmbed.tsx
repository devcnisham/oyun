'use client';

import { useState } from 'react';

/**
 * Google Maps embed behind a tap. Loading the iframe eagerly pulls in several
 * hundred KB of third-party JavaScript that hurts mobile performance, so the
 * map only loads when the player asks for it.
 */
export default function MapEmbed({ name, location }: { name: string; location: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ width: '100%', height: '100%', border: 0, background: 'var(--bg-muted)', color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
      >
        📍 Tap to load map
      </button>
    );
  }
  return (
    <iframe
      title={`${name} on map`}
      src={`https://www.google.com/maps?q=${encodeURIComponent(`${name} ${location}`)}&output=embed`}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen={false}
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
