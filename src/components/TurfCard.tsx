import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import type { PublicTurf } from '@/lib/types';
import FavouriteButton from './FavouriteButton';
import styles from './TurfCard.module.css';

interface TurfCardProps {
  turf: PublicTurf;
  // Above-the-fold cards: load the image right away instead of lazily (it is the page's largest paint)
  eager?: boolean;
  // Small card with a Book button (home sliders)
  compact?: boolean;
  // Date picked in search (YYYY-MM-DD): the turf page opens on it
  date?: string;
}

export default function TurfCard({ turf, eager = false, compact = false, date }: TurfCardProps) {

  return (
    <div className={`${styles.cardWrap} ${compact ? styles.compact : ''}`}>
    <FavouriteButton turfId={turf.id} turfName={turf.name} className={styles.fav} />
    <Link href={date ? `/arenas/${turf.id}?date=${date}` : `/arenas/${turf.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image src={turf.images[0]} alt={turf.name} fill sizes="(max-width: 768px) 100vw, 400px" className={styles.image} {...(eager ? { loading: 'eager' as const, fetchPriority: 'high' as const } : {})} unoptimized={!canOptimize(turf.images[0])} />
        {turf.isFeatured && (
          <div className={styles.badgeTop}>OYUN WIZARD</div>
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{turf.name}</h3>
        </div>
        
        <p className={styles.location}>{turf.location}</p>
        
        <div className={styles.amenities}>
          {turf.amenities.slice(0, 3).map((a, i) => (
            <span key={i} className={styles.amenity}>✓ {a}</span>
          ))}
        </div>

        <div className={styles.pricing}>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{turf.pricePerHour}</span>
            <span className={styles.bookBtn}>Book</span>
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}
