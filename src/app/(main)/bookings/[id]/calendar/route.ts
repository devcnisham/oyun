import { getDb } from '@/lib/store';
import { absoluteUrl } from '@/lib/site';

// "Add to calendar": the booking as an .ics event (works with Google, Apple and Outlook calendars)
const ics = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  const turf = booking && db.turfs.find((t) => t.id === booking.turfId);
  if (!booking || !turf) return new Response('Not found', { status: 404 });

  const start = new Date(`${booking.date}T${String(booking.hour).padStart(2, '0')}:00:00+05:30`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OYUN//Turf booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@oyun`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${ics(`Game at ${turf.name}`)}`,
    `LOCATION:${ics(turf.location)}`,
    `DESCRIPTION:${ics(`Booking ${booking.code}. Show your QR code at the gate: ${absoluteUrl(`/bookings/${booking.id}`)}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${ics(`Your game at ${turf.name} starts in 1 hour`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="oyun-${booking.code}.ics"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
