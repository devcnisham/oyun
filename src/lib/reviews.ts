import type { Booking, BookingReview, Database } from './types';

export const REVIEW_MAX_LENGTH = 500;

export interface PublicReview {
  bookingId: string;
  turfId: string;
  rating: number;
  comment: string;
  name: string;
  createdAt: string;
  hidden: boolean;
}

function toPublic(b: Booking & { review: BookingReview }): PublicReview {
  return { bookingId: b.id, turfId: b.turfId, ...b.review };
}

// All reviews for a turf (or every turf), newest first; moderation can include hidden ones
export function turfReviews(db: Database, turfId: string | null, { includeHidden = false, limit = 50 } = {}) {
  return db.bookings
    .filter((b): b is Booking & { review: BookingReview } => Boolean(b.review) && (turfId === null || b.turfId === turfId))
    .filter((b) => includeHidden || !b.review.hidden)
    .map(toPublic)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// Keeps turf.rating / turf.reviewCount in step with the visible reviews
export function recomputeTurfRating(db: Database, turfId: string) {
  const turf = db.turfs.find((t) => t.id === turfId);
  if (!turf) return;
  const visible = turfReviews(db, turfId, { limit: Number.MAX_SAFE_INTEGER });
  turf.reviewCount = visible.length;
  turf.rating = visible.length ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10 : 0;
}

// "Rahul Shetty" -> "Rahul S."
export function publicName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Player';
  return parts.length === 1 ? parts[0].slice(0, 30) : `${parts[0].slice(0, 30)} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
