import { ImageResponse } from 'next/og';

// Default share image for every page that doesn't set its own (turf pages use the turf photo)
export const alt = 'OYUN: book football turfs in Mangalore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: '#fff',
          background: 'linear-gradient(135deg, #180000 0%, #7a0714 55%, #d31027 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d31027', fontSize: 40, fontWeight: 800 }}>O</div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>OYUN</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Book football turfs in Mangalore</div>
          <div style={{ fontSize: 34, opacity: 0.85 }}>Live slots · Instant booking · 5-a-side &amp; 7-a-side</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['Kodialbail', 'Kankanady', 'Ullal', 'Bejai'].map((a) => (
            <div key={a} style={{ fontSize: 26, padding: '10px 22px', borderRadius: 40, background: 'rgba(255,255,255,0.16)' }}>{a}</div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
