import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function Nutrition() {
  const [cal, setCal] = useState("2400");
  const cals = Number(cal) || 0;
  const protein = Math.round((cals * 0.30) / 4);
  const carbs   = Math.round((cals * 0.40) / 4);
  const fat     = Math.round((cals * 0.30) / 9);

  return (
    <View style={s.c}>
      <Text style={s.h}>Nutrition</Text>
      <Text style={s.l}>Daily Calories</Text>
      <TextInput
        style={s.input}
        keyboardType="numeric"
        value={cal}
        onChangeText={setCal}
        placeholder="e.g., 2400"
      />
      <View style={s.row}><Text style={s.k}>Protein</Text><Text style={s.v}>{protein} g</Text></View>
      <View style={s.row}><Text style={s.k}>Carbs</Text><Text style={s.v}>{carbs} g</Text></View>
      <View style={s.row}><Text style={s.k}>Fat</Text><Text style={s.v}>{fat} g</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 12 },
  h: { fontSize: 22, fontWeight: "700" },
  l: { marginTop: 8, color: "#555" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  k: { fontWeight: "600" },
  v: { color: "#333" },
});
