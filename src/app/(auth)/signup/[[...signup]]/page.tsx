import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/clerk';
import AuthShell from '../../_shell/AuthShell';
import NotConfigured from '../../_shell/NotConfigured';
import { clerkAppearance } from '../../_shell/appearance';
import styles from '../../auth.module.css';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a free OYUN account to keep your bookings, wallet and details in one place.',
  alternates: { canonical: '/signup' },
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free, and it keeps your bookings and wallet in one place."
      tagline="Book Mangalore's best turfs in seconds."
      footer={
        <>
          <p>Already have an account? <Link href="/login" className={styles.footerLink}>Sign in</Link></p>
          <p className={styles.partnerNote}>Own a turf? <Link href="/list-turf" className={styles.footerLink}>List it on OYUN</Link></p>
        </>
      }
    >
      {clerkEnabled ? <SignUp path="/signup" routing="path" signInUrl="/login" fallbackRedirectUrl="/" appearance={clerkAppearance} /> : <NotConfigured />}
    </AuthShell>
  );
}
