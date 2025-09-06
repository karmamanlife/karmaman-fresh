import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { fetchWorkouts, Workout } from "../../lib/workouts";

export default function Workouts() {
  const [data, setData] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchWorkouts();
        setData(rows);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load workouts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[s.c, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading workouts…</Text>
      </View>
    );
  }

  return (
    <View style={s.c}>
      <Text style={s.h}>Workouts</Text>
      {data.length === 0 ? (
        <Text style={{ color: "#666" }}>No workouts yet. Add one in Supabase Studio → public.workouts.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.title}>{item.name}</Text>
              <Text style={s.meta}>{item.sets} x {item.reps}</Text>
              <Pressable style={s.btn} onPress={() => {}}>
                <Text style={s.btnt}>Start</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 12 },
  h: { fontSize: 22, fontWeight: "700" },
  card: { padding: 16, backgroundColor: "#f5f5f5", borderRadius: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  meta: { color: "#666", marginTop: 4 },
  btn: { marginTop: 10, backgroundColor: "#111", padding: 10, borderRadius: 8, alignItems: "center" },
  btnt: { color: "#fff", fontWeight: "600" },
});
