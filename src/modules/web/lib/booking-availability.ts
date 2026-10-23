// On a serverless host with no Supabase connection, data is kept in a temporary file that belongs to one
// server instance. A booking made there can vanish: the next request may land on another instance, so the
// ticket link shows "not found". Rather than hand players a ticket that may disappear, new holds and
// bookings are refused with a clear message until the database is connected.
// ALLOW_EPHEMERAL_BOOKINGS=true switches the check off, for demos where lost bookings do not matter.

export const BOOKINGS_NOT_SAVED_MESSAGE = 'Booking is not open on this site yet because its database is not connected. Please try again later.';

export function bookingsAreSaved({ shared, allowEphemeral }: { shared: boolean; allowEphemeral: boolean }) {
  return shared || allowEphemeral;
}
