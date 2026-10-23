'use client';

import { useFavourites } from '@/modules/web/frontend/hooks/favourites';

// Heart toggle that saves a turf to the player's favourites
export default function FavouriteButton({ turfId, turfName, className }: { turfId: string; turfName: string; className?: string }) {
  const { has, toggle } = useFavourites();
  const saved = has(turfId);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${turfName} from saved turfs` : `Save ${turfName}`}
      title={saved ? 'Saved' : 'Save turf'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(turfId);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? '#d31027' : 'none'} stroke={saved ? '#d31027' : 'currentColor'} strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
