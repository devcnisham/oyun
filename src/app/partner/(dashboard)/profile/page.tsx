import Link from 'next/link';
import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/modules/shared/frontend/dash/ui';
import { ROLE_LABELS, requirePartner } from '@/modules/shared/backend/partner-auth';
import { changePassword, updateAccount } from '@/modules/partner/backend/partner-actions';

export default async function ProfilePage() {
  const ctx = await requirePartner();
  const account = ctx.staff ?? ctx.partner;
  const opsLogin = !ctx.staff && ctx.partner.id === 'partner_oyun' && Boolean(process.env.PARTNER_PASSWORD);

  return (
    <div className={dash.page}>
      <PageHeader title="Profile & settings" desc="Your own details and password. Turf, pricing and business settings are on their own pages." />

      <div className={dash.grid2}>
        <div className={dash.card}>
          <div className={dash.cardHeader}>
            <h2 className={dash.cardTitle}>Your details</h2>
            <Badge status="active" label={ROLE_LABELS[ctx.role]} />
          </div>
          <ActionForm action={updateAccount}>
            <div className={dash.formGrid}>
              <label className={dash.field}>
                <span className={dash.label}>Name</span>
                <input name="name" required maxLength={80} defaultValue={account.name} autoComplete="name" className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Mobile</span>
                <input name="phone" required inputMode="numeric" maxLength={10} defaultValue={account.phone} autoComplete="tel-national" className={dash.input} />
              </label>
            </div>
            <label className={dash.field}>
              <span className={dash.label}>Login email</span>
              <input value={account.email} readOnly disabled className={dash.input} aria-describedby="email-note" />
            </label>
            <p id="email-note" className={dash.muted}>Your email is your login, so it can&apos;t be changed here. Contact OYUN support to change it.</p>
            <div className={dash.actions}><button className={dash.btn}>Save details</button></div>
          </ActionForm>
        </div>

        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Change password</h2></div>
          {opsLogin ? (
            <p className={dash.muted}>This account signs in with the <code>PARTNER_PASSWORD</code> set in the hosting settings. Change it there.</p>
          ) : (
            <ActionForm action={changePassword} resetOnSuccess>
              <label className={dash.field}>
                <span className={dash.label}>Current password</span>
                <input name="current" type="password" required autoComplete="current-password" className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>New password</span>
                <input name="next" type="password" required minLength={12} autoComplete="new-password" className={dash.input} />
              </label>
              <label className={dash.field}>
                <span className={dash.label}>Repeat new password</span>
                <input name="confirm" type="password" required minLength={12} autoComplete="new-password" className={dash.input} />
              </label>
              <p className={dash.muted}>At least 12 characters. You stay signed in on this device.</p>
              <div className={dash.actions}><button className={dash.btn}>Change password</button></div>
            </ActionForm>
          )}
        </div>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <h2 className={dash.cardTitle}>{ctx.turfs.length === 1 ? 'Your venue' : 'Your venues'}</h2>
        </div>
        <div className={dash.list}>
          {ctx.turfs.map((t) => (
            <div key={t.id} className={dash.listItem}>
              <div>
                <div className={dash.strong}>
                  {t.name}
                  {t.id === ctx.turf.id && <span className={dash.muted}> · selected</span>}
                </div>
                <div className={dash.muted}>{t.location}</div>
              </div>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
        <p className={dash.muted} style={{ marginTop: 12 }}>
          {ctx.can('turf') && <><Link href="/partner/turf">Edit venue details</Link>{ctx.can('payouts') ? ' · ' : ''}</>}
          {ctx.can('payouts') && <Link href="/partner/payouts">Business and GST details</Link>}
        </p>
      </div>
    </div>
  );
}
