import type { Bookable, PublicTurf, Turf, VenueResource } from './types';

export interface RelationalVenueMapping {
  venue: {
    id: string;
    slug: string;
    name: string;
    city: string;
    address: string;
    openTime: string;
    closeTime: string;
    status: string;
    isVerified: boolean;
    commissionPercent: number | null;
    amenities: string[];
    images: string[];
    phone: string;
  };
  resources: VenueResource[];
  bookables: Bookable[];
}

/**
 * Maps a single Turf (from legacy/JSON store) to its physical resources and bookable offerings.
 *
 * Rules:
 * 1. If custom resources and bookables are already defined on the turf object, they are returned.
 * 2. If turf.halfPitch is true, creates 2 resources (Half A, Half B) and 3 bookables:
 *    - Full Pitch (occupies Half A + Half B)
 *    - Half Pitch A (occupies Half A)
 *    - Half Pitch B (occupies Half B)
 * 3. Otherwise (plain turf or single court), creates 1 physical resource and corresponding
 *    bookables for its sports/formats.
 */
export function mapTurfToResourcesAndBookables(turf: PublicTurf): {
  resources: VenueResource[];
  bookables: Bookable[];
} {
  if (turf.resources && turf.resources.length > 0 && turf.bookables && turf.bookables.length > 0) {
    return { resources: turf.resources, bookables: turf.bookables };
  }

  const primarySport = (turf.sports[0] ?? 'Football').toLowerCase().replace(/\s+/g, '_');

  if (turf.halfPitch) {
    const halfAId = `${turf.id}_half_a`;
    const halfBId = `${turf.id}_half_b`;

    const resources: VenueResource[] = [
      { id: halfAId, venueId: turf.id, name: 'Pitch Half A', sort: 0, active: true },
      { id: halfBId, venueId: turf.id, name: 'Pitch Half B', sort: 1, active: true },
    ];

    const halfPrice = Math.round((turf.pricePerHour * (turf.halfPricePercent ?? 50)) / 100);

    // A turf that names its halves (and its full size) shows those names; others keep the generic ones
    const names = turf.halfNames;
    const fullName = names ? turf.size : 'Full Pitch (7-a-side)';
    const halfAName = names?.A || 'Half Pitch A (5-a-side)';
    const halfBName = names?.B || 'Half Pitch B (5-a-side)';

    const bookables: Bookable[] = [
      {
        id: `${turf.id}_full`,
        venueId: turf.id,
        sport: primarySport,
        name: fullName,
        slotMinutes: 60,
        maxSlots: 6,
        basePrice: turf.pricePerHour,
        active: true,
        sort: 0,
        resourceIds: [halfAId, halfBId],
      },
      {
        id: `${turf.id}_half_a`,
        venueId: turf.id,
        sport: primarySport,
        name: halfAName,
        slotMinutes: 60,
        maxSlots: 6,
        basePrice: halfPrice,
        active: true,
        sort: 1,
        resourceIds: [halfAId],
      },
      {
        id: `${turf.id}_half_b`,
        venueId: turf.id,
        sport: primarySport,
        name: halfBName,
        slotMinutes: 60,
        maxSlots: 6,
        basePrice: halfPrice,
        active: true,
        sort: 2,
        resourceIds: [halfBId],
      },
    ];

    return { resources, bookables };
  }

  // Plain turf or multi-sport venue
  const resourceId = `${turf.id}_court_1`;
  const resources: VenueResource[] = [
    {
      id: resourceId,
      venueId: turf.id,
      name: turf.formats[0] ? `${turf.name} (${turf.formats[0]})` : 'Main Court',
      sort: 0,
      active: true,
    },
  ];

  const bookables: Bookable[] = turf.sports.map((sport, index) => {
    const sportCode = sport.toLowerCase().replace(/\s+/g, '_');
    const slotMinutes = sportCode === 'pickleball' ? 30 : 60;
    return {
      id: `${turf.id}_bk_${sportCode}`,
      venueId: turf.id,
      sport: sportCode,
      name: `${sport} (${turf.formats[index] ?? turf.size ?? 'Standard'})`,
      slotMinutes,
      maxSlots: 6,
      basePrice: turf.pricePerHour,
      active: true,
      sort: index,
      resourceIds: [resourceId],
    };
  });

  return { resources, bookables };
}

/**
 * Builds the complete relational payload for a venue, its opening hours,
 * physical resources, and bookables.
 */
export function mapTurfToRelationalVenue(turf: Turf): RelationalVenueMapping {
  const { resources, bookables } = mapTurfToResourcesAndBookables(turf);

  return {
    venue: {
      id: turf.id,
      slug: turf.id,
      name: turf.name,
      city: turf.city,
      address: turf.location,
      openTime: turf.openTime,
      closeTime: turf.closeTime,
      status: turf.status,
      isVerified: turf.isVerified,
      commissionPercent: turf.commissionPercent,
      amenities: turf.amenities,
      images: turf.images,
      phone: turf.phone,
    },
    resources,
    bookables,
  };
}

/** On a split pitch, a bookable that covers one physical half rather than the whole pitch. */
export function isHalfBookable(turf: { halfPitch?: boolean }, bookable: { resourceIds: string[] }): boolean {
  return Boolean(turf.halfPitch) && bookable.resourceIds.length === 1;
}
