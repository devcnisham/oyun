'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './FloatingSearch.module.css';

// Round floating search button at the bottom-right on phones; opens a search sheet
export default function FloatingSearch({ areas }: { areas: string[] }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // Turf pages use the bottom of the screen for the booking bar
  if (pathname.startsWith('/arenas/') || pathname.endsWith('/invoice')) return null;

  const go = (query: string) => {
    setOpen(false);
    const term = query.trim();
    router.push(term ? `/arenas?q=${encodeURIComponent(term)}` : '/arenas');
  };

  return (
    <>
      <button type="button" className={styles.fab} aria-label="Search turfs" onClick={() => setOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Search turfs">
            <form
              className={styles.bar}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search turfs or areas"
                aria-label="Search turfs or areas"
                enterKeyHint="search"
              />
              <button type="button" className={styles.close} onClick={() => setOpen(false)}>Cancel</button>
            </form>
            {areas.length > 0 && (
              <>
                <p className={styles.label}>Popular areas</p>
                <div className={styles.chips}>
                  {areas.slice(0, 10).map((a) => (
                    <button key={a} type="button" className={styles.chip} onClick={() => go(a)}>{a}</button>
                  ))}
                </div>
              </>
            )}
            <button type="button" className={styles.all} onClick={() => go('')}>Browse all turfs</button>
          </div>
        </div>
      )}
    </>
  );
}
