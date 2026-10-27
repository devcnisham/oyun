import Link from 'next/link';
import Image from 'next/image';
import styles from './BookingHome.module.css';

/** Demo creative only. Replace inside data-ad-container when a publisher is configured. */
export default function AdPlacement({ id, format = 'banner' }: { id: string; format?: 'banner' | 'card' }) {
  const second = id.includes('right') || id.includes('inline');
  const photo = id.includes('leaderboard') ? 'photo-1752614654887-0b8d59c076b0' : second ? 'photo-1779862758053-0d4e29f93105' : 'photo-1778180883969-073d6361fea3';
  return <aside className={`${styles.adPlacement} ${format === 'card' ? styles.adCard : styles.adBanner} ${second ? styles.adAlternate : ''}`} aria-label="Demo advertisement" data-ad-placement={id} data-ad-format={format}>
    <Image src={`https://images.unsplash.com/${photo}?w=1200&q=85&auto=format&fit=crop`} alt="" fill sizes={format === 'banner' ? '100vw' : '(max-width: 600px) 100vw, 50vw'} className={styles.adPhoto} />
    <span>Advertisement · Demo</span>
    <div className={styles.adCreative} data-ad-container={id}>
      <div><small>OYUN · PLAY BEYOND.</small><p>{second ? 'Make room for more play.' : 'Your next game is calling.'}</p><span>Sample ad creative</span></div>
      <Link href="/arenas">Explore venues</Link>
    </div>
  </aside>;
}
