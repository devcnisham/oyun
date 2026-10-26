import { SignIn, SignUp } from '@clerk/nextjs';
import { clerkAppearance } from '@/modules/shared/frontend/auth/appearance';

// Google and Apple only: Clerk's email form is hidden so partners sign in either with a social account or the password form below
const appearance = {
  ...clerkAppearance,
  elements: { ...clerkAppearance.elements, form: { display: 'none' }, dividerRow: { display: 'none' } },
};

export function PartnerSignIn() {
  return <SignIn path="/partner/login" routing="path" signUpUrl="/partner/signup" fallbackRedirectUrl="/partner/login/sso" appearance={appearance} />;
}

export function PartnerSignUp() {
  return <SignUp path="/partner/signup" routing="path" signInUrl="/partner/login" fallbackRedirectUrl="/partner/login/sso" appearance={appearance} />;
}
