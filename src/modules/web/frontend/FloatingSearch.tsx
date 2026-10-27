'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { SPORTS } from '@/modules/web/lib/sports';
import SearchSuggestions, { useSuggestions } from '@/modules/web/frontend/SearchSuggestions';
import styles from '@/modules/web/frontend/FloatingSearch.module.css';

// Raised red search button in the middle of the phone tab bar; opens a search sheet
export default function FloatingSearch({ className, renderTrigger }: { className?: string; renderTrigger?: (open: () => void) => React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('');
  const [view, setView] = useState('grid');
  const input = useRef<HTMLInputElement>(null);
  const suggestions = useSuggestions(q, open);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const openSearch = () => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q') ?? '');
    setSport(params.get('sport') ?? '');
    setView(params.get('view') === 'map' ? 'map' : 'grid');
    setOpen(true);
  };

  const go = (query: string) => {
    setOpen(false);
    const term = query.trim();
    const params = window.location.pathname === '/arenas' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    if (term) params.set('q', term); else params.delete('q');
    if (sport) params.set('sport', sport); else params.delete('sport');
    if (view === 'map') params.set('view', view); else params.delete('view');
    router.push(`/arenas${params.size ? `?${params}` : ''}`);
  };

  return (
    <>
      {renderTrigger ? renderTrigger(openSearch) : (
      <button type="button" className={className} aria-label="Search venues" onClick={openSearch}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      )}

      {/* Portal so the sheet is not trapped under the tab bar's stacking layer */}
      {open && createPortal(
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Search venues">
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
                placeholder="Search venues or areas"
                aria-label="Search venues or areas"
                enterKeyHint="search"
              />
              <button type="button" className={styles.close} onClick={() => setOpen(false)}>Cancel</button>
            </form>
            <div className={styles.categoryFilters} role="group" aria-label="Venue categories">{[{ value: '', label: 'All sports' }, ...SPORTS].map(category => <button key={category.value} type="button" aria-pressed={sport === category.value} onClick={() => setSport(category.value)}>{category.label}</button>)}</div>
            <SearchSuggestions query={q} suggestions={suggestions} onPick={() => setOpen(false)} />
            <button type="button" className={styles.all} onClick={() => go(q)}>Show venues</button>
          </div>
        </div>
      , document.body)}
    </>
  );
}
