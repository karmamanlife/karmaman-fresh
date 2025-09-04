// File: src/components/StreakBanner.tsx
import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  daysTrained: number;
  daysMissed: number;
  todaysCalories: number;
};

export default function StreakBanner({ daysTrained, daysMissed, todaysCalories }: Props) {
  return (
    <View style={{
      padding: 16,
      borderRadius: 16,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#374151',
      marginTop: 12
    }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>🔥 Streaks & Today</Text>
      <Text style={{ color: '#9CA3AF', marginTop: 6 }}>Days trained: {daysTrained}</Text>
      <Text style={{ color: '#9CA3AF' }}>Days missed: {daysMissed}</Text>
      <Text style={{ color: '#9CA3AF' }}>Today’s calories: {todaysCalories}</Text>
    </View>
  );
}
