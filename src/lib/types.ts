export type TurfStatus = 'active' | 'pending' | 'maintenance' | 'suspended';

export interface Turf {
  id: string;
  name: string;
  location: string;
  area: string;
  city: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  sports: string[];
  amenities: string[];
  size: string;
  formats: string[];
  surface: string;
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
  images: string[];
  isVerified: boolean;
  isFeatured: boolean;
  description: string;
  ownerName: string;
  phone: string;
  status: TurfStatus;
  partnerId: string | null;
  commissionPercent: number | null; // null = platform default
  createdAt: string;
}

// Turf plus today's availability, for listing pages
export interface TurfSummary extends Turf {
  availableToday: number;
}

export type SlotUnavailableReason = 'booked' | 'blocked' | 'past' | 'held';

export interface Slot {
  date: string; // YYYY-MM-DD (IST)
  hour: number; // 0-23, start hour
  label: string; // "06:00 PM"
  basePrice: number;
  price: number;
  tags: string[];
  available: boolean;
  reason: SlotUnavailableReason | null;
  heldByYou?: boolean; // held for this device's checkout
}

export interface PricingRules {
  peakEnabled: boolean;
  peakStartHour: number;
  peakEndHour: number;
  peakPercent: number;
  weekendEnabled: boolean;
  weekendPercent: number;
  lastMinuteEnabled: boolean;
  lastMinuteHours: number;
  lastMinutePercent: number;
}

export type OfferType = 'happy_hour' | 'first_time';

export interface Offer {
  id: string;
  turfId: string;
  type: OfferType;
  title: string;
  percentOff: number;
  startHour: number; // happy hour only
  endHour: number; // happy hour only, exclusive
  active: boolean;
  createdAt: string;
}

export interface AddOn {
  id: string;
  turfId: string;
  name: string;
  price: number;
  active: boolean;
}

// Temporary lock on a slot while a player checks out (like a cinema seat)
export interface SlotHold {
  id: string;
  turfId: string;
  date: string;
  hour: number;
  holder: string; // sha256 of the device cookie
  expiresAt: string; // ISO
}

export interface SlotBlock {
  id: string;
  turfId: string;
  date: string;
  hour: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface BusinessInfo {
  legalName: string;
  gstin: string;
  address: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  status: 'active' | 'suspended';
  business: BusinessInfo;
  createdAt: string;
}

export type StaffRole = 'manager' | 'front_desk';

export interface StaffMember {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  passwordHash: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  phone: string; // 10 digits
  walletBalance: number;
  status: 'active' | 'banned';
  referralCode: string;
  referredBy: string | null; // player id of whoever referred them
  referralRewarded: boolean; // referral credit paid out after their first game
  createdAt: string;
}

export type WalletTxnType = 'cashback' | 'referral' | 'referral_bonus' | 'refund' | 'booking_payment' | 'admin_adjust';

export interface WalletTxn {
  id: string;
  playerId: string;
  amount: number; // positive = credit, negative = debit
  type: WalletTxnType;
  note: string;
  bookingId: string | null;
  createdAt: string;
}

export type BookingStatus = 'confirmed' | 'checked_in' | 'no_show' | 'cancelled' | 'refunded';

export interface BookingAddOn {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface PriceLine {
  label: string;
  amount: number; // negative = discount
}

export interface PriceBreakdown {
  basePrice: number;
  adjustments: PriceLine[]; // dynamic pricing
  slotPrice: number;
  offer: PriceLine | null;
  promo: PriceLine | null;
  addOnTotal: number;
  subtotal: number;
  walletDeduction: number;
  total: number;
  advance: number;
}

// venue: reserved online, paid at the turf; full/advance: paid online (when a payment gateway is connected)
export type PaymentMode = 'venue' | 'full' | 'advance' | 'cash' | 'upi';

export interface Booking {
  id: string;
  code: string; // check-in code shown as QR
  turfId: string;
  date: string;
  hour: number;
  timeLabel: string;
  customerName: string;
  customerPhone: string;
  playerId: string | null;
  source: 'online' | 'walk_in';
  createdBy: string | null; // partner/staff name for walk-ins
  addOns: BookingAddOn[];
  pricing: PriceBreakdown;
  paymentMode: PaymentMode;
  amountPaid: number;
  status: BookingStatus;
  checkedInAt: string | null;
  cashback?: number; // wallet credit given when the player checked in
  accountId?: string | null; // signed-in player account (Clerk user id) that made the booking
  review?: BookingReview | null; // the player's rating after playing
  cancelledAt?: string | null;
  createdAt: string;
}

export interface BookingReview {
  rating: number; // 1-5
  comment: string;
  name: string; // shown publicly, e.g. "Rahul S."
  createdAt: string;
  hidden: boolean; // hidden by OYUN moderation
}

export interface PromoCode {
  code: string;
  kind: 'percent' | 'flat';
  value: number;
  maxDiscount: number | null;
  weekendOnly: boolean;
  active: boolean;
  uses: number;
}

export interface PlatformSettings {
  commissionPercent: number;
  advancePercent: number;
  // The advance stays between these rupee amounts (and never above the booking total)
  minAdvance: number;
  maxAdvance: number;
  gstPercent: number;
  supportEmail: string;
  supportPhone: string;
  cashbackEnabled: boolean;
  cashbackPercent: number;
  cashbackMax: number;
  referralEnabled: boolean;
  referrerReward: number; // to the existing player who shared the code
  refereeReward: number; // to the new player who used it
}

export interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface SiteContent {
  heroTitle: string;
  announcement: string;
  announcementActive: boolean;
  promos: PromoCard[];
}

export interface Application {
  id: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  turfName: string;
  area: string;
  address: string;
  sport: string;
  size: string;
  surface: string;
  openTime: string;
  closeTime: string;
  weekdayPrice: number;
  description: string;
  whatsapp: string;
  amenities: string[];
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  turfId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Database {
  version: number;
  turfs: Turf[];
  partners: Partner[];
  staff: StaffMember[];
  players: Player[];
  bookings: Booking[];
  blocks: SlotBlock[];
  offers: Offer[];
  addOns: AddOn[];
  pricing: Record<string, PricingRules>;
  promoCodes: PromoCode[];
  settings: PlatformSettings;
  site: SiteContent;
  applications: Application[];
  walletTxns: WalletTxn[];
  holds: SlotHold[];
}

export type ActionResult = { ok?: string; error?: string; data?: Record<string, string> } | null;
