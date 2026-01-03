import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Image, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Card, CardContent } from '../../src/components/ui/Card';
import { KoruBackground } from '../../src/components/KoruBackground';
import { useRouter } from 'expo-router';
import { createWorkoutLog, saveExerciseSet, completeWorkoutLog, isTodaysWorkoutComplete } from '../../src/services/workoutService';
import { getTodaysWorkout, type SessionExercise } from '../../src/services/workoutApi';
import { getSupabase } from '../../src/lib/supabase';

type SetData = {
  weight: string;
  reps: string;
};

export default function TodaysWorkoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [workoutStartTime] = useState<Date>(new Date());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [allExercisesComplete, setAllExercisesComplete] = useState(false);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [finisher, setFinisher] = useState<any>(null);

  // Initialize set data for all exercises
  const [setData, setSetData] = useState<Record<string, SetData[]>>({});

  // Load today's workout from database
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          Alert.alert('Error', 'Database not initialized');
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Error', 'Not logged in');
          router.back();
          return;
        }

        const workout = await getTodaysWorkout(user.id);
        
        if (!workout) {
          Alert.alert('No Workout', 'No workout assigned for today. Please set up your program.');
          router.back();
          return;
        }

        setExercises(workout.exercises);
        setSessionName(workout.session.name);
        setSessionDuration(workout.session.estimated_minutes);
        setFinisher(workout.session.finisher);

        // Initialize set data for exercises
        const initial: Record<string, SetData[]> = {};
        workout.exercises.forEach(exercise => {
          initial[exercise.id] = Array.from({ length: exercise.sets }).map(() => ({
            weight: '',
            reps: '',
          }));
        });
        setSetData(initial);

      } catch (error) {
        console.error('Error loading workout:', error);
        Alert.alert('Error', 'Failed to load workout');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, []);

  // Create workout log on mount
  useEffect(() => {
    const initWorkout = async () => {
      const logId = await createWorkoutLog(null);
      if (logId) {
        setWorkoutLogId(logId);
      } else {
        Alert.alert('Error', 'Failed to start workout session');
      }
    };
    initWorkout();
  }, []);

  // Check if workout already complete
  useEffect(() => {
    if (exercises.length > 0) {
      const checkCompletion = async () => {
        const complete = await isTodaysWorkoutComplete(exercises.length);
        setAllExercisesComplete(complete);
      };
      checkCompletion();
    }
  }, [exercises.length]);

  const updateSetData = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setSetData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const handleMarkComplete = async (exercise: SessionExercise) => {
    if (!workoutLogId) {
      Alert.alert('Error', 'Workout session not initialized');
      return;
    }

    const exerciseSets = setData[exercise.id];
    
    // Validate that at least one set has data
    const hasData = exerciseSets.some(set => set.weight || set.reps);
    if (!hasData) {
      Alert.alert('No Data', 'Please enter at least one set before marking complete');
      return;
    }

    // Save all sets to database
    let successCount = 0;
    for (let i = 0; i < exerciseSets.length; i++) {
      const set = exerciseSets[i];
      if (set.weight || set.reps) {
        const success = await saveExerciseSet({
          workout_log_id: workoutLogId,
          exercise_name: exercise.exercise_name,
          set_number: i + 1,
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || null,
          rpe: null,
        });
        if (success) successCount++;
      }
    }

    if (successCount > 0) {
      setCompletedExercises(prev => new Set(prev).add(exercise.id));
      Alert.alert('Success', `${exercise.exercise_name} completed! ${successCount} sets logged.`);
    } else {
      Alert.alert('Error', 'Failed to save exercise data');
    }
  };

  const handleFinishWorkout = async () => {
    if (!workoutLogId) {
      router.back();
      return;
    }

    // Check if all exercises are complete
    const remaining = exercises.length - completedExercises.size;
    
    if (remaining > 0) {
      Alert.alert(
        'Incomplete Workout',
        `Are you sure brother? You only have ${remaining} exercise${remaining > 1 ? 's' : ''} left`,
        [
          { text: 'Go Back', style: 'cancel' },
          { 
            text: 'Finish Anyway', 
            style: 'destructive',
            onPress: async () => {
              const durationMinutes = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
              const success = await completeWorkoutLog(workoutLogId, durationMinutes);
              if (success) {
                router.back();
              }
            }
          }
        ]
      );
      return;
    }

    const durationMinutes = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
    const success = await completeWorkoutLog(workoutLogId, durationMinutes);
    
    if (success) {
      Alert.alert('Workout Complete!', `Great job! Duration: ${durationMinutes} minutes`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <KoruBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F6B5C" />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KoruBackground />
      
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <Image
            source={require('../../assets/images/karmamanFull.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View style={styles.workoutHeader}>
          <Text style={styles.workoutTitle}>{sessionName}</Text>
          <Text style={styles.workoutMeta}>{sessionDuration} min • {exercises.length} exercises</Text>
          {finisher && (
            <View style={styles.finisherBadge}>
              <Text style={styles.finisherBadgeText}>
                🔥 {finisher.type}: {finisher.duration_min} min
              </Text>
            </View>
          )}
        </View>

        {exercises.map((exercise) => {
          const isCompleted = completedExercises.has(exercise.id);
          return (
            <Card key={exercise.id} variant="outlined" style={styles.exerciseCard}>
              <CardContent style={styles.exerciseContent}>
                {/* Exercise Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={require('../../assets/images/UpperTorso2.png')}
                    style={styles.exerciseImage}
                    resizeMode="cover"
                  />
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓ Complete</Text>
                    </View>
                  )}
                </View>

                {/* Exercise Info */}
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                  <Text style={styles.exerciseTarget}>
                    {exercise.sets} sets • {exercise.reps} reps • RPE {exercise.rpe}
                  </Text>
                  {exercise.notes && (
                    <Text style={styles.exerciseNotes}>💡 {exercise.notes}</Text>
                  )}
                  <Text style={styles.exerciseRest}>Rest: {exercise.rest_seconds}s between sets</Text>
                </View>

                {/* Sets Input Grid */}
                <View style={styles.setsContainer}>
                  {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                      <View style={styles.inputGroup}>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            maxFontSizeMultiplier={1}
                            value={setData[exercise.id]?.[setIndex]?.weight || ''}
                            onChangeText={(value) => updateSetData(exercise.id, setIndex, 'weight', value)}
                            editable={!isCompleted}
                          />
                          <Text style={styles.inputLabel}>kg</Text>
                        </View>
                        <Text style={styles.inputSeparator}>×</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            maxFontSizeMultiplier={1}
                            value={setData[exercise.id]?.[setIndex]?.reps || ''}
                            onChangeText={(value) => updateSetData(exercise.id, setIndex, 'reps', value)}
                            editable={!isCompleted}
                          />
                          <Text style={styles.inputLabel}>reps</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Complete Exercise Button */}
                <Pressable 
                  style={[styles.completeButton, isCompleted && styles.completeButtonDisabled]}
                  onPress={() => handleMarkComplete(exercise)}
                  disabled={isCompleted}
                >
                  <Text style={styles.completeButtonText}>
                    {isCompleted ? '✓ Completed' : 'Mark Complete'}
                  </Text>
                </Pressable>
              </CardContent>
            </Card>
          );
        })}

        {/* Finisher Instructions */}
        {finisher && (
          <Card variant="outlined" style={styles.finisherCard}>
            <CardContent>
              <Text style={styles.finisherTitle}>🔥 {finisher.type} Finisher</Text>
              <Text style={styles.finisherProtocol}>{finisher.protocol}</Text>
              <Text style={styles.finisherMode}>Mode: {finisher.mode}</Text>
              {finisher.notes && (
                <Text style={styles.finisherNotes}>💡 {finisher.notes}</Text>
              )}
            </CardContent>
          </Card>
        )}

        {/* Finish Workout Button */}
        <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>
            {completedExercises.size === exercises.length || allExercisesComplete ? 'Nice Work!!' : 'Finish Workout'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 400,
  },
  header: {
    marginBottom: 24,
    paddingTop: 48,
  },
  backButton: {
    fontSize: 16,
    color: '#3F6B5C',
    fontWeight: '600',
    marginBottom: 16,
  },
  logo: {
    width: 250,
    height: 60,
    marginBottom: 8,
    tintColor: '#42534A',
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  workoutHeader: {
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#42534A',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  finisherBadge: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD8A8',
  },
  finisherBadgeText: {
    fontSize: 14,
    color: '#D28A41',
    fontWeight: '600',
  },
  exerciseCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  completedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3F6B5C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#42534A',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#3F6B5C',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exerciseRest: {
    fontSize: 12,
    color: '#999',
  },
  setsContainer: {
    padding: 16,
    gap: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#42534A',
    width: 60,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#42534A',
    textAlign: 'center',
    paddingHorizontal: 8,
    minWidth: 50,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  inputSeparator: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#3F6B5C',
    paddingVertical: 14,
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#A3D9A1',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  finisherCard: {
    marginBottom: 20,
    backgroundColor: '#FFF4E6',
    borderColor: '#FFD8A8',
  },
  finisherTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D28A41',
    marginBottom: 8,
  },
  finisherProtocol: {
    fontSize: 16,
    color: '#42534A',
    marginBottom: 4,
    fontWeight: '600',
  },
  finisherMode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  finisherNotes: {
    fontSize: 14,
    color: '#D28A41',
    fontStyle: 'italic',
  },
  finishButton: {
    backgroundColor: '#D40C19',
    paddingVertical: 18,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});