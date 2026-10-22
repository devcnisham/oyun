import type { Metadata } from 'next';
import { ogBase } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FaqList from '@/components/FaqList';
import JsonLd from '@/components/JsonLd';
import { GUIDES, getGuide } from '@/lib/guides-content';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { SITE_CITY } from '@/lib/site';
import { sportFromSlug } from '@/lib/sports';
import styles from '../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function load(slug: string) {
  const guide = getGuide(slug);
  if (!guide) return null;
  const others = GUIDES.filter((g) => g.slug !== slug);
  const relatedSport = sportFromSlug(guide.relatedSportSlug);
  return { guide, others, relatedSport };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Guide not found', robots: { index: false } };

  const { guide } = data;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      ...ogBase(`/guides/${slug}`),
      type: 'article',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [{ url: guide.coverImage, alt: guide.metaTitle }],
      publishedTime: guide.publishedAt,
    },
  };
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { guide, others, relatedSport } = data;

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: guide.title, path: `/guides/${slug}` },
          ]),
          articleSchema({
            title: guide.title,
            description: guide.metaDescription,
            path: `/guides/${slug}`,
            image: guide.coverImage,
            datePublished: guide.publishedAt,
          }),
          faqSchema(guide.faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span>{' '}
        <Link href="/guides">Guides</Link> <span aria-hidden>›</span>{' '}
        <span aria-current="page">{guide.category}</span>
      </nav>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-700)', background: 'rgba(5, 150, 105, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
          {guide.category}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{guide.readTime}</span>
      </div>

      <h1 className={styles.title} style={{ maxWidth: '840px' }}>
        {guide.title}
      </h1>

      <p className={styles.lead} style={{ maxWidth: '820px' }}>
        {guide.excerpt}
      </p>

      <div style={{ borderRadius: '16px', overflow: 'hidden', maxHeight: '420px', margin: '8px 0 16px', border: '1px solid var(--border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={guide.coverImage}
          alt={guide.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <article style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {guide.sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {section.heading}
            </h2>
            {section.paragraphs.map((p, pIdx) => (
              <p key={pIdx} style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
                {p}
              </p>
            ))}
            {section.keyTakeaway && (
              <div style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '4px 8px 8px 4px', fontSize: '14px', color: '#065f46', fontWeight: 500, lineHeight: 1.6 }}>
                💡 <strong>Key Takeaway:</strong> {section.keyTakeaway}
              </div>
            )}
          </div>
        ))}
      </article>

      {relatedSport && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', maxWidth: '820px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>Ready to play {relatedSport.label}?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Check verified venue availability and book hourly slots online across {SITE_CITY}.
            </p>
          </div>
          <Link
            href={`/sports/${guide.relatedSportSlug}`}
            className={styles.areaLink}
            style={{ background: 'var(--primary-700)', color: '#fff', borderColor: 'var(--primary-700)', padding: '10px 20px' }}
          >
            Browse {relatedSport.label} {relatedSport.place}s →
          </Link>
        </div>
      )}

      {guide.faqs.length > 0 && (
        <section aria-labelledby="faqs-heading" style={{ maxWidth: '820px', marginTop: '12px' }}>
          <h2 id="faqs-heading" className={styles.h2}>
            Frequently Asked Questions
          </h2>
          <FaqList faqs={guide.faqs} />
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="other-guides" style={{ marginTop: '20px' }}>
          <h2 id="other-guides" className={styles.h2}>More Sports Guides in {SITE_CITY}</h2>
          <div className={styles.areas}>
            {others.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className={styles.areaLink}>
                📖 {g.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
