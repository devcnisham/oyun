import Image from 'next/image';
import { SPORTS } from '@/modules/web/lib/sports';
import BookingSearch from './BookingSearch';
import styles from './BookingDiscovery.module.css';

export default function BookingDiscovery({ selectedSport, onSelectSport }: { selectedSport: string; onSelectSport: (sport: string) => void }) {
  return <section className={styles.discovery} aria-label="Find a place to play">
    <BookingSearch />
    <div className={styles.categories} role="group" aria-label="Filter venues by sport">
      {SPORTS.slice(0, 4).map(sport => <button type="button" key={sport.value} className={styles.category} aria-pressed={selectedSport === sport.value} aria-controls="featured-title" onClick={() => onSelectSport(sport.value)}>
        <span className={styles.photo}><Image src={sport.image.replace('w=600', 'w=1000').replace('q=80', 'q=85')} alt="" fill loading="eager" sizes="(max-width: 760px) 50vw, 25vw" /></span>
        <span className={styles.name}>{sport.label}</span>
      </button>)}
    </div>
  </section>;
}
