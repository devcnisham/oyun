import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { Badge, PageHeader, dash, tableScroll } from '@/modules/shared/frontend/dash/ui';
import { deletePromoCode, savePlatformOffers, savePromoCode, saveSettings, setRainDay, togglePromoCode } from '@/modules/admin/backend/admin-actions';
import { platformOffersOf } from '@/modules/shared/lib/platform-offers';
import { getDb } from '@/modules/shared/database/store';

export default async function AdminSettings() {
  const db = await getDb();
  const s = db.settings;
  const offers = platformOffersOf(s);

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
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Offers for players</h2></div>
          <p className={dash.muted}>Two offers that apply to every turf while they are on. A player gets the single best offer for a booking: these, the turf&apos;s own offers and first-time offers do not add up. The Student offer only applies to players whose student ID you have approved (see Student IDs).</p>
          <ActionForm action={savePlatformOffers}>
            <h3 className={dash.cardTitle}>Regular offer</h3>
            <label className={dash.check}><input type="checkbox" name="regularActive" defaultChecked={offers.regular.active} /> On: for every player</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Name shown to players</span>
                <input name="regularTitle" maxLength={40} defaultValue={offers.regular.title} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Discount %</span>
                <input name="regularPercent" type="number" min={1} max={90} defaultValue={offers.regular.percentOff} className={dash.input} required />
              </label>
            </div>
            <h3 className={dash.cardTitle}>Student offer</h3>
            <label className={dash.check}><input type="checkbox" name="studentActive" defaultChecked={offers.student.active} /> On: for players with an approved student ID</label>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Name shown to players</span>
                <input name="studentTitle" maxLength={40} defaultValue={offers.student.title} className={dash.input} required />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Discount %</span>
                <input name="studentPercent" type="number" min={1} max={90} defaultValue={offers.student.percentOff} className={dash.input} required />
              </label>
            </div>
            <div className={dash.actions}><button className={dash.btn}>Save offers</button></div>
          </ActionForm>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Rain days</h2></div>
          <p className={dash.muted}>On a rain day, players with a booking at any outdoor turf can cancel up to the start of the slot and get a full wallet refund. Indoor and covered turfs are not affected.</p>
          <ActionForm action={setRainDay} resetOnSuccess>
            <input type="hidden" name="mode" value="set" />
            <label className={dash.field}>
              <span className={dash.label}>Date</span>
              <input name="date" type="date" required className={dash.input} />
            </label>
            <div className={dash.actions}><button className={dash.btn}>Declare rain day</button></div>
          </ActionForm>
          {(s.rainDays ?? []).length > 0 && (
            <ul>
              {(s.rainDays ?? []).map((d) => (
                <li key={d}>
                  <ActionForm action={setRainDay} inline>
                    <input type="hidden" name="mode" value="clear" />
                    <input type="hidden" name="date" value={d} />
                    <span className={dash.strong}>{d}</span>{' '}
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Clear</button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
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
        <div {...tableScroll}>
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
