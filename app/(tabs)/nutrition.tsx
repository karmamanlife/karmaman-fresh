import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal } from 'react-native';
import { getSupabase } from '../../src/lib/supabase';
import { searchFood, getFoodNutrients } from '../../src/services/foodApi';

export default function NutritionScreen() {
  const [macros, setMacros] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchFood(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = async (food) => {
    try {
      const nutrients = await getFoodNutrients(food.food_name);
      
      if (nutrients) {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Cache the food
        await supabase.from('food_cache').upsert({
          food_name: nutrients.food_name,
          brand: nutrients.brand_name,
          calories: nutrients.nf_calories,
          protein: nutrients.nf_protein,
          carbs: nutrients.nf_total_carbohydrate,
          fats: nutrients.nf_total_fat,
          serving_size: nutrients.serving_qty,
          serving_unit: nutrients.serving_unit
        });

        // Log the meal
        await supabase.from('user_meals_history').insert({
          user_id: user.id,
          meal_number: selectedMeal,
          meal_name: `Meal ${selectedMeal}`,
          foods: [{
            name: nutrients.food_name,
            calories: nutrients.nf_calories,
            protein: nutrients.nf_protein,
            carbs: nutrients.nf_total_carbohydrate,
            fats: nutrients.nf_total_fat,
            quantity: nutrients.serving_qty
          }],
          total_calories: nutrients.nf_calories,
          total_protein: nutrients.nf_protein,
          total_carbs: nutrients.nf_total_carbohydrate,
          total_fats: nutrients.nf_total_fat
        });

        setModalVisible(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Food select error:', error);
    }
  };

  const openLogModal = (mealNumber) => {
    setSelectedMeal(mealNumber);
    setModalVisible(true);
  };

  const renderMealSlots = () => {
    if (!profile || !macros) return null;
    
    const mealsPerDay = profile.meals_per_day || 3;
    const perMeal = {
      calories: Math.round(macros.daily_calories / mealsPerDay),
      protein: Math.round(macros.daily_protein / mealsPerDay),
      carbs: Math.round(macros.daily_carbs / mealsPerDay),
      fats: Math.round(macros.daily_fats / mealsPerDay)
    };
    
    return Array.from({ length: mealsPerDay }, (_, i) => (
      <View key={i} style={styles.mealCard}>
        <Text style={styles.mealTitle}>Meal {i + 1}</Text>
        <View style={styles.mealMacros}>
          <Text style={styles.mealMacroText}>{perMeal.calories} cal</Text>
          <Text style={styles.mealMacroText}>P: {perMeal.protein}g</Text>
          <Text style={styles.mealMacroText}>C: {perMeal.carbs}g</Text>
          <Text style={styles.mealMacroText}>F: {perMeal.fats}g</Text>
        </View>
        <Pressable style={styles.logButton} onPress={() => openLogModal(i + 1)}>
          <Text style={styles.logButtonText}>Log Meal</Text>
        </Pressable>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Nutrition</Text>
        
        {macros && (
          <>
            <Text style={styles.subtitle}>Daily Targets</Text>
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
              <Text style={styles.metaText}>BMR: {Math.round(macros.bmr)} cal • TDEE: {Math.round(macros.tdee)} cal</Text>
              {profile && <Text style={styles.metaText}>Meals per day: {profile.meals_per_day}</Text>}
            </View>

            <Text style={styles.subtitle}>Your Meals</Text>
            {renderMealSlots()}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Meal {selectedMeal}</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>?</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food (e.g., chicken breast)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          {searching && <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />}

          <ScrollView style={styles.resultsContainer}>
            {searchResults.map((food, index) => (
              <Pressable
                key={index}
                style={styles.foodItem}
                onPress={() => handleSelectFood(food)}
              >
                <Text style={styles.foodName}>{food.food_name}</Text>
                <Text style={styles.foodServing}>{food.serving_unit}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 15 },
  macroCard: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 12, marginBottom: 15 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  macroLabel: { fontSize: 16, color: '#666' },
  macroValue: { fontSize: 18, fontWeight: '600' },
  metaCard: { backgroundColor: '#e8e8e8', padding: 12, borderRadius: 8, marginBottom: 10 },
  metaText: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 3 },
  mealCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  mealTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  mealMacros: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  mealMacroText: { fontSize: 14, color: '#666' },
  logButton: { backgroundColor: '#000', padding: 10, borderRadius: 8, alignItems: 'center' },
  logButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { fontSize: 24, color: '#000' },
  searchContainer: { flexDirection: 'row', marginBottom: 20 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginRight: 10 },
  searchButton: { backgroundColor: '#000', padding: 12, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '500' },
  resultsContainer: { flex: 1 },
  foodItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  foodName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  foodServing: { fontSize: 14, color: '#666' }
});
