'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HeroSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    // Free text matches turf name, area or location on the arenas page
    const query = new URLSearchParams();
    if (location.trim()) {
      query.set('q', location.trim());
    }
    router.push(`/arenas?${query.toString()}`);
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchInputGroup}>
        <div className={styles.searchField}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <input 
            type="text" 
            placeholder="Search by city, location or arena name" 
            className={styles.searchInput}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>
      <button onClick={handleSearch} className={styles.searchBtn}>Search</button>
    </div>
  );
}
