import { notFound } from 'next/navigation';
import LoginScreen from '@/components/auth/LoginScreen';
import { PartnerSignUp } from '@/components/auth/PartnerSocial';
import { clerkEnabled } from '@/lib/clerk';

export default function PartnerSignupPage() {
  if (!clerkEnabled) notFound();
  return <LoginScreen role="partner" mode="signup" social={<PartnerSignUp />} />;
}
