import NavIcon from '@/modules/shared/frontend/dash/NavIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Invoice from '@/modules/shared/frontend/Invoice';
import PrintButton from '@/modules/shared/frontend/PrintButton';
import { dash } from '@/modules/shared/frontend/dash/ui';
import { requirePartner } from '@/modules/shared/backend/partner-auth';
import { getDb } from '@/modules/shared/database/store';

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
        <Link href="/partner/bookings" className={`${dash.btn} ${dash.btnSecondary}`}><NavIcon name="arrowLeft" size={16} /> Bookings</Link>
        <PrintButton className={dash.btn} />
      </div>
      <Invoice booking={booking} turf={turf} partner={ctx.partner} settings={db.settings} />
    </div>
  );
}
