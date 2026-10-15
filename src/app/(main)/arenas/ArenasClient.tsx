'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import TurfCard from '@/components/TurfCard';
import type { TurfSummary } from '@/lib/types';
import styles from './page.module.css';
import BackButton from '@/components/BackButton';
import { SPORTS } from '@/lib/sports';
import { PRICE_STEPS, matchesExtras, matchesQuery } from '@/lib/search';
import { locateTurfs } from '@/lib/map-actions';
import type { Coords } from '@/lib/geocode';

// Leaflet touches window, so the map loads in the browser only
const TurfMap = dynamic(() => import('@/components/TurfMap'), { ssr: false, loading: () => <div style={{ height: 420 }} /> });

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
  const urlDate = searchParams.get('date');
  const pickedDate = urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? urlDate : undefined;
  const defaultArea = urlArea && areas.includes(urlArea) ? urlArea : 'All Areas';

  const [selectedArea, setSelectedArea] = useState(defaultArea);
  const [selectedSport, setSelectedSport] = useState(urlSport || 'All Sports');
  const [sortBy, setSortBy] = useState(sortOptions.some((o) => o.value === urlSort) ? urlSort! : 'featured');
  const [maxPrice, setMaxPrice] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const amenityOptions = useMemo(() => [...new Set(turfs.flatMap((t) => t.amenities))].sort(), [turfs]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'grid');

  // Map positions are looked up the first time the map opens, a few turfs at a time
  const [located, setLocated] = useState<Record<string, Coords>>({});
  useEffect(() => {
    if (viewMode !== 'map') return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 6 && !cancelled; i++) {
        const found = await locateTurfs().catch(() => ({}));
        if (cancelled || !Object.keys(found).length) return;
        setLocated((prev) => ({ ...prev, ...found }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewMode]);

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

    result = result.filter((t) => matchesExtras(t, { maxPrice, amenities }));

    // Filter by search
    if (searchQuery.trim()) {
      result = result.filter((t) => matchesQuery(`${t.name} ${t.location} ${t.area} ${t.sports.join(' ')}`, searchQuery));
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
  }, [turfs, selectedCity, selectedArea, selectedSport, sortBy, searchQuery, maxPrice, amenities]);

  const mapTurfs = filtered.map((t) => (located[t.id] ? { ...t, ...located[t.id] } : t));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>
              <BackButton />
              <p className={`section-label ${styles.cityLabel}`}>{selectedCity.toUpperCase()}</p>
              <h1 className={styles.pageTitle}>{selectedSport === 'All Sports' ? 'Sports Arenas' : selectedSport + ' Arenas'}</h1>
              <p className={styles.pageDesc}>
                {filtered.length} venue{filtered.length !== 1 ? 's' : ''} available
                {selectedArea !== 'All Areas' ? ` in ${selectedArea}` : ` across ${selectedCity}`}
              </p>
            </div>
          </div>

          {/* Row 1: search, sort, grid/map */}
          <div className={styles.filterBar}>
            <div className={styles.searchInputWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                id="arena-search"
                type="search"
                placeholder="Search turfs or areas"
                aria-label="Search turfs or areas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                enterKeyHint="search"
              />
              {searchQuery && (
                <button className={styles.searchClear} onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
              )}
            </div>

            {/* Native select laid over a compact button: icon-only on phones, with the label on desktop */}
            <label className={styles.ctrlBtn} title="Sort">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
              </svg>
              <span className={styles.ctrlLabel}>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <select id="arena-sort" className={styles.overlaySelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort turfs">
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <button
              className={styles.ctrlBtn}
              onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
              aria-label={viewMode === 'grid' ? 'Show map' : 'Show list'}
              title={viewMode === 'grid' ? 'Map' : 'List'}
            >
              {viewMode === 'grid' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              )}
              <span className={styles.ctrlLabel}>{viewMode === 'grid' ? 'Map' : 'List'}</span>
            </button>
          </div>

          {/* Row 2: area picker chip, then sports */}
          <div className={styles.chipRowWrap}>
            <div className={styles.chipRow}>
              <label className={`${styles.chip} ${selectedArea !== 'All Areas' ? styles.chipOn : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
                </svg>
                {selectedArea === 'All Areas' ? 'All areas' : selectedArea}
                <span aria-hidden className={styles.caret}>▾</span>
                <select className={styles.overlaySelect} value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} aria-label="Area">
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area === 'All Areas' ? 'All areas' : `${area} (${turfs.filter((t) => t.area === area).length})`}
                    </option>
                  ))}
                </select>
              </label>
              <span className={styles.chipDivider} aria-hidden />
              {['All Sports', ...SPORTS.map((s) => s.value)].map((sport) => (
                <button
                  key={sport}
                  id={`filter-sport-${sport.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`${styles.chip} ${selectedSport === sport ? styles.chipOn : ''}`}
                  onClick={() => setSelectedSport(sport)}
                  aria-pressed={selectedSport === sport}
                >
                  {sport === 'All Sports' ? 'All sports' : sport}
                </button>
              ))}
              <span className={styles.chipDivider} aria-hidden />
              <label className={`${styles.chip} ${maxPrice > 0 ? styles.chipOn : ''}`}>
                {maxPrice > 0 ? `Up to ₹${maxPrice}/hr` : 'Any price'}
                <span aria-hidden className={styles.caret}>▾</span>
                <select className={styles.overlaySelect} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Maximum price per hour">
                  <option value={0}>Any price</option>
                  {PRICE_STEPS.map((p) => (
                    <option key={p} value={p}>{`Up to ₹${p}/hr`}</option>
                  ))}
                </select>
              </label>
              {amenityOptions.map((a) => (
                <button
                  key={a}
                  className={`${styles.chip} ${amenities.includes(a) ? styles.chipOn : ''}`}
                  onClick={() => setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))}
                  aria-pressed={amenities.includes(a)}
                >
                  {a}
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
              <h2 className={styles.emptyTitle}>No turfs found</h2>
              <p className={styles.emptyDesc}>Try a different area, price or search term.</p>
              <button className="btn btn--secondary" onClick={() => { setSelectedArea('All Areas'); setSelectedSport('All Sports'); setMaxPrice(0); setAmenities([]); setSearchQuery(''); }}>
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'map' ? (
            <div className={styles.mapContainer}>
              <TurfMap turfs={mapTurfs} />
              {mapTurfs.some((t) => t.lat === undefined) && <p className={styles.mapNote}>Placing turfs on the map…</p>}
            </div>
          ) : (
            <>
            <h2 className="sr-only">{filtered.length} turfs found</h2>
            <div className={styles.grid}>
              {filtered.map((turf, i) => (
                // Above-the-fold cards paint at once: a fade-in starts at opacity 0 and would hold back the LCP image
                <div key={turf.id} className={i < 4 ? undefined : 'animate-fadeInUp'} style={i < 4 ? undefined : { animationDelay: `${Math.min(i - 4, 6) * 0.06}s` }}>
                  <TurfCard turf={turf} eager={i < 1} date={pickedDate} />
                </div>
              ))}
            </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
