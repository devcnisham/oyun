import type { Metadata } from 'next';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import AuthShell from '../../_shell/AuthShell';
import PlayerForm from '../../_shell/PlayerForm';
import { clerkAppearance } from '../../_shell/appearance';
import styles from '../../auth.module.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OYUN to see your bookings and book turfs faster.',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams;
  return (
    <AuthShell
      mode="login"
      title="Welcome back"
      subtitle="Sign in with Google, Apple or your email to book in a tap."
      footer={<p>New to OYUN? <Link href="/signup" className={styles.footerLink}>Create an account</Link></p>}
    >
      {clerkEnabled ? (
        <SignIn path="/login" routing="path" signUpUrl="/signup" fallbackRedirectUrl="/" appearance={clerkAppearance} />
      ) : (
        <PlayerForm mode="login" redirectTo={redirect_url} />
      )}
    </AuthShell>
  );
}
