import LoginScreen from '@/modules/shared/frontend/auth/LoginScreen';
import { PartnerSignIn } from '@/modules/partner/frontend/auth/PartnerSocial';
import { clerkEnabled } from '@/modules/shared/lib/clerk';

// A catch-all so Clerk can use /partner/login/... for its Google and Apple redirects
export default function PartnerLoginPage() {
  return <LoginScreen role="partner" social={clerkEnabled ? <PartnerSignIn /> : undefined} />;
}
