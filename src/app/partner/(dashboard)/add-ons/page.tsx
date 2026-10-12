import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash, inr, tableScroll } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { deleteAddOn, saveAddOn, toggleAddOn } from '@/lib/partner-actions';
import { getDb } from '@/lib/store';

export default async function AddOnsPage() {
  const ctx = await requirePartner('addons');
  const db = await getDb();
  const addOns = db.addOns.filter((a) => a.turfId === ctx.turf.id);

  // Units sold and revenue per add-on across all bookings
  const sales = new Map<string, { qty: number; revenue: number }>();
  for (const b of db.bookings) {
    if (b.turfId !== ctx.turf.id || b.status === 'cancelled' || b.status === 'refunded') continue;
    for (const a of b.addOns) {
      const s = sales.get(a.id) ?? { qty: 0, revenue: 0 };
      s.qty += a.qty;
      s.revenue += a.qty * a.price;
      sales.set(a.id, s);
    }
  }

  return (
    <div className={dash.page}>
      <PageHeader title="Add-ons at checkout" desc="Equipment rental and drinks players can add when they book." />

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Add a new item</h2></div>
        <ActionForm action={saveAddOn} resetOnSuccess>
          <div className={dash.formGrid}>
            <label className={dash.field}>
              <span className={dash.label}>Item name</span>
              <input name="name" required maxLength={60} placeholder="e.g. Goalkeeper gloves" className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Price (₹)</span>
              <input name="price" type="number" min={0} max={10000} required className={dash.input} />
            </label>
          </div>
          <div className={dash.actions}><button className={dash.btn}>Add item</button></div>
        </ActionForm>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Items ({addOns.length})</h2></div>
        {addOns.length === 0 ? (
          <p className={dash.empty}>No add-ons yet.</p>
        ) : (
          <div {...tableScroll}>
            <table className={dash.table}>
              <thead><tr><th>Item & price</th><th>Status</th><th className={dash.num}>Sold</th><th className={dash.num}>Revenue</th><th></th></tr></thead>
              <tbody>
                {addOns.map((a) => {
                  const s = sales.get(a.id) ?? { qty: 0, revenue: 0 };
                  return (
                    <tr key={a.id}>
                      <td>
                        <ActionForm action={saveAddOn} inline>
                          <input type="hidden" name="addOnId" value={a.id} />
                          <input name="name" defaultValue={a.name} required className={dash.input} style={{ width: 200 }} />
                          <input name="price" type="number" min={0} defaultValue={a.price} required className={dash.input} style={{ width: 90 }} />
                          <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save</button>
                        </ActionForm>
                      </td>
                      <td><Badge status={a.active ? 'active' : 'cancelled'} label={a.active ? 'At checkout' : 'Hidden'} /></td>
                      <td className={dash.num}>{s.qty}</td>
                      <td className={dash.num}>{inr(s.revenue)}</td>
                      <td>
                        <div className={dash.inline}>
                          <ActionForm action={toggleAddOn} inline>
                            <input type="hidden" name="addOnId" value={a.id} />
                            <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>{a.active ? 'Hide' : 'Show'}</button>
                          </ActionForm>
                          <ActionForm action={deleteAddOn} inline confirm={`Delete ${a.name}?`}>
                            <input type="hidden" name="addOnId" value={a.id} />
                            <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Delete</button>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
