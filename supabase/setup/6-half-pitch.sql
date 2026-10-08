-- Half-pitch bookings: a pitch that splits down the middle can take one booking on half A
-- and another on half B in the same hour. A whole-pitch booking still takes both halves.
--
-- The old guard allowed one live booking (and one hold) per turf, date and hour. It is
-- replaced by two guards, one per half: a booking or hold of the whole pitch counts against
-- both, a half counts against its own. So A + B can share an hour; full + anything cannot.
-- Run before switching any turf to "Can be booked as two halves". Safe to run again.

alter table public.bookings
  add column if not exists pitch_part text generated always as (coalesce(data->>'pitch', 'full')) stored;
drop index if exists public.bookings_live_slot_uniq;
create unique index if not exists bookings_live_half_a_uniq on public.bookings (turf_id, slot_date, slot_hour)
  where status in ('confirmed', 'checked_in') and pitch_part in ('full', 'A');
create unique index if not exists bookings_live_half_b_uniq on public.bookings (turf_id, slot_date, slot_hour)
  where status in ('confirmed', 'checked_in') and pitch_part in ('full', 'B');

alter table public.holds
  add column if not exists pitch_part text generated always as (coalesce(data->>'pitch', 'full')) stored;
drop index if exists public.holds_slot_uniq;
create unique index if not exists holds_half_a_uniq on public.holds (turf_id, slot_date, slot_hour)
  where pitch_part in ('full', 'A');
create unique index if not exists holds_half_b_uniq on public.holds (turf_id, slot_date, slot_hour)
  where pitch_part in ('full', 'B');
