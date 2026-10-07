import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { logout } from '@/lib/auth-actions';
import { ROLE_LABELS, requirePartner } from '@/lib/partner-auth';
import { switchTurf } from '@/lib/partner-actions';
import NavLinks, { type NavItem } from './NavLinks';
import MobileDrawerClose from './MobileDrawerClose';
import styles from './layout.module.css';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePartner();

  const nav: NavItem[] = [
    { href: '/partner', label: 'Dashboard', icon: '📊' },
    ...(ctx.can('bookings') ? [{ href: '/partner/bookings', label: 'Bookings', icon: '📅' }] : []),
    ...(ctx.can('checkin') ? [{ href: '/partner/check-in', label: 'Check-in', icon: '📷' }] : []),
    ...(ctx.can('slots') ? [{ href: '/partner/slots', label: 'Manage Slots', icon: '⏰' }] : []),
    ...(ctx.can('pricing') ? [{ href: '/partner/pricing', label: 'Pricing', icon: '💹' }] : []),
    { href: '/partner/reviews', label: 'Reviews', icon: '⭐' },
    ...(ctx.can('offers') ? [{ href: '/partner/offers', label: 'Offers', icon: '🏷️' }] : []),
    ...(ctx.can('addons') ? [{ href: '/partner/add-ons', label: 'Add-ons', icon: '🧃' }] : []),
    ...(ctx.can('payouts') ? [{ href: '/partner/payouts', label: 'Payouts & GST', icon: '💰' }] : []),
    ...(ctx.can('staff') ? [{ href: '/partner/staff', label: 'Staff', icon: '👥' }] : []),
    ...(ctx.can('turf') ? [{ href: '/partner/turf', label: 'My Turf', icon: '🏟️' }] : []),
  ];

  return (
    <div className={styles.layout}>
      <MobileDrawerClose />
      <input type="checkbox" id="mobile-menu" className={styles.mobileMenuToggle} aria-hidden="true" />
      <label htmlFor="mobile-menu" className={styles.mobileMenuOverlay} aria-label="Close menu"></label>
      
      <header className={`${styles.mobileHeader} noPrint`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚽</span>
          <div className={styles.logoText}>
            <span className={styles.logoName}>OYUN</span>
            <span className={styles.logoTag}>Partner</span>
          </div>
        </Link>
        <label htmlFor="mobile-menu" className={styles.menuBtn} aria-label="Open menu">☰</label>
      </header>

      <aside className={`${styles.sidebar} noPrint`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚽</span>
            <div className={styles.logoText}>
              <span className={styles.logoName}>OYUN</span>
              <span className={styles.logoTag}>Partner</span>
            </div>
          </Link>
          <label htmlFor="mobile-menu" className={styles.closeBtn} aria-label="Close menu">✕</label>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <div className={styles.navTitle}>Menu</div>
            <NavLinks items={nav} linkClass={styles.navLink} activeClass={styles.active} iconClass={styles.navIcon} />
          </div>
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
          </div>
          <div className={styles.headerActions}>
            <Link href={`/arenas/${ctx.turf.id}`} className="btn btn--secondary btn--sm" target="_blank">View public page</Link>
            <form action={logout.bind(null, 'partner')}>
              <button type="submit" className="btn btn--secondary btn--sm">Log Out</button>
            </form>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
