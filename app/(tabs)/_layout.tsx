import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../src/lib/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Layout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        router.replace('/auth/sign-in');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth/sign-in');
      } else {
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth/sign-in');
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3F6B5C" />
      </View>
    );
  }

  return (
  <>
    <StatusBar style="auto" />
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="board" options={{ title: 'Tribe' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  </>
);
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});