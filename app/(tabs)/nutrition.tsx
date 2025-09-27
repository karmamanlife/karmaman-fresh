import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { getSupabase } from '../../src/lib/supabase';
import { searchFood, getFoodNutrients } from '../../src/services/foodApi';

export default function NutritionScreen() {
  const [macros, setMacros] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    serving: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const [macrosResult, profileResult, historyResult] = await Promise.all([
        supabase.from('user_calculations').select('*').eq('user_id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_meals_history').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10)
      ]);

      if (macrosResult.data) setMacros(macrosResult.data);
      if (profileResult.data) setProfile(profileResult.data);
      if (historyResult.data) setHistory(historyResult.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualFood.name || !manualFood.calories || !manualFood.protein || !manualFood.carbs || !manualFood.fats) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      const calories = parseFloat(manualFood.calories);
      const protein = parseFloat(manualFood.protein);
      const carbs = parseFloat(manualFood.carbs);
      const fats = parseFloat(manualFood.fats);

      // Cache the food
      await supabase.from('food_cache').upsert({
        food_name: manualFood.name,
        calories,
        protein,
        carbs,
        fats,
        serving_size: manualFood.serving || '1',
        serving_unit: 'serving'
      });

      // Log the meal
      await supabase.from('user_meals_history').insert({
        user_id: user.id,
        meal_number: selectedMeal,
        meal_name: `Meal ${selectedMeal}`,
        foods: [{
          name: manualFood.name,
          calories,
          protein,
          carbs,
          fats,
          quantity: manualFood.serving || '1'
        }],
        total_calories: calories,
        total_protein: protein,
        total_carbs: carbs,
        total_fats: fats
      });

      setModalVisible(false);
      setManualEntry(false);
      setManualFood({ name: '', calories: '', protein: '', carbs: '', fats: '', serving: '' });
      loadUserData();
    } catch (error) {
      console.error('Manual entry error:', error);
      Alert.alert('Error', 'Failed to log food');
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
        loadUserData();
      }
    } catch (error) {
      console.error('Food select error:', error);
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

      loadUserData();
    } catch (error) {
      console.error('Copy meal error:', error);
    }
  };

  const openLogModal = (mealNumber) => {
    setSelectedMeal(mealNumber);
    setModalVisible(true);
    setManualEntry(false);
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 }}>
              <Text style={styles.subtitle}>Your Meals</Text>
              <Pressable onPress={() => setShowHistory(!showHistory)} style={{ backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>{showHistory ? 'Hide' : 'History'}</Text>
              </Pressable>
            </View>

            {showHistory ? (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Recent Meals</Text>
                {history.length === 0 ? (
                  <Text style={styles.noHistory}>No meals logged yet</Text>
                ) : (
                  history.map((meal) => (
                    <View key={meal.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyMealName}>{meal.meal_name}</Text>
                        <Pressable style={styles.copyButton} onPress={() => copyMeal(meal)}>
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.historyDate}>{new Date(meal.logged_at).toLocaleDateString()}</Text>
                      <View style={styles.historyMacros}>
                        <Text style={styles.historyMacroText}>{Math.round(meal.total_calories)} cal</Text>
                        <Text style={styles.historyMacroText}>P: {Math.round(meal.total_protein)}g</Text>
                        <Text style={styles.historyMacroText}>C: {Math.round(meal.total_carbs)}g</Text>
                        <Text style={styles.historyMacroText}>F: {Math.round(meal.total_fats)}g</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : (
              renderMealSlots()
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Meal {selectedMeal}</Text>
            <Pressable onPress={() => { setModalVisible(false); setManualEntry(false); }}>
              <Text style={styles.closeButton}>?</Text>
            </Pressable>
          </View>

          {!manualEntry ? (
            <>
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

              <Pressable style={styles.manualButton} onPress={() => setManualEntry(true)}>
                <Text style={styles.manualButtonText}>Can't find food? Add manually</Text>
              </Pressable>

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
            </>
          ) : (
            <ScrollView style={styles.manualForm}>
              <Text style={styles.formLabel}>Food Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Grilled Chicken"
                value={manualFood.name}
                onChangeText={(text) => setManualFood({...manualFood, name: text})}
              />

              <Text style={styles.formLabel}>Calories</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 165"
                keyboardType="numeric"
                value={manualFood.calories}
                onChangeText={(text) => setManualFood({...manualFood, calories: text})}
              />

              <Text style={styles.formLabel}>Protein (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 31"
                keyboardType="numeric"
                value={manualFood.protein}
                onChangeText={(text) => setManualFood({...manualFood, protein: text})}
              />

              <Text style={styles.formLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 0"
                keyboardType="numeric"
                value={manualFood.carbs}
                onChangeText={(text) => setManualFood({...manualFood, carbs: text})}
              />

              <Text style={styles.formLabel}>Fats (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 3.6"
                keyboardType="numeric"
                value={manualFood.fats}
                onChangeText={(text) => setManualFood({...manualFood, fats: text})}
              />

              <Text style={styles.formLabel}>Serving Size (optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 100g"
                value={manualFood.serving}
                onChangeText={(text) => setManualFood({...manualFood, serving: text})}
              />

              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.cancelButton]} onPress={() => setManualEntry(false)}>
                  <Text style={styles.buttonText}>Back to Search</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={handleManualEntry}>
                  <Text style={styles.buttonText}>Add Food</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
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
  historySection: { marginTop: 10 },
  historyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyMealName: { fontSize: 16, fontWeight: '600' },
  historyDate: { fontSize: 12, color: '#999', marginBottom: 8 },
  historyMacros: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  historyMacroText: { fontSize: 13, color: '#666' },
  copyButton: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  copyButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  noHistory: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { fontSize: 24, color: '#000' },
  searchContainer: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginRight: 10 },
  searchButton: { backgroundColor: '#000', padding: 12, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '500' },
  manualButton: { backgroundColor: '#666', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  manualButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  manualForm: { flex: 1 },
  formLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  formInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16 },
  buttonRow: { flexDirection: 'row', marginTop: 30, gap: 10 },
  button: { flex: 1, backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#666' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  resultsContainer: { flex: 1 },
  foodItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  foodName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  foodServing: { fontSize: 14, color: '#666' }
});
