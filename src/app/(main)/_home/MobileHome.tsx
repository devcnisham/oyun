import { areaSlug } from '@/lib/site';
import { CURATED_COLLECTIONS } from '@/lib/curated-collections';
import { SPORTS, sportSlug } from '@/lib/sports';
import type { OpenMatch, PromoCard, TurfSummary } from '@/lib/types';
import PhoneHome from './PhoneHome';
import type { HomeData } from './types';

interface Props {
  turfs: TurfSummary[];
  promos: PromoCard[];
  coupons: HomeData['coupons'];
  deals: HomeData['deals'];
  matches: OpenMatch[];
}

const dateLabel = (date: string) => new Date(`${date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

// The phone version of the home page: an app-style home with three modes (categories, turfs, play with others).
// Everything is prepared here on the server and trimmed, since the page itself runs in the browser.
export default function MobileHome({ turfs, promos, coupons, deals, matches }: Props) {
  const homeTurfs = turfs.map((t) => ({ id: t.id, name: t.name, area: t.area, size: t.size, rating: t.rating, reviewCount: t.reviewCount, pricePerHour: t.pricePerHour, image: t.images[0], availableToday: t.availableToday, sports: t.sports }));

  // Sports shown: the four main ones always, any other only once a venue offers it
  const sports = SPORTS.map((s) => ({ value: s.value, label: s.label, slug: sportSlug(s.value), image: s.image.replace('w=600', 'w=800'), count: turfs.filter((t) => t.sports.includes(s.value)).length })).filter((s, i) => i < 4 || s.count > 0);

  const collections = CURATED_COLLECTIONS.map((c) => {
    const hit = turfs.filter((t) => c.filter(t));
    return { slug: c.slug, label: c.badge, count: hit.length, image: hit[0]?.images[0] ?? '' };
  }).filter((c) => c.count > 0 && c.image);

  const areaNames = [...new Set(turfs.map((t) => t.area))].sort();
  const areas = areaNames.map((name) => ({ name, slug: areaSlug(name), count: turfs.filter((t) => t.area === name).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Open games: only first names and counts leave the server, never phone numbers
  const openMatches = matches
    .filter((m) => m.status === 'open')
    .map((m) => ({ id: m.id, turfName: m.turfName, sport: m.sport, dateLabel: dateLabel(m.date), timeLabel: m.timeLabel, format: m.format, spotsLeft: Math.max(0, m.playersNeeded - m.playersJoined.length), host: m.hostName.split(' ')[0] }))
    .filter((m) => m.spotsLeft > 0)
    .slice(0, 12);

  const data: HomeData = {
    turfs: homeTurfs,
    sports,
    collections,
    areas,
    matches: openMatches,
    coupons,
    deals,
    promos: promos.map((p) => ({ id: p.id, title: p.title, subtitle: p.subtitle, image: p.image })),
    offerMax: deals.reduce((m, d) => Math.max(m, d.percentOff), 0),
    openSlots: turfs.reduce((n, t) => n + t.availableToday, 0),
  };
  return <PhoneHome data={data} />;
}
