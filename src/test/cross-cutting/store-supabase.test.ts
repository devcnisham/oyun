import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// The Supabase path of the store with a fake admin client: what mutate() sends to apply_changes()
const EMPTY_STATE = {
  turfs: [], partners: [], staff: [], players: [], bookings: [], blocks: [], offers: [],
  add_ons: [], applications: [], wallet_txns: [{ id: 'wt_1', data: { id: 'wt_1', playerId: 'pl_1', amount: 100 } }], holds: [], promo_codes: [], pricing: [], app_config: [],
  waitlist: [], payouts: [{ id: 'po_1', data: { id: 'po_1', net: 500 } }], open_matches: [], tournaments: [], activity: [],
  rev: 7,
};

// A query builder that answers every chained call, then resolves to the rows for its table
function query(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'gte', 'order', 'limit', 'eq', 'in', 'or']) chain[m] = () => chain;
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

const updates: unknown[] = [];

function fakeClient(applied: unknown[], newRev = 8) {
  return {
    schema: () => ({ from: (table: string) => query(table === 'bookings' ? [V2_BOOKING] : []) }),
    rpc: vi.fn(async (fn: string, args?: unknown) => {
      if (fn === 'load_state') return { data: EMPTY_STATE, error: null };
      if (fn === 'load_changes') return { data: { rev: 7, full: false }, error: null };
      if (fn === 'erase_account') {
        updates.push({ erase: args });
        return { data: 3, error: null };
      }
      if (fn === 'apply_booking_updates') {
        updates.push(args);
        return { data: (args as { p_updates: unknown[] }).p_updates.length, error: null };
      }
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
  vi.doMock('@/modules/shared/database/supabase/admin', () => ({ supabaseConfigured: () => true, createAdminClient: () => client }));
  vi.doMock('@/modules/shared/backend/realtime', () => ({ broadcastSlotChanges: vi.fn(async () => {}) }));
  const g = globalThis as unknown as Record<string, unknown>;
  delete g.__oyunCache;
  delete g.__oyunSync;
  delete g.__oyunNoDelta;
  return import('@/modules/shared/database/store');
}

const booking = { id: 'bk_1', turfId: 'turf_a', date: '2026-10-30', hour: 18, status: 'confirmed', code: 'SA-TEST1' };

describe('store writes in Supabase mode', () => {
  beforeEach(() => vi.stubEnv('NODE_ENV', 'test'));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/modules/shared/database/supabase/admin');
    vi.doUnmock('@/modules/shared/backend/realtime');
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

  test('with v2 slots on, a booking cannot be created by editing the list', async () => {
    const applied: unknown[] = [];
    updates.length = 0;
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient(applied));
    await expect(
      mutate((db) => {
        db.bookings.push(booking as never);
      })
    ).rejects.toThrow(/cannot be created/);
    expect(applied).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  test('with v2 slots on, an edit to an existing booking is written back to oyun', async () => {
    const applied: unknown[] = [];
    updates.length = 0;
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient(applied));
    await mutate((db) => {
      const b = db.bookings.find((x) => x.id === 'bk_v2')!;
      b.status = 'checked_in';
      b.checkedInAt = '2026-10-20T13:00:00.000Z';
    });
    expect(applied).toHaveLength(0);
    const sent = (updates[0] as { p_updates: { id: string; status: string; checkedInAt: string }[] }).p_updates;
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ id: 'bk_v2', status: 'checked_in', checkedInAt: '2026-10-20T13:00:00.000Z' });
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

  test('payouts, waitlist, matches, tournaments and activity are saved, not dropped', async () => {
    const applied: unknown[] = [];
    const { mutate } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient(applied));
    await mutate((db) => {
      db.waitlist = [...(db.waitlist ?? []), { id: 'wl_1' } as never];
      db.activity = [...(db.activity ?? []), { id: 'act_1' } as never];
      db.openMatches = [...(db.openMatches ?? []), { id: 'match_1' } as never];
      db.tournaments = [...(db.tournaments ?? []), { id: 'tour_1' } as never];
      (db.payouts![0] as { net: number }).net = 450;
    });
    const up = (applied[0] as { changes: { upserts: Record<string, { id: string }[]> } }).changes.upserts;
    expect(Object.keys(up).sort()).toEqual(['activity', 'open_matches', 'payouts', 'tournaments', 'waitlist']);
    expect(up.payouts[0].id).toBe('po_1');
  });

  test('payouts come back from the database', async () => {
    const { getDb } = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient([]));
    expect((await getDb()).payouts).toEqual([{ id: 'po_1', net: 500 }]);
  });

  test('a privacy export sees bookings older than the per-request window', async () => {
    const { getDb, withAccountHistory } = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient([]));
    const bare = { ...(await getDb()), bookings: [] };
    const full = await withAccountHistory(bare, 'user_x');
    expect(full.bookings.map((b) => b.id)).toEqual(['bk_v2']);
  });

  test('a privacy erase reaches every v2 booking, and does nothing with v2 off', async () => {
    updates.length = 0;
    const on = await loadStore({ OYUN_V2_SLOTS: '1' }, fakeClient([]));
    expect(await on.eraseV2Account('user_x', 'pl_x')).toBe(3);
    expect(updates[0]).toEqual({ erase: { p_account_id: 'user_x', p_player_legacy_id: 'pl_x' } });
    updates.length = 0;
    const off = await loadStore({ OYUN_V2_SLOTS: '' }, fakeClient([]));
    expect(await off.eraseV2Account('user_x', null)).toBe(0);
    expect(updates).toHaveLength(0);
  });
});
