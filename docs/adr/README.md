# Architecture decision records

One short file per decision that shaped OYUN, with what to watch for before reopening it. Add a new numbered file when you make a decision that is expensive to reverse. Format: context, decision, trade-off, reopen when.

- [0001 jsonb document store](0001-jsonb-document-store.md)
- [0002 global revision lock plus unique indexes](0002-global-revision-lock.md)
- [0003 advance recorded, not charged](0003-advance-recorded-not-charged.md)
- [0004 Clerk optional, device identity fallback](0004-clerk-optional.md)
- [0005 custom cookie sessions for admin and partner](0005-custom-cookie-auth.md)
- [0006 Realtime broadcast for slot freshness](0006-realtime-broadcast.md)
- [0007 delta sync](0007-delta-sync.md)
- [0008 Redis vs Postgres for holds, availability, and rate limits](0008-redis-vs-postgres.md)
