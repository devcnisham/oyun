import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { createOffer, deleteOffer, toggleOffer } from '@/lib/partner-actions';
import { getDb } from '@/lib/store';
import { formatSlotRange } from '@/lib/time';

const hourText = (h: number) => (h === 24 ? 'Midnight' : formatSlotRange(h).split(' – ')[0]);

export default async function OffersPage() {
  const ctx = await requirePartner('offers');
  const db = await getDb();
  const offers = db.offers.filter((o) => o.turfId === ctx.turf.id);

  // How often each offer has been used (from saved booking price breakdowns)
  const uses = (title: string) =>
    db.bookings.filter((b) => b.turfId === ctx.turf.id && b.pricing.offer?.label.startsWith(`${title} (`)).length;

  return (
    <div className={dash.page}>
      <PageHeader title="Offers" desc="Happy hours and first-time discounts. Players get the single best offer that applies; promo codes can stack on top." />

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Create an offer</h2></div>
          <ActionForm action={createOffer} resetOnSuccess>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Type</span>
                <select name="type" className={dash.select} defaultValue="happy_hour">
                  <option value="happy_hour">Happy hour (time window)</option>
                  <option value="first_time">First-time player</option>
                </select>
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Name shown to players</span>
                <input name="title" required maxLength={40} placeholder="e.g. Afternoon Deal" className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Discount %</span>
                <input name="percentOff" type="number" min={1} max={90} defaultValue={15} required className={dash.input} />
              </label>
            </div>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Happy hour from</span>
                <select name="startHour" className={dash.select} defaultValue={13}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourText(h)}</option>)}
                </select>
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Until</span>
                <select name="endHour" className={dash.select} defaultValue={16}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{hourText(h)}</option>)}
                </select>
              </label>
            </div>
            <p className={dash.muted}>Time window applies to happy hours only. First-time offers apply to a phone number&apos;s first booking.</p>
            <div className={dash.actions}><button className={dash.btn}>Create offer</button></div>
          </ActionForm>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Your offers</h2></div>
          {offers.length === 0 ? (
            <p className={dash.empty}>No offers yet.</p>
          ) : (
            <div className={dash.list}>
              {offers.map((o) => (
                <div key={o.id} className={dash.listItem}>
                  <div>
                    <div className={dash.strong}>{o.title} · {o.percentOff}% off</div>
                    <div className={dash.muted}>
                      {o.type === 'first_time' ? 'First booking only' : `${hourText(o.startHour)} – ${hourText(o.endHour)}`} · used {uses(o.title)} times
                    </div>
                  </div>
                  <div className={dash.inline}>
                    <Badge status={o.active ? 'active' : 'cancelled'} label={o.active ? 'Live' : 'Paused'} />
                    <ActionForm action={toggleOffer} inline>
                      <input type="hidden" name="offerId" value={o.id} />
                      <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>{o.active ? 'Pause' : 'Resume'}</button>
                    </ActionForm>
                    <ActionForm action={deleteOffer} inline confirm={`Delete "${o.title}"?`}>
                      <input type="hidden" name="offerId" value={o.id} />
                      <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Delete</button>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
