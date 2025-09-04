// File: src/components/EnvGate.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabaseConnectivityCheck } from '../lib/supabase';

export default function EnvGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<{ envOk: boolean; clientOk: boolean; details: string } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await supabaseConnectivityCheck();
      if (mounted) setStatus(res);
    })();
    return () => { mounted = false; };
  }, []);

  if (!status) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F15', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white' }}>Checking environment…</Text>
      </View>
    );
  }

  const { envOk, clientOk, details } = status;

  if (envOk && clientOk) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F15', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: 12 }}>
        {envOk ? 'Supabase client failed to initialize.' : 'Supabase credentials not found in .env.'}
      </Text>

      <View style={{ width: '100%', marginBottom: 14 }}>
        <Text style={{ color: '#D1D5DB', fontSize: 12 }}>Diagnostics</Text>
        <Text style={{ color: envOk ? '#10B981' : '#F87171', fontSize: 12 }}>Env OK: {String(envOk)}</Text>
        <Text style={{ color: clientOk ? '#10B981' : '#F87171', fontSize: 12 }}>Client OK: {String(clientOk)}</Text>
        <Text style={{ color: '#D1D5DB', fontSize: 12 }}>Details: {details}</Text>
      </View>

      <TouchableOpacity
        onPress={() => {}}
        style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#374151' }}
      >
        <Text style={{ color: 'white' }}>After fixing .env, restart Expo with cache clear</Text>
      </TouchableOpacity>
    </View>
  );
}