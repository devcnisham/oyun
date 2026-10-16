// Small shaded illustrations for the sport category tiles (no emoji, so they look the same on every device)
type Props = { sport: string; size?: number; className?: string };

export default function SportArt({ sport, size = 88, className }: Props) {
  const key = sport.trim().toLowerCase();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden focusable="false">
      <ellipse cx="48" cy="86" rx="26" ry="5" fill="#000" opacity="0.35" />
      {key === 'football' && (
        <>
          <defs>
            <radialGradient id="sa-fb" cx="38%" cy="32%" r="75%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.7" stopColor="#e4e4e4" />
              <stop offset="1" stopColor="#a9a9a9" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="46" r="34" fill="url(#sa-fb)" />
          <path d="M48 31l12 9-4.6 14H40.6L36 40z" fill="#1c1c1c" />
          <path d="M48 31V15M60 40l16-5M55.400 54l10 13M40.600 54l-10 13M36 40l-16-5" stroke="#1c1c1c" strokeWidth="2.200" strokeLinecap="round" />
          <path d="M65 22l9 6-1 12-9-1zM31 22l-9 6 1 12 9-1zM66 67l-2 10-11 2-3-9zM30 67l2 10 11 2 3-9z" fill="#1c1c1c" opacity="0.88" />
        </>
      )}
      {key === 'box cricket' && (
        <>
          <defs>
            <linearGradient id="sa-bat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f3d29a" />
              <stop offset="1" stopColor="#c58a43" />
            </linearGradient>
            <radialGradient id="sa-cb" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#ff6a5c" />
              <stop offset="1" stopColor="#a60f1c" />
            </radialGradient>
          </defs>
          <g transform="rotate(32 40 44)">
            <rect x="34" y="6" width="12" height="26" rx="5" fill="#2a2a2a" />
            <rect x="26" y="28" width="28" height="52" rx="9" fill="url(#sa-bat)" />
            <path d="M40 34v40" stroke="#a8702f" strokeWidth="1.500" opacity="0.6" />
          </g>
          <circle cx="68" cy="66" r="15" fill="url(#sa-cb)" />
          <path d="M57 58c6 4 6 14 0 18M79 58c-6 4-6 14 0 18" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" strokeDasharray="2 3" opacity="0.9" />
        </>
      )}
      {key === 'badminton' && (
        <>
          <defs>
            <radialGradient id="sa-cork" cx="38%" cy="30%" r="80%">
              <stop offset="0" stopColor="#f6e2c0" />
              <stop offset="1" stopColor="#c99a5b" />
            </radialGradient>
            <linearGradient id="sa-feather" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#d9dde3" />
            </linearGradient>
          </defs>
          <path d="M31 14l8 40h18l8-40c-10 5-24 5-34 0z" fill="url(#sa-feather)" />
          <path d="M31 14l8 40M40 12l3 42M48 11v43M56 12l-3 42M65 14l-8 40" stroke="#a9b0ba" strokeWidth="1.400" />
          <path d="M31 14c10 5 24 5 34 0" stroke="#e2574c" strokeWidth="3" strokeLinecap="round" />
          <circle cx="48" cy="62" r="13" fill="url(#sa-cork)" />
          <path d="M36.500 58h23" stroke="#e2574c" strokeWidth="2.500" opacity="0.8" />
        </>
      )}
      {key === 'pickleball' && (
        <>
          <defs>
            <linearGradient id="sa-pad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff6a5c" />
              <stop offset="1" stopColor="#b3121f" />
            </linearGradient>
            <radialGradient id="sa-pb" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#f6ff8a" />
              <stop offset="1" stopColor="#b9cf1c" />
            </radialGradient>
          </defs>
          <g transform="rotate(-28 44 46)">
            <rect x="38" y="52" width="12" height="28" rx="5" fill="#2a2a2a" />
            <rect x="22" y="8" width="44" height="50" rx="20" fill="url(#sa-pad)" />
            <rect x="27" y="13" width="34" height="40" rx="16" stroke="#fff" strokeWidth="1.500" opacity="0.35" />
          </g>
          <circle cx="68" cy="66" r="14" fill="url(#sa-pb)" />
          <g fill="#7f9210" opacity="0.8">
            <circle cx="62" cy="62" r="2" /><circle cx="70" cy="60" r="2" /><circle cx="73" cy="68" r="2" />
            <circle cx="65" cy="71" r="2" /><circle cx="60" cy="68" r="1.600" />
          </g>
        </>
      )}
    </svg>
  );
}
