import PageSkeleton from '@/modules/shared/frontend/PageSkeleton';

// Shown inside the site shell while a public page loads
export default function Loading() {
  return <PageSkeleton variant="cards" />;
}
