'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clusterPins } from '@/modules/web/lib/map-cluster';
import type { TurfSummary } from '@/modules/shared/database/types';

// What a pin needs; the turf page has these without the live availability count
export type MapTurf = Pick<TurfSummary, 'id' | 'name' | 'area' | 'pricePerHour' | 'rating' | 'reviewCount' | 'lat' | 'lng'> & { location?: string };
import styles from '@/modules/web/frontend/TurfMap.module.css';

const MANGALORE: L.LatLngTuple = [12.9141, 74.856];
// Room one price pin takes on screen; pins closer than this are grouped
const PIN_WIDTH = 150;
const PIN_HEIGHT = 60;
const CLUSTER_SIZE = 44;

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

// Round badge with the number of turfs grouped under it
function clusterPin(count: number) {
  return L.divIcon({ html: el('div', styles.cluster, String(count)), className: styles.pinWrap, iconSize: [CLUSTER_SIZE, CLUSTER_SIZE] });
}

// List shown when grouped turfs sit too close to be told apart by zooming in
function listCard(turfs: MapTurf[]) {
  const root = el('div', styles.card);
  root.append(el('strong', styles.cardName, `${turfs.length} venues here`));
  for (const t of [...turfs].sort((a, b) => a.name.localeCompare(b.name))) {
    const link = el('a', styles.cardLink, `${t.name} · ₹${t.pricePerHour}`) as HTMLAnchorElement;
    link.href = `/arenas/${t.id}`;
    root.append(link);
  }
  return root;
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
    const m = map.current;
    const lay = layer.current;
    if (!m || !lay) return;
    const placed = turfs.filter((t) => t.lat !== undefined && t.lng !== undefined);
    const byId = new Map(placed.map((t) => [t.id, t]));

    // Pins that would overlap at this zoom become one numbered circle; redrawn whenever the zoom changes
    const draw = () => {
      lay.clearLayers();
      if (single) {
        for (const t of placed) {
          const marker = L.marker([t.lat!, t.lng!], { icon: pin(t), title: t.name }).bindPopup(card(t, true)).addTo(lay);
          marker.openPopup();
        }
        return;
      }
      const zoom = m.getZoom();
      const points = placed.map((t) => {
        const at = m.project([t.lat!, t.lng!], zoom);
        return { id: t.id, x: at.x, y: at.y };
      });
      for (const c of clusterPins(points, PIN_WIDTH, PIN_HEIGHT)) {
        const members = c.ids.map((id) => byId.get(id)!);
        if (members.length === 1) {
          const t = members[0];
          L.marker([t.lat!, t.lng!], { icon: pin(t), title: t.name }).bindPopup(card(t, false)).addTo(lay);
          continue;
        }
        const at = m.unproject(L.point(c.x, c.y), zoom);
        L.marker(at, { icon: clusterPin(members.length), title: `${members.length} venues here`, keyboard: true }).addTo(lay).on('click', () => {
          const bounds = L.latLngBounds(members.map((t) => [t.lat!, t.lng!] as L.LatLngTuple));
          const apart = !bounds.getNorthEast().equals(bounds.getSouthWest());
          // Zoom in when that would separate them; otherwise (same spot, or already at the closest zoom) list them
          if (apart && m.getBoundsZoom(bounds, false, L.point(48, 48)) > m.getZoom()) m.fitBounds(bounds, { padding: [48, 48], maxZoom: m.getMaxZoom() });
          else L.popup().setLatLng(at).setContent(listCard(members)).openOn(m);
        });
      }
    };

    m.on('zoomend', draw);
    if (single && placed.length) m.setView([placed[0].lat!, placed[0].lng!], 16);
    else if (placed.length) m.fitBounds(L.latLngBounds(placed.map((t) => [t.lat!, t.lng!] as L.LatLngTuple)), { padding: [48, 48], maxZoom: 15 });
    draw();
    return () => {
      m.off('zoomend', draw);
    };
  }, [turfs, single]);

  return <div ref={box} className={`${styles.map} ${single ? styles.fill : ''}`} role="region" aria-label={single ? 'Venue location' : 'Venues on map'} />;
}
