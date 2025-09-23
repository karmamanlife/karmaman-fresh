import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeOnboarding() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const goalOptions = [
    {
      id: 'weight_loss',
      title: 'Lose Weight',
      description: 'Reduce body fat and achieve sustainable weight loss',
      icon: 'trending-down-outline',
      color: '#FF6B6B'
    },
    {
      id: 'muscle_gain',
      title: 'Build Muscle',
      description: 'Increase lean muscle mass and strength',
      icon: 'barbell-outline',
      color: '#4ECDC4'
    },
    {
      id: 'maintenance',
      title: 'Maintain Health',
      description: 'Stay healthy and maintain current fitness level',
      icon: 'heart-outline',
      color: '#45B7D1'
    },
    {
      id: 'recomposition',
      title: 'Body Recomposition',
      description: 'Lose fat while building muscle simultaneously',
      icon: 'fitness-outline',
      color: '#96CEB4'
    },
    {
      id: 'performance',
      title: 'Athletic Performance',
      description: 'Optimize performance for sports or competitions',
      icon: 'trophy-outline',
      color: '#FFEAA7'
    }
  ];

  const handleContinue = () => {
    if (!selectedGoal) return;
    
    // Pass the selected goal to the next screen
    router.push({
      pathname: '/onboarding/nutrition',
      params: { goalType: selectedGoal }
    });
  };

  const renderGoalOption = (goal: typeof goalOptions[0]) => {
    const isSelected = selectedGoal === goal.id;
    
    return (
      <TouchableOpacity
        key={goal.id}
        style={[
          styles.goalCard,
          isSelected && { borderColor: goal.color, backgroundColor: goal.color + '15' }
        ]}
        onPress={() => setSelectedGoal(goal.id)}
      >
        <View style={styles.goalHeader}>
          <Ionicons 
            name={goal.icon as any} 
            size={28} 
            color={isSelected ? goal.color : '#666'} 
          />
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={goal.color} />
          )}
        </View>
        
        <Text style={[styles.goalTitle, isSelected && { color: goal.color }]}>
          {goal.title}
        </Text>
        
        <Text style={styles.goalDescription}>
          {goal.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Welcome to Karmaman</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's personalize your health and fitness journey
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your primary goal?</Text>
          <Text style={styles.sectionSubtitle}>
            We'll customize your nutrition, workouts, and AI coaching based on your objective
          </Text>
        </View>

        <View style={styles.goalsGrid}>
          {goalOptions.map(renderGoalOption)}
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <Text style={styles.stepLabel}>Goals</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={styles.stepDot} />
            <Text style={styles.stepLabel}>Nutrition</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={styles.stepDot} />
            <Text style={styles.stepLabel}>Workouts</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={styles.stepDot} />
            <Text style={styles.stepLabel}>Complete</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedGoal && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedGoal}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedGoal && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={selectedGoal ? '#fff' : '#666'} 
          />
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Step 1 of 4 - This will take about 3 minutes
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#999',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  goalsGrid: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
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
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: '#666',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

