import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { ROLE_LABELS, requirePartner } from '@/lib/partner-auth';
import { createStaff, deleteStaff, resetStaffPassword } from '@/lib/partner-actions';
import { getDb } from '@/lib/store';

export default async function StaffPage() {
  const ctx = await requirePartner('staff');
  const db = getDb();
  const staff = db.staff.filter((s) => s.partnerId === ctx.partner.id);
  const walkIns = (name: string) => db.bookings.filter((b) => b.createdBy === name && ctx.turfs.some((t) => t.id === b.turfId)).length;

  return (
    <div className={dash.page}>
      <PageHeader title="Staff accounts" desc="Give managers and front-desk staff their own login. They sign in at /partner/login." />

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Add a staff member</h2></div>
          <ActionForm action={createStaff} resetOnSuccess>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Name</span>
                <input name="name" required className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Mobile</span>
                <input name="phone" required inputMode="numeric" className={dash.input} />
              </label>
            </div>
            <label className={dash.field}>
              <span className={dash.label}>Login email</span>
              <input name="email" type="email" required className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Role</span>
              <select name="role" className={dash.select} defaultValue="front_desk">
                <option value="front_desk">Front desk — bookings, walk-ins, check-in, slots</option>
                <option value="manager">Manager — everything except staff and payouts</option>
              </select>
            </label>
            <div className={dash.actions}><button className={dash.btn}>Create login</button></div>
          </ActionForm>
          <p className={dash.muted} style={{ marginTop: 12 }}>A temporary password is shown once after you create the login. Share it with the staff member.</p>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Team</h2>
          </div>
          <div className={dash.list}>
            <div className={dash.listItem}>
              <div>
                <div className={dash.strong}>{ctx.partner.name}</div>
                <div className={dash.muted}>{ctx.partner.email}</div>
              </div>
              <Badge status="active" label="Owner" />
            </div>
            {staff.map((s) => (
              <div key={s.id} className={dash.listItem} style={{ flexWrap: 'wrap' }}>
                <div>
                  <div className={dash.strong}>{s.name}</div>
                  <div className={dash.muted}>{s.email} · {s.phone} · {walkIns(s.name)} walk-ins created</div>
                </div>
                <div className={dash.inline}>
                  <Badge status={s.role === 'manager' ? 'confirmed' : 'pending'} label={ROLE_LABELS[s.role]} />
                  <ActionForm action={resetStaffPassword}>
                    <input type="hidden" name="staffId" value={s.id} />
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Reset password</button>
                  </ActionForm>
                  <ActionForm action={deleteStaff} inline confirm={`Remove ${s.name}'s access?`}>
                    <input type="hidden" name="staffId" value={s.id} />
                    <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Remove</button>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
