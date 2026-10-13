import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { mapTurfToVenue } from '@/lib/data-mapping';
import { updateCourtSetup } from '@/lib/partner-actions';

export default async function CourtsPage() {
  const ctx = await requirePartner('turf');
  const turf = ctx.turf;
  const mapped = mapTurfToVenue(turf);

  return (
    <div className={dash.page}>
      <PageHeader
        title="Courts & Pitches"
        desc="Physical court units, pitch partitions, and bookable configurations."
      >
        <Link href="/partner/slots" className={`${dash.btn} ${dash.btnSecondary}`}>
          Manage Slots
        </Link>
        <Link href={`/arenas/${turf.id}`} target="_blank" className={`${dash.btn} ${dash.btnSecondary}`}>
          View public page
        </Link>
      </PageHeader>

      <div className={dash.grid2}>
        {/* Physical Resources */}
        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Physical Resources ({mapped.resources.length})</h2>
          <p className={dash.desc}>
            Individual physical units that can only be used by one group at a time. The database enforces zero overlap on these resources.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {mapped.resources.map((res) => (
              <div
                key={res.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--dash-border, #e5e7eb)',
                  background: 'var(--dash-subtle, #f9fafb)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{res.name}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>ID: {res.id}</div>
                </div>
                <Badge status={res.active ? 'active' : 'suspended'} label={res.active ? 'Active' : 'Offline'} />
              </div>
            ))}
          </div>
        </div>

        {/* Bookable Items */}
        <div className={dash.card}>
          <h2 className={dash.cardTitle}>Bookables ({mapped.bookables.length})</h2>
          <p className={dash.desc}>
            What players select during checkout, along with sport, slot duration, and occupied physical units.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {mapped.bookables.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--dash-border, #e5e7eb)',
                  background: 'var(--dash-subtle, #f9fafb)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</div>
                  <div style={{ fontWeight: 700, color: '#d31027' }}>₹{b.basePrice}/slot</div>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  Sport: <strong>{b.sport}</strong> · Length: <strong>{b.slotMinutes} mins</strong>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  Occupies: {b.resourceNames.join(' + ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pitch Partition Configuration */}
      <div className={dash.card} style={{ marginTop: 24 }}>
        <h2 className={dash.cardTitle}>Pitch Partition & Multi-court Settings</h2>
        <p className={dash.desc}>
          Configure whether this pitch can be booked as separate half-pitches simultaneously.
        </p>

        <ActionForm action={updateCourtSetup}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, maxWidth: 500 }}>
            <label className={dash.check}>
              <input type="checkbox" name="halfPitch" defaultChecked={turf.halfPitch ?? false} />
              Enable half-pitch partition (Half A and Half B bookable separately)
            </label>

            <div>
              <label className={dash.label}>Half Pitch Price Percentage</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  name="halfPricePercent"
                  defaultValue={turf.halfPricePercent ?? 50}
                  min={30}
                  max={80}
                  className={dash.input}
                  style={{ width: 120 }}
                />
                <span style={{ fontSize: 14, color: '#666' }}>% of full pitch hourly rate</span>
              </div>
              <p className={dash.hint}>Between 30% and 80%. Default is 50%.</p>
            </div>

            <div className={dash.actions}>
              <button type="submit" className={dash.btn}>
                Save court layout
              </button>
            </div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
