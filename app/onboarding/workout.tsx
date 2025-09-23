import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutOnboarding() {
  const router = useRouter();
  const { goalType, nutritionComplete } = useLocalSearchParams<{ 
    goalType: string; 
    nutritionComplete: string; 
  }>();

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/complete',
      params: { 
        goalType,
        nutritionComplete,
        workoutComplete: 'true'
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Setup</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Ionicons name="barbell-outline" size={80} color="#007AFF" />
        <Text style={styles.title}>Workout Preferences</Text>
        <Text style={styles.subtitle}>
          Your workout planning will be integrated here. For now, we'll set up basic preferences based on your {goalType?.replace('_', ' ')} goal.
        </Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Personalized workout plans</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Progress tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>Exercise library</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.featureText}>AI-powered recommendations</Text>
          </View>
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <Text style={styles.stepLabel}>Goals</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <Text style={styles.stepLabel}>Nutrition</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <Text style={styles.stepLabel}>Workouts</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={styles.stepDot} />
            <Text style={styles.stepLabel}>Complete</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Step 3 of 4 - Almost done!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    marginBottom: 6,
  },
  stepActive: {
    backgroundColor: '#007AFF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  progressLine: {
    width: 30,
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

