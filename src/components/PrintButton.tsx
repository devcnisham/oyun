'use client';

export default function PrintButton({ className, label = 'Print / Save as PDF' }: { className?: string; label?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
