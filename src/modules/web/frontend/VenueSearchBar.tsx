'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AppBar.module.css';
export default function VenueSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  useEffect(() => { queueMicrotask(() => setQuery(new URLSearchParams(window.location.search).get('q') ?? '')); }, []);
  return <div className={styles.bar} data-app-bar><Link href="/" className={styles.back} aria-label="Back to home"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 5-7 7 7 7" /></svg></Link><form role="search" aria-label="Search venues" className={styles.venueSearch} onSubmit={e => { e.preventDefault(); const params = new URLSearchParams(window.location.search); if (query.trim()) params.set('q', query.trim()); else params.delete('q'); router.push(`/arenas${params.size ? `?${params}` : ''}`); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg><input type="search" aria-label="Search venue, area or sport" placeholder="Search venue, area or sport" value={query} onChange={e => setQuery(e.target.value)} /><button className="sr-only" type="submit">Search</button></form></div>;
}
