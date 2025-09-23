import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getSupabase } from '../../src/lib/supabase';

export default function GoalsSetup() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState('');
  const [trainingDays, setTrainingDays] = useState(0);
  const [loading, setLoading] = useState(false);

  const goals = [
    { id: 'cut', title: 'Cut Fat & Get Jacked', description: 'Lose fat while building lean muscle' },
    { id: 'maintain', title: 'Maintain', description: 'Maintain current weight and build strength' },
    { id: 'bulk', title: 'Bulk Up Time', description: 'Build muscle mass and size' }
  ];

  const handleContinue = async () => {
    if (!selectedGoal || trainingDays === 0) {
      Alert.alert('Error', 'Please select a goal and training frequency');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'No user session found');
        return;
      }

      const { error } = await supabase.from('user_goals').insert({
        user_id: user.id,
        goal_type: selectedGoal,
        training_days: trainingDays
      });

      if (error) {
        console.error('Goals creation error:', error);
        Alert.alert('Error', 'Failed to save goals');
        return;
      }

      // Navigate to macro calculation
      router.replace('/onboarding/calculate');
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your goal?</Text>
      
      {goals.map((goal) => (
        <Pressable
          key={goal.id}
          style={[styles.goalCard, selectedGoal === goal.id && styles.selectedGoal]}
          onPress={() => setSelectedGoal(goal.id)}
        >
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription}>{goal.description}</Text>
        </Pressable>
      ))}
      
      <Text style={styles.subtitle}>How many days can you train per week?</Text>
      
      <View style={styles.trainingDaysContainer}>
        {[1, 2, 3, 4, 5, 6, 7].map((days) => (
          <Pressable
            key={days}
            style={[styles.dayButton, trainingDays === days && styles.selectedDay]}
            onPress={() => setTrainingDays(days)}
          >
            <Text style={styles.dayText}>{days}</Text>
          </Pressable>
        ))}
      </View>
      
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Calculate My Macros</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 30, marginBottom: 20 },
  goalCard: { padding: 20, borderWidth: 2, borderColor: '#ddd', borderRadius: 12, marginBottom: 15 },
  selectedGoal: { borderColor: '#000', backgroundColor: '#f8f8f8' },
  goalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  goalDescription: { fontSize: 14, color: '#666' },
  trainingDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  dayButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  selectedDay: { backgroundColor: '#000', borderColor: '#000' },
  dayText: { fontSize: 16, fontWeight: '500', color: '#000' },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
