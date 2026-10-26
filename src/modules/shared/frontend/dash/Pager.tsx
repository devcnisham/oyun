import Link from 'next/link';
import { dash } from '@/modules/shared/frontend/dash/ui';
import type { Page } from '@/modules/shared/lib/paginate';

// Previous / next links that keep the other query params (search, filters, tab).
export default function Pager({ info, basePath, params = {} }: { info: Page<unknown>; basePath: string; params?: Record<string, string> }) {
  if (info.pages <= 1) return null;
  const href = (page: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (page > 1) qs.set('page', String(page));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const btn = `${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`;
  return (
    <nav className={dash.inline} aria-label="Pages" style={{ justifyContent: 'space-between', paddingTop: 12 }}>
      <span className={dash.muted}>Showing {info.from}–{info.to} of {info.total}</span>
      <span className={dash.inline}>
        {info.page > 1 && <Link href={href(info.page - 1)} className={btn} rel="prev">Previous</Link>}
        <span className={dash.muted}>Page {info.page} of {info.pages}</span>
        {info.page < info.pages && <Link href={href(info.page + 1)} className={btn} rel="next">Next</Link>}
      </span>
    </nav>
  );
}
