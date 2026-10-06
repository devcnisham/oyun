'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HeroSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');

  const handleSearch = () => {
    // Free text matches turf name, area or location on the arenas page
    const query = new URLSearchParams();
    if (location.trim()) {
      query.set('q', location.trim());
    }
    if (dateStr) {
      query.set('date', dateStr);
    }
    router.push(`/arenas?${query.toString()}`);
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchInputGroup}>
        <div className={styles.searchField}>
          <span className={styles.searchIcon}>📍</span>
          <input 
            type="text" 
            placeholder="Search by city, location or arena name" 
            className={styles.searchInput}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className={styles.searchDivider}></div>
        <div className={styles.searchField} style={{ flex: '0 0 auto', width: '180px' }}>
          <span className={styles.searchIcon}>📅</span>
          <input 
            type="date" 
            aria-label="Date" 
            className={styles.searchInput} 
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ cursor: 'pointer', colorScheme: 'dark' }}
          />
        </div>
      </div>
      <button onClick={handleSearch} className={styles.searchBtn}>Search</button>
    </div>
  );
}
