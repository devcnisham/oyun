import type { Metadata } from 'next';
import { ogBase } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FaqList from '@/components/FaqList';
import JsonLd from '@/components/JsonLd';
import TurfGrid from '@/components/TurfGrid';
import { CURATED_COLLECTIONS, getCuratedCollection } from '@/lib/curated-collections';
import { listPublicTurfs } from '@/lib/queries';
import { breadcrumbSchema, faqSchema, itemListSchema } from '@/lib/schema';
import { SITE_CITY } from '@/lib/site';
import styles from '../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  return CURATED_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  const collection = getCuratedCollection(slug);
  if (!collection) return null;

  const allTurfs = await listPublicTurfs();
  const matchingTurfs = allTurfs.filter(collection.filter).sort((a, b) => b.rating - a.rating);
  const otherCollections = CURATED_COLLECTIONS.filter((c) => c.slug !== slug);

  return { collection, turfs: matchingTurfs, otherCollections };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Not found', robots: { index: false } };

  const { collection } = data;
  return {
    title: `${collection.metaTitle} | OYUN`,
    description: collection.metaDescription,
    alternates: { canonical: `/curated/${slug}` },
    openGraph: ogBase(`/curated/${slug}`),
  };
}

export default async function CuratedCollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { collection, turfs, otherCollections } = data;

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `Turfs in ${SITE_CITY}`, path: '/arenas' },
            { name: collection.title, path: `/curated/${slug}` },
          ]),
          ...(turfs.length > 0 ? [itemListSchema(turfs, collection.title)] : []),
          faqSchema(collection.faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span>{' '}
        <Link href="/arenas">Turfs in {SITE_CITY}</Link> <span aria-hidden>›</span>{' '}
        <span aria-current="page">{collection.badge}</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '32px' }}>{collection.icon}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-700)', background: 'rgba(5, 150, 105, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
          {collection.badge}
        </span>
      </div>

      <h1 className={styles.title}>{collection.title}</h1>
      <p className={styles.lead}>{collection.lead}</p>

      {turfs.length > 0 ? (
        <section aria-labelledby="curated-list">
          <h2 id="curated-list" className={styles.h2}>
            Recommended Venues ({turfs.length})
          </h2>
          <TurfGrid turfs={turfs} />
        </section>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>New Venues Joining Soon</h2>
          <p className={styles.emptyDesc}>
            We are actively verifying new sports arenas in {SITE_CITY} meeting these exact standards.
          </p>
        </div>
      )}

      {collection.editorialTips.length > 0 && (
        <section aria-labelledby="tips-heading">
          <h2 id="tips-heading" className={styles.h2}>Expert Tips for Players</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {collection.editorialTips.map((tip, idx) => (
              <div key={idx} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{tip.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {collection.faqs.length > 0 && (
        <section aria-labelledby="faqs-heading">
          <h2 id="faqs-heading" className={styles.h2}>Frequently Asked Questions</h2>
          <FaqList faqs={collection.faqs} />
        </section>
      )}

      {otherCollections.length > 0 && (
        <section aria-labelledby="other-curated">
          <h2 id="other-curated" className={styles.h2}>Explore More Collections</h2>
          <div className={styles.areas}>
            {otherCollections.map((c) => (
              <Link key={c.slug} href={`/curated/${c.slug}`} className={styles.areaLink}>
                {c.icon} {c.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
