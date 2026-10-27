'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import TurfCard from '@/modules/web/frontend/TurfCard';
import PageSkeleton from '@/modules/shared/frontend/PageSkeleton';
import type { TurfSummary } from '@/modules/shared/database/types';
import styles from '@/app/(main)/arenas/page.module.css';
import { VENUE_SORT_OPTIONS as sortOptions } from '@/modules/web/lib/venue-search-options';
import { SPORTS, sportInfo } from '@/modules/web/lib/sports';
import { filtersToParams, matchesExtras, matchesQuery, parseMaxPrice } from '@/modules/web/backend/search';
import { locateTurfs } from '@/modules/web/backend/map-actions';
import { getOpenHours } from '@/modules/web/backend/availability-actions';
import { hasOpenSlot, isTimeWindow, type TimeWindow } from '@/modules/web/lib/availability';
import { istNow } from '@/modules/shared/lib/time';
import type { Coords } from '@/modules/shared/backend/geocode';

// Leaflet touches window, so the map loads in the browser only
const TurfMap = dynamic(() => import('@/modules/web/frontend/TurfMap'), { ssr: false, loading: () => <PageSkeleton variant="content" /> });



// The list reads its filters from the address bar in the browser, so the page itself can be prebuilt and cached.
// Re-keying on the filters that come from other pages (home search, top bar) restarts the list state when they change.
export default function ArenasClient(props: { turfs: TurfSummary[]; areaNames: string[] }) {
  const sp = useSearchParams();
  const key = ['q', 'area', 'sport', 'date', 'type', 'sort', 'view'].map((k) => sp.get(k) ?? '').join('|');
  return <ArenasList key={key} {...props} />;
}

function ArenasList({ turfs, areaNames }: { turfs: TurfSummary[]; areaNames: string[] }) {
  const searchParams = useSearchParams();
  const areas = ['All Areas', ...areaNames];

  const selectedCity = searchParams.get('city') || 'Mangalore';
  const urlArea = searchParams.get('area');
  const urlSort = searchParams.get('sort');
  const urlSport = searchParams.get('sport');
  // /turfs and /courts arrive here as ?type=turf and ?type=court
  const urlType = searchParams.get('type');
  const placeType = urlType === 'turf' || urlType === 'court' ? urlType : null;
  const urlDate = searchParams.get('date');
  const pickedDate = urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? urlDate : undefined;
  const defaultArea = urlArea && areas.includes(urlArea) ? urlArea : 'All Areas';

  const [selectedArea, setSelectedArea] = useState(defaultArea);
  const [selectedSport, setSelectedSport] = useState(urlSport || 'All Sports');
  const [sortBy, setSortBy] = useState(sortOptions.some((o) => o.value === urlSort) ? urlSort! : 'featured');
  const [maxPrice, setMaxPrice] = useState(() => parseMaxPrice(searchParams.get('maxPrice')));
  const amenityOptions = useMemo(() => [...new Set(turfs.flatMap((t) => t.amenities))].sort(), [turfs]);
  const [amenities, setAmenities] = useState<string[]>(() => searchParams.getAll('amenity').filter((a) => amenityOptions.includes(a)));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [date, setDate] = useState(pickedDate ?? '');
  const [time, setTime] = useState<TimeWindow | ''>(() => {
    const t = searchParams.get('time');
    return isTimeWindow(t) ? t : '';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(searchParams.get('view') === 'map' ? 'map' : 'grid');

  // Keep the filters in the address bar so a refresh keeps them and the link can be shared
  useEffect(() => {
    const next = filtersToParams(new URLSearchParams(window.location.search), {
      q: searchQuery,
      area: selectedArea,
      sport: selectedSport,
      sort: sortBy,
      maxPrice,
      amenities,
      date,
      time,
      view: viewMode,
    });
    const qs = next.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [searchQuery, selectedArea, selectedSport, sortBy, maxPrice, amenities, date, time, viewMode]);

  // Open slots for the chosen day (today when only a time of day is chosen), fetched when the choice changes
  const today = useMemo(() => istNow().date, []);
  const queryDate = date || (time ? today : '');
  const [openSlots, setOpenSlots] = useState<{ date: string; hours: Record<string, number[]> } | null>(null);
  useEffect(() => {
    if (!queryDate) return;
    let cancelled = false;
    getOpenHours(queryDate)
      .then((hours) => !cancelled && setOpenSlots({ date: queryDate, hours }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [queryDate]);
  const checking = queryDate !== '' && openSlots?.date !== queryDate;
  // An empty answer means the day is outside the booking window: show everything rather than nothing
  const openHours = !checking && openSlots && Object.keys(openSlots.hours).length > 0 ? openSlots.hours : null;

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

    // Filter by kind of venue (turf or court), from the address
    if (placeType) {
      result = result.filter((t) => t.sports.some((sp) => sportInfo(sp).place === placeType));
    }

    // Filter by sport
    if (selectedSport !== 'All Sports') {
      result = result.filter((t) => t.sports.includes(selectedSport));
    }

    result = result.filter((t) => matchesExtras(t, { maxPrice, amenities }));

    // Filter by open slots on the chosen day and time of day
    if (openHours) result = result.filter((t) => hasOpenSlot(openHours[t.id] ?? [], time));

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
  }, [turfs, selectedCity, selectedArea, selectedSport, sortBy, searchQuery, maxPrice, amenities, openHours, time, placeType]);

  const hasSearchPreferences = selectedArea !== 'All Areas' || maxPrice > 0 || amenities.length > 0 || Boolean(date || time);

  const mapTurfs = filtered.map((t) => (located[t.id] ? { ...t, ...located[t.id] } : t));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>

              <h1 className="sr-only">{selectedSport === 'All Sports' ? 'Sports Arenas' : selectedSport + ' Arenas'}</h1>
              {(checking || hasSearchPreferences) && <div className={styles.pageDesc}>
                {checking && <span role="status">Checking open slots…</span>}
                {hasSearchPreferences && <button type="button" className={styles.clearFilters} onClick={() => { setSelectedArea('All Areas'); setMaxPrice(0); setAmenities([]); setDate(''); setTime(''); }}>Clear search preferences</button>}
              </div>}
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
                placeholder="Search venues or sports"
                aria-label="Search venues or sports"
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
              <select id="arena-sort" className={styles.overlaySelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort venues">
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
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.body}`}>
        {/* Grid */}
        <div className={styles.main}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏟️</div>
              <h2 className={styles.emptyTitle}>No venues found</h2>
              <p className={styles.emptyDesc}>Try a different area, price, day or search term.</p>
              <button className="btn btn--secondary" onClick={() => { setSelectedArea('All Areas'); setSelectedSport('All Sports'); setMaxPrice(0); setAmenities([]); setDate(''); setTime(''); setSearchQuery(''); }}>
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'map' ? (
            <div className={styles.mapContainer}>
              <TurfMap turfs={mapTurfs} />
              {mapTurfs.some((t) => t.lat === undefined) && <p className={styles.mapNote}>Placing venues on the map…</p>}
            </div>
          ) : (
            <>
            <h2 className="sr-only">{filtered.length} venues found</h2>
            <div className={styles.grid}>
              {filtered.map((turf, i) => (
                // Above-the-fold cards paint at once: a fade-in starts at opacity 0 and would hold back the LCP image
                <div key={turf.id}>
                  <TurfCard turf={turf} eager={i < 4} date={date || undefined} />
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
