'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavIcon from '@/components/dash/NavIcon';
import { DrawerButton } from './MobileDrawerClose';
import styles from './MobileTabBar.module.css';

export interface TabItem {
  href: string;
  label: string;
  icon: string;
}

// App-style bottom tab bar for phones: the four most used pages plus "More", which opens the full menu drawer
export default function MobileTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();
  return (
    <nav className={`${styles.bar} noPrint`} aria-label="Main">
      {items.map((item) => {
        const active = item.href === '/partner' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`${styles.tab} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
            <NavIcon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <DrawerButton open label="Open menu" className={styles.tab}>
        <NavIcon name="menu" size={22} />
        <span>More</span>
      </DrawerButton>
    </nav>
  );
}
