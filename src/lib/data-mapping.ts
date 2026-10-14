import type { PublicTurf, Turf } from './types';

export interface MappedVenue {
  id: string;
  slug: string;
  name: string;
  status: string;
  isVerified: boolean;
  address: string;
  phone: string;
  description: string;
  pricePerHour: number;
}

export interface MappedResource {
  id: string;
  venueSlug: string;
  name: string;
  sort: number;
  active: boolean;
}

export interface MappedBookable {
  id: string;
  venueSlug: string;
  sport: string;
  name: string;
  slotMinutes: number;
  basePrice: number;
  sort: number;
  active: boolean;
  resourceNames: string[];
}

export interface MappedTurfData {
  venue: MappedVenue;
  resources: MappedResource[];
  bookables: MappedBookable[];
}

/**
 * Maps a turf into the v2 relational model:
 * - Plain turf -> 1 resource (Main Pitch), 1 bookable (Full pitch)
 * - halfPitch turf -> 2 resources (Half A, Half B), 3 bookables (Full, Half A, Half B)
 * - Badminton/Pickleball -> Court 1, Court 2 resources and corresponding bookables
 */
export function mapTurfToVenue(turf: Turf | PublicTurf): MappedTurfData {
  const isBadminton = turf.sports.some((s) => s.toLowerCase() === 'badminton');
  const isPickleball = turf.sports.some((s) => s.toLowerCase() === 'pickleball');
  const isCricket = turf.sports.some((s) => s.toLowerCase().includes('cricket'));
  const primarySport = isBadminton ? 'badminton' : isCricket ? 'box_cricket' : 'football';

  const venue: MappedVenue = {
    id: `ven_${turf.id}`,
    slug: turf.id,
    name: turf.name,
    status: turf.status,
    isVerified: turf.isVerified,
    address: turf.location,
    phone: turf.phone,
    description: turf.description,
    pricePerHour: turf.pricePerHour,
  };

  const resources: MappedResource[] = [];
  const bookables: MappedBookable[] = [];

  if (turf.halfPitch) {
    resources.push(
      { id: `res_${turf.id}_ha`, venueSlug: turf.id, name: 'Half A', sort: 0, active: true },
      { id: `res_${turf.id}_hb`, venueSlug: turf.id, name: 'Half B', sort: 1, active: true }
    );
    const halfPct = turf.halfPricePercent ?? 50;
    const halfPrice = Math.round((turf.pricePerHour * halfPct) / 100);

    bookables.push(
      {
        id: `bk_${turf.id}_full`,
        venueSlug: turf.id,
        sport: primarySport,
        name: 'Full pitch',
        slotMinutes: 60,
        basePrice: turf.pricePerHour,
        sort: 0,
        active: true,
        resourceNames: ['Half A', 'Half B'],
      },
      {
        id: `bk_${turf.id}_ha`,
        venueSlug: turf.id,
        sport: primarySport,
        name: 'Half pitch A',
        slotMinutes: 60,
        basePrice: halfPrice,
        sort: 1,
        active: true,
        resourceNames: ['Half A'],
      },
      {
        id: `bk_${turf.id}_hb`,
        venueSlug: turf.id,
        sport: primarySport,
        name: 'Half pitch B',
        slotMinutes: 60,
        basePrice: halfPrice,
        sort: 2,
        active: true,
        resourceNames: ['Half B'],
      }
    );
  } else if (isBadminton || isPickleball) {
    resources.push(
      { id: `res_${turf.id}_c1`, venueSlug: turf.id, name: 'Court 1', sort: 0, active: true },
      { id: `res_${turf.id}_c2`, venueSlug: turf.id, name: 'Court 2', sort: 1, active: true }
    );

    let sortIdx = 0;
    if (isBadminton) {
      bookables.push(
        {
          id: `bk_${turf.id}_bd1`,
          venueSlug: turf.id,
          sport: 'badminton',
          name: 'Badminton court 1',
          slotMinutes: 60,
          basePrice: turf.pricePerHour,
          sort: sortIdx++,
          active: true,
          resourceNames: ['Court 1'],
        },
        {
          id: `bk_${turf.id}_bd2`,
          venueSlug: turf.id,
          sport: 'badminton',
          name: 'Badminton court 2',
          slotMinutes: 60,
          basePrice: turf.pricePerHour,
          sort: sortIdx++,
          active: true,
          resourceNames: ['Court 2'],
        }
      );
    }
    if (isPickleball) {
      const pbPrice = Math.round(turf.pricePerHour * 0.6);
      bookables.push(
        {
          id: `bk_${turf.id}_pb1`,
          venueSlug: turf.id,
          sport: 'pickleball',
          name: 'Pickleball on court 1',
          slotMinutes: 30,
          basePrice: pbPrice,
          sort: sortIdx++,
          active: true,
          resourceNames: ['Court 1'],
        },
        {
          id: `bk_${turf.id}_pb2`,
          venueSlug: turf.id,
          sport: 'pickleball',
          name: 'Pickleball on court 2',
          slotMinutes: 30,
          basePrice: pbPrice,
          sort: sortIdx++,
          active: true,
          resourceNames: ['Court 2'],
        }
      );
    }
  } else {
    resources.push({
      id: `res_${turf.id}_main`,
      venueSlug: turf.id,
      name: 'Main Pitch',
      sort: 0,
      active: true,
    });
    bookables.push({
      id: `bk_${turf.id}_full`,
      venueSlug: turf.id,
      sport: primarySport,
      name: 'Full pitch',
      slotMinutes: 60,
      basePrice: turf.pricePerHour,
      sort: 0,
      active: true,
      resourceNames: ['Main Pitch'],
    });
  }

  return { venue, resources, bookables };
}
