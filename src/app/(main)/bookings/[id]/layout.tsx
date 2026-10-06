import type { Metadata } from 'next';

// Personal booking tickets and invoices are never indexed
export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
