const fs = require('fs');
const path = require('path');

// Exact SVG from Navbar.tsx, scaled up to 512x512 for high-res export
const svg = `<svg width="512" height="512" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(100, 0, 0, 0.4)" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0, 0, 0, 0.2)" />
    </filter>
    <linearGradient id="shieldGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9E0A0A"/>
      <stop offset="1" stop-color="#4A0000"/>
    </linearGradient>
  </defs>
  <g filter="url(#shadow)">
    <circle cx="20" cy="20" r="18" fill="url(#shieldGrad)"/>
    <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="32" cy="12" r="2.5" fill="white"/>
    <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

const outSvg = path.join(__dirname, '../public/oyun-icon.svg');
fs.writeFileSync(outSvg, svg);
console.log('Saved:', outSvg);
