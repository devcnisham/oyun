-- ⚠️ DELETES ALL OYUN DATA. Run this ONCE, before launch, only if the database already holds
-- test or demo data (sample bookings, players, iPhone giveaway…). The site then starts again
-- from the launch data (the 10 turfs, no bookings) the next time a page loads.
-- Never run it after real players have started booking.
select public.reset_state();
