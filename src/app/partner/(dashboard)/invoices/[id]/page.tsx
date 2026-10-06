import Link from 'next/link';
import { notFound } from 'next/navigation';
import Invoice from '@/components/Invoice';
import PrintButton from '@/components/PrintButton';
import { dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { getDb } from '@/lib/store';

export default async function PartnerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePartner('bookings');
  const { id } = await params;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking || !ctx.turfs.some((t) => t.id === booking.turfId)) notFound();
  const turf = db.turfs.find((t) => t.id === booking.turfId)!;

  return (
    <div className={dash.page}>
      <div className={`${dash.actions} noPrint`} style={{ justifyContent: 'space-between' }}>
        <Link href="/partner/bookings" className={`${dash.btn} ${dash.btnSecondary}`}>← Bookings</Link>
        <PrintButton className={dash.btn} />
      </div>
      <Invoice booking={booking} turf={turf} partner={ctx.partner} settings={db.settings} />
    </div>
  );
}
