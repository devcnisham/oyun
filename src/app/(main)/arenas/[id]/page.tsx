import { platformOffersFor } from '@/modules/shared/lib/platform-offers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSlots } from '@/modules/shared/lib/pricing';
import { getPublicTurf } from '@/modules/web/database/queries';
import { getDb } from '@/modules/shared/database/store';
import { BOOKING_DAYS, addDays, formatDate, istNow } from '@/modules/shared/lib/time';
import JsonLd from '@/modules/web/frontend/JsonLd';
import { breadcrumbSchema, turfSchema } from '@/modules/web/lib/schema';
import { areaSlug } from '@/modules/web/lib/site';
import { turfReviews } from '@/modules/shared/lib/reviews';
import TurfDetail from '@/modules/web/frontend/main/arenas/id/TurfDetail';
import { primarySport } from '@/modules/web/lib/sports';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Prebuilt on first visit and rebuilt in the background every 30 seconds, so the CDN serves the page.
// The date and referral code in the address bar, and the slots themselves, are read in the browser (BookingFlow),
// so availability on screen is always fetched live.
export const revalidate = 30;

// No pages are built ahead of time; each turf page is built on its first visit, then kept and refreshed
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const turf = await getPublicTurf(id);
  if (!turf) return { title: 'Turf not found', robots: { index: false } };
  const sport = primarySport(turf);
  const place = sport.place === 'court' ? 'Court' : 'Turf';
  const title = `${turf.name}, ${turf.area} | ${sport.label} ${place} from ₹${turf.pricePerHour}/hr`;
  const description = `Book ${turf.name} in ${turf.area}, ${turf.city}: ${turf.sports.join(', ')}, ${turf.size}, ${turf.surface.toLowerCase()}, open ${turf.openTime}–${turf.closeTime}. ${turf.amenities.slice(0, 3).join(', ')}. See live slots and book online.`.slice(0, 300);
  const image = turf.images[0];
  return {
    title,
    description,
    alternates: { canonical: `/arenas/${turf.id}` },
    openGraph: { type: 'website', url: `/arenas/${turf.id}`, title, description, images: image ? [{ url: image, alt: `${turf.name}, ${sport.label.toLowerCase()} ${sport.place} in ${turf.area}` }] : undefined },
  };
}

export default async function TurfDetailPage({ params }: PageProps) {
  const { id } = await params;
  const turf = await getPublicTurf(id);
  if (!turf) notFound();

  const db = await getDb();
  const now = istNow();
  const dates = Array.from({ length: BOOKING_DAYS }, (_, i) => {
    const date = addDays(now.date, i);
    const d = new Date(`${date}T00:00:00+05:30`);
    return {
      date,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(date),
      day: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      num: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' }),
    };
  });
  const initialDate = now.date;

  return (
    <>
    <JsonLd
      data={[
        turfSchema(turf),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Turfs in Mangalore', path: '/arenas' },
          { name: turf.area, path: `/turfs/${areaSlug(turf.area)}` },
          { name: turf.name, path: `/arenas/${turf.id}` },
        ]),
      ]}
    />
    <TurfDetail
      turf={turf}
      dates={dates}
      initialDate={initialDate}
      initialSlots={getSlots(db, turf, initialDate, now)}
      offers={[...db.offers.filter((o) => o.turfId === turf.id && o.active), ...platformOffersFor(db.settings, turf.id, true).filter((o) => o.active)]}
      bookable={turf.status === 'active'}
      rewards={{
        cashbackEnabled: db.settings.cashbackEnabled,
        cashbackPercent: db.settings.cashbackPercent,
        cashbackMax: db.settings.cashbackMax,
        referralEnabled: db.settings.referralEnabled,
        refereeReward: db.settings.refereeReward,
      }}
      reviews={turfReviews(db, turf.id, { limit: 10 })}
      addOns={db.addOns.filter((a) => a.turfId === turf.id && a.active)}
      initialReferral=""
    />
    </>
  );
}
