// FILE: C:\Users\sngaw\karmaman-fresh\app\(tabs)\workouts.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { fetchWorkouts, addWorkout, completeWorkoutToday, fetchRecentLogs, computeDailyStreak, Workout } from '../../lib/workouts';

export default function WorkoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // Add form
  const [name, setName] = useState('');
  const [sets, setSets] = useState('5');
  const [reps, setReps] = useState('5');
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const ws = await fetchWorkouts();
      setWorkouts(ws);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      setLogsLoading(true);
      const logs = await fetchRecentLogs(30);
      setStreak(computeDailyStreak(logs));
    } catch (e: any) {
      Alert.alert('Logs Error', e.message ?? String(e));
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadLogs();
  }, []);

  async function onAddWorkout() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a workout name');
      return;
    }
    setAdding(true);
    try {
      const setsNum = Number(sets) || 5;
      const repsNum = Number(reps) || 5;
      const w = await addWorkout(name.trim(), setsNum, repsNum);
      setWorkouts((prev) => [...prev, w]);
      setName('');
      setSets('5');
      setReps('5');
    } catch (e: any) {
      Alert.alert('Add Workout Error', e.message ?? String(e));
    } finally {
      setAdding(false);
    }
  }

  async function onCompleteToday(workoutId: string) {
    try {
      await completeWorkoutToday(workoutId);
      await loadLogs();
      Alert.alert('Nice!', 'Logged for today.');
    } catch (e: any) {
      Alert.alert('Log Error', e.message ?? String(e));
    }
  }

  const header = useMemo(
    () => (
      <View style={{ gap: 8, padding: 16, backgroundColor: '#0b0f1a' }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Workouts</Text>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#121a2b', borderWidth: 1, borderColor: '#1f2a44' }}>
          <Text style={{ color: '#bcd', fontSize: 12, marginBottom: 6 }}>Daily Streak</Text>
          {logsLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>{streak}🔥</Text>
          )}
          <Text style={{ color: '#8aa', fontSize: 12, marginTop: 4 }}>
            Counts consecutive days (UTC) with any logged workout.
          </Text>
        </View>

        <View style={{ marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#121a2b', borderWidth: 1, borderColor: '#1f2a44', gap: 8 }}>
          <Text style={{ color: '#bcd', fontSize: 12 }}>Add Workout</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (e.g., Bench Press)"
            placeholderTextColor="#889"
            style={{ color: 'white', borderWidth: 1, borderColor: '#233153', borderRadius: 8, padding: 10 }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={sets}
              onChangeText={setSets}
              placeholder="Sets"
              placeholderTextColor="#889"
              keyboardType="number-pad"
              style={{ flex: 1, color: 'white', borderWidth: 1, borderColor: '#233153', borderRadius: 8, padding: 10 }}
            />
            <TextInput
              value={reps}
              onChangeText={setReps}
              placeholder="Reps"
              placeholderTextColor="#889"
              keyboardType="number-pad"
              style={{ flex: 1, color: 'white', borderWidth: 1, borderColor: '#233153', borderRadius: 8, padding: 10 }}
            />
          </View>
          <Pressable
            disabled={adding}
            onPress={onAddWorkout}
            style={{
              backgroundColor: adding ? '#2a3a5a' : '#345ff6',
              padding: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{adding ? 'Adding…' : 'Add Workout'}</Text>
          </Pressable>
        </View>

        <Text style={{ color: '#bcd', marginTop: 12 }}>Your Workouts</Text>
      </View>
    ),
    [streak, logsLoading, name, sets, reps, adding]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0f1a' }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: '#121a2b',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#1f2a44',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: '#9ab', marginTop: 2 }}>
                {item.sets} x {item.reps}
              </Text>
              <Pressable
                onPress={() => onCompleteToday(item.id)}
                style={{ marginTop: 10, backgroundColor: '#25a244', padding: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Complete Today</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
