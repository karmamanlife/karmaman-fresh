import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getSupabase } from '../../src/lib/supabase';

type UserNutritionProfile = {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
};

type MealHistory = {
  id: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  logged_at: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserNutritionProfile | null>(null);
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [loading, setLoading] = useState(true);

  const loadNutritionData = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProfile({
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fats: 65
        });
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile({
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fats: 65
        });
        setLoading(false);
        return;
      }

      // Get user's nutrition profile
      try {
        const { data: profileData } = await supabase
          .from('user_nutrition_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({
            daily_calories: 2000,
            daily_protein: 150,
            daily_carbs: 200,
            daily_fats: 65
          });
        }
      } catch (profErr) {
        setProfile({
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fats: 65
        });
      }

      // Get today's meals
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      try {
        const { data: mealsData } = await supabase
          .from('user_meals_history')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', todayStart.toISOString())
          .lte('logged_at', todayEnd.toISOString());

        if (mealsData) {
          const meals = mealsData as MealHistory[];
          const totals = meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.total_calories,
              protein: acc.protein + meal.total_protein,
              carbs: acc.carbs + meal.total_carbs,
              fats: acc.fats + meal.total_fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
          );
          setConsumed(totals);
        } else {
          setConsumed({ calories: 0, protein: 0, carbs: 0, fats: 0 });
        }
      } catch (mealsErr) {
        setConsumed({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      setProfile({
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 200,
        daily_fats: 65
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNutritionData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNutritionData();
    }, [])
  );

  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3F6B5C" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back! 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <Card variant="elevated">
        <CardHeader 
          title="Today's Nutrition"
          action={<Pressable onPress={() => router.push('/nutrition')}><Text style={styles.link}>Details →</Text></Pressable>}
        />
        <CardContent>
          <View style={styles.calorieRing}>
            <View style={[styles.ring, isOverCalories && styles.ringOver]}>
              <View style={styles.ringInner}>
                <Text style={[styles.ringValue, isOverCalories && styles.overTarget]}>
                  {isOverCalories ? '+' : ''}{Math.abs(remaining.calories).toLocaleString()}
                </Text>
                <Text style={styles.ringLabel}>{isOverCalories ? 'cal over' : 'cal left'}</Text>
              </View>
            </View>
            <View style={styles.macroBars}>
              <MacroBar label="Protein" current={Math.round(consumed.protein)} target={profile.daily_protein} color="#3F6B5C" />
              <MacroBar label="Carbs" current={Math.round(consumed.carbs)} target={profile.daily_carbs} color="#A3D9A1" />
              <MacroBar label="Fat" current={Math.round(consumed.fats)} target={profile.daily_fats} color="#D28A41" />
            </View>
          </View>
        </CardContent>
      </Card>

      <Card variant="default" pressable onPress={() => router.push('/workouts')}>
        <CardHeader 
          title="Today's Workout"
          icon={<Text style={styles.emoji}>💪</Text>}
        />
        <CardContent>
          <View style={styles.workoutContent}>
            <View style={styles.workoutIcon}>
              <Text style={styles.emoji}>🏋️</Text>
            </View>
            <View style={styles.workoutDetails}>
              <Text style={styles.workoutTitle}>Upper Body Strength</Text>
              <Text style={styles.workoutMeta}>45 min • 6 exercises</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card variant="default">
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
                <Text style={styles.actionEmoji}>🎯</Text>
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
  );
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;
  
  return (
    <View style={styles.macroBar}>
      <Text style={styles.macroName}>{label}</Text>
      <View style={styles.macroProgress}>
        <View style={[styles.macroFill, { width: `${percentage}%`, backgroundColor: isOver ? '#D40C19' : color }]} />
      </View>
      <Text style={[styles.macroValue, isOver && styles.overTarget]}>{current}g / {target}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#24534A',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  link: {
    color: '#3F6B5C',
    fontSize: 14,
    fontWeight: '600',
  },
  calorieRing: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCD1C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  ringOver: {
    backgroundColor: '#fee2e2',
  },
  ringInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F6B5C',
  },
  overTarget: {
    color: '#D40C19',
  },
  ringLabel: {
    fontSize: 12,
    color: '#666',
  },
  macroBars: {
    width: '100%',
    gap: 12,
  },
  macroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroName: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
    color: '#333',
  },
  macroProgress: {
    flex: 1,
    height: 8,
    backgroundColor: '#DCD1C1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 12,
    color: '#666',
    minWidth: 80,
    textAlign: 'right',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#24534A',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 14,
    color: '#666',
  },
  emoji: {
    fontSize: 24,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3F6B5C',
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
    color: '#24534A',
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
});