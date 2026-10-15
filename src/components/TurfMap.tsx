'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TurfSummary } from '@/lib/types';
import styles from './TurfMap.module.css';

const MANGALORE: L.LatLngTuple = [12.9141, 74.856];

const el = (tag: string, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// Price pill with the turf name above it, like the pins on booking sites
function pin(turf: TurfSummary) {
  const root = el('div', styles.pin);
  root.append(el('span', styles.pinName, turf.name), el('span', styles.pinPrice, `₹${turf.pricePerHour}`));
  return L.divIcon({ html: root, className: styles.pinWrap, iconSize: undefined });
}

// Small card shown when a pin is tapped
function card(turf: TurfSummary) {
  const root = el('div', styles.card);
  root.append(
    el('strong', styles.cardName, turf.name),
    el('span', styles.cardMeta, `${turf.area}${turf.reviewCount > 0 ? ` · ★ ${turf.rating}` : ''}`),
    el('span', styles.cardMeta, `From ₹${turf.pricePerHour}/hr`),
  );
  const link = el('a', styles.cardLink, 'View & book') as HTMLAnchorElement;
  link.href = `/arenas/${turf.id}`;
  root.append(link);
  return root;
}

export default function TurfMap({ turfs }: { turfs: TurfSummary[] }) {
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
      L.marker([t.lat!, t.lng!], { icon: pin(t), title: t.name }).bindPopup(card(t)).addTo(layer.current);
    }
    if (placed.length) map.current.fitBounds(L.latLngBounds(placed.map((t) => [t.lat!, t.lng!] as L.LatLngTuple)), { padding: [48, 48], maxZoom: 15 });
  }, [turfs]);

  return <div ref={box} className={styles.map} role="region" aria-label="Turfs on map" />;
}
