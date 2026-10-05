import Link from 'next/link';
import styles from './dash.module.css';

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {desc && <p className={styles.pageDesc}>{desc}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {hint && <div className={styles.statHint}>{hint}</div>}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  confirmed: styles.badgeBlue,
  checked_in: styles.badgeGreen,
  active: styles.badgeGreen,
  approved: styles.badgeGreen,
  no_show: styles.badgeAmber,
  pending: styles.badgeAmber,
  maintenance: styles.badgeAmber,
  cancelled: styles.badgeGray,
  refunded: styles.badgeGray,
  rejected: styles.badgeRed,
  suspended: styles.badgeRed,
  banned: styles.badgeRed,
};

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`${styles.badge} ${BADGE_COLORS[status] ?? styles.badgeGray}`}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}

export function Tabs({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <nav className={styles.tabs}>
      {items.map((t) => (
        <Link key={t.key} href={t.href} className={`${styles.tab} ${t.key === active ? styles.tabActive : ''}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export { styles as dash };
