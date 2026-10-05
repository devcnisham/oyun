# Slot Arena - Feature Roadmap

This document outlines the core features required to turn the Slot Arena frontend into a fully functional, production-ready premium turf booking platform. 

### 1. Backend & Database Integration (High Priority)
*Status: Not Started*
- [ ] Connect the app to a database (Supabase or Firebase).
- [ ] Create database schemas for `Turfs`, `Slots`, `Users`, and `Bookings`.
- [ ] Fetch turf data dynamically from the server instead of using hardcoded mock data.
- [ ] Implement real-time slot locking (when a slot is booked, it instantly becomes unavailable for others).

### 2. User Authentication & "My Bookings"
*Status: Not Started*
- [ ] Implement secure Sign Up / Login (Phone OTP, Google, or Email/Password).
- [ ] Build the **User Dashboard / Profile** page.
- [ ] Create a **My Bookings** page where users can view upcoming matches, past bookings, and download receipts.
- [ ] Build the Cancel/Reschedule flow allowing users to modify bookings based on the turf's cancellation policy.

### 3. Real Payment Gateway
*Status: Not Started*
- [ ] Integrate a payment provider (Razorpay, Stripe, or PhonePe).
- [ ] Handle the logic for "Pay 30% Advance" vs "Pay Full Amount" flows.
- [ ] Implement webhook listeners to capture payments and automatically issue booking confirmation invoices.

### 4. Partner / Turf Owner Dashboard
*Status: Working on demo data store*
- [x] Build the authenticated dashboard for Turf Owners.
- [x] Allow owners to add, edit, or delete their turf details, pricing, and images.
- [ ] Calendar view to manage daily/weekly bookings.
- [x] Manual slot blocking (e.g., blocking out time for maintenance or offline phone bookings).
- [x] Revenue tracking and payout management metrics.

### 5. Advanced Search, Map View, & Filters
*Status: Basic UI Complete, Advanced Pending*
- [ ] **Map View:** Add an interactive Google/Mapbox map toggle on the home page to search for turfs visually.
- [ ] **Advanced Filters:** Filter by price range, distance, specific dates/times, and amenities (e.g., "Only show turfs with Showers & Parking").

### 6. Reviews & Rating System
*Status: Not Started*
- [ ] Create a system to automatically prompt users to rate a turf out of 5 stars after their match concludes.
- [ ] Build a database schema for `Reviews`.
- [ ] Display dynamic, aggregate star ratings and text reviews on the individual turf pages.

### 7. Notification System (SMS/WhatsApp/Email)
*Status: Not Started*
- [ ] Integrate a messaging API (e.g., Twilio for SMS/WhatsApp, Resend for Email).
- [ ] Automate booking confirmation messages with Google Maps directions.
- [ ] Send automated reminders 2 hours before the booked slot time.
- [ ] Send cancellation or reschedule alerts.

### 8. Digital Wallet & Promo Engine
*Status: Not Started*
- [x] **Slot Arena Wallet:** Allow users to earn and store cashback credits from previous bookings to use on future matches.
- [x] **Promo Code Engine:** Build a backend system to generate, validate, and apply discount codes (e.g., `ARENA10`) dynamically at checkout.

### 9. Player Experience Extras
*Status: Not Started*
- [ ] **Split Payment:** Booker shares a UPI link so teammates can pay their share.
- [ ] **Find Players / Open Matches:** Post games that are short of players (e.g., "need 3 players, 7 PM Kankanady") and let others join.
- [ ] **Recurring Bookings:** Book the same slot every week at a discount.
- [ ] **Waitlist:** Automatically notify the next person when a booked slot is cancelled.
- [ ] **Favourites & Book Again:** One-tap rebooking of a user's usual turf.
- [ ] **Weather Alerts:** Rain warnings for outdoor turfs and a rain cancellation policy.
- [ ] **Teams & Tournaments:** Create teams, run mini-leagues, show fixtures and points tables.
- [x] **Referral Program:** Wallet credit for both the referrer and the new user.
- [ ] **Add to Calendar & Share to WhatsApp** after a booking is confirmed.

### 10. Advanced Partner Tools
*Status: Complete (demo data store — moves to the database with section 1)*
- [x] **Dynamic Pricing:** Peak/weekend pricing and discounts on slots still empty near game time.
- [x] **QR Check-in:** Scan at the gate to confirm attendance and track no-shows.
- [x] **Owner Offers:** Happy hours and first-time-player discounts.
- [x] **Staff Accounts:** Logins for managers who handle walk-in bookings.
- [x] **Payout Reports & GST Invoices.**
- [x] **Add-ons at Checkout:** Equipment rental (bibs, balls, shoes) and drinks.

### 11. Admin Operations
*Status: Mostly complete on demo data store*
- [x] **Turf Verification:** Approve or reject new listings and grant the verified badge.
- [x] **Refunds & Disputes:** Queue for handling refunds and booking disputes.
- [x] **Commission Settings:** Per-turf commission configuration and reports.
- [ ] **Moderation:** Moderate reviews and reports; ban abusive users.
- [ ] **Analytics:** Bookings by area, busiest hours, conversion rate.

### 12. Platform & Growth
*Status: Not Started*
- [ ] **PWA:** Installable mobile app with push notifications.
- [ ] **Multi-sport Support:** Box cricket, badminton, pickleball (the `sports` field already supports multiple sports).
- [ ] **Languages:** Kannada, Tulu, and Hindi versions of the site.
- [ ] **SEO:** Per-area landing pages (e.g., `/turfs/kankanady`), structured data, sitemap, and Open Graph preview images for each turf page.

### 13. Code Cleanup & Security
*Status: Complete*
- [x] Merge the duplicate `list-turf` and `list-your-turf` pages into one.
- [x] Replace `<img>` tags with `next/image` for faster page loads.
- [x] Replace the hardcoded home page area counts with real data (now derived from turf data; switch to the database with section 1).
- [x] Protect `/admin` and `/partner` routes behind authentication (temporary env-var logins; replace with real accounts in section 2).
- [x] Move promo code (`ARENA10`) and wallet balance checks to the server so they can't be bypassed in the browser (server action with demo data; move to the database in section 1).

---

### Suggested Build Order
1. Backend with Supabase
2. Phone OTP login
3. Razorpay payments
4. Partner dashboard functionality
5. Split payment and Find Players (key differentiators)

---

*Note: Check off boxes (`[x]`) as features are implemented.*
