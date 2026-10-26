import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { GUIDES } from '@/modules/web/lib/guides-content';
import { ogBase } from '@/modules/web/lib/seo';
import AdPlacement from '@/modules/web/frontend/main/_booking/AdPlacement';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'OYUN Blog | Sports Guides & Playing Tips in Mangalore',
  description: 'Read OYUN sports guides, beginner rules and booking tips for football, cricket, badminton, pickleball and padel in Mangalore.',
  alternates: { canonical: '/blog' },
  openGraph: ogBase('/blog'),
};

export default function BlogPage() {
  const [featured, ...rest] = GUIDES;
  return <div className={styles.page}>
    <header className={styles.header}><span>OYUN JOURNAL</span><h1>Off the turf.</h1><p>Sports guides, rules and ideas for your next game.</p></header>
    {featured && <article className={styles.featured}>
      <Link className={styles.featureImage} href={`/guides/${featured.slug}`} tabIndex={-1} aria-hidden="true"><Image src={featured.coverImage} alt="" fill sizes="(max-width: 760px) 100vw, 60vw" priority /></Link>
      <div className={styles.featureBody}><span className={styles.meta}>Featured · {featured.category}</span><h2><Link href={`/guides/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.excerpt}</p><span className={styles.meta}>{featured.readTime}</span><Link className={styles.read} href={`/guides/${featured.slug}`}>Read story</Link></div>
    </article>}
    <AdPlacement id="blog-leaderboard" />
    <section aria-labelledby="stories-title" className={styles.stories}><h2 id="stories-title">More from OYUN</h2>
      <div className={styles.grid}>{rest.map(g => <article className={styles.card} key={g.slug}>
        <div className={styles.cardImage}><Image src={g.coverImage} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" /></div>
        <div className={styles.cardBody}><span className={styles.meta}>{g.category} · {g.readTime}</span><h3><Link href={`/guides/${g.slug}`}>{g.title}</Link></h3><p>{g.excerpt}</p><Link className={styles.read} href={`/guides/${g.slug}`}>Read story</Link></div>
      </article>)}<AdPlacement id="blog-inline-card" format="card" /></div>
      {!featured && <p>No stories in this category yet. <Link href="/blog">Browse all stories</Link>.</p>}
    </section>
  </div>;
}
