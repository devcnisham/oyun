'use client';

import { useEffect, useRef, type RefObject } from 'react';

// Small motion toolkit for the landing page. Everything writes CSS custom properties from requestAnimationFrame and only
// runs while its element is on screen, so the browser does the drawing (transform and opacity only). With reduced motion
// or a touch device the hooks do nothing and the CSS shows the finished, still state.

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));

/**
 * Writes --p (0 to 1) on the element as it scrolls.
 *  'leave'   0 while it fills the top of the page, 1 once it has scrolled out (a hero)
 *  'through' 0 as it enters the bottom of the screen, 1 as it leaves the top (a section)
 *  'pinned'  0 to 1 while a tall element's sticky child is on screen (a pinned scene)
 *  onChange gets the same value, for scenes that also need to know which step they are on.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, mode: 'leave' | 'through' | 'pinned' = 'through', onChange?: (p: number) => void) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let visible = true;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p =
        mode === 'leave' ? clamp(-r.top / Math.max(1, r.height * 0.85)) : mode === 'pinned' ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    };
    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, mode]);
}

/** Writes --mx and --my (each -0.5 to 0.5) on the element from the pointer position over it. Mouse and pen only. */
export function usePointerVars(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !canHover()) return;
    let frame = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty('--mx', nx.toFixed(3));
      el.style.setProperty('--my', ny.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      nx = clamp((e.clientX - r.left) / r.width, 0, 1) - 0.5;
      ny = clamp((e.clientY - r.top) / r.height, 0, 1) - 0.5;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
