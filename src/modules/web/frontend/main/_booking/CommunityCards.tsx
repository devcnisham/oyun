import Image from 'next/image';
import Link from 'next/link';
import styles from './CommunityCards.module.css';

const examples = [
  { kind: 'Tournament', title: 'Five-a-side football cup', image: 'https://images.unsplash.com/photo-1771077508493-c79cd2634c3d?w=1000&q=85&auto=format&fit=crop', detail: 'Team competition · Mangalore', href: '/tournaments' },
  { kind: 'Community event', title: 'Pickleball social', image: 'https://images.unsplash.com/photo-1761644695629-7227bba59fc4?w=1000&q=85&auto=format&fit=crop', detail: 'Social play · Mangalore', href: '/events' },
  { kind: 'Tournament', title: 'Box cricket challenge', image: 'https://images.unsplash.com/photo-1595210382051-4d2c31fcc2f4?w=1000&q=85&auto=format&fit=crop', detail: 'Team competition · Mangalore', href: '/tournaments' },
];
export default function CommunityCards() {
  return <section className={styles.section} aria-labelledby="community-title">
    <div className={styles.heading}><h2 id="community-title">Tournaments &amp; events</h2><Link href="/events">View all events</Link></div>
    <div className={styles.grid}>{examples.map(item => <article className={styles.card} key={item.title}>
      <div className={styles.image}><Image src={item.image} alt="" fill sizes="(max-width: 600px) 100vw, 33vw" /><span>Demo event</span></div>
      <div className={styles.body}><span className={styles.kind}>{item.kind}</span><h3>{item.title}</h3><p>{item.detail}</p><small>Sample listing · Dates and registration aren’t live</small><Link href={item.href}>{item.kind === 'Tournament' ? 'Browse tournaments' : 'Browse events'}</Link></div>
    </article>)}</div>
  </section>;
}
