import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Image, TextInput, Pressable } from 'react-native';
import { Card, CardContent } from '../../src/components/ui/Card';
import { KoruBackground } from '../../components/KoruBackground';
import { useRouter } from 'expo-router';

type Exercise = {
  id: string;
  name: string;
  imageUrl: string;
  sets: number;
  targetReps: string;
  notes?: string;
};

export default function TodaysWorkoutScreen() {
  const router = useRouter();
  
  const [exercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Barbell Bench Press',
      imageUrl: '../../assets/images/UpperTorso2.png',
      sets: 4,
      targetReps: '8-10',
      notes: 'Focus on controlled descent',
    },
    {
      id: '2',
      name: 'Dumbbell Rows',
      imageUrl: '../../assets/images/UpperTorso2.png',
      sets: 3,
      targetReps: '10-12',
      notes: 'Keep back straight',
    },
    {
      id: '3',
      name: 'Overhead Press',
      imageUrl: '../../assets/images/UpperTorso2.png',
      sets: 3,
      targetReps: '8-10',
      notes: 'Engage core throughout',
    },
  ]);

  return (
    <View style={styles.container}>
      <KoruBackground />
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
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
          <Text style={styles.workoutTitle}>Upper Body Strength</Text>
          <Text style={styles.workoutMeta}>45 min • 6 exercises</Text>
        </View>

        {exercises.map((exercise) => (
          <Card key={exercise.id} variant="solid" style={styles.exerciseCard}>
            <CardContent style={styles.exerciseContent}>
              {/* Exercise Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require('../../assets/images/UpperTorso2.png')}
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
              </View>

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseTarget}>{exercise.sets} sets • {exercise.targetReps} reps</Text>
                {exercise.notes && (
                  <Text style={styles.exerciseNotes}>💡 {exercise.notes}</Text>
                )}
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
                        />
                        <Text style={styles.inputLabel}>reps</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Complete Exercise Button */}
              <Pressable style={styles.completeButton}>
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </Pressable>
            </CardContent>
          </Card>
        ))}

        {/* Finish Workout Button */}
        <Pressable style={styles.finishButton} onPress={() => router.back()}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
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
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
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
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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