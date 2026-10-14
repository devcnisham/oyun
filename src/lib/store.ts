import 'server-only';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after } from 'next/server';
import { cache } from 'react';
import { ValidationError } from './errors';
import { DB_VERSION, migrate, seed } from './seed';
import type { Database } from './types';
import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';
import { broadcastSlotChanges } from './realtime';

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

// Turf/days whose slot map a write changed (a booking, hold or block was added, edited or removed)
const SLOT_TABLES = new Set<Table>(['bookings', 'holds', 'blocks']);

function changedSlotDays(before: Map<Table, Map<string, string>>, changes: ReturnType<typeof diff>) {
  const days = new Map<string, { turfId: string; date: string }>();
  const add = (item: unknown) => {
    const { turfId, date } = (item ?? {}) as { turfId?: unknown; date?: unknown };
    if (typeof turfId === 'string' && typeof date === 'string') days.set(`${turfId}|${date}`, { turfId, date });
  };
  for (const table of SLOT_TABLES) {
    const old = before.get(table);
    for (const row of changes.upserts[table] ?? []) {
      add(row.data);
      const prev = old?.get(row.id);
      if (prev) add(JSON.parse(prev));
    }
    for (const id of changes.deletes[table] ?? []) {
      const prev = old?.get(id);
      if (prev) add(JSON.parse(prev));
    }
  }
  return [...days.values()];
}

// Push the change to open slot maps once the response is on its way
function announceSlotChanges(slots: { turfId: string; date: string }[]) {
  if (slots.length === 0) return;
  try {
    after(async () => {
      try {
        await broadcastSlotChanges(slots);
      } catch (err) {
        console.warn('[store] failed to announce slot changes:', err);
      }
    });
  } catch {
    broadcastSlotChanges(slots).catch((err) => console.warn('[store] failed to announce slot changes:', err));
  }
}

class StoreConflict extends Error {}

const SLOT_TAKEN: Record<string, string> = {
  bookings_live_slot_uniq: 'That slot was just booked by someone else. Please pick another slot.',
  blocks_slot_uniq: 'This slot is already blocked.',
  holds_slot_uniq: 'Someone else is checking out this slot right now. Please pick another slot.',
};

function isTransientDbError(err: unknown): boolean {
  if (err instanceof StoreConflict) return true;
  if (!err) return false;
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (['40001', '40P01', '57P01', '57P02', '57P03', '08000', '08001', '08003', '08004', '08006', '53300'].includes(code)) {
    return true;
  }
  const msg = (err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : String(err)).toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('socket hang up') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('server busy') ||
    msg.includes('connection terminated') ||
    msg.includes('connection refused') ||
    msg.includes('upstream') ||
    msg.includes('timeout')
  );
}

async function applyChanges(changes: { upserts: TableRows; deletes: Partial<Record<Table, string[]>> }, expectedRev: number | null) {
  try {
    const { data, error } = await createAdminClient().rpc('apply_changes', { changes, expected_rev: expectedRev });
    if (!error) return Number(data);
    // 40001: someone else wrote first; 23505 on players: same new player created concurrently
    if (error.code === '40001' || (error.code === '23505' && error.message.includes('players_phone_uniq'))) {
      throw new StoreConflict(error.message);
    }
    const taken = Object.keys(SLOT_TAKEN).find((name) => error.message.includes(name));
    if (taken) throw new ValidationError(SLOT_TAKEN[taken]);
    if (isTransientDbError(error)) {
      throw new StoreConflict(`Transient database error: ${error.message}`);
    }
    throw new Error(`[store] write failed: ${error.message}`);
  } catch (err) {
    if (err instanceof StoreConflict || err instanceof ValidationError) throw err;
    if (isTransientDbError(err)) {
      throw new StoreConflict(`Transient database error: ${err instanceof Error ? err.message : String(err)}`);
    }
    throw err;
  }
}

async function loadFull(): Promise<Loaded> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await createAdminClient().rpc('load_state');
      if (error) {
        lastError = error;
        if (error.code === 'PGRST202' || error.code === '42883') {
          throw new Error(`[store] could not load data from Supabase: ${error.message}. Did you apply supabase/migrations?`);
        }
        if (attempt < 2 && isTransientDbError(error)) {
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1) + Math.random() * 50));
          continue;
        }
        throw new Error(`[store] could not load data from Supabase: ${error.message}. Did you apply supabase/migrations?`);
      }
      const state = data as TableRows & { rev: number | null };
      if (state.rev !== null) return cacheFull(state, Number(state.rev));

      // Empty database: start it with the launch data once
      const db = seed();
      try {
        const rev = await applyChanges({ upserts: toRows(db), deletes: {} }, null);
        return cacheFull(toRows(db), rev);
      } catch (err) {
        if (!(err instanceof StoreConflict)) throw err; // another server seeded first
      }
    } catch (err) {
      lastError = err;
      if (attempt < 2 && isTransientDbError(err)) {
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1) + Math.random() * 50));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`[store] could not initialise the database: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

/*
 * In-memory copy per server. Instead of downloading every table on every request,
 * each request asks Supabase only for rows written since the revision this server
 * already has (load_changes, see supabase/migrations/20261007000000_delta_sync.sql).
 * An unchanged store answers with a few bytes. Readers share the cached object and
 * must not modify it; mutate() always works on its own copy.
 */
type RowMaps = Map<Table, Map<string, unknown>>;
interface Cache {
  rows: RowMaps;
  rev: number;
  db: Database;
}
interface Delta {
  rev: number | null;
  full: boolean;
  upserts?: TableRows;
  deletes?: Partial<Record<Table, string[]>>;
}

const memory = globalThis as unknown as {
  __oyunCache?: Cache;
  __oyunSync?: Promise<Loaded> | null;
  __oyunNoDelta?: boolean;
};

function buildDb(rows: RowMaps): Database {
  const tableRows: TableRows = {};
  for (const [table, map] of rows) tableRows[table] = [...map].map(([id, data]) => ({ id, data }));
  const db = fromRows(tableRows);
  // Catch readers that modify the shared copy while developing
  if (process.env.NODE_ENV === 'development') deepFreeze(db);
  return db;
}

function deepFreeze(value: unknown) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
}

function cacheFull(state: TableRows, rev: number): Loaded {
  const rows: RowMaps = new Map();
  for (const table of Object.keys(state) as Table[]) {
    if (!Array.isArray(state[table])) continue; // skip rev / full flags
    rows.set(table, new Map((state[table] ?? []).map((r) => [r.id, r.data])));
  }
  const cache: Cache = { rows, rev, db: buildDb(rows) };
  memory.__oyunCache = cache;
  return { db: cache.db, rev };
}

function applyToCache(cache: Cache, upserts: TableRows, deletes: Partial<Record<Table, string[]>>, rev: number): Loaded {
  for (const [table, ids] of Object.entries(deletes) as [Table, string[]][]) {
    const map = cache.rows.get(table);
    for (const id of ids) map?.delete(id);
  }
  for (const [table, list] of Object.entries(upserts) as [Table, Row[]][]) {
    let map = cache.rows.get(table);
    if (!map) cache.rows.set(table, (map = new Map()));
    for (const row of list) map.set(row.id, row.data); // existing ids keep their place, like `order by seq`
  }
  cache.rev = rev;
  cache.db = buildDb(cache.rows);
  return { db: cache.db, rev };
}

async function syncOnce(): Promise<Loaded> {
  const cache = memory.__oyunCache;
  if (!cache || memory.__oyunNoDelta) return loadFull();
  const since = cache.rev;
  try {
    const { data, error } = await createAdminClient().rpc('load_changes', { since });
    if (error) {
      // Migration not applied yet: keep working the old way (whole state per request)
      if (error.code === 'PGRST202' || error.code === '42883') {
        memory.__oyunNoDelta = true;
        console.warn('[store] load_changes is missing; run supabase/migrations/20261007000000_delta_sync.sql. Loading everything per request until then.');
        return loadFull();
      }
      console.warn(`[store] load_changes failed (${error.message}), falling back to full reload`);
      return loadFull();
    }
    const delta = data as Delta & TableRows;
    if (delta.full) {
      if (delta.rev === null) return loadFull(); // store was reset: seed it again
      return cacheFull(delta, Number(delta.rev));
    }
    // A write on this server moved the cache on while we waited; this delta is older
    if (memory.__oyunCache !== cache || cache.rev !== since) return { db: memory.__oyunCache!.db, rev: memory.__oyunCache!.rev };
    if (Number(delta.rev) === cache.rev) return { db: cache.db, rev: cache.rev };
    return applyToCache(cache, delta.upserts ?? {}, delta.deletes ?? {}, Number(delta.rev));
  } catch (err) {
    if (cache) {
      console.warn('[store] delta sync network glitch; using cached memory state:', err instanceof Error ? err.message : String(err));
      return { db: cache.db, rev: cache.rev };
    }
    throw err;
  }
}

// One sync at a time per server; concurrent requests share it
function loadSupabase(): Promise<Loaded> {
  memory.__oyunSync ??= syncOnce().finally(() => {
    memory.__oyunSync = null;
  });
  return memory.__oyunSync;
}

/* ---------------- JSON file backend (local development) ---------------- */

// Serverless hosts only allow writes under the temp dir
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join(tmpdir(), 'oyun-data') : path.join(process.cwd(), '.data'));
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const globalStore = globalThis as unknown as { __oyunArenaDb?: Database; __oyunArenaPersisted?: boolean };

function loadFile(): Database {
  if (existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Database;
      if (parsed && typeof parsed === 'object' && parsed.version === DB_VERSION) return migrate(parsed);
    } catch (err) {
      console.error('[store] corrupt or invalid db.json; backing up and recovering:', err);
      try {
        renameSync(DATA_FILE, `${DATA_FILE}.corrupt.${Date.now()}`);
      } catch {}
      if (globalStore.__oyunArenaDb) {
        saveFile(globalStore.__oyunArenaDb);
        return globalStore.__oyunArenaDb;
      }
    }
  }
  const seeded = seed();
  saveFile(seeded);
  return seeded;
}

function saveFile(data: Database) {
  try {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, DATA_FILE);
    globalStore.__oyunArenaPersisted = true;
  } catch (err) {
    if (globalStore.__oyunArenaPersisted !== false) console.error('[store] could not persist the local database; keeping it in memory', err);
    globalStore.__oyunArenaPersisted = false;
  }
}

function fileDb(): Database {
  // Reload if db.json was deleted (manual reset), but never reseed on every request when the disk is read-only
  const fileGone = globalStore.__oyunArenaPersisted === true && !existsSync(DATA_FILE);
  if (!globalStore.__oyunArenaDb || fileGone) globalStore.__oyunArenaDb = loadFile();
  // A dev server keeps this copy across code reloads, so settings added since it started (like
  // minAdvance) would be missing; migrate fills them in from the defaults and is safe to repeat
  return migrate(globalStore.__oyunArenaDb);
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

// Where data lives right now. On a serverless host the local file is per-server and temporary, so
// bookings are only safe (and shared between players) when Supabase is active.
export function storageInfo() {
  const supabase = supabaseActive();
  return {
    backend: supabase ? ('supabase' as const) : ('local-file' as const),
    shared: supabase || !process.env.VERCEL,
  };
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
    if (memory.__oyunCache?.db) {
      console.error('[store] getDb() failed, serving cached copy to prevent server crash:', err);
      return memory.__oyunCache.db;
    }
    throw err;
  }
}

export async function mutate<T>(fn: (db: Database) => T): Promise<T> {
  if (!supabaseActive()) {
    // Work on a copy so a change that throws part-way (a booking that turns out to be taken) leaves nothing behind
    const db = structuredClone(fileDb());
    const result = fn(db);
    globalStore.__oyunArenaDb = db;
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
      if (attempt < 4 && isTransientDbError(err)) {
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1) + Math.random() * 50));
        continue;
      }
      throw err;
    }
    // Work on a private copy: the loaded object is shared with other requests on this server
    const db = structuredClone(loaded.db);
    const before = snapshot(db);
    const result = fn(db);
    const changes = diff(before, db);
    try {
      const rev = changes.empty ? loaded.rev : await applyChanges(changes, loaded.rev);
      // Our write is exactly the next revision, so the cache can take it without a round trip
      const cache = memory.__oyunCache;
      if (!changes.empty && rev !== null && cache && cache.rev === loaded.rev) {
        applyToCache(cache, structuredClone(changes.upserts), changes.deletes, rev);
      }
      requestState().current = Promise.resolve({ db, rev });
      announceSlotChanges(changedSlotDays(before, changes));
      return result;
    } catch (err) {
      if (!isTransientDbError(err)) throw err;
      await new Promise((r) => setTimeout(r, 40 * (attempt + 1) + Math.random() * 60));
    }
  }
  throw new ValidationError('The server is busy. Please try again.');
}
