import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { getSupabase } from '../../src/lib/supabase';

export default function MealHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [macros, setMacros] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const [historyResult, macrosResult] = await Promise.all([
        supabase
          .from('user_meals_history')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(30),
        supabase
          .from('user_calculations')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (historyResult.data) setHistory(historyResult.data);
      if (macrosResult.data) setMacros(macrosResult.data);
    } catch (error) {
      console.error('Load history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyMeal = async (meal) => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('user_meals_history').insert({
        user_id: user.id,
        meal_number: meal.meal_number,
        meal_name: meal.meal_name,
        foods: meal.foods,
        total_calories: meal.total_calories,
        total_protein: meal.total_protein,
        total_carbs: meal.total_carbs,
        total_fats: meal.total_fats
      });

      loadHistory();
    } catch (error) {
      console.error('Copy meal error:', error);
    }
  };

  const getDailyTotals = (date) => {
    const dayMeals = history.filter(m => 
      new Date(m.logged_at).toDateString() === new Date(date).toDateString()
    );
    
    return {
      calories: dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0),
      carbs: dayMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0),
      fats: dayMeals.reduce((sum, m) => sum + (m.total_fats || 0), 0)
    };
  };

  const groupedByDate = history.reduce((acc, meal) => {
    const date = new Date(meal.logged_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Meal History</Text>

      {macros && (
        <View style={styles.targetsCard}>
          <Text style={styles.targetsTitle}>Daily Targets</Text>
          <View style={styles.targetsRow}>
            <Text style={styles.targetText}>{Math.round(macros.daily_calories)} cal</Text>
            <Text style={styles.targetText}>P: {Math.round(macros.daily_protein)}g</Text>
            <Text style={styles.targetText}>C: {Math.round(macros.daily_carbs)}g</Text>
            <Text style={styles.targetText}>F: {Math.round(macros.daily_fats)}g</Text>
          </View>
        </View>
      )}

      {Object.keys(groupedByDate).length === 0 ? (
        <Text style={styles.noData}>No meals logged yet</Text>
      ) : (
        Object.entries(groupedByDate).map(([date, meals]) => {
          const totals = getDailyTotals(date);
          return (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              
              <View style={styles.dailyTotals}>
                <Text style={styles.totalsLabel}>Daily Total:</Text>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalText}>{Math.round(totals.calories)} cal</Text>
                  <Text style={styles.totalText}>P: {Math.round(totals.protein)}g</Text>
                  <Text style={styles.totalText}>C: {Math.round(totals.carbs)}g</Text>
                  <Text style={styles.totalText}>F: {Math.round(totals.fats)}g</Text>
                </View>
              </View>

              {meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{meal.meal_name}</Text>
                    <Pressable style={styles.copyButton} onPress={() => copyMeal(meal)}>
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </Pressable>
                  </View>
                  
                  {meal.foods && Array.isArray(meal.foods) && meal.foods.map((food, idx) => (
                    <Text key={idx} style={styles.foodItem}>• {food.name}</Text>
                  ))}
                  
                  <View style={styles.mealMacros}>
                    <Text style={styles.macroText}>{Math.round(meal.total_calories)} cal</Text>
                    <Text style={styles.macroText}>P: {Math.round(meal.total_protein)}g</Text>
                    <Text style={styles.macroText}>C: {Math.round(meal.total_carbs)}g</Text>
                    <Text style={styles.macroText}>F: {Math.round(meal.total_fats)}g</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  targetsCard: { backgroundColor: '#e8f5e9', padding: 15, borderRadius: 12, marginBottom: 20 },
  targetsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  targetsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  targetText: { fontSize: 14, fontWeight: '500' },
  dateSection: { marginBottom: 25 },
  dateHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  dailyTotals: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 15 },
  totalsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  totalText: { fontSize: 14 },
  mealCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mealName: { fontSize: 16, fontWeight: '600' },
  copyButton: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  copyButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  foodItem: { fontSize: 14, color: '#666', marginBottom: 4 },
  mealMacros: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  macroText: { fontSize: 13, color: '#666' },
  noData: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 40 }
});
