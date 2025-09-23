import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
// Adjust this import to match your project structure if needed:
import { getSupabase } from '../../src/lib/supabase';

type Gender = 'male' | 'female';
type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';

export default function NutritionOnboarding() {
  const router = useRouter();

  // ---- Form State ----
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState<string>(''); // in cm
  const [weight, setWeight] = useState<string>(''); // in kg
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');

  const [loading, setLoading] = useState(false);

  // ---- Derived helpers for preview ----
  const bmr = useMemo(() => calculateBMR({ gender, weight, height, age }), [
    gender,
    weight,
    height,
    age,
  ]);
  const tdee = useMemo(() => calculateTDEE({ bmr, activityLevel }), [
    bmr,
    activityLevel,
  ]);
  const macroPreview = useMemo(() => calculateMacros({ tdee, goal }), [
    tdee,
    goal,
  ]);

  // ---- Validation ----
  const validateForm = (): boolean => {
    const ageNum = parseInt(age, 10);
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (Number.isNaN(ageNum) || ageNum < 12 || ageNum > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age (12�100).');
      return false;
    }
    if (Number.isNaN(h) || h < 120 || h > 250) {
      Alert.alert(
        'Invalid Height',
        'Please enter a valid height in centimeters (120�250).'
      );
      return false;
    }
    if (Number.isNaN(w) || w < 35 || w > 300) {
      Alert.alert(
        'Invalid Weight',
        'Please enter a valid weight in kilograms (35�300).'
      );
      return false;
    }
    return true;
  };

  // ---- Submit / Save then go to TERMS ----
  const handleComplete = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const {
        data: { user },
      } = await getSupabase().auth.getUser();

      if (!user) {
        Alert.alert('Error', 'No user session found');
        router.replace('/welcome');
        return;
      }

      // Calculate numbers
      const computedBMR = calculateBMR({ gender, weight, height, age });
      const computedTDEE = calculateTDEE({ bmr: computedBMR, activityLevel });
      const macros = calculateMacros({ tdee: computedTDEE, goal });

      // Persist profile
      const { error } = await getSupabase().from('user_nutrition_profiles').insert({
        user_id: user.id,
        age: parseInt(age, 10),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        activity_level: activityLevel,
        goal,
        bmr: Math.round(computedBMR),
        tdee: Math.round(computedTDEE),
        daily_calories: Math.round(macros.calories),
        daily_protein: Math.round(macros.protein),
        daily_carbs: Math.round(macros.carbs),
        daily_fats: Math.round(macros.fats),
      });

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert(
          'Error',
          'Failed to save your profile. Please try again.'
        );
        return;
      }

      // GO TO TERMS FIRST!!!
      router.replace('/onboarding/terms');
    } catch (err) {
      console.error('Error completing nutrition setup:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nutrition Setup</Text>
        <Text style={styles.subtitle}>
          Enter your details to personalize your daily targets.
        </Text>

        {/* Age */}
        <View style={styles.field}>
          <Text style={styles.label}>Age (years)</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="e.g. 30"
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="next"
          />
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={gender}
              onValueChange={(v) => setGender(v as Gender)}
            >
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>
        </View>

        {/* Height */}
        <View style={styles.field}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 180"
            keyboardType="decimal-pad"
            style={styles.input}
            returnKeyType="next"
          />
        </View>

        {/* Weight */}
        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 80"
            keyboardType="decimal-pad"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        {/* Activity Level */}
        <View style={styles.field}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
            >
              <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
              <Picker.Item label="Light (1�3x/week)" value="light" />
              <Picker.Item label="Moderate (3�5x/week)" value="moderate" />
              <Picker.Item label="Active (6�7x/week)" value="active" />
              <Picker.Item label="Very Active (hard exercise & job)" value="very_active" />
            </Picker>
          </View>
        </View>

        {/* Goal */}
        <View style={styles.field}>
          <Text style={styles.label}>Goal</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={goal} onValueChange={(v) => setGoal(v as Goal)}>
              <Picker.Item label="Lose weight" value="lose" />
              <Picker.Item label="Maintain" value="maintain" />
              <Picker.Item label="Gain muscle" value="gain" />
            </Picker>
          </View>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>BMR</Text>
            <Text style={styles.previewValue}>
              {Number.isFinite(bmr) ? Math.round(bmr) : '�'} kcal
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>TDEE</Text>
            <Text style={styles.previewValue}>
              {Number.isFinite(tdee) ? Math.round(tdee) : '�'} kcal
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.previewTitle, { marginTop: 6 }]}>Daily Macros</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Calories</Text>
            <Text style={styles.previewValue}>
              {fmt(macroPreview.calories)} kcal
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Protein</Text>
            <Text style={styles.previewValue}>
              {fmt(macroPreview.protein)} g
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Carbs</Text>
            <Text style={styles.previewValue}>
              {fmt(macroPreview.carbs)} g
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Fats</Text>
            <Text style={styles.previewValue}>
              {fmt(macroPreview.fats)} g
            </Text>
          </View>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save & Continue to Terms</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Utilities ---------------- */

function toNum(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

// Mifflin-St Jeor BMR
function calculateBMR({
  gender,
  weight,
  height,
  age,
}: {
  gender: Gender;
  weight: string | number;
  height: string | number;
  age: string | number;
}): number {
  const w = typeof weight === 'string' ? toNum(weight) : weight;
  const h = typeof height === 'string' ? toNum(height) : height;
  const a = typeof age === 'string' ? parseInt(age, 10) : age;

  if (!isFinite(w) || !isFinite(h) || !isFinite(a)) return NaN;

  // kg, cm, years
  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === 'male' ? base + 5 : base - 161;
}

function activityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'active':
      return 1.725;
    case 'very_active':
      return 1.9;
    default:
      return 1.55;
  }
}

function calculateTDEE({
  bmr,
  activityLevel,
}: {
  bmr: number;
  activityLevel: ActivityLevel;
}): number {
  if (!isFinite(bmr)) return NaN;
  return bmr * activityMultiplier(activityLevel);
}

function calculateMacros({
  tdee,
  goal,
}: {
  tdee: number;
  goal: Goal;
}): { calories: number; protein: number; carbs: number; fats: number } {
  if (!isFinite(tdee)) return { calories: NaN, protein: NaN, carbs: NaN, fats: NaN };

  // Calorie adjustments by goal
  let calories = tdee;
  if (goal === 'lose') calories = tdee * 0.8; // ~20% deficit
  if (goal === 'gain') calories = tdee * 1.1; // ~10% surplus

  // Simple macro split by goal (can refine later)
  // Protein ~2.0 g/kg for maintain, 2.2 for lose, 1.8 for gain (placeholder until we store lean mass)
  // For now, approximate weight from calories is noisy; use 2.0 g/kg @ 80kg default if missing.
  const assumedWeight = 80;
  const proteinPerKg = goal === 'lose' ? 2.2 : goal === 'gain' ? 1.8 : 2.0;
  const protein = proteinPerKg * assumedWeight; // grams

  // Remaining calories -> carbs & fats (50/50 split)
  const proteinCals = protein * 4;
  const remaining = Math.max(calories - proteinCals, 0);
  const fats = remaining * 0.5 / 9; // grams
  const carbs = remaining * 0.5 / 4; // grams

  return {
    calories,
    protein,
    carbs,
    fats,
  };
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '�';
  return Math.round(n).toString();
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9e9e9',
    fontSize: 16,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9e9e9',
    overflow: 'hidden',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  previewLabel: {
    color: '#555',
    fontSize: 14,
  },
  previewValue: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

