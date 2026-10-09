import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { makeDb } from '@/test/fixtures';
import { toPublicTurf } from './public-turf';

describe('toPublicTurf', () => {
  test('drops the owner account link and the commission deal, keeps what the page shows', () => {
    const { turf } = makeDb({ partnerId: 'par_1', commissionPercent: 7, name: 'Arena', phone: '9800000000', ownerName: 'Owner' });
    const pub = toPublicTurf(turf) as Record<string, unknown>;
    expect('partnerId' in pub).toBe(false);
    expect('commissionPercent' in pub).toBe(false);
    expect(pub.name).toBe('Arena');
    expect(pub.phone).toBe('9800000000'); // the turf's contact number is shown on its page on purpose
    expect(pub.ownerName).toBe('Owner');
  });

  test('does not change the original record', () => {
    const { turf } = makeDb({ partnerId: 'par_1', commissionPercent: 7 });
    toPublicTurf(turf);
    expect(turf.partnerId).toBe('par_1');
    expect(turf.commissionPercent).toBe(7);
  });
});

// Whatever a client component takes as a prop is serialised into the page and readable in the browser.
// These entity types carry password hashes, phones, balances or deals, so client components must not take them.
describe('client components', () => {
  const FORBIDDEN = ['Partner', 'StaffMember', 'Player', 'Database', 'Turf', 'Booking', 'WalletTxn'];

  function clientFiles(dir: string, out: string[] = []) {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) clientFiles(full, out);
      else if (/\.tsx?$/.test(name) && /^\s*['"]use client['"]/.test(readFileSync(full, 'utf8'))) out.push(full);
    }
    return out;
  }

  test('never import the full internal entity types', () => {
    const offenders: string[] = [];
    const files = clientFiles(path.join(process.cwd(), 'src'));
    expect(files.length).toBeGreaterThan(20); // the scan really found the client components
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](?:@\/lib\/types|\.\.?\/[^'"]*types)['"]/g)) {
        const names = m[1].split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]);
        for (const n of names) if (FORBIDDEN.includes(n)) offenders.push(`${path.relative(process.cwd(), file)}: ${n}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
