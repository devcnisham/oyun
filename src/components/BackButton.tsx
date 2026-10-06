'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  /** Where to go when there is no previous page (opened in a new tab or from a search result) */
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children?: React.ReactNode;
}

// True when the previous history entry is an OYUN page (moved within the app, or arrived from another OYUN page)
function cameFromThisSite() {
  if ((window as unknown as { __oyunNavigated?: boolean }).__oyunNavigated) return true;
  try {
    return document.referrer !== '' && new URL(document.referrer).origin === window.location.origin && window.history.length > 1;
  } catch {
    return false;
  }
}

/*
 * Keeps the floating back button in view: it starts in its own spot at the top-left of the page and,
 * once that spot scrolls under the top bar, it pins itself just below the bar (or to the top of the
 * screen while the bar is hidden).
 */
function usePinned(enabled: boolean) {
  const spot = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let settleUntil = 0;
    const place = () => {
      frame = 0;
      const el = button.current;
      const anchor = spot.current;
      if (!el || !anchor) return;
      const rect = anchor.getBoundingClientRect();
      const bar = document.querySelector('[data-app-header]');
      const barBottom = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
      const minTop = barBottom + 8;
      if (rect.top >= minTop) {
        delete el.dataset.pinned;
        el.style.top = '';
        el.style.left = '';
      } else {
        el.dataset.pinned = '';
        el.style.top = `${minTop}px`;
        el.style.left = `${rect.left}px`;
      }
      // keep following the top bar while it slides in or out
      if (performance.now() < settleUntil) frame = requestAnimationFrame(place);
    };
    const schedule = () => {
      settleUntil = performance.now() + 350;
      if (!frame) frame = requestAnimationFrame(place);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return { spot, button };
}

// Goes to the previous page like the browser's back button. Still a real link, so it works without JavaScript.
export default function BackButton({ fallback = '/', className, style, ariaLabel = 'Back', children }: BackButtonProps) {
  const router = useRouter();
  const floating = !className;
  const { spot, button } = usePinned(floating);
  const link = (
    <a
      ref={floating ? button : undefined}
      href={fallback}
      // Without a custom look it is the floating back button: pinned on screen and always on top
      className={floating ? 'floatingBack' : className}
      style={style}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work
        e.preventDefault();
        if (cameFromThisSite()) router.back();
        else router.push(fallback);
      }}
    >
      {children ?? (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="floatingBackLabel">Back</span>
        </>
      )}
    </a>
  );
  // The floating button sits in its own spot at the top-left and pins itself when that spot scrolls away
  return floating ? (
    <span ref={spot} className="floatingBackSpot">
      {link}
    </span>
  ) : (
    link
  );
}
