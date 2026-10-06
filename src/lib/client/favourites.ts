'use client';

import { useCallback, useEffect, useState } from 'react';

// Turfs the player saved. Kept in this browser; ClerkProfileSync also copies them to the signed-in account
// so they follow the player to other devices.
const KEY = 'oyun_favourites';
export const FAVOURITES_EVENT = 'oyun:favourites';

export function getFavourites(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, 200) : [];
  } catch {
    return [];
  }
}

export function setFavourites(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)].slice(0, 200)));
  } catch {}
  window.dispatchEvent(new Event(FAVOURITES_EVENT));
}

export function useFavourites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const read = () => setIds(getFavourites());
    queueMicrotask(read);
    window.addEventListener(FAVOURITES_EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(FAVOURITES_EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const current = getFavourites();
    setFavourites(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
