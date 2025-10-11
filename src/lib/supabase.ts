import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
  
  if (!url || !anon) {
    throw new Error('Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  _client = createClient(url, anon, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  return _client;
}

export const supabase = getSupabase();
export default supabase;

export function supabaseConnectivityCheck(): boolean {
  return !!_client;
}