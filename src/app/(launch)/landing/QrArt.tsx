import styles from './sections.module.css';

// A decorative QR-style code: three finder squares and a deterministic scatter of modules. Not scannable and not data.
function on(n: number, f: number, x: number, y: number) {
  const inFinder = (fx: number, fy: number) => x >= fx && x < fx + f && y >= fy && y < fy + f;
  for (const [fx, fy] of [[0, 0], [n - f, 0], [0, n - f]]) {
    if (inFinder(fx, fy)) {
      const lx = x - fx;
      const ly = y - fy;
      const edge = lx === 0 || ly === 0 || lx === f - 1 || ly === f - 1;
      const core = lx > 1 && lx < f - 2 && ly > 1 && ly < f - 2;
      return edge || core;
    }
    // quiet gap around each finder
    if (x >= fx - 1 && x <= fx + f && y >= fy - 1 && y <= fy + f) return false;
  }
  return ((x * 37 + y * 91 + x * y * 13) % 7) < 3;
}

export default function QrArt({ n = 17, f = 5, className }: { n?: number; f?: number; className?: string }) {
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: n * n }).map((_, i) => (
        <i key={i} className={on(n, f, i % n, Math.floor(i / n)) ? styles.qrOn : ''} style={{ display: 'block' }} />
      ))}
    </div>
  );
}
