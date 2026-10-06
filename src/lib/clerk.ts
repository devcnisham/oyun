// Clerk (player sign-in / sign-up) switches on once its keys are set:
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from dashboard.clerk.com → API keys.
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
