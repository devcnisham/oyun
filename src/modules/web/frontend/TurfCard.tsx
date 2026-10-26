import type { PublicTurf } from '@/modules/shared/database/types';
import VenueCard from '@/modules/web/frontend/main/_booking/VenueCard';

// Home, search results and saved venues use one card and one sizing system.
export default function TurfCard({ turf, eager = false, compact = false, date }: {
  turf: PublicTurf & { availableToday?: number };
  eager?: boolean;
  compact?: boolean;
  date?: string;
}) {
  return <VenueCard turf={turf} eager={eager} date={date} showSave showAmenities={!compact} />;
}
