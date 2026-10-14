import { bookingRevenue, onlineCollected } from './reports';
import { commissionFor } from './pricing';
import type { Database, Turf } from './types';

export interface AreaMetric {
  area: string;
  bookingsCount: number;
  revenue: number;
  turfCount: number;
}

export interface SportMetric {
  sport: string;
  bookingsCount: number;
  revenue: number;
}

export interface TurfPerformance {
  id: string;
  name: string;
  area: string;
  bookingsCount: number;
  revenue: number;
  rating: number;
  reviewCount: number;
}

export interface HourlyDistribution {
  hour: number;
  label: string;
  bookingsCount: number;
  isPeak: boolean;
}

export interface PlatformAnalytics {
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  checkedInBookings: number;
  noShowBookings: number;
  totalGmv: number;
  totalOnlineCollected: number;
  totalCommissionEarned: number;
  checkInRatePercent: number;
  cancellationRatePercent: number;
  noShowRatePercent: number;
  averageBookingValue: number;
  areaBreakdown: AreaMetric[];
  sportBreakdown: SportMetric[];
  topTurfs: TurfPerformance[];
  hourlyDistribution: HourlyDistribution[];
}

export function computePlatformAnalytics(db: Database): PlatformAnalytics {
  const allBookings = db.bookings ?? [];
  const totalBookings = allBookings.length;

  const confirmed = allBookings.filter((b) => b.status === 'confirmed').length;
  const checkedIn = allBookings.filter((b) => b.status === 'checked_in').length;
  const cancelled = allBookings.filter((b) => b.status === 'cancelled' || b.status === 'refunded').length;
  const noShow = allBookings.filter((b) => b.status === 'no_show').length;
  const activeBookings = confirmed + checkedIn;

  const totalGmv = allBookings.reduce((sum, b) => sum + bookingRevenue(b), 0);
  const totalOnlineCollected = allBookings.reduce((sum, b) => sum + onlineCollected(b), 0);

  const turfMap = new Map<string, Turf>();
  for (const t of db.turfs ?? []) turfMap.set(t.id, t);

  const totalCommissionEarned = allBookings.reduce((sum, b) => {
    const turf = turfMap.get(b.turfId);
    if (!turf) return sum;
    const rate = commissionFor(db, turf);
    return sum + Math.round((onlineCollected(b) * rate) / 100);
  }, 0);

  const completedOrConfirmed = activeBookings + noShow;
  const checkInRatePercent = completedOrConfirmed > 0 ? Math.round((checkedIn / completedOrConfirmed) * 100) : 0;
  const cancellationRatePercent = totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0;
  const noShowRatePercent = completedOrConfirmed > 0 ? Math.round((noShow / completedOrConfirmed) * 100) : 0;
  const averageBookingValue = activeBookings > 0 ? Math.round(totalGmv / activeBookings) : 0;

  // 1. Area breakdown
  const areaStats = new Map<string, { bookings: number; revenue: number; turfs: Set<string> }>();
  for (const turf of db.turfs ?? []) {
    const a = turf.area || 'Other';
    if (!areaStats.has(a)) areaStats.set(a, { bookings: 0, revenue: 0, turfs: new Set() });
    areaStats.get(a)!.turfs.add(turf.id);
  }

  for (const b of allBookings) {
    if (b.status === 'cancelled' || b.status === 'refunded') continue;
    const turf = turfMap.get(b.turfId);
    const a = turf?.area || 'Other';
    const curr = areaStats.get(a) ?? { bookings: 0, revenue: 0, turfs: new Set() };
    curr.bookings += 1;
    curr.revenue += bookingRevenue(b);
    areaStats.set(a, curr);
  }

  const areaBreakdown: AreaMetric[] = Array.from(areaStats.entries())
    .map(([area, stat]) => ({
      area,
      bookingsCount: stat.bookings,
      revenue: stat.revenue,
      turfCount: stat.turfs.size,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.bookingsCount - a.bookingsCount);

  // 2. Sport breakdown
  const sportStats = new Map<string, { bookings: number; revenue: number }>();
  for (const b of allBookings) {
    if (b.status === 'cancelled' || b.status === 'refunded') continue;
    const turf = turfMap.get(b.turfId);
    const sports = turf?.sports ?? ['Football'];
    const primarySport = sports[0] ?? 'Football';
    const curr = sportStats.get(primarySport) ?? { bookings: 0, revenue: 0 };
    curr.bookings += 1;
    curr.revenue += bookingRevenue(b);
    sportStats.set(primarySport, curr);
  }

  const sportBreakdown: SportMetric[] = Array.from(sportStats.entries())
    .map(([sport, stat]) => ({
      sport,
      bookingsCount: stat.bookings,
      revenue: stat.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 3. Hourly distribution
  const hourCounts = new Array(24).fill(0);
  for (const b of allBookings) {
    if (b.status === 'cancelled' || b.status === 'refunded') continue;
    if (b.hour >= 0 && b.hour < 24) {
      hourCounts[b.hour] += 1;
    }
  }

  const hourlyDistribution: HourlyDistribution[] = hourCounts.map((count, hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
    const isPeak = hour >= 17 && hour <= 22; // 5 PM - 10 PM
    return {
      hour,
      label,
      bookingsCount: count,
      isPeak,
    };
  });

  // 4. Turf performance
  const turfPerf = new Map<string, { bookings: number; revenue: number }>();
  for (const b of allBookings) {
    if (b.status === 'cancelled' || b.status === 'refunded') continue;
    const curr = turfPerf.get(b.turfId) ?? { bookings: 0, revenue: 0 };
    curr.bookings += 1;
    curr.revenue += bookingRevenue(b);
    turfPerf.set(b.turfId, curr);
  }

  const topTurfs: TurfPerformance[] = (db.turfs ?? [])
    .map((t) => {
      const perf = turfPerf.get(t.id) ?? { bookings: 0, revenue: 0 };
      return {
        id: t.id,
        name: t.name,
        area: t.area,
        bookingsCount: perf.bookings,
        revenue: perf.revenue,
        rating: t.rating ?? 0,
        reviewCount: t.reviewCount ?? 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.bookingsCount - a.bookingsCount);

  return {
    totalBookings,
    activeBookings,
    cancelledBookings: cancelled,
    checkedInBookings: checkedIn,
    noShowBookings: noShow,
    totalGmv,
    totalOnlineCollected,
    totalCommissionEarned,
    checkInRatePercent,
    cancellationRatePercent,
    noShowRatePercent,
    averageBookingValue,
    areaBreakdown,
    sportBreakdown,
    topTurfs,
    hourlyDistribution,
  };
}
