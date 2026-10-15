import Image from 'next/image';
import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash, inr, tableScroll } from '@/components/dash/ui';
import { quickUpdateTurf } from '@/lib/admin-actions';
import { canOptimize } from '@/lib/images';
import { commissionFor } from '@/lib/pricing';
import { bookingRevenue } from '@/lib/reports';
import { getDb } from '@/lib/store';
import { istNow } from '@/lib/time';

export default async function AdminTurfs({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = '', status = '' } = await searchParams;
  const db = await getDb();
  const month = istNow().date.slice(0, 7);
  const search = q.trim().toLowerCase();
  const turfs = db.turfs
    .filter((t) => !status || t.status === status)
    .filter((t) => !search || `${t.name} ${t.area} ${t.location}`.toLowerCase().includes(search));
  const partnerName = (id: string | null) => db.partners.find((p) => p.id === id)?.name ?? '—';

  return (
    <div className={dash.page}>
      <PageHeader title="Turfs" desc={`${db.turfs.length} turfs on the platform. New turfs come from approved listing applications.`} />

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <form className={dash.inline}>
            <input name="q" aria-label="Search turfs by name or area" defaultValue={q} placeholder="Search name or area" className={dash.input} style={{ width: 220 }} />
            <select name="status" defaultValue={status} className={dash.select} style={{ width: 160 }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <button className={`${dash.btn} ${dash.btnSecondary}`}>Filter</button>
          </form>
        </div>
        <div {...tableScroll}>
          <table className={dash.table}>
            <thead>
              <tr>
                <th></th><th>Turf</th><th>Partner</th><th>Status</th><th>Flags</th>
                <th className={dash.num}>Price</th><th className={dash.num}>Commission</th><th className={dash.num}>Revenue (month)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {turfs.map((t) => {
                const revenue = db.bookings.filter((b) => b.turfId === t.id && b.date.startsWith(month)).reduce((s, b) => s + bookingRevenue(b), 0);
                return (
                  <tr key={t.id}>
                    <td><Image src={t.images[0]} alt="" width={64} height={44} className={dash.imageThumb} unoptimized={!canOptimize(t.images[0])} /></td>
                    <td><div className={dash.strong}>{t.name}</div><div className={dash.muted}>{t.area}</div></td>
                    <td>{partnerName(t.partnerId)}</td>
                    <td>
                      <ActionForm action={quickUpdateTurf} inline>
                        <input type="hidden" name="turfId" value={t.id} />
                        <input type="hidden" name="field" value="status" />
                        <select name="value" defaultValue={t.status} className={dash.select} style={{ width: 130, padding: '6px 8px' }}>
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="suspended">Suspended</option>
                          <option value="pending">Pending</option>
                        </select>
                        <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Set</button>
                      </ActionForm>
                    </td>
                    <td>
                      <div className={dash.inline}>
                        <ActionForm action={quickUpdateTurf} inline>
                          <input type="hidden" name="turfId" value={t.id} />
                          <input type="hidden" name="field" value="isVerified" />
                          <button className={`${dash.btn} ${dash.btnSm} ${t.isVerified ? '' : dash.btnSecondary}`}>{t.isVerified ? 'Verified' : 'Verify'}</button>
                        </ActionForm>
                        <ActionForm action={quickUpdateTurf} inline>
                          <input type="hidden" name="turfId" value={t.id} />
                          <input type="hidden" name="field" value="isFeatured" />
                          <button className={`${dash.btn} ${dash.btnSm} ${t.isFeatured ? '' : dash.btnSecondary}`}>{t.isFeatured ? 'Featured' : 'Feature'}</button>
                        </ActionForm>
                      </div>
                    </td>
                    <td className={dash.num}>{inr(t.pricePerHour)}</td>
                    <td className={dash.num}>{commissionFor(db, t)}%{t.commissionPercent === null ? <div className={dash.muted}>default</div> : null}</td>
                    <td className={dash.num}>{inr(revenue)}</td>
                    <td>
                      <div className={dash.inline}>
                        <Link href={`/admin/turfs/${t.id}`} className={`${dash.btn} ${dash.btnSm}`}>Edit</Link>
                        <Link href={`/arenas/${t.id}`} className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>View</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {turfs.length === 0 && <p className={dash.empty}>No turfs match.</p>}
        <p className={dash.muted} style={{ marginTop: 12 }}><Badge status="maintenance" /> turfs stay visible but can&apos;t be booked; <Badge status="suspended" /> turfs are hidden.</p>
      </div>
    </div>
  );
}
