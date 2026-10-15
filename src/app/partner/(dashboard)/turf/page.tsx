import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import TurfProfileFields from '@/components/dash/TurfProfileFields';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { setRainOut, updateTurfProfile } from '@/lib/partner-actions';
import { isOutdoorTurf } from '@/lib/weather';

export default async function MyTurfPage() {
  const ctx = await requirePartner('turf');
  const turf = ctx.turf;

  return (
    <div className={dash.page}>
      <PageHeader title="My turf" desc="Everything here appears on your public booking page.">
        <Badge status={turf.status} />
        {turf.isVerified && <Badge status="active" label="Verified" />}
        <Link href={`/arenas/${turf.id}`} className={`${dash.btn} ${dash.btnSecondary}`}>View public page</Link>
      </PageHeader>

      {turf.status !== 'active' && (
        <p className={dash.notice}>Your turf is {turf.status}. Contact OYUN support to make it live again.</p>
      )}

      {isOutdoorTurf(turf) && (
        <div className={dash.card}>
          <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Rained out</h2></div>
          <p className={dash.muted}>Mark a day as rained out and players with a booking that day can cancel any time before the slot and get a full wallet refund.</p>
          <ActionForm action={setRainOut} resetOnSuccess>
            <input type="hidden" name="mode" value="set" />
            <label className={dash.field}>
              <span className={dash.label}>Date</span>
              <input name="date" type="date" required className={dash.input} />
            </label>
            <div className={dash.actions}><button className={dash.btn}>Mark as rained out</button></div>
          </ActionForm>
          {(turf.rainOutDates ?? []).length > 0 && (
            <ul>
              {(turf.rainOutDates ?? []).map((d) => (
                <li key={d}>
                  <ActionForm action={setRainOut} inline>
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
      )}

      <div className={dash.card}>
        <ActionForm action={updateTurfProfile}>
          <TurfProfileFields turf={turf} />
          <div className={dash.actions}><button className={dash.btn}>Save changes</button></div>
        </ActionForm>
      </div>
    </div>
  );
}
