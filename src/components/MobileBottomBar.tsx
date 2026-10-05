'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileBottomBar.module.css';

export default function MobileBottomBar() {
  const pathname = usePathname();

  if (
    pathname === '/login' || 
    pathname === '/signup' || 
    (pathname.startsWith('/arenas/') && pathname !== '/arenas')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Bookings', href: '/user/bookings', icon: '📅' },
    { label: 'Search', href: '/arenas', icon: '🔍' },
    { label: 'Setting', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className={styles.bottomBar}>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
