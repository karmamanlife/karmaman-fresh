import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { getSupabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editTrainingDays, setEditTrainingDays] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const [profileResult, goalsResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_goals').select('*').eq('user_id', user.id).single()
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (goalsResult.data) {
        setGoals(goalsResult.data);
        setEditGoal(goalsResult.data.goal_type);
        setEditTrainingDays(goalsResult.data.training_days);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoals = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_goals')
        .update({
          goal_type: editGoal,
          training_days: editTrainingDays
        })
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update goals');
        return;
      }

      Alert.alert('Success', 'Goals updated successfully');
      setEditing(false);
      loadUserData();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const goalLabels = {
    cut: 'Cut Fat & Get Jacked',
    maintain: 'Maintain',
    bulk: 'Bulk Up Time'
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {profile && (
        <>
          <Text style={styles.subtitle}>Your Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{profile.age} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight:</Text>
              <Text style={styles.value}>{profile.weight} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Height:</Text>
              <Text style={styles.value}>{profile.height} cm</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Meals per day:</Text>
              <Text style={styles.value}>{profile.meals_per_day}</Text>
            </View>
          </View>
        </>
      )}

      {goals && (
        <>
          <Text style={styles.subtitle}>Your Goals</Text>
          <View style={styles.card}>
            {!editing ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Goal:</Text>
                  <Text style={styles.value}>{goalLabels[goals.goal_type]}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Training days:</Text>
                  <Text style={styles.value}>{goals.training_days} per week</Text>
                </View>
                <Pressable style={styles.button} onPress={() => setEditing(true)}>
                  <Text style={styles.buttonText}>Edit Goals</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.editLabel}>Goal Type</Text>
                <View style={styles.goalOptions}>
                  {['cut', 'maintain', 'bulk'].map(g => (
                    <Pressable
                      key={g}
                      style={[styles.goalOption, editGoal === g && styles.selectedGoal]}
                      onPress={() => setEditGoal(g)}
                    >
                      <Text style={styles.goalText}>{goalLabels[g]}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.editLabel}>Training Days per Week</Text>
                <View style={styles.daysContainer}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <Pressable
                      key={d}
                      style={[styles.dayButton, editTrainingDays === d && styles.selectedDay]}
                      onPress={() => setEditTrainingDays(d)}
                    >
                      <Text style={[styles.dayText, editTrainingDays === d && styles.selectedDayText]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.buttonRow}>
                  <Pressable style={[styles.button, styles.cancelButton]} onPress={() => { setEditing(false); setEditGoal(goals.goal_type); setEditTrainingDays(goals.training_days); }}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.button} onPress={handleUpdateGoals}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 15 },
  card: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  cancelButton: { backgroundColor: '#666', flex: 1, marginRight: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  editLabel: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 10 },
  goalOptions: { marginBottom: 20 },
  goalOption: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 10 },
  selectedGoal: { borderColor: '#000', backgroundColor: '#f0f0f0' },
  goalText: { fontSize: 16 },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  dayButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  selectedDay: { backgroundColor: '#000', borderColor: '#000' },
  dayText: { fontSize: 16, color: '#000' },
  selectedDayText: { color: '#fff' },
  buttonRow: { flexDirection: 'row', marginTop: 20 }
});
