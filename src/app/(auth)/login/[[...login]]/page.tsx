import { headers } from 'next/headers';
import { authReturnPath } from '@/modules/web/lib/auth-return';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import AuthShell from '@/modules/web/frontend/auth/_shell/AuthShell';
import PlayerForm from '@/modules/web/frontend/auth/_shell/PlayerForm';
import { clerkAppearance } from '@/modules/shared/frontend/auth/appearance';
import styles from '../../auth.module.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OYUN to see your bookings and book venues faster.',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams;
  const requestHeaders = await headers();
  const redirectTo = authReturnPath(redirect_url, requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? '');
  const query = `?redirect_url=${encodeURIComponent(redirectTo)}`;
  return (
    <AuthShell
      mode="login" redirectTo={redirectTo}
      title="Welcome back"
      subtitle="Your bookings and favourite venues, all in one place."
      footer={<p>New to OYUN? <Link href={`/signup${query}`} className={styles.footerLink}>Create an account</Link></p>}
    >
      {clerkEnabled ? (
        <SignIn path="/login" routing="path" signUpUrl={`/signup${query}`} fallbackRedirectUrl={redirectTo} appearance={{ ...clerkAppearance, variables: { ...clerkAppearance.variables, colorPrimary: '#4a0000' } }} />
      ) : (
        <PlayerForm mode="login" redirectTo={redirectTo} />
      )}
    </AuthShell>
  );
}
