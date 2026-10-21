import styles from '@/app/(main)/turfs/[area]/page.module.css';
import type { PublicTurf } from '@/lib/types';
import TurfCard from './TurfCard';

export default function TurfGrid({ turfs }: { turfs: PublicTurf[] }) {
  return (
    <div className={styles.grid}>
      {turfs.map((t) => (
        <TurfCard key={t.id} turf={t} />
      ))}
    </div>
  );
}
