// File: src/screens/NutritionScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function NutritionScreen() {
  // Placeholder; later: show today’s meals, macros, calories
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Nutrition</Text>
      <View style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#374151' }}>
        <Text style={{ color: '#9CA3AF' }}>Add meals, track calories, and view macro targets here.</Text>
      </View>
    </ScrollView>
  );
}
