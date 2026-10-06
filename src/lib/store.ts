import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cache } from 'react';
import { ValidationError } from './errors';
import { DB_VERSION, migrate, seed } from './seed';
import type { Database } from './types';
import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';

export { newBookingCode, newId } from './ids';

/*
 * Data store. Pages read with `await getDb()`, server actions write with
 * `await mutate(db => ...)`; the callback edits the database object in place.
 *
 * - Supabase (production): set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY,
 *   and apply supabase/migrations. Each mutation is written atomically and
 *   retried on fresh data if another write landed first; the database rejects
 *   double bookings of a slot.
 * - JSON file in .data/ (local development) when Supabase is not configured.
 */

interface Loaded {
  db: Database;
  rev: number | null;
}

/* ---------------- Supabase backend ---------------- */

// Database collection -> table. Rows are keyed by `id` unless noted.
const LIST_TABLES = {
  turfs: 'turfs',
  partners: 'partners',
  staff: 'staff',
  players: 'players',
  bookings: 'bookings',
  blocks: 'blocks',
  offers: 'offers',
  addOns: 'add_ons',
  applications: 'applications',
  walletTxns: 'wallet_txns',
  holds: 'holds',
} as const;

type Table = (typeof LIST_TABLES)[keyof typeof LIST_TABLES] | 'promo_codes' | 'pricing' | 'app_config';
type Row = { id: string; data: unknown };
type TableRows = Partial<Record<Table, Row[]>>;

function toRows(db: Database): TableRows {
  const rows: TableRows = {};
  for (const [key, table] of Object.entries(LIST_TABLES) as [keyof typeof LIST_TABLES, Table][]) {
    rows[table] = (db[key] as { id: string }[]).map((item) => ({ id: item.id, data: item }));
  }
  rows.promo_codes = db.promoCodes.map((p) => ({ id: p.code, data: p }));
  rows.pricing = Object.entries(db.pricing).map(([turfId, rules]) => ({ id: turfId, data: rules }));
  rows.app_config = [
    { id: 'settings', data: db.settings },
    { id: 'site', data: db.site },
  ];
  return rows;
}

function fromRows(rows: TableRows): Database {
  const list = <T,>(table: Table) => (rows[table] ?? []).map((r) => r.data as T);
  const config = new Map((rows.app_config ?? []).map((r) => [r.id, r.data]));
  const db = {
    version: DB_VERSION,
    pricing: Object.fromEntries((rows.pricing ?? []).map((r) => [r.id, r.data])),
    promoCodes: list('promo_codes'),
    settings: config.get('settings') ?? {},
    site: config.get('site'),
  } as Database;
  for (const [key, table] of Object.entries(LIST_TABLES) as [keyof typeof LIST_TABLES, Table][]) {
    (db as unknown as Record<string, unknown>)[key] = list(table);
  }
  return migrate(db);
}

// Serialized rows, to work out what a mutation changed
function snapshot(db: Database) {
  const snap = new Map<Table, Map<string, string>>();
  for (const [table, rows] of Object.entries(toRows(db)) as [Table, Row[]][]) {
    snap.set(table, new Map(rows.map((r) => [r.id, JSON.stringify(r.data)])));
  }
  return snap;
}

function diff(before: Map<Table, Map<string, string>>, db: Database) {
  const upserts: TableRows = {};
  const deletes: Partial<Record<Table, string[]>> = {};
  for (const [table, rows] of Object.entries(toRows(db)) as [Table, Row[]][]) {
    const old = before.get(table) ?? new Map<string, string>();
    const changed = rows.filter((r) => old.get(r.id) !== JSON.stringify(r.data));
    const ids = new Set(rows.map((r) => r.id));
    const removed = [...old.keys()].filter((id) => !ids.has(id));
    if (changed.length) upserts[table] = changed;
    if (removed.length) deletes[table] = removed;
  }
  return { upserts, deletes, empty: Object.keys(upserts).length === 0 && Object.keys(deletes).length === 0 };
}

class StoreConflict extends Error {}

const SLOT_TAKEN: Record<string, string> = {
  bookings_live_slot_uniq: 'That slot was just booked by someone else. Please pick another slot.',
  blocks_slot_uniq: 'This slot is already blocked.',
  holds_slot_uniq: 'Someone else is checking out this slot right now. Please pick another slot.',
};

async function applyChanges(changes: { upserts: TableRows; deletes: Partial<Record<Table, string[]>> }, expectedRev: number | null) {
  const { data, error } = await createAdminClient().rpc('apply_changes', { changes, expected_rev: expectedRev });
  if (!error) return Number(data);
  // 40001: someone else wrote first; 23505 on players: same new player created concurrently
  if (error.code === '40001' || (error.code === '23505' && error.message.includes('players_phone_uniq'))) {
    throw new StoreConflict(error.message);
  }
  const taken = Object.keys(SLOT_TAKEN).find((name) => error.message.includes(name));
  if (taken) throw new ValidationError(SLOT_TAKEN[taken]);
  throw new Error(`[store] write failed: ${error.message}`);
}

async function loadSupabase(): Promise<Loaded> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await createAdminClient().rpc('load_state');
    if (error) throw new Error(`[store] could not load data from Supabase: ${error.message}. Did you apply supabase/migrations?`);
    const state = data as TableRows & { rev: number | null };
    if (state.rev !== null) return { db: fromRows(state), rev: Number(state.rev) };

    // Empty database: seed the demo data once
    const db = seed();
    try {
      const rev = await applyChanges({ upserts: toRows(db), deletes: {} }, null);
      return { db, rev };
    } catch (err) {
      if (!(err instanceof StoreConflict)) throw err; // another server seeded first
    }
  }
  throw new Error('[store] could not initialise the database');
}

/* ---------------- JSON file backend (local development) ---------------- */

// Serverless hosts only allow writes under the temp dir
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join(tmpdir(), 'oyun-data') : path.join(process.cwd(), '.data'));
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const globalStore = globalThis as unknown as { __slotArenaDb?: Database; __slotArenaPersisted?: boolean };

function loadFile(): Database {
  if (existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Database;
      if (parsed.version === DB_VERSION) return migrate(parsed);
    } catch {
      // fall through and reseed
    }
  }
  const seeded = seed();
  saveFile(seeded);
  return seeded;
}

function saveFile(data: Database) {
  try {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, DATA_FILE);
    globalStore.__slotArenaPersisted = true;
  } catch (err) {
    if (globalStore.__slotArenaPersisted !== false) console.error('[store] could not persist demo database; keeping it in memory', err);
    globalStore.__slotArenaPersisted = false;
  }
}

function fileDb(): Database {
  // Reload if db.json was deleted (manual reset), but never reseed on every request when the disk is read-only
  const fileGone = globalStore.__slotArenaPersisted === true && !existsSync(DATA_FILE);
  if (!globalStore.__slotArenaDb || fileGone) globalStore.__slotArenaDb = loadFile();
  return globalStore.__slotArenaDb;
}

/* ---------------- public API ---------------- */

// Local dev only: if Supabase is set up but unreachable or missing its tables, use the JSON file
// instead of failing every page. Production always surfaces the error.
const devFallback = globalThis as unknown as { __oyunSupabaseFailed?: boolean };

function supabaseActive() {
  return supabaseConfigured() && !devFallback.__oyunSupabaseFailed;
}

function fallBackInDev(err: unknown): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  devFallback.__oyunSupabaseFailed = true;
  console.warn(
    `\n[store] Supabase is configured but not usable, so local dev is using .data/db.json instead.\n` +
      `        Reason: ${err instanceof Error ? err.message : String(err)}\n` +
      `        Fix: run supabase/migrations/*.sql in the Supabase SQL editor and check SUPABASE_SECRET_KEY, then restart \`npm run dev\`.\n`
  );
  return true;
}

// One load per request, shared by layouts, pages and actions
const requestState = cache(() => ({ current: null as Promise<Loaded> | null }));

export async function getDb(): Promise<Database> {
  if (!supabaseActive()) return fileDb();
  const state = requestState();
  state.current ??= loadSupabase();
  try {
    return (await state.current).db;
  } catch (err) {
    state.current = null;
    if (fallBackInDev(err)) return fileDb();
    throw err;
  }
}

export async function mutate<T>(fn: (db: Database) => T): Promise<T> {
  if (!supabaseActive()) {
    const db = fileDb();
    const result = fn(db);
    saveFile(db);
    return result;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    // Always start from fresh data so checks (e.g. slot availability) see the latest writes
    let loaded: Loaded;
    try {
      loaded = await loadSupabase();
    } catch (err) {
      if (fallBackInDev(err)) return mutate(fn);
      throw err;
    }
    const before = snapshot(loaded.db);
    const result = fn(loaded.db);
    const changes = diff(before, loaded.db);
    try {
      const rev = changes.empty ? loaded.rev : await applyChanges(changes, loaded.rev);
      requestState().current = Promise.resolve({ db: loaded.db, rev });
      return result;
    } catch (err) {
      if (!(err instanceof StoreConflict)) throw err;
      await new Promise((r) => setTimeout(r, 30 * (attempt + 1) + Math.random() * 50));
    }
  }
  throw new ValidationError('The server is busy. Please try again.');
}

export async function resetDb() {
  if (!supabaseActive()) {
    globalStore.__slotArenaDb = seed();
    saveFile(globalStore.__slotArenaDb);
    return;
  }
  const { error } = await createAdminClient().rpc('reset_state');
  if (error) throw new Error(`[store] reset failed: ${error.message}`);
  requestState().current = loadSupabase(); // reseeds
  await requestState().current;
}
