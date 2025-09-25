import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { getSupabase } from '../../src/lib/supabase';

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [macros, setMacros] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const [macrosResult, profileResult] = await Promise.all([
        supabase.from('user_calculations').select('*').eq('user_id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      ]);

      if (macrosResult.data) setMacros(macrosResult.data);
      if (profileResult.data) setProfile(profileResult.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerMealMacros = () => {
    if (!macros || !profile) return null;
    
    const mealsPerDay = profile.meals_per_day || 3;
    return {
      calories: Math.round(macros.daily_calories / mealsPerDay),
      protein: Math.round(macros.daily_protein / mealsPerDay),
      carbs: Math.round(macros.daily_carbs / mealsPerDay),
      fats: Math.round(macros.daily_fats / mealsPerDay)
    };
  };

  const renderMealSlots = () => {
    if (!profile) return null;
    
    const mealsPerDay = profile.meals_per_day || 3;
    const perMeal = calculatePerMealMacros();
    
    return Array.from({ length: mealsPerDay }, (_, i) => (
      <View key={i} style={styles.mealCard}>
        <Text style={styles.mealTitle}>Meal {i + 1}</Text>
        <View style={styles.mealMacros}>
          <Text style={styles.mealMacroText}>{perMeal.calories} cal</Text>
          <Text style={styles.mealMacroText}>P: {perMeal.protein}g</Text>
          <Text style={styles.mealMacroText}>C: {perMeal.carbs}g</Text>
          <Text style={styles.mealMacroText}>F: {perMeal.fats}g</Text>
        </View>
        <Pressable style={styles.logButton}>
          <Text style={styles.logButtonText}>Log Meal</Text>
        </Pressable>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nutrition</Text>
      
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={styles.tabText}>Overview</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === 'meals' && styles.activeTab]}
          onPress={() => setSelectedTab('meals')}
        >
          <Text style={styles.tabText}>Meals</Text>
        </Pressable>
      </View>

      {selectedTab === 'overview' && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : macros ? (
            <>
              <Text style={styles.subtitle}>Your Daily Targets</Text>
              
              <View style={styles.macroCard}>
                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.daily_calories)}</Text>
                </View>
                
                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.daily_protein)}g</Text>
                </View>
                
                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.daily_carbs)}g</Text>
                </View>
                
                <View style={styles.macroRow}>
                  <Text style={styles.macroLabel}>Fats</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.daily_fats)}g</Text>
                </View>
              </View>

              <View style={styles.metaCard}>
                <Text style={styles.metaText}>BMR: {Math.round(macros.bmr)} cal</Text>
                <Text style={styles.metaText}>TDEE: {Math.round(macros.tdee)} cal</Text>
                {profile && <Text style={styles.metaText}>Meals per day: {profile.meals_per_day}</Text>}
              </View>
            </>
          ) : (
            <Text style={styles.noData}>Complete your profile setup to see macro targets</Text>
          )}
        </View>
      )}

      {selectedTab === 'meals' && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : macros && profile ? (
            <>
              <Text style={styles.subtitle}>Your Meal Plan</Text>
              <Text style={styles.mealInfo}>Split your daily macros across {profile.meals_per_day} meals</Text>
              {renderMealSlots()}
            </>
          ) : (
            <Text style={styles.noData}>Complete your profile setup to see meal plan</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tabContainer: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, padding: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#000' },
  tabText: { textAlign: 'center', fontWeight: '500' },
  content: { minHeight: 200 },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  mealInfo: { fontSize: 14, color: '#666', marginBottom: 20 },
  macroCard: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 12, marginBottom: 20 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  macroLabel: { fontSize: 16, color: '#666' },
  macroValue: { fontSize: 18, fontWeight: '600' },
  metaCard: { backgroundColor: '#e8e8e8', padding: 15, borderRadius: 8, marginBottom: 20 },
  metaText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 5 },
  mealCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  mealTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  mealMacros: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mealMacroText: { fontSize: 14, color: '#666' },
  logButton: { backgroundColor: '#000', padding: 10, borderRadius: 8, alignItems: 'center' },
  logButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  noData: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 40 }
});
