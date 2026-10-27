import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import CommunityCards from '@/modules/web/frontend/main/_booking/CommunityCards';
import AdPlacement from '@/modules/web/frontend/main/_booking/AdPlacement';
import { GUIDES } from '@/modules/web/lib/guides-content';
import { ogBase } from '@/modules/web/lib/seo';
import styles from '../blog/page.module.css';

export const metadata: Metadata = {
  title: 'News & Events | OYUN Mangalore',
  description: 'Explore OYUN sports stories, tournaments and community events in Mangalore. Demo event previews are clearly marked.',
  alternates: { canonical: '/news' },
  openGraph: ogBase('/news'),
};
export default function NewsPage() {
  return <div className={styles.page}>
    <header className={styles.header}><span>AROUND THE GAME</span><h1>News &amp; events.</h1></header>
    <CommunityCards />
    <AdPlacement id="news-leaderboard" />
    <section className={styles.stories} aria-labelledby="news-stories"><h2 id="news-stories">From the blog</h2><div className={styles.grid}>{GUIDES.slice(4, 7).map(g => <article className={styles.card} key={g.slug}><div className={styles.cardImage}><Image src={g.coverImage} alt="" fill sizes="(max-width: 600px) 100vw, 33vw" /></div><div className={styles.cardBody}><span className={styles.meta}>{g.category} · {g.readTime}</span><h3><Link href={`/guides/${g.slug}`}>{g.title}</Link></h3><Link href={`/guides/${g.slug}`} className={styles.read}>Read story</Link></div></article>)}</div><Link className={styles.read} href="/blog">Browse the blog</Link></section>
  </div>;
}
