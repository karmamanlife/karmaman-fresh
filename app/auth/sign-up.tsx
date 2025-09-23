// File: app/auth/sign-up.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSupabase } from "@/lib/supabase";

export default function SignUpScreen() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);   // eye toggle
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleSecure = () => setSecure(s => !s);

  async function handleSignUp() {
    setErr(null); setLoading(true);
    try {
      const s = getSupabase();

      // No email redirect. Create the user.
      const { data, error } = await s.auth.signUp({ email, password });
      if (error) throw error;

      // If confirmations are still ON in Supabase, session may be null. Try to sign in anyway.
      if (!data.session) {
        const { error: siErr } = await s.auth.signInWithPassword({ email, password });
        if (siErr) throw siErr;
      }

      // Go straight to your existing onboarding screen (change path if yours differs)
      r.replace("/onboarding/nutrition");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      console.warn("Sign-up error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Create your account</Text>

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
          key={secure ? "pwd-secure" : "pwd-open"} // force re-mount on RN Web when toggled
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
        onPress={handleSignUp}
        disabled={loading || !email || !password}
        style={{ backgroundColor: loading ? "#aaa" : "#000", padding: 12, borderRadius: 8, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator /> : <Text style={{ color: "#fff" }}>Sign up</Text>}
      </Pressable>

      {err ? <Text style={{ color: "red" }}>{err}</Text> : null}

      <Pressable onPress={() => r.replace("/auth/sign-in")} style={{ marginTop: 8 }}>
        <Text style={{ color: "#555" }}>Already have an account? Sign in</Text>
      </Pressable>
    </View>
  );
}
