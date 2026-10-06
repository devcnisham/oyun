'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  /** Where to go when there is no previous page (opened in a new tab or from a search result) */
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children?: React.ReactNode;
}

const defaultStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 24,
  color: 'var(--text-muted)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
};

// True when the previous history entry is an OYUN page (moved within the app, or arrived from another OYUN page)
function cameFromThisSite() {
  if ((window as unknown as { __oyunNavigated?: boolean }).__oyunNavigated) return true;
  try {
    return document.referrer !== '' && new URL(document.referrer).origin === window.location.origin && window.history.length > 1;
  } catch {
    return false;
  }
}

// Goes to the previous page like the browser's back button. Still a real link, so it works without JavaScript.
export default function BackButton({ fallback = '/', className, style, ariaLabel = 'Back', children }: BackButtonProps) {
  const router = useRouter();
  return (
    <a
      href={fallback}
      className={className}
      style={className ? style : { ...defaultStyle, ...style }}
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
          <span aria-hidden style={{ fontSize: 16 }}>←</span> Back
        </>
      )}
    </a>
  );
}
