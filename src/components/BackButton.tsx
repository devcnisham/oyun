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
  const floating = !className;
  const link = (
    <a
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
  // The floating button leaves its old spot empty so it never covers the page heading
  return floating ? (
    <>
      <span className="floatingBackSpacer" aria-hidden />
      {link}
    </>
  ) : (
    link
  );
}
