'use client';

import { useState } from 'react';
import SearchAutocomplete from '@/modules/web/frontend/SearchAutocomplete';
import styles from './BookingDiscovery.module.css';

export default function BookingSearch() {
  const [query,setQuery]=useState('');
  return (
    <form action="/arenas" method="get" role="search" aria-label="Find a venue" className={styles.search}>
      <div className={styles.searchField}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <SearchAutocomplete name="q" value={query} onChange={setQuery} label="Search a venue or area" placeholder="Search venue, area or sport" />
      </div>
      <button type="submit" className={styles.searchButton}>Search</button>
    </form>
  );
}
