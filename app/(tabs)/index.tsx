import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getSupabase } from '../../src/lib/supabase';
import { KoruBackground } from '../../src/components/KoruBackground';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { isTodaysWorkoutComplete } from '../../src/services/workoutService';
import Svg, { Circle } from 'react-native-svg';

type UserProfile = {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
};

type ConsumedMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>({
  daily_calories: 2000,
  daily_protein: 150,
  daily_carbs: 200,
  daily_fats: 65,
});
  const [consumed, setConsumed] = useState<ConsumedMacros>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [workoutComplete, setWorkoutComplete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNutritionData();
    }, [])
  );
useEffect(() => {
  const checkWorkoutStatus = async () => {
    const complete = await isTodaysWorkoutComplete(3); // 3 exercises in hardcoded workout
    setWorkoutComplete(complete);
  };
  checkWorkoutStatus();
}, []);
  const loadNutritionData = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user profile
      const { data: profileData } = await supabase
        .from('user_nutrition_profiles')
        .select('daily_calories, daily_protein, daily_carbs, daily_fats')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load today's consumed macros
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: meals } = await supabase
        .from('user_meals_history')
        .select('total_calories, total_protein, total_carbs, total_fats')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart.toISOString())
        .lte('logged_at', todayEnd.toISOString());

      if (meals) {
        const totals = meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.total_calories || 0),
            protein: acc.protein + (meal.total_protein || 0),
            carbs: acc.carbs + (meal.total_carbs || 0),
            fats: acc.fats + (meal.total_fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
        setConsumed(totals);
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <KoruBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42534A" />
        </View>
      </View>
    );
  }

  const remaining = {
    calories: profile.daily_calories - consumed.calories,
    protein: profile.daily_protein - consumed.protein,
    carbs: profile.daily_carbs - consumed.carbs,
    fats: profile.daily_fats - consumed.fats,
  };

  const isOverCalories = remaining.calories < 0;

  return (
    <View style={styles.container}>
      <KoruBackground />
      
  <View style={styles.header}>
  <View style={styles.headerTop}>
    <Image
      source={require('../../assets/images/karmamanFull.png')}
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
        <Card variant="outlined">
          <CardHeader 
            title="Today's Nutrition"
            action={
              <Pressable onPress={() => router.push('/nutrition')}>
                <Text style={styles.link}>Details →</Text>
              </Pressable>
            }
          />
          <CardContent>
            <View style={styles.nutritionContainer}>
              {/* Left side - Circular rings */}
              <View style={styles.ringsContainer}>
                <MacroRing 
                  percentage={(consumed.protein / profile.daily_protein) * 100}
                  color="#3F6B5C"
                  size={200}
                  strokeWidth={12}
                  position="protein"
                />
                <MacroRing 
                  percentage={(consumed.carbs / profile.daily_carbs) * 100}
                  color="#A3D9A1"
                  size={180}
                  strokeWidth={12}
                  position="carbs"
                />
                <MacroRing 
                  percentage={(consumed.fats / profile.daily_fats) * 100}
                  color="#D28A41"
                  size={160}
                  strokeWidth={12}
                  position="fats"
                />
                
                {/* Center calorie ring */}
                <View style={styles.calorieRing}>
                  <View style={styles.calorieRingInner}>
                    <Text style={[styles.calorieValue, isOverCalories && styles.overTarget]}>
                      {isOverCalories ? '+' : ''}{Math.abs(remaining.calories).toLocaleString()}
                    </Text>
                    <Text style={styles.calorieLabel}>
                      {isOverCalories ? 'cal over' : 'cal left'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right side - Macro breakdown */}
              <View style={styles.macroBreakdown}>
                <MacroBreakdownItem
                  color="#3F6B5C"
                  label="Protein"
                  current={Math.round(consumed.protein)}
                  target={profile.daily_protein}
                />
                <MacroBreakdownItem
                  color="#A3D9A1"
                  label="Carbs"
                  current={Math.round(consumed.carbs)}
                  target={profile.daily_carbs}
                />
                <MacroBreakdownItem
                  color="#D28A41"
                  label="Fat"
                  current={Math.round(consumed.fats)}
                  target={profile.daily_fats}
                />
              </View>
            </View>
          </CardContent>
        </Card>

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
      <Pressable style={styles.workoutButton} onPress={() => router.push('/workout/today')}>
  <Text style={styles.workoutButtonText}>{workoutComplete ? 'Nice Work!!' : "Let's Go!"}</Text>
</Pressable>
    </View>
  </CardContent>
</Card>

        <Card variant="outlined">
          <CardHeader 
            title="Current Streak 🔥"
            subtitle="Keep it going!"
          />
          <CardContent>
            <Text style={styles.streakValue}>7 days</Text>
            <Text style={styles.streakText}>Your longest streak this month</Text>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <Pressable style={styles.actionButton} onPress={() => router.push('/nutrition')}>
                  <Text style={styles.actionEmoji}>🍎</Text>
                  <Text style={styles.actionText}>Log Meal</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionEmoji}>💧</Text>
                  <Text style={styles.actionText}>Log Water</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionEmoji}>✅</Text>
                  <Text style={styles.actionText}>Log Habit</Text>
                </Pressable>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

function MacroRing({ percentage, color, size, strokeWidth, position }: { 
  percentage: number; 
  color: string; 
  size: number; 
  strokeWidth: number;
  position: 'protein' | 'carbs' | 'fats';
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  
  return (
    <Svg
      width={size}
      height={size}
      style={{
        position: 'absolute',
        transform: [{ rotate: '-90deg' }],
      }}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#DCD1C1"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={percentage > 100 ? '#D40C19' : color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MacroBreakdownItem({ color, label, current, target }: {
  color: string;
  label: string;
  current: number;
  target: number;
}) {
  const isOver = current > target;
  
  return (
    <View style={styles.breakdownItem}>
      <Text style={[styles.breakdownLabel, { color: isOver ? '#D40C19' : color }]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, isOver && styles.overTarget]}>
        {current}g / {target}g
      </Text>
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
  },
  scrollContent: {
    flex: 1,
  },
  content: {
  padding: 16,
},
header: {
  paddingHorizontal: 16,
  paddingTop: 48,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  marginBottom: 24,
},
 headerTop: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
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
  marginBottom: 16,
  marginLeft: 16,
  width: '100%',
},
  link: {
    color: '#42534A',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 24,
  },
  ringsContainer: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  calorieRingInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#42534A',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  overTarget: {
    color: '#D40C19',
  },
  macroBreakdown: {
    flex: 1,
    gap: 20,
  },
  breakdownItem: {
    gap: 4,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#A3D9A1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDetails: {
    flex: 1,
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
  backgroundColor: '#D40C19',
  paddingVertical: 18,
  paddingHorizontal: 36,
  borderRadius: 8,
  marginTop: 16,
  alignSelf: 'flex-start',
},
workoutButtonText: {
  color: '#fff',
  fontSize: 24,
  fontWeight: '600',
},
  emoji: {
    fontSize: 24,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#42534A',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    alignItems: 'center',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#42534A',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionEmoji: {
    fontSize: 32,
  },
 actionText: {
  fontSize: 12,
  color: '#666',
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
  padding: 0,
  minHeight: 150,
  justifyContent: 'center',
},
});