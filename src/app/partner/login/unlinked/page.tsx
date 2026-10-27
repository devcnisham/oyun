import type { Metadata } from 'next';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { connection } from 'next/server';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import styles from '@/modules/shared/frontend/auth/LoginScreen.module.css';

export const metadata: Metadata = { title: 'No partner account yet' };

// Shown after a Google or Apple sign-in whose email is not an approved partner
export default async function UnlinkedPage() {
  await connection();
  const user = clerkEnabled ? await currentUser() : null;
  const email = user?.primaryEmailAddress?.emailAddress;
  return (
    <div className={styles.loginContainer}>
      <div className={styles.rightPane} style={{ width: '100%' }}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h2>No partner account yet</h2>
            <p>
              {email ? <>You signed in as <b>{email}</b>, but that email is not linked to an approved venue. </> : <>That sign-in is not linked to an approved venue. </>}
              Apply to list your venue and we will approve it, then you can sign in with the same account.
            </p>
          </div>
          <Link href="/list-turf" className={styles.loginBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>List your venue</Link>
          <div className={styles.partnerPrompt}>
            {clerkEnabled && (
              <SignOutButton redirectUrl="/partner/login">
                <button type="button" className={styles.partnerLink} style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>Use a different account</button>
              </SignOutButton>
            )}
            <Link href="/partner/login" className={styles.partnerLink}>Back to partner login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
