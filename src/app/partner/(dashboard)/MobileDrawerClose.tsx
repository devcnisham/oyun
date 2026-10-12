'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const TOGGLE_ID = 'mobile-menu';
const EVENT = 'oyun:drawer';

function toggle() {
  return document.getElementById(TOGGLE_ID) as HTMLInputElement | null;
}

function setOpen(open: boolean) {
  const box = toggle();
  if (!box || box.checked === open) return;
  box.checked = open;
  window.dispatchEvent(new Event(EVENT));
}

// Closes the mobile drawer after navigation and on Escape.
export default function MobileDrawerClose() {
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}

// A real button for the checkbox-driven drawer, so it works from the keyboard and screen readers.
export function DrawerButton({ open, label, className, children }: { open: boolean; label: string; className?: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const sync = () => setExpanded(Boolean(toggle()?.checked));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return (
    <button type="button" className={className} aria-label={label} aria-expanded={expanded} aria-controls={TOGGLE_ID} onClick={() => setOpen(open)}>
      {children}
    </button>
  );
}
