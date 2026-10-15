'use client';

import { useRouter } from 'next/navigation';

// Big date field that opens the picker on a tap and jumps straight to the chosen day (no "Go" button)
export default function DateJump({ date, view = 'day', className }: { date: string; view?: string; className?: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      aria-label="Pick a date"
      defaultValue={date}
      className={className}
      onClick={(e) => {
        try {
          e.currentTarget.showPicker();
        } catch {}
      }}
      onChange={(e) => {
        if (e.target.value) router.push(`/partner/slots?view=${view}&date=${e.target.value}`);
      }}
    />
  );
}
