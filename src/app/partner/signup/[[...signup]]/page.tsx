import { notFound } from 'next/navigation';
import LoginScreen from '@/modules/shared/frontend/auth/LoginScreen';
import { PartnerSignUp } from '@/modules/partner/frontend/auth/PartnerSocial';
import { clerkEnabled } from '@/modules/shared/lib/clerk';

export default function PartnerSignupPage() {
  if (!clerkEnabled) notFound();
  return <LoginScreen role="partner" mode="signup" social={<PartnerSignUp />} />;
}
