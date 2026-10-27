import styles from './BookingDiscovery.module.css';

export default function BookingSearch() {
  return (
    <form action="/arenas" method="get" role="search" aria-label="Find a venue" className={styles.search}>
      <label className={styles.searchField}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <input name="q" type="search" aria-label="Search a venue or area" placeholder="Search venue, area or sport" autoComplete="off" />
      </label>
      <button type="submit" className={styles.searchButton}>Search</button>
    </form>
  );
}
