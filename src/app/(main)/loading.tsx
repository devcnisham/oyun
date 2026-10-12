import PageSkeleton from '@/components/PageSkeleton';

// Shown inside the site shell while a public page loads
export default function Loading() {
  return <PageSkeleton variant="cards" />;
}
