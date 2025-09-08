import { View, Text, StyleSheet } from 'react-native';

export default function Workouts() {
  return (
    <View style={s.c}>
      <Text style={s.h}>Workouts</Text>
      <Text>Coming soon: list of workouts, add session, streaks.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 8 },
  h: { fontSize: 22, fontWeight: '700' },
});
