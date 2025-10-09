// File: src/screens/LogsScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function LogsScreen() {
  // Placeholder; later: fetch from Supabase habit_logs/workout_logs (group by date)
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Logs</Text>
      <View style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#374151' }}>
        <Text style={{ color: '#9CA3AF' }}>Your recent workouts and habit completions will appear here.</Text>
      </View>
    </ScrollView>
  );
}
