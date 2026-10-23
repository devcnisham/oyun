import { describe, expect, test } from 'vitest';
import {
  addCourtResource,
  deleteCourtResource,
} from '@/modules/partner/backend/partner-actions';
import type { Turf } from '@/modules/shared/database/types';
import { mapTurfToRelationalVenue, mapTurfToResourcesAndBookables } from '@/modules/shared/lib/venue-mapping';

describe('Data mapping: turf to venue, resources, bookables (#134)', () => {
  const plainTurf: Turf = {
    id: 'turf_plain',
    name: 'Arena Central',
    location: 'Kodialbail, Mangalore',
    area: 'Kodialbail',
    city: 'Mangalore',
    rating: 4.8,
    reviewCount: 42,
    pricePerHour: 1200,
    sports: ['Football', 'Box Cricket'],
    amenities: ['Floodlights', 'Parking'],
    size: '6-a-side',
    formats: ['6-a-side'],
    surface: 'Artificial Turf',
    openTime: '06:00',
    closeTime: '23:00',
    images: ['/turfs/turf_1.jpg'],
    isVerified: true,
    isFeatured: false,
    description: 'Premier arena',
    ownerName: 'Sunil Kumar',
    phone: '9845012345',
    status: 'active',
    partnerId: 'partner_1',
    commissionPercent: 5,
    halfPitch: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const splitTurf: Turf = {
    id: 'turf_split',
    name: 'Mangalore Mega Arena',
    location: 'Kankanady, Mangalore',
    area: 'Kankanady',
    city: 'Mangalore',
    rating: 4.9,
    reviewCount: 88,
    pricePerHour: 1500,
    sports: ['Football'],
    amenities: ['Floodlights'],
    size: '7-a-side',
    formats: ['7-a-side', '5-a-side'],
    surface: 'FIFA Pro Turf',
    openTime: '06:00',
    closeTime: '01:00',
    images: ['/turfs/turf_2.jpg'],
    isVerified: true,
    isFeatured: true,
    description: 'Can be split into two halves',
    ownerName: 'Praveen Shetty',
    phone: '9845099999',
    status: 'active',
    partnerId: 'partner_1',
    commissionPercent: 5,
    halfPitch: true,
    halfPricePercent: 55,
    createdAt: '2026-01-01T00:00:00Z',
  };

  test('plain turf maps to 1 physical resource and bookables per sport', () => {
    const { resources, bookables } = mapTurfToResourcesAndBookables(plainTurf);

    expect(resources).toHaveLength(1);
    expect(resources[0].name).toContain('Arena Central');
    expect(resources[0].active).toBe(true);

    expect(bookables).toHaveLength(2); // Football and Box Cricket
    expect(bookables[0].name).toContain('Football');
    expect(bookables[0].resourceIds).toEqual([resources[0].id]);
    expect(bookables[0].basePrice).toBe(1200);

    expect(bookables[1].name).toContain('Box Cricket');
    expect(bookables[1].resourceIds).toEqual([resources[0].id]);
    expect(bookables[1].basePrice).toBe(1200);
  });

  test('halfPitch turf maps to 2 resources (Half A, Half B) and 3 bookables', () => {
    const { resources, bookables } = mapTurfToResourcesAndBookables(splitTurf);

    expect(resources).toHaveLength(2);
    expect(resources[0].name).toBe('Pitch Half A');
    expect(resources[1].name).toBe('Pitch Half B');

    expect(bookables).toHaveLength(3);
    const full = bookables.find((b) => b.name.includes('Full Pitch'));
    const halfA = bookables.find((b) => b.name.includes('Half Pitch A'));
    const halfB = bookables.find((b) => b.name.includes('Half Pitch B'));

    expect(full).toBeDefined();
    expect(full?.resourceIds).toEqual([resources[0].id, resources[1].id]);
    expect(full?.basePrice).toBe(1500);

    expect(halfA).toBeDefined();
    expect(halfA?.resourceIds).toEqual([resources[0].id]);
    expect(halfA?.basePrice).toBe(825); // 1500 * 55% = 825

    expect(halfB).toBeDefined();
    expect(halfB?.resourceIds).toEqual([resources[1].id]);
    expect(halfB?.basePrice).toBe(825);
  });

  test('mapTurfToRelationalVenue maps venue headers, address, and status', () => {
    const payload = mapTurfToRelationalVenue(splitTurf);

    expect(payload.venue.id).toBe('turf_split');
    expect(payload.venue.name).toBe('Mangalore Mega Arena');
    expect(payload.venue.city).toBe('Mangalore');
    expect(payload.resources).toHaveLength(2);
    expect(payload.bookables).toHaveLength(3);
  });

  test('custom turf resources and bookables are preserved when defined', () => {
    const customTurf: Turf = {
      ...plainTurf,
      resources: [
        { id: 'res_court_1', venueId: plainTurf.id, name: 'Badminton Court 1', sort: 0, active: true },
        { id: 'res_court_2', venueId: plainTurf.id, name: 'Badminton Court 2', sort: 1, active: true },
      ],
      bookables: [
        {
          id: 'bk_court_1',
          venueId: plainTurf.id,
          sport: 'badminton',
          name: 'Court 1 (Singles/Doubles)',
          slotMinutes: 60,
          maxSlots: 4,
          basePrice: 500,
          active: true,
          sort: 0,
          resourceIds: ['res_court_1'],
        },
      ],
    };

    const { resources, bookables } = mapTurfToResourcesAndBookables(customTurf);
    expect(resources).toHaveLength(2);
    expect(bookables).toHaveLength(1);
    expect(resources[1].name).toBe('Badminton Court 2');
  });

  test('partner actions: add and delete court resources reject without partner session', async () => {
    // Unauthenticated call returns error from requirePartnerAction guard
    const fd = new FormData();
    fd.set('name', 'Court 2');
    const res = await addCourtResource({ error: '' }, fd);
    expect(res?.error).toBeDefined();

    const delFd = new FormData();
    delFd.set('resourceId', 'res_1');
    const delRes = await deleteCourtResource({ error: '' }, delFd);
    expect(delRes?.error).toBeDefined();
  });
});
