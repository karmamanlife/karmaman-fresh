import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { getSupabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "exp://192.168.50.57:8081/auth/callback", // 👈 redirect back to Expo Router
      },
    });

    if (error) {
      Alert.alert("Login error", error.message);
    } else {
      Alert.alert("Check your email", "We sent you a magic login link!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Send Magic Link" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 20, borderRadius: 5 },
});
