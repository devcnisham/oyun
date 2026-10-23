import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { PageHeader, dash } from '@/modules/shared/frontend/dash/ui';
import { addBookableOffering, addCourtResource, deleteBookableOffering, deleteCourtResource } from '@/modules/partner/backend/partner-actions';
import { requirePartner } from '@/modules/shared/backend/partner-auth';
import { mapTurfToResourcesAndBookables } from '@/modules/shared/lib/venue-mapping';

export default async function PartnerCourtsPage() {
  const ctx = await requirePartner('turf');
  const turf = ctx.turf;
  const { resources, bookables } = mapTurfToResourcesAndBookables(turf);

  return (
    <div className={dash.page}>
      <PageHeader
        title="Courts & Pitches"
        desc={`Configure physical courts, pitch halves, and bookable offerings for ${turf.name}. Multi-court and split-pitch inventory allow multiple simultaneous games without double bookings.`}
      />

      <div className={dash.card} style={{ marginBottom: 24 }}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Physical Courts & Resources ({resources.length})</h2>
        </div>
        <p className={dash.muted} style={{ marginBottom: 16 }}>
          Each resource represents a physical playing surface that can only accommodate one group at a time.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
          {resources.map((res) => (
            <div
              key={res.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--color-surface, #1e293b)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text, #f8fafc)' }}>{res.name}</div>
                <div className={dash.muted} style={{ fontSize: '0.8rem' }}>ID: {res.id}</div>
              </div>
              {resources.length > 1 && (
                <ActionForm action={deleteCourtResource}>
                  <input type="hidden" name="resourceId" value={res.id} />
                  <button type="submit" className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>
                    Delete
                  </button>
                </ActionForm>
              )}
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text, #f8fafc)' }}>Add New Court / Resource</h3>
        <ActionForm action={addCourtResource}>
          <div className={dash.inline} style={{ gap: 8 }}>
            <input
              name="name"
              placeholder="e.g. Court 2 or Pitch Half C"
              required
              maxLength={60}
              className={dash.input}
              style={{ maxWidth: 300 }}
            />
            <button type="submit" className={`${dash.btn} ${dash.btnSm}`}>
              + Add Court
            </button>
          </div>
        </ActionForm>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>Bookable Offerings ({bookables.length})</h2>
        </div>
        <p className={dash.muted} style={{ marginBottom: 16 }}>
          Bookables are what players select when reserving a slot. A bookable occupies one or more physical resources (e.g. a Full Pitch occupies both Half A and Half B).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {bookables.map((bk) => (
            <div
              key={bk.id}
              style={{
                padding: 16,
                background: 'var(--color-surface, #1e293b)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-text, #f8fafc)' }}>{bk.name}</div>
                  <span className={dash.badge} style={{ textTransform: 'capitalize' }}>{bk.sport}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: 4 }}>
                  Duration: {bk.slotMinutes} mins · Base: ₹{bk.basePrice}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #94a3b8)', marginBottom: 12 }}>
                  Occupies: {bk.resourceIds.map((rid) => resources.find((r) => r.id === rid)?.name ?? rid).join(' + ')}
                </div>
              </div>
              {bookables.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <ActionForm action={deleteBookableOffering}>
                    <input type="hidden" name="bookableId" value={bk.id} />
                    <button type="submit" className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>
                      Delete Offering
                    </button>
                  </ActionForm>
                </div>
              )}
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--color-text, #f8fafc)' }}>Add Bookable Offering</h3>
        <ActionForm action={addBookableOffering}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <label className={dash.field}>
              <span className={dash.label}>Offering Name</span>
              <input name="name" placeholder="e.g. 5-a-side Full Pitch" required maxLength={80} className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Sport</span>
              <select name="sport" defaultValue={turf.sports[0] ?? 'football'} className={dash.input}>
                {turf.sports.map((sp) => (
                  <option key={sp} value={sp.toLowerCase().replace(/\s+/g, '_')}>{sp}</option>
                ))}
              </select>
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Slot Duration (mins)</span>
              <select name="slotMinutes" defaultValue="60" className={dash.input}>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Base Price (₹)</span>
              <input name="basePrice" type="number" min={50} max={20000} defaultValue={turf.pricePerHour} required className={dash.input} />
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span className={dash.label} style={{ display: 'block', marginBottom: 6 }}>Physical Resources Occupied (Select at least one)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {resources.map((res) => (
                <label key={res.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--color-text, #f8fafc)', cursor: 'pointer' }}>
                  <input type="checkbox" name="resourceIds" value={res.id} defaultChecked />
                  {res.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className={`${dash.btn} ${dash.btnSm}`}>
            + Add Bookable Offering
          </button>
        </ActionForm>
      </div>
    </div>
  );
}
