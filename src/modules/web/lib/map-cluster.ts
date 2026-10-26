// Groups map pins that would overlap on screen. Works in pixel space, so the caller re-runs it when the zoom changes.

export interface PinPoint {
  id: string;
  x: number; // pixel position at the current zoom
  y: number;
}

export interface PinCluster {
  ids: string[];
  x: number; // average position of the members
  y: number;
}

/**
 * A pin takes up a box of `width` x `height` pixels around its position. Pins whose boxes overlap are put in one
 * cluster, nearest-first from the first pin in the list, so the result is the same on every run for the same input.
 */
export function clusterPins(points: PinPoint[], width: number, height: number): PinCluster[] {
  const left = [...points].sort((a, b) => a.x - b.x || a.y - b.y || a.id.localeCompare(b.id));
  const clusters: PinCluster[] = [];
  while (left.length > 0) {
    const seed = left.shift()!;
    const members = [seed];
    for (let i = left.length - 1; i >= 0; i--) {
      const p = left[i];
      if (Math.abs(p.x - seed.x) < width && Math.abs(p.y - seed.y) < height) {
        members.push(p);
        left.splice(i, 1);
      }
    }
    clusters.push({
      ids: members.map((m) => m.id).sort(),
      x: members.reduce((s, m) => s + m.x, 0) / members.length,
      y: members.reduce((s, m) => s + m.y, 0) / members.length,
    });
  }
  return clusters;
}
