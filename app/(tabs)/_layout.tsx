import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../src/lib/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Home, Dumbbell, UtensilsCrossed, Users } from 'lucide-react-native';

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
      <Tabs 
        screenOptions={{ 
          headerShown: false,
          tabBarActiveTintColor: '#3F6B5C',
          tabBarInactiveTintColor: '#999',
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} strokeWidth={2} />
            )
          }} 
        />
        <Tabs.Screen 
          name="workout" 
          options={{ 
            title: 'Workout',
            tabBarIcon: ({ color, size }) => (
              <Dumbbell color={color} size={size} strokeWidth={2} />
            )
          }} 
        />
        <Tabs.Screen 
          name="nutrition" 
          options={{ 
            title: 'Nutrition',
            tabBarIcon: ({ color, size }) => (
              <UtensilsCrossed color={color} size={size} strokeWidth={2} />
            )
          }} 
        />
        <Tabs.Screen 
          name="board" 
          options={{ 
            title: 'Tribe',
            tabBarIcon: ({ color, size }) => (
              <Users color={color} size={size} strokeWidth={2} />
            )
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ href: null }} 
        />
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