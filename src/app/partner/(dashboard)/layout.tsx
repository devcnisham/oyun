import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { logout } from '@/lib/auth-actions';
import NavIcon from '@/components/dash/NavIcon';
import HeaderPageTitle from '@/components/dash/HeaderPageTitle';
import SidebarToggle from '@/components/dash/SidebarToggle';
import { ROLE_LABELS, requirePartner } from '@/lib/partner-auth';
import { switchTurf } from '@/lib/partner-actions';
import NavLinks, { type NavItem } from './NavLinks';
import MobileTabBar from './MobileTabBar';
import MobileDrawerClose, { DrawerButton } from './MobileDrawerClose';
import styles from './layout.module.css';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePartner();

  const nav: NavItem[] = [
    { href: '/partner', label: 'Dashboard', icon: 'dashboard' },
    ...(ctx.can('bookings') ? [{ href: '/partner/bookings', label: 'Bookings', icon: 'bookings' }] : []),
    ...(ctx.can('bookings') ? [{ href: '/partner/calendar', label: 'Calendar', icon: 'calendar' }] : []),
    ...(ctx.can('checkin') ? [{ href: '/partner/check-in', label: 'Check-in', icon: 'checkin' }] : []),
    ...(ctx.can('slots') ? [{ href: '/partner/slots', label: 'Manage Slots', icon: 'slots' }] : []),
    ...(ctx.can('pricing') ? [{ href: '/partner/pricing', label: 'Pricing', icon: 'pricing' }] : []),
    ...(ctx.can('payouts') ? [{ href: '/partner/analytics', label: 'Analytics', icon: 'analytics' }] : []),
    { href: '/partner/reviews', label: 'Reviews', icon: 'reviews' },
    ...(ctx.can('offers') ? [{ href: '/partner/offers', label: 'Offers', icon: 'offers' }] : []),
    ...(ctx.can('addons') ? [{ href: '/partner/add-ons', label: 'Add-ons', icon: 'addons' }] : []),
    ...(ctx.can('payouts') ? [{ href: '/partner/payouts', label: 'Payouts & GST', icon: 'payouts' }] : []),
    ...(ctx.can('staff') ? [{ href: '/partner/staff', label: 'Staff', icon: 'staff' }] : []),
    ...(ctx.can('turf') ? [{ href: '/partner/turf', label: 'My Turf', icon: 'turf' }] : []),
    ...(ctx.can('turf') ? [{ href: '/partner/courts', label: 'Courts & Pitches', icon: 'courts' }] : []),
  ];

  // Phone tab bar: the most used pages this role can open
  const tabs = ['/partner', '/partner/bookings', '/partner/calendar', '/partner/slots', '/partner/check-in', '/partner/reviews']
    .map((href) => nav.find((n) => n.href === href))
    .filter((n): n is NavItem => Boolean(n))
    .slice(0, 4);

  return (
    <div className={styles.layout}>
      <MobileDrawerClose />
      <input type="checkbox" id="mobile-menu" className={styles.mobileMenuToggle} aria-hidden="true" tabIndex={-1} />
      <label htmlFor="mobile-menu" className={styles.mobileMenuOverlay} aria-label="Close menu"></label>
      
      <header className={`${styles.mobileHeader} noPrint`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}><NavIcon name="ball" size={18} /></span>
          <div className={styles.logoText}>
            <span className={styles.logoName}>OYUN</span>
            <span className={styles.logoTag}>Partner</span>
          </div>
        </Link>
        <DrawerButton open label="Open menu" className={styles.menuBtn}><NavIcon name="menu" size={20} /></DrawerButton>
      </header>

      <aside className={`${styles.sidebar} noPrint`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}><NavIcon name="ball" size={18} /></span>
            <div className={styles.logoText}>
              <span className={styles.logoName}>OYUN</span>
              <span className={styles.logoTag}>Partner</span>
            </div>
          </Link>
          <DrawerButton open={false} label="Close menu" className={styles.closeBtn}><NavIcon name="close" size={18} /></DrawerButton>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <div className={styles.navTitle}>Menu</div>
            <NavLinks items={nav} linkClass={styles.navLink} activeClass={styles.active} iconClass={styles.navIcon} />
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navTitle}>Switch to</div>
            <Link href="/" title="Main site" className={styles.navLink}>
              <NavIcon name="site" className={styles.navIcon} /> Main site
            </Link>
            <Link href="/admin" title="Admin dashboard" className={styles.navLink}>
              <NavIcon name="shield" className={styles.navIcon} /> Admin dashboard
            </Link>
          </div>
          <SidebarToggle variant="button" className={styles.hideMenu} />
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>{ctx.userName.charAt(0)}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{ctx.userName}</div>
              <div className={styles.userTurf}>{ROLE_LABELS[ctx.role]} · {ctx.turf.name}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={`${styles.header} noPrint`}>
          <div className={styles.headerTitle}>
            <SidebarToggle className={styles.toggleBtn} />
            <HeaderPageTitle items={[...nav, { href: '/partner/invoices', label: 'Invoice' }]} fallback="Dashboard" className={styles.pageName} />
            <span className={styles.turfName}>
            {ctx.turfs.length > 1 ? (
              <ActionForm action={switchTurf} inline>
                <select name="turfId" defaultValue={ctx.turf.id} aria-label="Switch turf" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontWeight: 600 }}>
                  {ctx.turfs.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn--secondary btn--sm">Switch</button>
              </ActionForm>
            ) : (
              ctx.turf.name
            )}
            </span>
          </div>
          <div className={styles.headerActions}>
            {ctx.can('bookings') && (
              <form action="/partner/bookings" method="get" role="search" className={styles.headerSearch}>
                <input type="search" name="q" aria-label="Search bookings by name, phone or code" placeholder="Search bookings" />
              </form>
            )}
            <form action={logout.bind(null, 'partner')}>
              <button type="submit" className="btn btn--secondary btn--sm">Log Out</button>
            </form>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>

      <MobileTabBar items={tabs} />
    </div>
  );
}
