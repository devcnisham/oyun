import { headers } from 'next/headers';

// Wraps the app in Clerk only when its keys are configured; otherwise renders children as-is.
// Clerk is imported on demand so a deployment without keys does not preload the Clerk client bundle on every page.
export default async function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read inline (not through lib/clerk) so the bundler drops the Clerk imports below when no key is set
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <>{children}</>;
  // The CSP allows scripts by nonce only ('strict-dynamic'), so Clerk's loader must carry this request's nonce
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const [{ ClerkProvider }, { default: ClerkProfileSync }] = await Promise.all([import('@clerk/nextjs'), import('./ClerkProfileSync')]);
  return (
    <ClerkProvider nonce={nonce} signInUrl="/login" signUpUrl="/signup" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" afterSignOutUrl="/">
      <ClerkProfileSync />
      {children}
    </ClerkProvider>
  );
}
