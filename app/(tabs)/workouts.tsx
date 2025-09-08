// FILE: C:\Users\sngaw\karmaman-fresh\app\(tabs)\workouts.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import {
  fetchWorkouts,
  addWorkout,
  completeWorkoutToday,
  fetchRecentLogs,
  computeDailyStreak,
  fetchServerStreak,
  Workout,
  WorkoutLog,
} from '../../lib/workouts';

// Get first integer in a string; fallback to default
function parseNum(input: string, def: number): number {
  const m = (input ?? '').toString().match(/\d+/);
  return m ? parseInt(m[0], 10) : def;
}

export default function WorkoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [logsLoading, setLogsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);

  // Add form
  const [name, setName] = useState('');
  const [sets, setSets] = useState('5');
  const [reps, setReps] = useState('5');
  const [adding, setAdding] = useState(false);

  async function loadWorkouts() {
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
      setRecentLogs(logs);
      try {
        const s = await fetchServerStreak('Australia/Sydney');
        setStreak(typeof s === 'number' ? s : 0);
      } catch {
        setStreak(computeDailyStreak(logs));
      }
    } catch (e: any) {
      Alert.alert('Logs Error', e.message ?? String(e));
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkouts();
    loadLogs();
  }, []);

  async function onAddWorkout() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a workout name');
      return;
    }
    setAdding(true);
    try {
      const setsNum = parseNum(sets, 5);
      const repsNum = parseNum(reps, 5);
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

  const workoutNameById = useMemo(() => {
    const m = new Map<string, string>();
    workouts.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [workouts]);

  const header = useMemo(
    () => (
      <View style={{ gap: 8, padding: 16, backgroundColor: '#0b0f1a' }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Workouts</Text>
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#121a2b', borderWidth: 1, borderColor: '#1f2a44' }}>
          <Text style={{ color: '#bcd', fontSize: 12, marginBottom: 6 }}>Daily Streak (AEST)</Text>
          {logsLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>{streak}🔥</Text>
          )}
          <Text style={{ color: '#8aa', fontSize: 12, marginTop: 4 }}>
            Server-calculated consecutive days (Australia/Sydney) with any logged workout.
          </Text>
        </View>

        <View style={{ marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#121a2b', borderWidth: 1, borderColor: '#1f2a44', gap: 8 }}>
          <Text style={{ color: '#bcd', fontSize: 12 }}>
            Add Workout <Text style={{ color: '#7fb' }}>(reps accepts 10 or 10-12)</Text>
          </Text>
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
            style={{ backgroundColor: adding ? '#2a3a5a' : '#345ff6', padding: 12, borderRadius: 10, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{adding ? 'Adding…' : 'Add Workout'}</Text>
          </Pressable>
        </View>

        <Text style={{ color: '#bcd', marginTop: 12 }}>Your Workouts</Text>
      </View>
    ),
    [streak, logsLoading, name, sets, reps, adding]
  );

  const footer = useMemo(
    () => (
      <View style={{ padding: 16 }}>
        <View style={{ marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#121a2b', borderWidth: 1, borderColor: '#1f2a44' }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>History (last 30 days)</Text>
          {logsLoading ? (
            <View style={{ marginTop: 8 }}>
              <ActivityIndicator />
            </View>
          ) : recentLogs.length === 0 ? (
            <Text style={{ color: '#9ab', marginTop: 8 }}>No logs yet.</Text>
          ) : (
            <View style={{ marginTop: 8, gap: 6 }}>
              {recentLogs.map((log) => {
                const wname = workoutNameById.get(log.workout_id) ?? 'Workout';
                return (
                  <View
                    key={log.id}
                    style={{
                      backgroundColor: '#0f1628',
                      borderWidth: 1,
                      borderColor: '#1f2a44',
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>{wname}</Text>
                    <Text style={{ color: '#9ab' }}>Date: {log.for_date}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    ),
    [logsLoading, recentLogs, workoutNameById]
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
          ListFooterComponent={footer}
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
