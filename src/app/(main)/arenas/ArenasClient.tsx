'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TurfCard from '@/components/TurfCard';
import type { TurfSummary } from '@/lib/types';
import styles from './page.module.css';

const sortOptions = [
  { value: 'featured', label: 'Featured First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'availability', label: 'Most Available' },
];

export default function ArenasClient({ turfs, areaNames }: { turfs: TurfSummary[]; areaNames: string[] }) {
  const searchParams = useSearchParams();
  const areas = ['All Areas', ...areaNames];

  const selectedCity = searchParams.get('city') || 'Mangalore';
  const urlArea = searchParams.get('area');
  const urlSort = searchParams.get('sort');
  const urlSport = searchParams.get('sport');
  const defaultArea = urlArea && areas.includes(urlArea) ? urlArea : 'All Areas';

  const [selectedArea, setSelectedArea] = useState(defaultArea);
  const [selectedSport, setSelectedSport] = useState(urlSport || 'All Sports');
  const [sortBy, setSortBy] = useState(sortOptions.some((o) => o.value === urlSort) ? urlSort! : 'featured');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'grid');

  const filtered = useMemo(() => {
    let result = [...turfs];

    // Filter by city
    if (selectedCity && selectedCity.toLowerCase() !== 'all cities') {
      result = result.filter((t) => t.location.toLowerCase().includes(selectedCity.toLowerCase()));
    }

    // Filter by area
    if (selectedArea !== 'All Areas') {
      result = result.filter((t) => t.area === selectedArea);
    }

    // Filter by sport
    if (selectedSport !== 'All Sports') {
      result = result.filter((t) => t.sports.includes(selectedSport));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerHour - a.pricePerHour);
        break;
      case 'availability':
        result.sort((a, b) => b.availableToday - a.availableToday);
        break;
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [turfs, selectedCity, selectedArea, selectedSport, sortBy, searchQuery]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>
              <Link href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
                <span style={{fontSize: 16}}>←</span> Back home
              </Link>
              <p className="section-label">{selectedCity.toUpperCase()}</p>
              <h1 className={styles.pageTitle}>{selectedSport === 'All Sports' ? 'Sports Arenas' : selectedSport + ' Arenas'}</h1>
              <p className={styles.pageDesc}>
                {filtered.length} venue{filtered.length !== 1 ? 's' : ''} available
                {selectedArea !== 'All Areas' ? ` in ${selectedArea}` : ` across ${selectedCity}`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                id="arena-search"
                type="text"
                placeholder="Search by turf name or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button className={styles.searchClear} onClick={() => setSearchQuery('')} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
            
            <div className={styles.controlsGroup}>
              <div className={styles.viewToggle}>
                <button 
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button 
                  className={`${styles.viewBtn} ${viewMode === 'map' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('map')}
                  aria-label="Map view"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                </button>
              </div>
              <select
                id="arena-sort"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort arenas"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Horizontal Sport Filters */}
          <div className={styles.areaFiltersWrapper}>
            <div className={styles.areaFilters}>
              {['All Sports', 'Football', 'Box Cricket', 'Badminton', 'Padel'].map((sport) => (
                <button
                  key={sport}
                  id={`filter-sport-${sport.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`${styles.areaFilter} ${selectedSport === sport ? styles.areaFilterActive : ''}`}
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Area Filters (Pill buttons) */}
          <div className={styles.areaFiltersWrapper} style={{ marginTop: 8 }}>
            <div className={styles.areaFilters}>
              {areas.map((area) => (
                <button
                  key={area}
                  id={`filter-area-${area.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`${styles.areaFilter} ${selectedArea === area ? styles.areaFilterActive : ''}`}
                  onClick={() => setSelectedArea(area)}
                >
                  {area}
                  {area !== 'All Areas' && (
                    <span className={styles.areaFilterCount}>
                      {turfs.filter((t) => t.area === area).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className={`container ${styles.body}`}>
        {/* Grid */}
        <main className={styles.main}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏟️</div>
              <h3 className={styles.emptyTitle}>No turfs found</h3>
              <p className={styles.emptyDesc}>Try a different area or search term.</p>
              <button className="btn btn--secondary" onClick={() => { setSelectedArea('All Areas'); setSearchQuery(''); }}>
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'map' ? (
            <div className={styles.mapContainer}>
              <iframe
                title="Turfs on map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`football turf ${selectedArea !== 'All Areas' ? selectedArea : ''} ${selectedCity}`)}&output=embed`}
                width="100%"
                height="420"
                style={{ border: 0, borderRadius: '12px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className={styles.mapPinsMock}>
                {filtered.map((t) => (
                  <a key={t.id} href={`/arenas/${t.id}`} className={styles.mapPinMock}>{t.name} · ₹{t.pricePerHour}</a>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((turf, i) => (
                <div key={turf.id} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.08}s` }}>
                  <TurfCard turf={turf} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
