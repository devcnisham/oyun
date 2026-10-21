import LoginScreen from '@/components/auth/LoginScreen';
import { PartnerSignIn } from '@/components/auth/PartnerSocial';
import { clerkEnabled } from '@/lib/clerk';

// A catch-all so Clerk can use /partner/login/... for its Google and Apple redirects
export default function PartnerLoginPage() {
  return <LoginScreen role="partner" social={clerkEnabled ? <PartnerSignIn /> : undefined} />;
}
