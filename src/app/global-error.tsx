'use client';

import './globals.css';

// Last-resort screen when the root layout itself fails
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 48 }} aria-hidden>⚽</p>
          <h1 style={{ fontSize: 26, margin: '8px 0' }}>Something went wrong</h1>
          <p style={{ color: '#4a4a4a', marginBottom: 20 }}>Please try again in a moment.{error.digest ? ` (ref ${error.digest})` : ''}</p>
          <button onClick={() => retry()} style={{ font: 'inherit', fontWeight: 800, background: '#d31027', color: '#fff', border: 0, borderRadius: 12, padding: '12px 22px', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
