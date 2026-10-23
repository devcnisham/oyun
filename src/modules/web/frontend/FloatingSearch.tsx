'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import SearchSuggestions, { useSuggestions } from '@/modules/web/frontend/SearchSuggestions';
import styles from '@/modules/web/frontend/FloatingSearch.module.css';

// Raised red search button in the middle of the phone tab bar; opens a search sheet
export default function FloatingSearch({ className, renderTrigger }: { className?: string; renderTrigger?: (open: () => void) => React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const suggestions = useSuggestions(q, open);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const go = (query: string) => {
    setOpen(false);
    const term = query.trim();
    router.push(term ? `/arenas?q=${encodeURIComponent(term)}` : '/arenas');
  };

  return (
    <>
      {renderTrigger ? renderTrigger(() => setOpen(true)) : (
      <button type="button" className={className} aria-label="Search turfs" onClick={() => setOpen(true)}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      )}

      {/* Portal so the sheet is not trapped under the tab bar's stacking layer */}
      {open && createPortal(
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
            <SearchSuggestions query={q} suggestions={suggestions} onPick={() => setOpen(false)} />
            <button type="button" className={styles.all} onClick={() => go('')}>Browse all turfs</button>
          </div>
        </div>
      , document.body)}
    </>
  );
}
