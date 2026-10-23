'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavIcon from '@/modules/shared/frontend/dash/NavIcon';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavLinksProps {
  items: NavItem[];
  linkClass: string;
  activeClass: string;
  iconClass: string;
  exact?: string; // href that should only match exactly (the dashboard root)
}

export default function NavLinks({ items, linkClass, activeClass, iconClass, exact }: NavLinksProps) {
  const pathname = usePathname();
  const root = exact ?? items[0]?.href;
  return (
    <>
      {items.map((item) => {
        const active = item.href === root ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} title={item.label} className={`${linkClass} ${active ? activeClass : ''}`}>
            <NavIcon name={item.icon} className={iconClass} /> {item.label}
          </Link>
        );
      })}
    </>
  );
}
