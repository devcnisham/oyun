import { SPORTS } from '@/modules/web/lib/sports';
import { addDays, BOOKING_DAYS, istNow } from '@/modules/shared/lib/time';
import styles from './BookingHome.module.css';

export default function BookingSearch() {
  const today = istNow().date;
  return (
    <form action="/arenas" method="get" role="search" aria-label="Find a turf" className={styles.search}>
      <label className={styles.searchField}>
        <span>Where do you want to play?</span>
        <input name="q" type="search" placeholder="Search a turf or area" autoComplete="off" />
      </label>
      <label className={styles.searchField}>
        <span>Your sport</span>
        <select name="sport" defaultValue=""><option value="">All sports</option>{SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </label>
      <label className={styles.searchField}>
        <span>When?</span>
        <input name="date" type="date" aria-label="Booking date" min={today} max={addDays(today, BOOKING_DAYS - 1)} defaultValue={today} />
      </label>
      <button type="submit" className={styles.searchButton}>Search turfs </button>
    </form>
  );
}
