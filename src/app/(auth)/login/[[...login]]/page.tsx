import type { Metadata } from 'next';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/clerk';
import AuthShell from '../../_shell/AuthShell';
import NotConfigured from '../../_shell/NotConfigured';
import { clerkAppearance } from '../../_shell/appearance';
import styles from '../../auth.module.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OYUN to see your bookings on any device and book turfs faster.',
  alternates: { canonical: '/login' },
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your bookings on any device."
      tagline="Your next game is just a tap away."
      footer={
        <>
          <p>New to OYUN? <Link href="/signup" className={styles.footerLink}>Create an account</Link></p>
          <p className={styles.partnerNote}>Own a turf? <Link href="/partner/login" className={styles.footerLink}>Partner login</Link></p>
        </>
      }
    >
      {clerkEnabled ? <SignIn path="/login" routing="path" signUpUrl="/signup" fallbackRedirectUrl="/" appearance={clerkAppearance} /> : <NotConfigured />}
    </AuthShell>
  );
}
