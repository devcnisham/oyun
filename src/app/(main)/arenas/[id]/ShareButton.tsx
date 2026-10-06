'use client';

export default function ShareButton({ title, className }: { title: string; className?: string }) {
  return (
    <button
      className={className}
      aria-label="Share"
      onClick={() => {
        if (navigator.share) navigator.share({ title, url: window.location.href }).catch(() => {});
        else navigator.clipboard?.writeText(window.location.href);
      }}
    >
      ➦
    </button>
  );
}
