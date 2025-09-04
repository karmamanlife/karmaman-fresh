import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return Alert.alert('Sign in failed', error.message);
    router.replace('/(tabs)/board');
  }

  async function onSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return Alert.alert('Sign up failed', error.message);
    Alert.alert('Account created', 'Now tap Sign In.');
  }

  return (
    <View style={s.c}>
      <Text style={s.h}>Karmaman Sign In</Text>
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={s.input} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={s.input} />
      <Button title="Sign In" onPress={onSignIn} />
      <View style={{ height: 8 }} />
      <Button title="Sign Up (first time)" onPress={onSignUp} />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 20, gap: 10 },
  h: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },
});
