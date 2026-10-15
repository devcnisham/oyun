'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth-actions';
import styles from './layout.module.css';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const link = (href: string, icon: string, label: string) => {
    const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
    return (
      <Link href={href} className={`${styles.navLink} ${active ? styles.active : ''}`}>
        <span className={styles.navIcon}>{icon}</span> {label}
      </Link>
    );
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} noPrint`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚽</span>
            <div className={styles.logoText}>
              <span className={styles.logoName}>OYUN</span>
              <span className={styles.logoTag}>Super Admin</span>
            </div>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <div className={styles.navTitle}>Platform</div>
            {link('/admin', '🛡️', 'Overview & approvals')}
            {link('/admin/turfs', '🏟️', 'Turfs')}
            {link('/admin/partners', '🤝', 'Partners')}
            {link('/admin/users', '👥', 'Players')}
            {link('/admin/students', '🎓', 'Student IDs')}
            {link('/admin/transactions', '💳', 'Bookings & refunds')}
            {link('/admin/analytics', '📊', 'Analytics')}
            {link('/admin/reviews', '⭐', 'Reviews')}
          </div>

          <div className={styles.navGroup} style={{ marginTop: '24px' }}>
            <div className={styles.navTitle}>System</div>
            {link('/admin/settings', '⚙️', 'Settings & promo codes')}
            {link('/admin/customization', '🎨', 'Homepage content')}
          </div>
        </nav>
        
        <div className={styles.sidebarBottom}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>A</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Admin User</div>
              <div className={styles.userTurf}>System Owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={`${styles.header} noPrint`}>
          <div className={styles.headerTitle}>Admin Control Center</div>
          <div className={styles.headerActions}>
            <Link href="/" className="btn btn--secondary btn--sm" target="_blank">View site</Link>
            <form action={logout.bind(null, 'admin')}>
              <button type="submit" className="btn btn--secondary btn--sm">Log Out</button>
            </form>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
