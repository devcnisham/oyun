import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Server-only client with the secret key (bypasses RLS). Used by the data store.
 * Never import this from a client component: SUPABASE_SECRET_KEY has no
 * NEXT_PUBLIC_ prefix, so it is never sent to the browser.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export function supabaseConfigured() {
  if (!supabaseUrl || !secretKey) return false;
  try {
    new URL(supabaseUrl);
    return true;
  } catch {
    return false;
  }
}

const globalClient = globalThis as unknown as { __oyunSupabaseAdmin?: SupabaseClient };

export function createAdminClient() {
  if (!supabaseUrl || !secretKey) throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  globalClient.__oyunSupabaseAdmin ??= createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return globalClient.__oyunSupabaseAdmin;
}
