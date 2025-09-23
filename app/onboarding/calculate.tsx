import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabase } from '../../src/lib/supabase';

export default function MacroCalculation() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [macros, setMacros] = useState(null);

  useEffect(() => {
    calculateMacros();
  }, []);

  const calculateMacros = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'No user session found');
        return;
      }

      // Get user profile and goals
      const [profileResult, goalsResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_goals').select('*').eq('user_id', user.id).single()
      ]);

      if (profileResult.error || goalsResult.error) {
        Alert.alert('Error', 'Failed to load profile data');
        return;
      }

      const profile = profileResult.data;
      const goals = goalsResult.data;

      // Calculate BMR (Mifflin-St Jeor Equation)
      const bmr = profile.age <= 30 
        ? 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
        : 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);

      // Calculate TDEE based on training days
      const activityMultipliers = {
        1: 1.375, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9
      };
      const tdee = bmr * activityMultipliers[goals.training_days];

      // Adjust calories based on goal
      let calories = tdee;
      if (goals.goal_type === 'cut') calories = tdee * 0.85; // 15% deficit
      if (goals.goal_type === 'bulk') calories = tdee * 1.15; // 15% surplus

      // Calculate macros
      const protein = calories * 0.30 / 4; // 30% protein
      const fats = calories * 0.25 / 9;    // 25% fats
      const carbs = (calories - (protein * 4) - (fats * 9)) / 4; // Remaining as carbs

      const calculatedMacros = {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats)
      };

      setMacros(calculatedMacros);
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate macros');
    } finally {
      setLoading(false);
    }
  };

  const saveMacros = async () => {
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('user_calculations').insert({
        user_id: user.id,
        bmr: macros.bmr,
        tdee: macros.tdee,
        daily_calories: macros.calories,
        daily_protein: macros.protein,
        daily_carbs: macros.carbs,
        daily_fats: macros.fats
      });

      if (error) {
        console.error('Save error:', error);
        Alert.alert('Error', 'Failed to save calculations');
        return;
      }

      // Update auth redirect to go to main app instead of onboarding
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Calculating your macros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Personalized Macros</Text>
      
      <View style={styles.macroCard}>
        <Text style={styles.macroTitle}>Daily Targets</Text>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Calories</Text>
          <Text style={styles.macroValue}>{macros.calories}</Text>
        </View>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{macros.protein}g</Text>
        </View>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{macros.carbs}g</Text>
        </View>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Fats</Text>
          <Text style={styles.macroValue}>{macros.fats}g</Text>
        </View>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>BMR: {macros.bmr} cal</Text>
        <Text style={styles.metaLabel}>TDEE: {macros.tdee} cal</Text>
      </View>
      
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={saveMacros}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Saving...' : 'Start Your Journey'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  macroCard: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 12, marginBottom: 20 },
  macroTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  macroLabel: { fontSize: 16, color: '#666' },
  macroValue: { fontSize: 16, fontWeight: '600' },
  metaCard: { padding: 15, backgroundColor: '#e8e8e8', borderRadius: 8, marginBottom: 20 },
  metaLabel: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 5 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
