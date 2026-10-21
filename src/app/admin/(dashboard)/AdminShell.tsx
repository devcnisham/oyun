'use client';

import Link from 'next/link';
import BrandMark from '@/components/BrandMark';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth-actions';
import NavIcon from '@/components/dash/NavIcon';
import HeaderPageTitle from '@/components/dash/HeaderPageTitle';
import SidebarToggle from '@/components/dash/SidebarToggle';
import AdminTabBar from './AdminTabBar';
import styles from './layout.module.css';

const ADMIN_PAGES = [
  { href: '/admin', label: 'Overview & approvals', tab: 'Overview', icon: 'shield' },
  { href: '/admin/turfs', label: 'Turfs', icon: 'turfs' },
  { href: '/admin/partners', label: 'Partners', icon: 'partners' },
  { href: '/admin/transactions', label: 'Bookings & refunds', tab: 'Bookings', icon: 'transactions' },
  { href: '/admin/users', label: 'Players', icon: 'players' },
  { href: '/admin/students', label: 'Student IDs', icon: 'students' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/settings', label: 'Settings & promo codes', icon: 'settings' },
  { href: '/admin/customization', label: 'Homepage content', icon: 'homepage' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const link = (href: string, icon: string, label: string) => {
    const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
    return (
      <Link href={href} title={label} className={`${styles.navLink} ${active ? styles.active : ''}`}>
        <NavIcon name={icon} className={styles.navIcon} /> {label}
      </Link>
    );
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} noPrint`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <BrandMark size={32} shadow={false} />
            <div className={styles.logoText}>
              <span className={styles.logoName}>OYUN</span>
              <span className={styles.logoTag}>Super Admin</span>
            </div>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <div className={styles.navTitle}>Platform</div>
            {link('/admin', 'shield', 'Overview & approvals')}
            {link('/admin/turfs', 'turfs', 'Turfs')}
            {link('/admin/partners', 'partners', 'Partners')}
            {link('/admin/users', 'players', 'Players')}
            {link('/admin/students', 'students', 'Student IDs')}
            {link('/admin/transactions', 'transactions', 'Bookings & refunds')}
            {link('/admin/analytics', 'analytics', 'Analytics')}
            {link('/admin/reviews', 'reviews', 'Reviews')}
          </div>

          <div className={styles.navGroup} style={{ marginTop: '24px' }}>
            <div className={styles.navTitle}>System</div>
            {link('/admin/settings', 'settings', 'Settings & promo codes')}
            {link('/admin/customization', 'homepage', 'Homepage content')}
          </div>

          <div className={styles.navGroup} style={{ marginTop: '24px' }}>
            <div className={styles.navTitle}>Switch to</div>
            <Link href="/" title="Main site" className={styles.navLink}>
              <NavIcon name="site" className={styles.navIcon} /> Main site
            </Link>
            <Link href="/partner" title="Partner dashboard" className={styles.navLink}>
              <NavIcon name="partners" className={styles.navIcon} /> Partner dashboard
            </Link>
          </div>
          <SidebarToggle variant="button" className={styles.hideMenu} />
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
          <div className={styles.headerTitle}>
            <SidebarToggle className={styles.toggleBtn} />
            <HeaderPageTitle items={ADMIN_PAGES} fallback="Admin" className={styles.pageName} />
            <span className={styles.turfName}>Admin Control Center</span>
          </div>
          <div className={styles.headerActions}>
            <Link href="/" className="btn btn--secondary btn--sm">View site</Link>
            <form action={logout.bind(null, 'admin')}>
              <button type="submit" className="btn btn--secondary btn--sm">Log Out</button>
            </form>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <AdminTabBar pages={ADMIN_PAGES} />
    </div>
  );
}
