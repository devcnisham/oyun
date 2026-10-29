import { OyunLoader } from './OyunMotion';
import styles from '@/modules/shared/frontend/PageSkeleton.module.css';

type Variant = 'home' | 'cards' | 'rows' | 'venue' | 'ticket' | 'auth' | 'content';
const Block = ({ className = '' }: { className?: string }) => <div className={`${styles.block} ${className}`} />;

function Card() {
  return <div className={styles.card} data-skeleton-card><Block className={styles.photo} /><div className={styles.cardBody}><Block className={styles.cardTitle} /><Block className={styles.short} /><div className={styles.cardFoot}><Block className={styles.price} /><Block className={styles.button} /></div></div></div>;
}

export default function PageSkeleton({ variant = 'rows' }: { variant?: Variant }) {
  return (
    <div className={`${styles.wrap} ${variant === 'auth' ? styles.auth : ''}`} aria-busy="true">
      <div className={styles.center}><OyunLoader label="Loading…" /></div>
      <div aria-hidden="true" className={styles.content}>
        <Block className={variant === 'home' ? styles.heroTitle : styles.title} />
        <Block className={styles.lineShort} />
        {(variant === 'home' || variant === 'cards') && <><Block className={styles.search} /><div className={styles.grid}>{Array.from({ length: variant === 'home' ? 4 : 8 }, (_, i) => <Card key={i} />)}</div></>}
        {variant === 'venue' && <><Block className={styles.cover} /><div className={styles.detail}><div><Block className={styles.panel} /><Block className={styles.panel} /></div><Block className={styles.booking} /></div></>}
        {variant === 'ticket' && <div className={styles.ticket}><Block className={styles.qr} /><div>{Array.from({ length: 5 }, (_, i) => <Block key={i} className={styles.row} />)}<Block className={styles.button} /></div></div>}
        {variant === 'rows' && <><div className={styles.stats}>{Array.from({ length: 4 }, (_, i) => <Block key={i} className={styles.stat} />)}</div><div className={styles.table}>{Array.from({ length: 6 }, (_, i) => <Block key={i} className={styles.row} />)}</div></>}
        {(variant === 'content' || variant === 'auth') && <div className={styles.form}>{Array.from({ length: 4 }, (_, i) => <Block key={i} className={styles.field} />)}<Block className={styles.button} /></div>}
      </div>
    </div>
  );
}
