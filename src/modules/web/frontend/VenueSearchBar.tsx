'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchAutocomplete from './SearchAutocomplete';
import styles from './AppBar.module.css';

export default function VenueSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const isMap = params.get('view') === 'map';
  const [query, setQuery] = useState('');
  useEffect(() => { queueMicrotask(() => setQuery(new URLSearchParams(window.location.search).get('q') ?? '')); }, []);

  const toggleMap = () => {
    const next = new URLSearchParams(params.toString());
    if (isMap) next.delete('view');
    else next.set('view', 'map');
    router.push(`/arenas${next.size ? `?${next}` : ''}`);
  };

  return <div className={styles.bar} data-app-bar>
    <Link href="/" className={styles.back} aria-label="Back to home"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 5-7 7 7 7" /></svg></Link>
    <form role="search" aria-label="Search venues" className={styles.venueSearch} onSubmit={e => {
      e.preventDefault();
      const next = new URLSearchParams(window.location.search);
      if (query.trim()) next.set('q', query.trim());
      else next.delete('q');
      router.push(`/arenas${next.size ? `?${next}` : ''}`);
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg>
      <SearchAutocomplete label="Search venue, area or sport" placeholder="Search venue, area or sport" value={query} onChange={setQuery} />
      <button className="sr-only" type="submit">Search</button>
      <button type="button" className={styles.mapToggle} onClick={toggleMap} aria-label={isMap ? 'Show venue cards' : 'Show venue map'} aria-pressed={isMap} title={isMap ? 'Show venue cards' : 'Map'}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13Z" /><circle cx="12" cy="9" r="2.5" /></svg>
      </button>
    </form>
  </div>;
}
