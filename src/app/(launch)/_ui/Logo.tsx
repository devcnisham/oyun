// OYUN mark: red shield with the stroke and ball. The id is per use so two logos on one page do not share a gradient.
export default function Logo({ id, size = 36 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill={`url(#${id})`} />
      <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="12" r="2.5" fill="white" />
      <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id={id} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0192f" />
          <stop offset="1" stopColor="#6b0010" />
        </linearGradient>
      </defs>
    </svg>
  );
}
