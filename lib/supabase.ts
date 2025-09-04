import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://vaokzjvirswjxfckcewf.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhb2t6anZpcnN3anhmY2tjZXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTcwMjIsImV4cCI6MjA3MTMzMzAyMn0.sZUxQF-UCfBFKIFwWeT0M9n-LFbpkQDZo_UW8vu7DVc';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: { params: { eventsPerSecond: 2 } },
});
