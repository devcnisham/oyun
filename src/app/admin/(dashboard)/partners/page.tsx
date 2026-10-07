import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash } from '@/components/dash/ui';
import { resetPartnerPassword, togglePartnerStatus, updatePartner } from '@/lib/admin-actions';
import { getDb } from '@/lib/store';

export default async function AdminPartners() {
  const db = await getDb();

  return (
    <div className={dash.page}>
      <PageHeader title="Partners" desc="Turf owners. Suspending a partner blocks their and their staff's logins." />

      <div className={dash.card}>
        <div className={dash.list}>
          {db.partners.map((p) => {
            const turfs = db.turfs.filter((t) => t.partnerId === p.id);
            const staff = db.staff.filter((s) => s.partnerId === p.id);
            return (
              <div key={p.id} className={dash.listItem} style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: '1 1 280px' }}>
                  <div className={dash.inline}>
                    <span className={dash.strong}>{p.name}</span>
                    <Badge status={p.status} />
                    {p.business.gstin && <Badge status="confirmed" label="GST registered" />}
                  </div>
                  <div className={dash.muted}>
                    Turfs:{' '}
                    {turfs.length === 0
                      ? 'none'
                      : turfs.map((t, i) => (
                          <span key={t.id}>
                            {i > 0 && ', '}
                            <Link href={`/admin/turfs/${t.id}`}>{t.name}</Link>
                          </span>
                        ))}
                  </div>
                  <div className={dash.muted}>Staff: {staff.length ? staff.map((s) => `${s.name} (${s.role.replace('_', ' ')})`).join(', ') : 'none'}</div>
                  <div className={dash.muted}>{p.business.legalName}{p.business.gstin ? ` · GSTIN ${p.business.gstin}` : ''}</div>
                </div>
                <div style={{ flex: '1 1 380px' }} className={dash.form}>
                  <ActionForm action={updatePartner} inline>
                    <input type="hidden" name="partnerId" value={p.id} />
                    <input name="name" defaultValue={p.name} required className={dash.input} style={{ width: 140 }} aria-label="Name" />
                    <input name="email" type="email" defaultValue={p.email} required className={dash.input} style={{ width: 210 }} aria-label="Login email" />
                    <input name="phone" defaultValue={p.phone} className={dash.input} style={{ width: 120 }} aria-label="Phone" />
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save</button>
                  </ActionForm>
                  <div className={dash.inline}>
                    <ActionForm action={resetPartnerPassword} confirm={`Reset ${p.name}'s password? Their current password stops working.`}>
                      <input type="hidden" name="partnerId" value={p.id} />
                      <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Reset password</button>
                    </ActionForm>
                    <ActionForm action={togglePartnerStatus} inline confirm={p.status === 'active' ? `Suspend ${p.name}? They and their staff will be logged out.` : undefined}>
                      <input type="hidden" name="partnerId" value={p.id} />
                      <button className={`${dash.btn} ${dash.btnSm} ${p.status === 'active' ? dash.btnDanger : ''}`}>{p.status === 'active' ? 'Suspend' : 'Reactivate'}</button>
                    </ActionForm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
