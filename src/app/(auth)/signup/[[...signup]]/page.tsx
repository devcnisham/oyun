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
  description: 'Create a free OYUN account to book turfs faster and keep your bookings in one place.',
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams;
  return (
    <AuthShell
      mode="signup"
      title="Create your account"
      subtitle="It's free and takes less than a minute."
      footer={<p>Already have an account? <Link href="/login" className={styles.footerLink}>Sign in</Link></p>}
    >
      {clerkEnabled ? (
        <SignUp path="/signup" routing="path" signInUrl="/login" fallbackRedirectUrl="/" appearance={clerkAppearance} />
      ) : (
        <PlayerForm mode="signup" redirectTo={redirect_url} />
      )}
    </AuthShell>
  );
}
