import { useId } from 'react';

/**
 * The approved OYUN mark: the deep-red shield with the stroke and ball, drawn exactly like the navbar and footer.
 * Colours come from the brand tokens (--logo-from / --logo-to in globals.css). Use this everywhere instead of a copy.
 * Pair it with the wordmark: font-family var(--font-wordmark-family), weight 800, letter-spacing 0 (see .brand-wordmark in globals.css).
 */
export default function BrandMark({ size = 36, shadow = true, className }: { size?: number; shadow?: boolean; className?: string }) {
  const id = `brandMark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', ...(shadow ? { filter: 'drop-shadow(0 6px 12px rgba(100, 0, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' } : {}) }}
    >
      <circle cx="20" cy="20" r="18" fill={`url(#${id})`} />
      <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="12" r="2.5" fill="white" />
      <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id={id} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--logo-from, #9e0a0a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-to, #4a0000)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
