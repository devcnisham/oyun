import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/dash/ActionForm';
import TurfProfileFields from '@/components/dash/TurfProfileFields';
import { PageHeader, dash } from '@/components/dash/ui';
import { updateTurfAdmin } from '@/lib/admin-actions';
import { getDb } from '@/lib/store';

export default async function AdminTurfEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const turf = db.turfs.find((t) => t.id === id);
  if (!turf) notFound();

  return (
    <div className={dash.page}>
      <PageHeader title={`Edit ${turf.name}`} desc={`ID: ${turf.id}`}>
        <Link href="/admin/turfs" className={`${dash.btn} ${dash.btnSecondary}`}>← All turfs</Link>
        <Link href={`/arenas/${turf.id}`} target="_blank" className={`${dash.btn} ${dash.btnSecondary}`}>View public page</Link>
      </PageHeader>

      <div className={dash.card}>
        <ActionForm action={updateTurfAdmin}>
          <input type="hidden" name="turfId" value={turf.id} />
          <h2 className={dash.cardTitle}>Platform controls</h2>
          <div className={dash.formGrid}>
            <label className={dash.field}>
              <span className={dash.label}>Status</span>
              <select name="status" defaultValue={turf.status} className={dash.select}>
                <option value="active">Active — bookable</option>
                <option value="maintenance">Maintenance — visible, not bookable</option>
                <option value="suspended">Suspended — hidden</option>
                <option value="pending">Pending — hidden</option>
              </select>
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Partner (owner)</span>
              <select name="partnerId" defaultValue={turf.partnerId ?? ''} className={dash.select}>
                <option value="">No partner</option>
                {db.partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Commission % (blank = platform default {db.settings.commissionPercent}%)</span>
              <input name="commissionPercent" type="number" min={0} max={50} defaultValue={turf.commissionPercent ?? ''} className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Rating (0–5)</span>
              <input name="rating" type="number" min={0} max={5} step={0.1} defaultValue={turf.rating} className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Map latitude (blank = look up from address)</span>
              <input name="lat" type="number" min={-90} max={90} step="any" defaultValue={turf.lat ?? ''} className={dash.input} placeholder="12.9141" />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Map longitude</span>
              <input name="lng" type="number" min={-180} max={180} step="any" defaultValue={turf.lng ?? ''} className={dash.input} placeholder="74.8560" />
            </label>
          </div>
          <div className={dash.inline}>
            <label className={dash.check}><input type="checkbox" name="isVerified" defaultChecked={turf.isVerified} /> Verified</label>
            <label className={dash.check}><input type="checkbox" name="isFeatured" defaultChecked={turf.isFeatured} /> Featured on homepage</label>
            <label className={dash.check}><input type="checkbox" name="halfPitch" defaultChecked={turf.halfPitch ?? false} /> Can be booked as two halves</label>
            <label className={dash.field} style={{ maxWidth: 220 }}>
              <span className={dash.label}>Half pitch price (% of full)</span>
              <input name="halfPricePercent" type="number" min={30} max={80} defaultValue={turf.halfPricePercent ?? 50} className={dash.input} />
            </label>
            <label className={dash.field} style={{ maxWidth: 220 }}>
              <span className={dash.label}>Half A name (e.g. 5-a-side (Right))</span>
              <input name="halfNameA" maxLength={60} defaultValue={turf.halfNames?.A ?? ''} className={dash.input} />
            </label>
            <label className={dash.field} style={{ maxWidth: 220 }}>
              <span className={dash.label}>Half B name (e.g. 5-a-side (Left))</span>
              <input name="halfNameB" maxLength={60} defaultValue={turf.halfNames?.B ?? ''} className={dash.input} />
            </label>
          </div>

          <h2 className={dash.cardTitle} style={{ marginTop: 8 }}>Turf details</h2>
          <TurfProfileFields turf={turf} phoneOptional />
          <div className={dash.actions}><button className={dash.btn}>Save turf</button></div>
        </ActionForm>
      </div>
    </div>
  );
}
