import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import TurfProfileFields from '@/components/dash/TurfProfileFields';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { requirePartner } from '@/lib/partner-auth';
import { updateTurfProfile } from '@/lib/partner-actions';

export default async function MyTurfPage() {
  const ctx = await requirePartner('turf');
  const turf = ctx.turf;

  return (
    <div className={dash.page}>
      <PageHeader title="My turf" desc="Everything here appears on your public booking page.">
        <Badge status={turf.status} />
        {turf.isVerified && <Badge status="active" label="Verified" />}
        <Link href={`/arenas/${turf.id}`} target="_blank" className={`${dash.btn} ${dash.btnSecondary}`}>View public page</Link>
      </PageHeader>

      {turf.status !== 'active' && (
        <p className={dash.notice}>Your turf is {turf.status}. Contact OYUN support to make it live again.</p>
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
