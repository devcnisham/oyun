'use client';

export default function ShareButton({ title, className }: { title: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      aria-label="Share"
      onClick={() => {
        if (navigator.share) navigator.share({ title, url: window.location.href }).catch(() => {});
        else navigator.clipboard?.writeText(window.location.href);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></svg>
    </button>
  );
}
