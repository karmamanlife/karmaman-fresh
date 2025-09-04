// File: src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

/** Build the Supabase client only when envs exist. */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

/** Connectivity test to check env + client before running queries. */
export async function supabaseConnectivityCheck(): Promise<{ envOk: boolean; clientOk: boolean; details: string }> {
  const envOk = Boolean(supabaseUrl && supabaseAnonKey);
  const client = getSupabase();
  if (!envOk || !client) return { envOk, clientOk: false, details: 'Missing envs or client not created' };

  const { data, error } = await client.auth.getSession();
  if (error) return { envOk: true, clientOk: false, details: `auth.getSession error: ${error.message}` };
  return { envOk: true, clientOk: true, details: data?.session ? 'Session present' : 'No session (anon) but client OK' };
}

/** Example: get streaks for current user. */
export async function getMyStreaks() {
  const client = getSupabase();
  if (!client) return { current: 0, longest: 0, lastDate: null as string | null, ready: false };

  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return { current: 0, longest: 0, lastDate: null, ready: true };

  const { data, error } = await client
    .from('user_activity_streaks')
    .select('current_streak,longest_streak,last_activity_date')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return { current: 0, longest: 0, lastDate: null, ready: true };

  return {
    current: data.current_streak ?? 0,
    longest: data.longest_streak ?? 0,
    lastDate: data.last_activity_date ?? null,
    ready: true,
  };
}
