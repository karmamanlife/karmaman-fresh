// File: src/screens/WorkoutScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Exercise = { id: string; name: string; sets: number; reps: string; done?: boolean };

const todayPlan: Exercise[] = [
  { id: '1', name: 'Squat', sets: 4, reps: '6-8' },
  { id: '2', name: 'Bench Press', sets: 4, reps: '6-8' },
  { id: '3', name: 'Row', sets: 4, reps: '8-10' },
];

export default function WorkoutScreen() {
  const nav = useNavigation();
  const [exs, setExs] = React.useState<Exercise[]>(todayPlan);

  function toggleDone(id: string) {
    setExs(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
  }

  const allDone = exs.every(e => e.done);

  async function markDayComplete() {
    // TODO: call Supabase insert into habit/workout logs with for_date=current_date & completed=true
    // Placeholder UX only:
    alert('Workout complete! (This will write to Supabase in the next step.)');
    // nav.goBack(); // optional
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>Today’s Workout</Text>
      {exs.map(e => (
        <TouchableOpacity
          key={e.id}
          onPress={() => toggleDone(e.id)}
          style={{
            backgroundColor: e.done ? '#065F46' : '#1F2937',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#374151',
            marginBottom: 10
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>{e.name}</Text>
          <Text style={{ color: '#9CA3AF' }}>{e.sets} sets • {e.reps} reps</Text>
          <Text style={{ color: e.done ? '#A7F3D0' : '#D1D5DB', marginTop: 6 }}>
            {e.done ? 'Completed' : 'Tap to mark complete'}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Completion lives here — only enabled when all exercises are marked done */}
      <TouchableOpacity
        onPress={markDayComplete}
        disabled={!allDone}
        style={{
          opacity: allDone ? 1 : 0.5,
          backgroundColor: '#2563EB',
          padding: 16,
          borderRadius: 16,
          marginTop: 6,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Complete Today’s Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
