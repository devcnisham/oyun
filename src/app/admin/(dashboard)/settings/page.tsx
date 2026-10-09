import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { deletePromoCode, savePromoCode, saveSettings, togglePromoCode } from '@/lib/admin-actions';
import { getDb } from '@/lib/store';

export default async function AdminSettings() {
  const db = await getDb();
  const s = db.settings;

  return (
    <div className={dash.page}>
      <PageHeader title="Settings" desc="Platform-wide rules and promo codes." />

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Platform</h2></div>
          <ActionForm action={saveSettings}>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Default commission %</span>
                <input name="commissionPercent" type="number" min={0} max={50} defaultValue={s.commissionPercent} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Advance payment %</span>
                <input name="advancePercent" type="number" min={10} max={100} defaultValue={s.advancePercent} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Minimum advance per hour (₹)</span>
                <input name="minAdvance" type="number" min={0} max={5000} defaultValue={s.minAdvance} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Maximum advance per hour (₹)</span>
                <input name="maxAdvance" type="number" min={0} max={5000} defaultValue={s.maxAdvance} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>GST % on bookings</span>
                <input name="gstPercent" type="number" min={0} max={28} defaultValue={s.gstPercent} className={dash.input} required />
              </label>
            </div>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Support email</span>
                <input name="supportEmail" type="email" defaultValue={s.supportEmail} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Support phone</span>
                <input name="supportPhone" defaultValue={s.supportPhone} className={dash.input} required />
              </label>
            </div>
            <h3 className={dash.cardTitle}>Cashback</h3>
            <label className={dash.check}><input type="checkbox" name="cashbackEnabled" defaultChecked={s.cashbackEnabled} /> Give players wallet cashback when they check in for a game</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Cashback % of booking total</span>
                <input name="cashbackPercent" type="number" min={0} max={50} defaultValue={s.cashbackPercent} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Max cashback per game (₹)</span>
                <input name="cashbackMax" type="number" min={0} max={5000} defaultValue={s.cashbackMax} className={dash.input} required />
              </label>
            </div>

            <h3 className={dash.cardTitle}>Referrals</h3>
            <label className={dash.check}><input type="checkbox" name="referralEnabled" defaultChecked={s.referralEnabled} /> Referral program on (paid after the new player&apos;s first game)</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Reward to referrer (₹)</span>
                <input name="referrerReward" type="number" min={0} max={5000} defaultValue={s.referrerReward} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Reward to new player (₹)</span>
                <input name="refereeReward" type="number" min={0} max={5000} defaultValue={s.refereeReward} className={dash.input} required />
              </label>
            </div>

            <p className={dash.muted}>Commission applies to online payments; individual turfs can override it on their edit page. Cashback and referral credit are paid by OYUN, not the turf.</p>
            <div className={dash.actions}><button className={dash.btn}>Save settings</button></div>
          </ActionForm>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>New promo code</h2></div>
          <ActionForm action={savePromoCode} resetOnSuccess>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Code</span>
                <input name="code" required maxLength={20} placeholder="SUMMER25" className={dash.input} style={{ textTransform: 'uppercase' }} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Type</span>
                <select name="kind" className={dash.select}>
                  <option value="percent">% off</option>
                  <option value="flat">Flat ₹ off</option>
                </select>
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Value</span>
                <input name="value" type="number" min={1} required className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Max discount ₹ (optional)</span>
                <input name="maxDiscount" type="number" min={1} className={dash.input} />
              </label>
            </div>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Last day (optional)</span>
                <input name="expiresOn" type="date" className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Total uses (optional)</span>
                <input name="maxUses" type="number" min={1} className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Uses per player (optional)</span>
                <input name="perPlayerLimit" type="number" min={1} className={dash.input} />
              </label>
            </div>
            <label className={dash.check}><input type="checkbox" name="weekendOnly" /> Weekends only</label>
            <div className={dash.actions}><button className={dash.btn}>Create code</button></div>
          </ActionForm>
        </div>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Promo codes</h2></div>
        <div className={dash.tableWrap}>
          <table className={dash.table}>
            <thead><tr><th>Code</th><th>Discount (edit)</th><th className={dash.num}>Uses</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {db.promoCodes.map((p) => (
                <tr key={p.code}>
                  <td className={dash.strong}>{p.code}</td>
                  <td>
                    <ActionForm action={savePromoCode} inline>
                      <input type="hidden" name="mode" value="edit" />
                      <input type="hidden" name="code" value={p.code} />
                      <select name="kind" defaultValue={p.kind} className={dash.select} style={{ width: 90, padding: '6px' }}>
                        <option value="percent">%</option>
                        <option value="flat">₹ flat</option>
                      </select>
                      <input name="value" type="number" min={1} defaultValue={p.value} className={dash.input} style={{ width: 80, padding: '6px' }} required />
                      <input name="maxDiscount" type="number" min={1} defaultValue={p.maxDiscount ?? ''} placeholder="max ₹" className={dash.input} style={{ width: 90, padding: '6px' }} />
                      <label className={dash.check}><input type="checkbox" name="weekendOnly" defaultChecked={p.weekendOnly} /> Weekends</label>
                      <input name="expiresOn" type="date" defaultValue={p.expiresOn ?? ''} aria-label={`Last day for ${p.code}`} title="Last day" className={dash.input} style={{ width: 140, padding: '6px' }} />
                      <input name="maxUses" type="number" min={1} defaultValue={p.maxUses ?? ''} placeholder="total uses" aria-label={`Total uses for ${p.code}`} className={dash.input} style={{ width: 100, padding: '6px' }} />
                      <input name="perPlayerLimit" type="number" min={1} defaultValue={p.perPlayerLimit ?? ''} placeholder="per player" aria-label={`Uses per player for ${p.code}`} className={dash.input} style={{ width: 100, padding: '6px' }} />
                      <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save</button>
                    </ActionForm>
                  </td>
                  <td className={dash.num}>{p.uses}{p.maxUses != null ? ` / ${p.maxUses}` : ''}</td>
                  <td><Badge status={p.active ? 'active' : 'cancelled'} label={p.active ? 'Active' : 'Paused'} /></td>
                  <td>
                    <div className={dash.inline}>
                      <ActionForm action={togglePromoCode} inline>
                        <input type="hidden" name="code" value={p.code} />
                        <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>{p.active ? 'Pause' : 'Activate'}</button>
                      </ActionForm>
                      <ActionForm action={deletePromoCode} inline confirm={`Delete ${p.code}?`}>
                        <input type="hidden" name="code" value={p.code} />
                        <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Delete</button>
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
