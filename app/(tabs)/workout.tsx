import React from 'react';
import { ScrollView, StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { KoruBackground } from '../../src/components/KoruBackground';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { isTodaysWorkoutComplete } from '../../src/services/workoutService';

export default function WorkoutScreen() {
  const router = useRouter();
  const [workoutComplete, setWorkoutComplete] = useState(false);

  useEffect(() => {
    const checkWorkoutStatus = async () => {
      const complete = await isTodaysWorkoutComplete(3);
      setWorkoutComplete(complete);
    };
    checkWorkoutStatus();
  }, []);

  return (
    <View style={styles.container}>
      <KoruBackground />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require('../../assets/images/karmamanFullResize.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ProfileAvatar size={40} />
        </View>
      </View>
      <Text style={styles.date}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        {/* Today's Workout Card */}
        <Card variant="outlined">
          <CardHeader title="Today's Workout" />
          <CardContent style={{ position: 'relative', overflow: 'hidden', padding: 0, minHeight: 200 }}>
            <Image
              source={require('../../assets/images/UpperTorso2.png')}
              style={styles.workoutBackground}
              resizeMode="cover"
            />
            <View style={styles.workoutOverlay}>
              <Text style={styles.workoutTitle}>Upper Body Strength</Text>
              <Text style={styles.workoutMeta}>45 min • 6 exercises</Text>
              <Pressable
                style={styles.workoutButton}
                onPress={() => router.push('/workout/today')}
              >
                <Text style={styles.workoutButtonText}>{workoutComplete ? 'Nice Work!!' : "Let's Go!"}</Text>
              </Pressable>
            </View>
          </CardContent>
        </Card>

        {/* Workout Report Card */}
        <Card variant="outlined">
          <CardHeader
            title="Workout Report"
            subtitle="Track your progress"
          />
          <CardContent>
            <View style={styles.reportContent}>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>12</Text>
                <Text style={styles.reportLabel}>Workouts This Month</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>540</Text>
                <Text style={styles.reportLabel}>Total Minutes</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportValue}>85%</Text>
                <Text style={styles.reportLabel}>Completion Rate</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Analysis Card */}
        <Card variant="outlined">
          <CardHeader
            title="Performance Analysis"
            subtitle="Your strength trends"
          />
          <CardContent>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisText}>📈 Bench Press: +15% strength gain</Text>
              <Text style={styles.analysisText}>💪 Overall volume: +22% vs last month</Text>
              <Text style={styles.analysisText}>🎯 Consistency: 4.2 workouts/week</Text>
              <Text style={styles.analysisText}>⚡ Best performance: Monday AM sessions</Text>
            </View>
          </CardContent>
        </Card>

        {/* Workout History Card */}
        <Card variant="outlined">
          <CardHeader title="Recent Workouts" />
          <CardContent>
            <View style={styles.historyContent}>
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>Oct 19</Text>
                  <Text style={styles.historyName}>Lower Body</Text>
                </View>
                <Text style={styles.historyDuration}>52 min</Text>
              </View>
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>Oct 17</Text>
                  <Text style={styles.historyName}>Push Day</Text>
                </View>
                <Text style={styles.historyDuration}>48 min</Text>
              </View>
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>Oct 15</Text>
                  <Text style={styles.historyName}>Pull Day</Text>
                </View>
                <Text style={styles.historyDuration}>45 min</Text>
              </View>
            </View>
          </CardContent>
        </Card>
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
    gap: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 170,
    height: 42,
    tintColor: '#42534A',
    marginLeft: -24,
  },
  date: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
    marginBottom: 8,
  },
  workoutBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '150%',
    opacity: 0.3,
  },
  workoutOverlay: {
    padding: 20,
    minHeight: 150,
    justifyContent: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#42534A',
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: '#666',
  },
  workoutButton: {
    backgroundColor: 'rgba(66, 83, 74, 0.3)',
    paddingVertical: 13,
    paddingHorizontal: 27,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCD1C1',
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  workoutButtonText: {
    color: '#D40C19',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  reportContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  reportItem: {
    alignItems: 'center',
  },
  reportValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3F6B5C',
    marginBottom: 4,
  },
  reportLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  analysisContent: {
    gap: 12,
  },
  analysisText: {
    fontSize: 15,
    color: '#42534A',
    lineHeight: 22,
  },
  historyContent: {
    gap: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  historyLeft: {
    gap: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#42534A',
  },
  historyDuration: {
    fontSize: 14,
    color: '#3F6B5C',
    fontWeight: '600',
  },
});