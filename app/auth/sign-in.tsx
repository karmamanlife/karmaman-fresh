// File: app/auth/sign-in.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSupabase } from "../../src/lib/supabase";

export default function SignInScreen() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleSecure = () => setSecure(s => !s);

  async function handleSignIn() {
    setErr(null); setLoading(true);
    try {
      const s = getSupabase();
      const { error } = await s.auth.signInWithPassword({ email, password });
      if (error) throw error;
      r.replace("/(tabs)"); // CONSISTENT with sign-up
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      console.warn("Sign-in error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Welcome back</Text>
      
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
      
      <View style={{ position: "relative" }}>
        <TextInput
          key={secure ? "pwd-secure" : "pwd-open"}
          placeholder="Password"
          secureTextEntry={secure}
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, paddingRight: 48 }}
        />
        <Pressable
          onPress={toggleSecure}
          accessibilityRole="button"
          accessibilityLabel="Toggle password visibility"
          style={{ position: "absolute", right: 6, top: 0, bottom: 0, width: 36, justifyContent: "center", alignItems: "center", zIndex: 10 }}
          hitSlop={10}
        >
          <Ionicons name={secure ? "eye-off" : "eye"} size={20} color="#666" />
        </Pressable>
      </View>
      
      <Pressable
        onPress={handleSignIn}
        disabled={loading || !email || !password}
        style={{ backgroundColor: loading ? "#aaa" : "#000", padding: 12, borderRadius: 8, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator /> : <Text style={{ color: "#fff" }}>Sign in</Text>}
      </Pressable>
      
      {err ? <Text style={{ color: "red" }}>{err}</Text> : null}
      
      <Pressable onPress={() => r.replace("/auth/sign-up")} style={{ marginTop: 8 }}>
        <Text style={{ color: "#555" }}>Create an account</Text>
      </Pressable>
    </View>
  );
}
