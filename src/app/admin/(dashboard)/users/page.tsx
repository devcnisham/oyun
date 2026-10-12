import ActionForm from '@/components/dash/ActionForm';
import { Badge, PageHeader, dash, inr } from '@/components/dash/ui';
import { adjustWallet, togglePlayerBan } from '@/lib/admin-actions';
import { getDb } from '@/lib/store';
import { formatDate, formatDateTime } from '@/lib/time';
import { WALLET_TXN_LABELS } from '@/lib/wallet';
import { paginate } from '@/lib/paginate';
import Pager from '@/components/dash/Pager';

export default async function AdminPlayers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page: pageParam } = await searchParams;
  const db = await getDb();
  const search = q.trim().toLowerCase();
  const players = db.players
    .filter((p) => !search || p.name.toLowerCase().includes(search) || p.phone.includes(search))
    .map((p) => {
      const list = db.bookings.filter((b) => b.playerId === p.id);
      const last = list.reduce<string | null>((m, b) => (!m || b.date > m ? b.date : m), null);
      return {
        ...p,
        referrer: p.referredBy ? db.players.find((r) => r.id === p.referredBy)?.name ?? '—' : null,
        referrals: db.players.filter((r) => r.referredBy === p.id).length,
        bookings: list.filter((b) => !['cancelled', 'refunded'].includes(b.status)).length,
        noShows: list.filter((b) => b.status === 'no_show').length,
        last,
      };
    })
    .sort((a, b) => b.bookings - a.bookings);
  const paged = paginate(players, pageParam, 50);

  return (
    <div className={dash.page}>
      <PageHeader title="Players" desc="Players are created automatically from their first booking (by mobile number)." />

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <form className={dash.inline}>
            <input name="q" defaultValue={q} placeholder="Name or phone" className={dash.input} style={{ width: 220 }} />
            <button className={`${dash.btn} ${dash.btnSecondary}`}>Search</button>
          </form>
          <span className={dash.muted}>{players.length} players</span>
        </div>
        <div className={dash.tableWrap} tabIndex={0} role="region" aria-label="Table, scrolls sideways">
          <table className={dash.table}>
            <thead>
              <tr>
                <th>Player</th><th className={dash.num}>Bookings</th><th className={dash.num}>No-shows</th>
                <th>Last game</th><th>Referral</th><th className={dash.num}>Wallet</th><th>Adjust wallet</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((p) => (
                <tr key={p.id}>
                  <td><div className={dash.strong}>{p.name}</div><div className={dash.muted}>{p.phone}</div></td>
                  <td className={dash.num}>{p.bookings}</td>
                  <td className={dash.num}>{p.noShows}</td>
                  <td>{p.last ? formatDate(p.last) : '—'}</td>
                  <td>
                    <span className={dash.strong}>{p.referralCode}</span>
                    <div className={dash.muted}>
                      {p.referrals} referred{p.referrer ? ` · by ${p.referrer}${p.referralRewarded ? '' : ' (pending)'}` : ''}
                    </div>
                  </td>
                  <td className={`${dash.num} ${dash.strong}`}>{inr(p.walletBalance)}</td>
                  <td>
                    <ActionForm action={adjustWallet} inline>
                      <input type="hidden" name="playerId" value={p.id} />
                      <input name="amount" type="number" placeholder="+200 / -200" className={dash.input} style={{ width: 110, padding: '6px 8px' }} required />
                      <input name="note" placeholder="Reason" maxLength={120} className={dash.input} style={{ width: 130, padding: '6px 8px' }} />
                      <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Apply</button>
                    </ActionForm>
                  </td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <ActionForm action={togglePlayerBan} inline confirm={p.status === 'active' ? `Ban ${p.name}? They won't be able to book.` : undefined}>
                      <input type="hidden" name="playerId" value={p.id} />
                      <button className={`${dash.btn} ${dash.btnSm} ${p.status === 'active' ? dash.btnDanger : ''}`}>{p.status === 'active' ? 'Ban' : 'Unban'}</button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager info={paged} basePath="/admin/users" params={{ q }} />
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Wallet activity</h2>
            <p className={dash.cardDesc}>
              Cashback paid: {inr(db.walletTxns.filter((t) => t.type === 'cashback').reduce((s, t) => s + t.amount, 0))} · Referral rewards paid:{' '}
              {inr(db.walletTxns.filter((t) => t.type === 'referral' || t.type === 'referral_bonus').reduce((s, t) => s + t.amount, 0))}
            </p>
          </div>
        </div>
        <div className={dash.tableWrap} tabIndex={0} role="region" aria-label="Table, scrolls sideways">
          <table className={dash.table}>
            <thead><tr><th>When</th><th>Player</th><th>Type</th><th>Note</th><th className={dash.num}>Amount</th></tr></thead>
            <tbody>
              {[...db.walletTxns].reverse().slice(0, 30).map((t) => (
                <tr key={t.id}>
                  <td className={dash.muted}>{formatDateTime(t.createdAt)}</td>
                  <td>{db.players.find((pl) => pl.id === t.playerId)?.name ?? '—'}</td>
                  <td>{WALLET_TXN_LABELS[t.type]}</td>
                  <td className={dash.muted}>{t.note}</td>
                  <td className={`${dash.num} ${dash.strong}`}>{t.amount > 0 ? '+' : '−'}{inr(Math.abs(t.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
