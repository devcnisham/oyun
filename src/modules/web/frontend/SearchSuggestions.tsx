'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSearchIndex } from '@/modules/web/backend/search-actions';
import { buildSuggestions, type SearchEntry } from '@/modules/web/backend/search';
import { usePublicSearchEntries } from './PublicSearchProvider';
import styles from '@/modules/web/frontend/SearchSuggestions.module.css';


// Loads the search index the first time a search box is used, then answers as you type
export function useSuggestions(query: string, active: boolean) {
  const publicEntries = usePublicSearchEntries();
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);

  useEffect(() => {
    if (!active || entries || publicEntries) return;
    let cancelled = false;
    getSearchIndex()
      .then((rows) => !cancelled && setEntries(rows))
      .catch(() => !cancelled && setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [active, entries, publicEntries]);

  return useMemo(() => buildSuggestions(publicEntries ?? entries ?? [], query), [publicEntries, entries, query]);
}

export default function SearchSuggestions({
  query,
  suggestions,
  onPick,
  className,
}: {
  query: string;
  suggestions: ReturnType<typeof useSuggestions>;
  onPick: () => void;
  className?: string;
}) {
  if (!query.trim()) return null;

  return (
    <ul className={`${styles.list} ${className ?? ''}`} aria-label="Search suggestions">
      {suggestions.map((s) => (
        <li key={`${s.kind}:${s.href}`}>
          <Link href={s.href} className={styles.item} onClick={onPick}>
            <span className={styles.text}>
              <span className={styles.label}>{s.label}</span>
              <span className={styles.hint}>{s.hint}</span>
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Link href={`/arenas?q=${encodeURIComponent(query.trim())}`} className={styles.item} onClick={onPick}>
          <span className={styles.text}>
            <span className={styles.label}>
              {suggestions.length === 0 ? `No matches for “${query.trim()}”` : `See all results for “${query.trim()}”`}
            </span>
          </span>
        </Link>
      </li>
    </ul>
  );
}
