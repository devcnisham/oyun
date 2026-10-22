// Read-only star rating, e.g. ★★★★☆
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} out of 5 stars`} style={{ color: 'var(--accent-gold)', fontSize: size, letterSpacing: 1, whiteSpace: 'nowrap' }}>
      {'★'.repeat(full)}
      <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}
