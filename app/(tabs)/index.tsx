// FILE: app/(tabs)/index.tsx
import { View, Text } from "react-native";
export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0f1a" }}>
      <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>Home</Text>
    </View>
  );
}
