import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// The Supabase path of the store with a fake admin client: what mutate() sends to apply_changes()
const EMPTY_STATE = {
  turfs: [], partners: [], staff: [], players: [], bookings: [], blocks: [], offers: [],
  add_ons: [], applications: [], wallet_txns: [{ id: 'wt_1', data: { id: 'wt_1', playerId: 'pl_1', amount: 100 } }], holds: [], promo_codes: [], pricing: [], app_config: [],
  rev: 7,
};

// A query builder that answers every chained call, then resolves to the rows for its table
function query(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'gte', 'order', 'limit', 'eq', 'in']) chain[m] = () => chain;
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
  return chain;
}

const V2_BOOKING = {
  id: '11111111-1111-5111-8111-111111111111', legacy_id: 'bk_v2', code: 'AB12CD34', holder: null, customer_name: 'Asha',
  customer_phone: '9876543210', source: 'online', status: 'confirmed', hold_expires_at: null, subtotal: 1000, discount: 0,
  wallet_used: 0, total: 1000, advance_due: 150, amount_paid: 150, price_breakdown: {}, meta: {}, cancelled_at: null,
  cancel_reason: null, checked_in_at: null, created_at: '2026-10-19T10:00:00Z', venues: { slug: 'turf_a' }, players: null,
  booking_items: [{ id: 'it_1', during: '["2026-10-20 12:30:00+00","2026-10-20 13:30:00+00")', price: 1000, bookables: { name: 'Full pitch' } }],
};

function fakeClient(applied: unknown[], newRev = 8) {
  return {
    schema: () => ({ from: (table: string) => query(table === 'bookings' ? [V2_BOOKING] : []) }),
    rpc: vi.fn(async (fn: string, args?: unknown) => {
      if (fn === 'load_state') return { data: EMPTY_STATE, error: null };
      if (fn === 'load_changes') return { data: { rev: 7, full: false }, error: null };
      if (fn === 'apply_changes') {
        applied.push(args);
        return { data: newRev, error: null };
      }
      return { data: null, error: { message: `unexpected rpc ${fn}`, code: 'XX000' } };
    }),
  };
}

async function loadStore(env: Record<string, string>, client: ReturnType<typeof fakeClient>) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.doMock('@/utils/supabase/admin', () => ({ supabaseConfigured: () => true, createAdminClient: () => client }));
  vi.doMock('./realtime', () => ({ broadcastSlotChanges: vi.fn(async () => {}) }));
  const g = globalThis as unknown as Record<string, unknown>;
  delete g.__oyunCache;
  delete g.__oyunSync;
  delete g.__oyunNoDelta;
  return import('./store');
}

const booking = { id: 'bk_1', turfId: 'turf_a', date: '2026-10-30', hour: 18, status: 'confirmed', code: 'SA-TEST1' };

describe('store writes in Supabase mode', () => {
  beforeEach(() => vi.stubEnv('NODE_ENV', 'test'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/utils/supabase/admin');
    vi.doUnmock('./realtime');
  });

  test('bookings are saved when v2 slots are off (the launch default)', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    await mutate((db) => {
      db.bookings.push(booking as never);
    });
    expect(applied).toHaveLength(1);
    const call = applied[0] as { changes: { upserts: Record<string, { id: string }[]> }; expected_rev: number };
    expect(call.expected_rev).toBe(7);
    expect(call.changes.upserts.bookings.map((r) => r.id)).toEqual(['bk_1']);
  });

  test('bookings are left to the oyun schema when v2 slots are on', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient(applied));
    await mutate((db) => {
      db.bookings.push(booking as never);
    });
    expect(applied).toHaveLength(0);
  });

  test('only the rows a mutation touched are sent', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    await mutate((db) => {
      db.bookings.push(booking as never);
    });
    const changes = (applied[0] as { changes: { upserts: Record<string, unknown[]>; deletes: object } }).changes;
    expect(Object.keys(changes.upserts)).toEqual(['bookings']);
    expect(changes.deletes).toEqual({});
  });

  test('a write that is not the next revision does not move the cache past other writers', async () => {
    const applied: unknown[] = [];
    // Other writers landed between our load (rev 7) and our write (rev 10)
    const { mutate, getDb } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied, 10));
    await mutate((db) => {
      db.bookings.push(booking as never);
    });
    const g = globalThis as unknown as { __oyunCache?: { rev: number } };
    expect(g.__oyunCache?.rev).toBe(7);
    expect(applied).toHaveLength(1);
    await getDb();
  });

  test('a write to one collection leaves the others out of the diff', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    await mutate((db) => {
      db.players.push({ id: 'pl_1', name: 'Asha', phone: '9876543210' } as never);
    });
    const changes = (applied[0] as { changes: { upserts: Record<string, unknown[]>; deletes: object } }).changes;
    expect(Object.keys(changes.upserts)).toEqual(['players']);
    expect(changes.deletes).toEqual({});
  });

  test('a callback that only reads writes nothing', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    const count = await mutate((db) => db.walletTxns.length);
    expect(count).toBe(1);
    expect(applied).toHaveLength(0);
  });

  test('editing a row in place and deleting another are both detected', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    await mutate((db) => {
      (db.walletTxns[0] as { amount: number }).amount = 250;
    });
    const edited = (applied[0] as { changes: { upserts: Record<string, { data: { amount: number } }[]> } }).changes;
    expect(edited.upserts.wallet_txns[0].data.amount).toBe(250);
    await mutate((db) => {
      db.walletTxns = [];
    });
    const removed = (applied[1] as { changes: { deletes: Record<string, string[]> } }).changes;
    expect(removed.deletes.wallet_txns).toEqual(['wt_1']);
  });

  test('with v2 slots on, getDb shows bookings read from the oyun schema', async () => {
    const { getDb } = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient([]));
    const db = await getDb();
    expect(db.bookings).toHaveLength(1);
    expect(db.bookings[0]).toMatchObject({ id: 'bk_v2', turfId: 'turf_a', date: '2026-10-20', hour: 18, status: 'confirmed' });
  });

  test('with v2 slots off, the oyun schema is not read', async () => {
    const { getDb } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient([]));
    expect((await getDb()).bookings).toEqual([]);
  });
});
