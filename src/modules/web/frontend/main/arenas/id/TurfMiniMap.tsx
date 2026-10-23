'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { locateTurf } from '@/modules/web/backend/map-actions';
import type { Coords } from '@/modules/shared/backend/geocode';
import type { MapTurf } from '@/modules/web/frontend/TurfMap';

const TurfMap = dynamic(() => import('@/modules/web/frontend/TurfMap'), { ssr: false, loading: () => <Note>Loading map…</Note> });

const fill = { width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center' as const };

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ ...fill, color: 'var(--text-muted)', fontSize: 14 }}>{children}</div>;
}

/**
 * The turf's pin on a small map, behind a tap. The map library and tiles are a few hundred KB that hurt
 * mobile performance, so they load only when the player asks. A turf with no saved position is looked up first.
 */
export default function TurfMiniMap({ turf }: { turf: MapTurf }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(turf.lat !== undefined && turf.lng !== undefined ? { lat: turf.lat, lng: turf.lng } : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || coords) return;
    let cancelled = false;
    locateTurf(turf.id)
      .then((found) => !cancelled && (found ? setCoords(found) : setFailed(true)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, coords, turf.id]);

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
  if (coords) return <TurfMap turfs={[{ ...turf, ...coords }]} single />;
  if (failed) {
    const query = encodeURIComponent(`${turf.name} ${turf.location ?? turf.area}`);
    return (
      <Note>
        <span>
          We could not place this turf on the map.{' '}
          <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">
            Search it on Google Maps
          </a>
        </span>
      </Note>
    );
  }
  return <Note>Finding the spot…</Note>;
}
