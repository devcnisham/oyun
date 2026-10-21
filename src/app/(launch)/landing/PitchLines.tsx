// A football pitch seen from above, as clean line art. Decorative: the hero tilts this into a 3D floor.
export default function PitchLines() {
  return (
    <svg viewBox="0 0 1000 640" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <rect x="40" y="40" width="920" height="560" rx="4" />
      <path d="M500 40v560" />
      <circle cx="500" cy="320" r="86" />
      <circle cx="500" cy="320" r="5" fill="currentColor" />
      {/* penalty areas, six-yard boxes, spots and arcs */}
      <path d="M40 170h140v300H40M960 170H820v300h140" />
      <path d="M40 255h60v130H40M960 255h-60v130h60" />
      <circle cx="140" cy="320" r="4" fill="currentColor" />
      <circle cx="860" cy="320" r="4" fill="currentColor" />
      <path d="M180 262a86 86 0 0 1 0 116M820 262a86 86 0 0 0 0 116" />
      {/* corner arcs */}
      <path d="M40 66a26 26 0 0 0 26-26M960 66a26 26 0 0 1-26-26M40 574a26 26 0 0 1 26 26M960 574a26 26 0 0 0-26 26" />
    </svg>
  );
}
