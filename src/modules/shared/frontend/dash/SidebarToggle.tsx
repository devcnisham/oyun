'use client';

import { useEffect, useRef, useState } from 'react';
import BrandMark from '@/modules/shared/frontend/BrandMark';

const KEY = 'oyun:sidebar-hidden';
const ATTR = 'data-sidebar';

function apply(hidden: boolean) {
  if (hidden) document.documentElement.setAttribute(ATTR, 'hidden');
  else document.documentElement.removeAttribute(ATTR);
}

// Collapses the dashboard sidebar to an icon rail and back. The choice is remembered per browser.
// Expanded it reads "OYUN"; collapsed it is just the OYUN logo.
export default function SidebarToggle({ className, variant = 'logo' }: { className?: string; variant?: 'logo' | 'button' }) {
  const [collapsed, setCollapsed] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(KEY) === '1';
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted preference after hydration
    setCollapsed(saved);
    apply(saved);
    return () => document.documentElement.removeAttribute(ATTR);
  }, []);

  // Collapsed rail: resting the cursor on the sidebar for 1s temporarily expands it (data-peek on the <aside>)
  useEffect(() => {
    if (variant !== 'button') return;
    const aside = btn.current?.closest('aside');
    if (!aside) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const enter = () => {
      clearTimeout(timer);
      timer = setTimeout(() => aside.setAttribute('data-peek', ''), 1000);
    };
    const leave = () => {
      clearTimeout(timer);
      aside.removeAttribute('data-peek');
    };
    aside.addEventListener('mouseenter', enter);
    aside.addEventListener('mouseleave', leave);
    return () => {
      clearTimeout(timer);
      aside.removeEventListener('mouseenter', enter);
      aside.removeEventListener('mouseleave', leave);
      aside.removeAttribute('data-peek');
    };
  }, [variant]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {}
  };

  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  if (variant === 'button') {
    // Bottom-of-sidebar hide / unhide button; the text sits in [data-sb-label] so the rail CSS can hide it
    return (
      <button ref={btn} type="button" className={className} onClick={toggle} aria-pressed={collapsed} aria-label={label} title={label}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {collapsed ? <path d="M7 6l6 6-6 6M13 6l6 6-6 6" /> : <path d="M17 6l-6 6 6 6M11 6l-6 6 6 6" />}
        </svg>
        <span data-sb-label>{collapsed ? 'Show menu' : 'Hide menu'}</span>
      </button>
    );
  }
  return (
    <button type="button" className={className} onClick={toggle} aria-pressed={collapsed} aria-label={label} title={label}>
      {collapsed ? (
        <span style={{ display: 'block', margin: '0 auto', width: 26 }}><BrandMark size={26} shadow={false} /></span>
      ) : (
        <span style={{ fontFamily: 'var(--font-wordmark-family)', fontWeight: 800, letterSpacing: 0 }}>OYUN</span>
      )}
    </button>
  );
}
