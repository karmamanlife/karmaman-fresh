// app/workout/[sessionId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSupabase } from '../../src/lib/supabase';
import { getSessionExercises, type SessionExercise } from '../../src/services/workoutApi';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { CoachingCue } from '../../src/components/ui/CoachingCue';

const { width } = Dimensions.get('window');

export default function WorkoutDetailScreen() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [sessionId]);

  const loadExercises = async () => {
    try {
      if (typeof sessionId !== 'string') return;
      const data = await getSessionExercises(sessionId);
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderExercise = ({ item }: { item: SessionExercise }) => (
    <View style={styles.exerciseCard}>
      <Card variant="outlined" style={styles.card}>
        <CardHeader title={item.exercise_name} />
        <CardContent>
          <View style={styles.exerciseDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sets</Text>
              <Text style={styles.detailValue}>{item.sets}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reps</Text>
              <Text style={styles.detailValue}>{item.reps}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RPE</Text>
              <Text style={styles.detailValue}>{item.rpe}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rest</Text>
              <Text style={styles.detailValue}>{item.rest_seconds}s</Text>
            </View>
          </View>

          {item.notes && (
            <CoachingCue cueType="form_tip" content={item.notes} />
          )}

          {item.equipment_needed && (
            <View style={styles.equipmentContainer}>
              <Text style={styles.equipmentLabel}>Equipment:</Text>
              <Text style={styles.equipmentText}>{item.equipment_needed}</Text>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Workout</Text>
      </View>

      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.footer}>
        <Pressable style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3F6B5C',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#24534A',
  },
  flatListContent: {
    paddingVertical: 16,
  },
  exerciseCard: {
    width: width,
    paddingHorizontal: 16,
  },
  card: {
    height: '90%',
  },
  exerciseDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 18,
    color: '#24534A',
    fontWeight: '700',
  },
  equipmentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(63, 107, 92, 0.1)',
    borderRadius: 8,
  },
  equipmentLabel: {
    fontSize: 12,
    color: '#3F6B5C',
    fontWeight: '600',
    marginBottom: 4,
  },
  equipmentText: {
    fontSize: 14,
    color: '#24534A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: '#3F6B5C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});