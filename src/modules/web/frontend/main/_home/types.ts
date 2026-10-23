// What the phone home needs, trimmed to the fields it shows: it runs in the browser, so nothing private goes in here
export interface HomeTurf {
  id: string;
  name: string;
  area: string;
  size: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  image: string;
  availableToday: number;
  sports: string[];
}
export interface HomeSport { value: string; label: string; slug: string; image: string; count: number }
export interface HomeCollection { slug: string; label: string; count: number; image: string }
export interface HomeArea { name: string; slug: string; count: number }
export interface HomeMatch { id: string; turfName: string; sport: string; dateLabel: string; timeLabel: string; format: string; spotsLeft: number; host: string }
export interface HomeCoupon { code: string; title: string; note: string }
export interface HomeDeal { id: string; turfId: string; turfName: string; image: string; title: string; percentOff: number; when: string }
export interface HomePromo { id: string; title: string; subtitle: string; image: string }
export interface HomeData {
  turfs: HomeTurf[];
  sports: HomeSport[];
  collections: HomeCollection[];
  areas: HomeArea[];
  matches: HomeMatch[];
  coupons: HomeCoupon[];
  deals: HomeDeal[];
  promos: HomePromo[];
  offerMax: number;
  openSlots: number;
}
