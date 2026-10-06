import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSlots } from '@/lib/pricing';
import { getPublicTurf } from '@/lib/queries';
import { getDb } from '@/lib/store';
import { addDays, formatDate, isValidDate, istNow } from '@/lib/time';
import { deviceHolder } from '@/lib/device-holder';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, turfSchema } from '@/lib/schema';
import { areaSlug } from '@/lib/site';
import TurfDetail from './TurfDetail';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; ref?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const turf = await getPublicTurf(id);
  if (!turf) return { title: 'Turf not found', robots: { index: false } };
  const title = `${turf.name}, ${turf.area} | ${turf.size} Football Turf from ₹${turf.pricePerHour}/hr`;
  const description = `Book ${turf.name} in ${turf.area}, ${turf.city}: ${turf.size} ${turf.surface.toLowerCase()} turf, open ${turf.openTime}–${turf.closeTime}. ${turf.amenities.slice(0, 3).join(', ')}. See live slots and book online.`.slice(0, 300);
  const image = turf.images[0];
  return {
    title,
    description,
    alternates: { canonical: `/arenas/${turf.id}` },
    openGraph: { type: 'website', url: `/arenas/${turf.id}`, title, description, images: image ? [{ url: image, alt: `${turf.name} football turf in ${turf.area}` }] : undefined },
  };
}

export default async function TurfDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { date: requestedDate, ref } = await searchParams;
  const turf = await getPublicTurf(id);
  if (!turf) notFound();

  const db = await getDb();
  const now = istNow();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(now.date, i);
    const d = new Date(`${date}T00:00:00+05:30`);
    return {
      date,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(date),
      day: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      num: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' }),
    };
  });
  const initialDate = requestedDate && isValidDate(requestedDate) && dates.some((d) => d.date === requestedDate) ? requestedDate : now.date;

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
      initialSlots={getSlots(db, turf, initialDate, now, await deviceHolder(false))}
      offers={db.offers.filter((o) => o.turfId === turf.id && o.active)}
      bookable={turf.status === 'active'}
      rewards={{
        cashbackEnabled: db.settings.cashbackEnabled,
        cashbackPercent: db.settings.cashbackPercent,
        cashbackMax: db.settings.cashbackMax,
        referralEnabled: db.settings.referralEnabled,
        refereeReward: db.settings.refereeReward,
      }}
      initialReferral={(ref ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)}
    />
    </>
  );
}
