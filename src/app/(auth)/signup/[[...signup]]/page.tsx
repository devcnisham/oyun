import { headers } from 'next/headers';
import { authReturnPath } from '@/modules/web/lib/auth-return';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import AuthShell from '@/modules/web/frontend/auth/_shell/AuthShell';
import PlayerForm from '@/modules/web/frontend/auth/_shell/PlayerForm';
import { clerkAppearance } from '@/modules/shared/frontend/auth/appearance';
import styles from '../../auth.module.css';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a free OYUN account to book venues faster and keep your bookings in one place.',
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams;
  const requestHeaders = await headers();
  const redirectTo = authReturnPath(redirect_url, requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? '');
  const query = `?redirect_url=${encodeURIComponent(redirectTo)}`;
  return (
    <AuthShell
      mode="signup" redirectTo={redirectTo}
      title="Create your account"
      subtitle="Keep your games, bookings and saved venues together."
      footer={<p>Already have an account? <Link href={`/login${query}`} className={styles.footerLink}>Sign in</Link></p>}
    >
      {clerkEnabled ? (
        <SignUp path="/signup" routing="path" signInUrl={`/login${query}`} fallbackRedirectUrl={redirectTo} appearance={{ ...clerkAppearance, variables: { ...clerkAppearance.variables, colorPrimary: '#4a0000' } }} />
      ) : (
        <PlayerForm mode="signup" redirectTo={redirectTo} />
      )}
    </AuthShell>
  );
}
