import PageSkeleton from '@/modules/shared/frontend/PageSkeleton';

// Shown while a turf's details and live slots load; a detail page reads as rows, not a card grid
export default function Loading() {
  return <PageSkeleton variant="venue" />;
}
