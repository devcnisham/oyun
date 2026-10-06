import { ClerkProvider } from '@clerk/nextjs';
import { clerkEnabled } from '@/lib/clerk';
import ClerkProfileSync from './ClerkProfileSync';

// Wraps the app in Clerk only when its keys are configured; otherwise renders children as-is
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <ClerkProvider signInUrl="/login" signUpUrl="/signup" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" afterSignOutUrl="/">
      <ClerkProfileSync />
      {children}
    </ClerkProvider>
  );
}
