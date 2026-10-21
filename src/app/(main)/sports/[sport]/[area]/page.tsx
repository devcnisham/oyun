import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { rupees } from '@/lib/format';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import { breadcrumbSchema, faqSchema, itemListSchema } from '@/lib/schema';
import { SITE_CITY, areaSlug } from '@/lib/site';
import { getSportFaqs } from '@/lib/sport-faqs';
import { SPORTS, sportFromSlug, sportSlug } from '@/lib/sports';
import { ChipLinks, FaqSection, TurfGridSection } from '../../../turfs/[area]/SeoSections';
import styles from '../../../turfs/[area]/page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  const turfs = await listPublicTurfs();
  const areas = listAreas(turfs);
  const params: { sport: string; area: string }[] = [];

  for (const s of SPORTS) {
    const sSlug = sportSlug(s.value);
    for (const a of areas) {
      const aSlug = areaSlug(a);
      // Generate for all sport+area combinations where turfs exist
      if (turfs.some((t) => areaSlug(t.area) === aSlug && t.sports.some((x) => sportSlug(x) === sSlug))) {
        params.push({ sport: sSlug, area: aSlug });
      }
    }
  }

  return params;
}

interface Props {
  params: Promise<{ sport: string; area: string }>;
}

async function load(sportParam: string, areaParam: string) {
  const sport = sportFromSlug(sportParam);
  if (!sport) return null;

  const all = await listPublicTurfs();
  const allAreas = listAreas(all);
  const area = allAreas.find((a) => areaSlug(a) === areaParam);
  if (!area) return null;

  // Exact matching turfs (matching sport AND area)
  const matchingTurfs = all
    .filter((t) => areaSlug(t.area) === areaParam && t.sports.some((x) => sportSlug(x) === sportParam))
    .sort((a, b) => b.rating - a.rating);

  // Other areas offering this sport
  const otherAreasWithSport = allAreas.filter(
    (a) => a !== area && all.some((t) => t.area === a && t.sports.some((x) => sportSlug(x) === sportParam))
  );

  // Other sports available in this area
  const otherSportsInArea = SPORTS.filter(
    (s) => s.value !== sport.value && all.some((t) => t.area === area && t.sports.some((x) => sportSlug(x) === sportSlug(s.value)))
  );

  const faqs = getSportFaqs(sportParam);

  return {
    sport,
    area,
    turfs: matchingTurfs,
    otherAreasWithSport,
    otherSportsInArea,
    faqs,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport: sportParam, area: areaParam } = await params;
  const data = await load(sportParam, areaParam);
  if (!data) return { title: 'Not found', robots: { index: false } };

  const { sport, area, turfs } = data;
  if (turfs.length === 0) {
    return {
      title: `${sport.label} in ${area}, ${SITE_CITY} | Court Availability & Guide`,
      description: `Explore ${sport.label.toLowerCase()} courts and turfs in ${area}, ${SITE_CITY}. Check nearby venues, prices, and booking options on OYUN.`,
      alternates: { canonical: `/sports/${sportParam}/${areaParam}` },
      openGraph: { url: `/sports/${sportParam}/${areaParam}` },
    };
  }

  const from = Math.min(...turfs.map((t) => t.pricePerHour));
  return {
    title: `Best ${sport.label} in ${area}, ${SITE_CITY} | Book from ₹${from}/hr`,
    description: `Book verified ${sport.label.toLowerCase()} ${sport.place}s in ${area}, ${SITE_CITY}. ${turfs.length} venue${turfs.length === 1 ? '' : 's'} available with live slot booking from ₹${from}/hr on OYUN.`,
    alternates: { canonical: `/sports/${sportParam}/${areaParam}` },
    openGraph: { url: `/sports/${sportParam}/${areaParam}` },
  };
}

export default async function SportAreaPage({ params }: Props) {
  const { sport: sportParam, area: areaParam } = await params;
  const data = await load(sportParam, areaParam);
  if (!data) notFound();

  const { sport, area, turfs, otherAreasWithSport, otherSportsInArea, faqs } = data;
  const from = turfs.length > 0 ? Math.min(...turfs.map((t) => t.pricePerHour)) : 0;
  const openToday = turfs.reduce((n, t) => n + t.availableToday, 0);

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `Turfs in ${SITE_CITY}`, path: '/arenas' },
            { name: sport.label, path: `/sports/${sportParam}` },
            { name: `${sport.label} in ${area}`, path: `/sports/${sportParam}/${areaParam}` },
          ]),
          ...(turfs.length > 0 ? [itemListSchema(turfs, `${sport.label} in ${area}, ${SITE_CITY}`)] : []),
          faqSchema(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/">Home</Link> <span aria-hidden>›</span>{' '}
        <Link href="/arenas">Turfs in {SITE_CITY}</Link> <span aria-hidden>›</span>{' '}
        <Link href={`/sports/${sportParam}`}>{sport.label}</Link> <span aria-hidden>›</span>{' '}
        <span aria-current="page">{area}</span>
      </nav>

      <h1 className={styles.title}>
        {sport.label} {sport.place}s in {area}, {SITE_CITY}
      </h1>

      <p className={styles.lead}>
        {turfs.length > 0 ? (
          <>
            {turfs.length} verified {sport.label.toLowerCase()} {sport.place}{turfs.length === 1 ? '' : 's'} in {area}, {SITE_CITY} from {rupees(from)}/hr
            {openToday > 0 ? ` with ${openToday} open slot${openToday === 1 ? '' : 's'} available today` : ''}.
          </>
        ) : (
          <>
            Looking to play {sport.label.toLowerCase()} near {area}? Browse nearby alternatives or explore other sports available right in {area}.
          </>
        )}
      </p>

      {turfs.length > 0 ? (
        <TurfGridSection id="venues-heading" title={`${sport.label} venues in ${area}`} turfs={turfs} />
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No {sport.label} venues directly in {area} yet</h2>
          <p className={styles.emptyDesc}>
            Check out other top areas across {SITE_CITY} offering {sport.label.toLowerCase()} courts and turfs below.
          </p>
        </div>
      )}

      <ChipLinks
        id="other-areas-heading"
        title={`${sport.label} in nearby areas`}
        links={otherAreasWithSport.map((a) => ({
          key: a,
          href: `/sports/${sportParam}/${areaSlug(a)}`,
          label: `${sport.label} in ${a}`,
        }))}
      />

      <ChipLinks
        id="other-sports-heading"
        title={`Other sports in ${area}`}
        links={otherSportsInArea.map((s) => ({
          key: s.value,
          href: `/sports/${sportSlug(s.value)}/${areaParam}`,
          label: `${s.label} in ${area}`,
        }))}
      />

      <FaqSection
        id="faqs-heading"
        title={`Frequently asked questions about ${sport.label.toLowerCase()} in ${SITE_CITY}`}
        faqs={faqs}
      />
    </div>
  );
}
