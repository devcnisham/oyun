import type { PlatformSettings } from '@/modules/shared/database/types';

// Questions shown on /faq and /help (and in the FAQ search data)
export function buildFaqs(s: PlatformSettings) {
  return [
    {
      q: 'How do I book a turf on OYUN?',
      a: 'Open a turf, pick a date and tap one or more free slots, then press Proceed. Your slots are held for you for 8 minutes while you sign in and reserve. You get a booking with a QR code straight away. Nothing is charged online: you pay the turf by cash or UPI, starting with an advance of ₹150 per hour when you arrive, and the balance after you play.',
    },
    {
      q: 'What does "On hold" mean on a slot?',
      a: 'Another player is reserving that slot right now. Holds last 8 minutes; if they don\'t finish in time the slot opens up again automatically. Slot maps update live, so you see it the moment it changes.',
    },
    {
      q: 'Do I need an account to book?',
      a: 'Yes, a free OYUN account. Sign in or sign up with your mobile number when you reserve. Your bookings appear under My bookings, and you can install OYUN to your home screen like an app.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Open your booking and tap Cancel booking, up to 2 hours before your slot. Any advance or wallet deduction is credited back to your OYUN wallet immediately. Within 2 hours of the slot, self-cancellation closes; please contact the turf or OYUN support.',
    },
    {
      q: 'What is the rain and weather cancellation policy?',
      a: 'For open-air outdoor turfs in Mangalore, our Monsoon Rain Guarantee gives you a 100% full wallet refund if matches are rained out or the turf is waterlogged, even right up until your scheduled slot time.',
    },
    {
      q: 'How do I check in at the turf?',
      a: 'Show the QR code on your booking page at the front desk. Staff scan it to check you in, and you pay the turf by cash or UPI.',
    },
    {
      q: 'Do I earn cashback?',
      a: s.cashbackEnabled
        ? `Yes. You earn ${s.cashbackPercent}% cashback (up to ₹${s.cashbackMax}) in your OYUN wallet when you check in for a game.`
        : 'Cashback offers run from time to time and are shown at checkout when available.',
    },
    {
      q: 'Do I need to bring my own equipment?',
      a: 'Most turfs have balls and bibs. Check the amenities on the turf page, or call the turf if you need anything specific.',
    },
    {
      q: 'How do I list my turf on OYUN?',
      a: 'Fill in the form on the List your turf page. Our team reviews it within 24–48 hours and sets up your partner dashboard for bookings, pricing, slots and payouts.',
    },
  ];
}
