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

// Mock functions for now - replace with your actual lib/workouts imports
const mockFetchWorkouts = async () => {
  return [
    { id: "1", name: "Push-ups", sets: 3, reps: 10 },
    { id: "2", name: "Squats", sets: 4, reps: 15 },
  ];
};

const mockAddWorkout = async (name: string, sets: number, reps: number) => {
  return { id: Date.now().toString(), name, sets, reps };
};

const mockCompleteWorkoutToday = async (workoutId: string) => {
  return { success: true };
};

const mockFetchRecentLogs = async (days: number) => {
  return [];
};

const mockFetchServerStreak = async (timezone: string) => {
  return 5; // Mock streak
};

function parseNum(input: string, def: number): number {
  const m = (input ?? "").toString().match(/\d+/);
  return m ? parseInt(m[0], 10) : def;
}

export default function WorkoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Add form
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [adding, setAdding] = useState(false);

  async function loadWorkouts() {
    try {
      setLoading(true);
      const ws = await mockFetchWorkouts();
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
      const logs = await mockFetchRecentLogs(30);
      setRecentLogs(logs);
      const s = await mockFetchServerStreak("Australia/Sydney");
      setStreak(typeof s === "number" ? s : 0);
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
      const setsNum = parseNum(sets, 3);
      const repsNum = parseNum(reps, 10);
      const w = await mockAddWorkout(name.trim(), setsNum, repsNum);
      setWorkouts((prev) => [...prev, w]);
      setName("");
      setSets("3");
      setReps("10");
      Alert.alert("Added!", `${name} added successfully`);
    } catch (e: any) {
      Alert.alert("Add Workout Error", e.message ?? String(e));
    } finally {
      setAdding(false);
    }
  }

  async function onCompleteToday(workoutId: string) {
    try {
      await mockCompleteWorkoutToday(workoutId);
      await loadLogs();
      Alert.alert("Nice!", "Logged for today.");
    } catch (e: any) {
      Alert.alert("Log Error", e.message ?? String(e));
    }
  }

  const header = useMemo(
    () => (
      <View style={{ gap: 16, padding: 16, backgroundColor: "#0b0f1a" }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>Workouts</Text>

        {/* Streak Card */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: "#121a2b",
            borderWidth: 1,
            borderColor: "#1f2a44",
          }}
        >
          <Text style={{ color: "#bcd", fontSize: 12, marginBottom: 6 }}>
            Daily Streak (AEST)
          </Text>
          {logsLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "white", fontSize: 32, fontWeight: "900" }}>
              {streak}🔥
            </Text>
          )}
          <Text style={{ color: "#8aa", fontSize: 12, marginTop: 4 }}>
            Consecutive days with any logged workout.
          </Text>
        </View>

        {/* Add Workout Form */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: "#121a2b",
            borderWidth: 1,
            borderColor: "#1f2a44",
            gap: 12,
          }}
        >
          <Text style={{ color: "#bcd", fontSize: 14, fontWeight: "600" }}>
            Add New Workout
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Workout name (e.g., Push-ups)"
            placeholderTextColor="#889"
            style={{
              color: "white",
              borderWidth: 1,
              borderColor: "#233153",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#bcd", fontSize: 12, marginBottom: 4 }}>Sets</Text>
              <TextInput
                value={sets}
                onChangeText={setSets}
                placeholder="3"
                placeholderTextColor="#889"
                keyboardType="number-pad"
                style={{
                  color: "white",
                  borderWidth: 1,
                  borderColor: "#233153",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#bcd", fontSize: 12, marginBottom: 4 }}>Reps</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                placeholder="10"
                placeholderTextColor="#889"
                keyboardType="number-pad"
                style={{
                  color: "white",
                  borderWidth: 1,
                  borderColor: "#233153",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </View>
          </View>

          <Pressable
            disabled={adding}
            onPress={onAddWorkout}
            style={{
              backgroundColor: adding ? "#2a3a5a" : "#345ff6",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              {adding ? "Adding..." : "Add Workout"}
            </Text>
          </Pressable>
        </View>

        <Text style={{ color: "#bcd", fontSize: 16, fontWeight: "600", marginTop: 8 }}>
          Your Workouts
        </Text>
      </View>
    ),
    [streak, logsLoading, name, sets, reps, adding]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0f1a" }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: "#121a2b",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#1f2a44",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                {item.name}
              </Text>
              <Text style={{ color: "#9ab", marginTop: 4, fontSize: 14 }}>
                {item.sets} sets × {item.reps} reps
              </Text>
              <Pressable
                onPress={() => onCompleteToday(item.id)}
                style={{
                  marginTop: 12,
                  backgroundColor: "#25a244",
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                  Complete Today
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
