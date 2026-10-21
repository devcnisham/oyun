// Top-down line drawings of the four courts, drawn to scale and simplified. Decorative; the card names the game in text.
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const, focusable: false as const };

export function FootballArt() {
  return (
    <svg viewBox="0 0 200 300" {...common}>
      <rect x="12" y="12" width="176" height="276" rx="3" />
      <path d="M12 150h176" />
      <circle cx="100" cy="150" r="26" />
      <circle cx="100" cy="150" r="2.5" fill="currentColor" />
      <path d="M50 12v34h100V12M72 12v14h56V12M50 288v-34h100v34M72 288v-14h56v14" />
      <path d="M78 46a26 26 0 0 0 44 0M78 254a26 26 0 0 1 44 0" />
    </svg>
  );
}
export function CricketArt() {
  return (
    <svg viewBox="0 0 200 300" {...common}>
      <rect x="12" y="12" width="176" height="276" rx="3" strokeDasharray="3 6" />
      <rect x="72" y="54" width="56" height="192" />
      <path d="M72 84h56M72 216h56" />
      <path d="M92 54v-8M100 54v-8M108 54v-8M92 246v8M100 246v8M108 246v8" />
      <circle cx="100" cy="150" r="4" fill="currentColor" />
    </svg>
  );
}
export function BadmintonArt() {
  return (
    <svg viewBox="0 0 200 300" {...common}>
      <rect x="36" y="20" width="128" height="260" />
      <path d="M48 20v260M152 20v260M36 150h128M36 88h128M36 212h128M100 20v68M100 212v68" />
      <path d="M30 150h140" strokeDasharray="2 4" />
    </svg>
  );
}
export function PickleballArt() {
  return (
    <svg viewBox="0 0 200 300" {...common}>
      <rect x="38" y="22" width="124" height="256" />
      <path d="M38 150h124" strokeWidth="3.4" />
      <path d="M38 98h124M38 202h124M100 22v76M100 202v76" />
    </svg>
  );
}
