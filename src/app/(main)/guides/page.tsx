import type { Metadata } from 'next';
import { ogBase } from '@/lib/seo';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { GUIDES } from '@/lib/guides-content';
import { breadcrumbSchema } from '@/lib/schema';
import { SITE_CITY } from '@/lib/site';
import styles from '../turfs/[area]/page.module.css';

export const metadata: Metadata = {
  title: `Sports Guides, Rules & Venue Tips in ${SITE_CITY} | OYUN`,
  description: `Essential playing guides for football, box cricket, badminton, pickleball, and padel in ${SITE_CITY}. Discover rules, gear requirements, pricing benchmarks, and court recommendations.`,
  alternates: { canonical: '/guides' },
  openGraph: ogBase('/guides'),
};

export default function GuidesIndexPage() {
  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Guides', path: '/guides' },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span> <span aria-current="page">Sports Guides</span>
      </nav>

      <h1 className={styles.title}>Mangalore Sports Guides & Rules</h1>
      <p className={styles.lead}>
        Everything you need to know about playing recreational and competitive sports in Kudla. Venue recommendations, footwear rules, tournament formats, and court booking tips.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '12px' }}>
        {GUIDES.map((g) => (
          <article
            key={g.slug}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.coverImage}
                alt={g.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                {g.category}
              </span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{g.readTime}</div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.35 }}>
                <Link href={`/guides/${g.slug}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                  {g.title}
                </Link>
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{g.excerpt}</p>
              <Link
                href={`/guides/${g.slug}`}
                style={{
                  color: 'var(--primary-700)',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                }}
              >
                Read full guide →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
