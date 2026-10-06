import { notFound } from 'next/navigation';
import { getSlots } from '@/lib/pricing';
import { getPublicTurf } from '@/lib/queries';
import { getDb } from '@/lib/store';
import { addDays, formatDate, isValidDate, istNow } from '@/lib/time';
import { deviceHolder } from '@/lib/device-holder';
import TurfDetail from './TurfDetail';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; ref?: string }>;
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
    <TurfDetail
      turf={turf}
      dates={dates}
      initialDate={initialDate}
      initialSlots={getSlots(db, turf, initialDate, now, await deviceHolder(false))}
      addOns={db.addOns.filter((a) => a.turfId === turf.id && a.active)}
      offers={db.offers.filter((o) => o.turfId === turf.id && o.active)}
      advancePercent={db.settings.advancePercent}
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
  );
}
