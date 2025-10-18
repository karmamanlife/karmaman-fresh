import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { KoruBackground } from '../../components/KoruBackground';

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <KoruBackground />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card variant="outlined">
          <CardHeader title="Today's Workout" />
          <CardContent>
            <Text style={styles.placeholderText}>
              Your workout plan will appear here
            </Text>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="This Week" />
          <CardContent>
            <Text style={styles.placeholderText}>
              Weekly workout schedule coming soon
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#24534A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});