'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TurfSummary } from '@/lib/types';

// What a pin needs; the turf page has these without the live availability count
export type MapTurf = Pick<TurfSummary, 'id' | 'name' | 'area' | 'pricePerHour' | 'rating' | 'reviewCount' | 'lat' | 'lng'> & { location?: string };
import styles from './TurfMap.module.css';

const MANGALORE: L.LatLngTuple = [12.9141, 74.856];

const el = (tag: string, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// Price pill with the turf name above it, like the pins on booking sites
function pin(turf: MapTurf) {
  const root = el('div', styles.pin);
  root.append(el('span', styles.pinName, turf.name), el('span', styles.pinPrice, `₹${turf.pricePerHour}`));
  return L.divIcon({ html: root, className: styles.pinWrap, iconSize: undefined });
}

// Small card shown when a pin is tapped
function card(turf: MapTurf, single: boolean) {
  const root = el('div', styles.card);
  root.append(
    el('strong', styles.cardName, turf.name),
    el('span', styles.cardMeta, `${turf.area}${turf.reviewCount > 0 ? ` · ★ ${turf.rating}` : ''}`),
    el('span', styles.cardMeta, `From ₹${turf.pricePerHour}/hr`),
  );
  // On the turf's own page the useful link is the route there; elsewhere it is the booking page
  const link = el('a', styles.cardLink, single ? 'Open in Google Maps' : 'View & book') as HTMLAnchorElement;
  if (single) {
    link.href = `https://www.google.com/maps/search/?api=1&query=${turf.lat},${turf.lng}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
  } else {
    link.href = `/arenas/${turf.id}`;
  }
  root.append(link);
  return root;
}

// `single` is the turf page's mini-map: one pin, popup open, fills its container
export default function TurfMap({ turfs, single = false }: { turfs: MapTurf[]; single?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, { scrollWheelZoom: false }).setView(MANGALORE, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const placed = turfs.filter((t) => t.lat !== undefined && t.lng !== undefined);
    for (const t of placed) {
      const marker = L.marker([t.lat!, t.lng!], { icon: pin(t), title: t.name }).bindPopup(card(t, single)).addTo(layer.current);
      if (single) marker.openPopup();
    }
    if (single && placed.length) map.current.setView([placed[0].lat!, placed[0].lng!], 16);
    else if (placed.length) map.current.fitBounds(L.latLngBounds(placed.map((t) => [t.lat!, t.lng!] as L.LatLngTuple)), { padding: [48, 48], maxZoom: 15 });
  }, [turfs, single]);

  return <div ref={box} className={`${styles.map} ${single ? styles.fill : ''}`} role="region" aria-label={single ? 'Turf location' : 'Turfs on map'} />;
}
