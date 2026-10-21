import { redirect } from 'next/navigation';

// The countdown moved to /countdown; this keeps old links working
export default function WelcomeRedirect() {
  redirect('/countdown');
}
