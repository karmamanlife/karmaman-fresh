// File: src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HeaderMenu from '../components/HeaderMenu';
import StreakBanner from '../components/StreakBanner';

export default function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Set header right menu
  useFocusEffect(
    React.useCallback(() => {
      nav.setOptions({ headerRight: () => <HeaderMenu /> });
    }, [nav])
  );

  // Placeholder data (replace with Supabase later)
  const userName = 'Shoan';
  const dailyQuote = 'Small wins today. Big momentum tomorrow.';
  const daysTrained = 5;
  const daysMissed = 1;
  const todaysCalories = 2450;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Welcome */}
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>
        Welcome, {userName}
      </Text>
      <Text style={{ color: '#9CA3AF', marginTop: 6 }}>
        “{dailyQuote}”
      </Text>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => nav.navigate('Workout')}
          style={{ flex: 1, backgroundColor: '#1F2937', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#374151' }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Workout</Text>
          <Text style={{ color: '#9CA3AF', marginTop: 6, fontSize: 12 }}>Today’s plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => nav.navigate('Nutrition')}
          style={{ flex: 1, backgroundColor: '#1F2937', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#374151' }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Nutrition</Text>
          <Text style={{ color: '#9CA3AF', marginTop: 6, fontSize: 12 }}>Meals & macros</Text>
        </TouchableOpacity>
      </View>

      {/* Streaks */}
      <StreakBanner
        daysTrained={daysTrained}
        daysMissed={daysMissed}
        todaysCalories={todaysCalories}
      />

      {/* Note: No completion on Home. Completion happens at end of Workout screen. */}
    </ScrollView>
  );
}
