'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { MapTurf } from '@/modules/web/frontend/TurfMap';

const TurfMap = dynamic(() => import('@/modules/web/frontend/TurfMap'), { ssr: false });

export default function TurfMiniMap({ turf }: { turf: MapTurf }) {
  const [open, setOpen] = useState(false);
  if (open) return <TurfMap turfs={[turf]} single />;
  return <button type="button" onClick={() => setOpen(true)} style={{ width: '100%', height: '100%', minHeight: 100, border: 0, background: 'var(--bg-muted)', color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Load Google Maps</button>;
}
