import Link from 'next/link';
import { notFound } from 'next/navigation';
import Invoice from '@/components/Invoice';
import PrintButton from '@/components/PrintButton';
import { getDb } from '@/lib/store';

export default async function BookingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id);
  const turf = booking && db.turfs.find((t) => t.id === booking.turfId);
  if (!booking || !turf) notFound();
  const partner = db.partners.find((p) => p.id === turf.partnerId) ?? null;

  return (
    <div className="container" style={{ padding: '32px 16px 64px' }}>
      <div className="noPrint" style={{ display: 'flex', gap: 8, justifyContent: 'space-between', maxWidth: 760, margin: '0 auto 16px' }}>
        <Link href={`/bookings/${booking.id}`} className="btn btn--secondary btn--sm">← Back to booking</Link>
        <PrintButton className="btn btn--primary btn--sm" />
      </div>
      <Invoice booking={booking} turf={turf} partner={partner} settings={db.settings} />
    </div>
  );
}
