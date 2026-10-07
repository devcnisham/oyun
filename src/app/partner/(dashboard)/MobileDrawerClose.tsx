'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileDrawerClose() {
  const pathname = usePathname();

  useEffect(() => {
    const checkbox = document.getElementById('mobile-menu') as HTMLInputElement;
    if (checkbox && checkbox.checked) {
      checkbox.checked = false;
    }
  }, [pathname]);

  return null;
}
