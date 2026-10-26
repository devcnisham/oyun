import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { PageHeader, dash, inr, tableScroll } from '@/modules/shared/frontend/dash/ui';
import { requirePartner } from '@/modules/shared/backend/partner-auth';
import { savePricing } from '@/modules/partner/backend/partner-actions';
import { rulesFor, slotPrice, turfHours } from '@/modules/shared/lib/pricing';
import { getDb } from '@/modules/shared/database/store';
import { addDays, dayOfWeek, formatSlotRange, istNow } from '@/modules/shared/lib/time';

const hourOptions = Array.from({ length: 25 }, (_, h) => h);
const hourText = (h: number) => (h === 24 ? 'Midnight' : formatSlotRange(h).split(' – ')[0]);

export default async function PricingPage() {
  const ctx = await requirePartner('pricing');
  const db = await getDb();
  const rules = rulesFor(db, ctx.turf.id);
  const now = istNow();

  // Preview against a weekday and a Saturday a week out (so last-minute discounts don't show)
  const nextWeek = addDays(now.date, 7);
  const weekday = addDays(nextWeek, [1, 0, 0, 0, 0, 0, 2][dayOfWeek(nextWeek)]);
  const saturday = addDays(nextWeek, (6 - dayOfWeek(nextWeek) + 7) % 7);
  const far = { date: addDays(now.date, -30), hour: 0, minute: 0 };
  const preview = turfHours(ctx.turf).map((h) => ({
    hour: h,
    weekday: slotPrice(ctx.turf, rules, weekday, h, far).price,
    weekend: slotPrice(ctx.turf, rules, saturday, h, far).price,
  }));

  return (
    <div className={dash.page}>
      <PageHeader title="Dynamic pricing" desc="Charge more when demand is high and fill empty slots with last-minute deals." />

      <div className={dash.grid2}>
        <div className={dash.card}>
          <ActionForm action={savePricing}>
            <label className={dash.field}>
              <span className={dash.label}>Base price per hour (₹)</span>
              <input name="pricePerHour" type="number" min={100} max={20000} defaultValue={ctx.turf.pricePerHour} className={dash.input} required />
            </label>

            <h3 className={dash.cardTitle}>Peak hours</h3>
            <label className={dash.check}><input type="checkbox" name="peakEnabled" defaultChecked={rules.peakEnabled} /> Charge extra during peak hours</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>From</span>
                <select name="peakStartHour" defaultValue={rules.peakStartHour} className={dash.select}>
                  {hourOptions.slice(0, 24).map((h) => <option key={h} value={h}>{hourText(h)}</option>)}
                </select>
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Until</span>
                <select name="peakEndHour" defaultValue={rules.peakEndHour} className={dash.select}>
                  {hourOptions.slice(1).map((h) => <option key={h} value={h}>{hourText(h)}</option>)}
                </select>
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Markup %</span>
                <input name="peakPercent" type="number" min={0} max={200} defaultValue={rules.peakPercent} className={dash.input} />
              </label>
            </div>

            <h3 className={dash.cardTitle}>Weekends</h3>
            <label className={dash.check}><input type="checkbox" name="weekendEnabled" defaultChecked={rules.weekendEnabled} /> Charge extra on Saturday and Sunday</label>
            <label className={dash.field}>
              <span className={dash.label}>Markup %</span>
              <input name="weekendPercent" type="number" min={0} max={200} defaultValue={rules.weekendPercent} className={dash.input} />
            </label>

            <h3 className={dash.cardTitle}>Last-minute deals</h3>
            <label className={dash.check}><input type="checkbox" name="lastMinuteEnabled" defaultChecked={rules.lastMinuteEnabled} /> Discount empty slots that start soon</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Within (hours)</span>
                <input name="lastMinuteHours" type="number" min={1} max={12} defaultValue={rules.lastMinuteHours} className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Discount %</span>
                <input name="lastMinutePercent" type="number" min={0} max={90} defaultValue={rules.lastMinutePercent} className={dash.input} />
              </label>
            </div>

            <div className={dash.actions}>
              <button className={dash.btn}>Save pricing</button>
            </div>
          </ActionForm>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <div>
              <h2 className={dash.cardTitle}>Price preview</h2>
              <p className={dash.cardDesc}>What players pay per slot (before offers). Last-minute deals come on top on the day.</p>
            </div>
          </div>
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead><tr><th>Slot</th><th className={dash.num}>Weekday</th><th className={dash.num}>Weekend</th></tr></thead>
              <tbody>
                {preview.map((p) => (
                  <tr key={p.hour}>
                    <td>{formatSlotRange(p.hour)}</td>
                    <td className={dash.num}>{inr(p.weekday)}</td>
                    <td className={dash.num}>{inr(p.weekend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
