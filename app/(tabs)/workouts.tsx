// FILE: C:\Users\sngaw\karmaman-fresh\app\(tabs)\workouts.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  fetchWorkouts,
  addWorkout,
  completeWorkoutToday,
  fetchRecentLogs,
  computeDailyStreak,
  fetchServerStreak,
  Workout,
  WorkoutLog,
} from "../../lib/workouts";

// Get first integer in a string; fallback to default
function parseNum(input: string, def: number): number {
  const m = (input ?? "").toString().match(/\d+/);
  return m ? parseInt(m[0], 10) : def;
}

export default function WorkoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [logsLoading, setLogsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);

  // Add form
  const [name, setName] = useState("");
  const [sets, setSets] = useState("5");
  const [reps, setReps] = useState("5");
  const [adding, setAdding] = useState(false);

  async function loadWorkouts() {
    try {
      setLoading(true);
      const ws = await fetchWorkouts();
      setWorkouts(ws);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? String(e));
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
        const s = await fetchServerStreak("Australia/Sydney");
        setStreak(typeof s === "number" ? s : 0);
      } catch {
        setStreak(computeDailyStreak(logs));
      }
    } catch (e: any) {
      Alert.alert("Logs Error", e.message ?? String(e));
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
      Alert.alert("Validation", "Please enter a workout name");
      return;
    }
    setAdding(true);
    try {
      const setsNum = parseNum(sets, 5);
      const repsNum = parseNum(reps, 5);
      const w = await addWorkout(name.trim(), setsNum, repsNum);
      setWorkouts((prev) => [...prev, w]);
      setName("");
      setSets("5");
      setReps("5");
    } catch (e: any) {
      Alert.alert("Add Workout Error", e.message ?? String(e));
    } finally {
      setAdding(false);
    }
  }

  async function onCompleteToday(workoutId: string) {
    try {
      await completeWorkoutToday(workoutId);
      await loadLogs();
      Alert.alert("Nice!", "Logged for today.");
    } catch (e: any) {
      Alert.alert("Log Error", e.message ?? String(e));
    }
  }

  // Map workout_id -> workout name for history section_
