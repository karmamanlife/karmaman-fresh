import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getSupabase } from '../../src/lib/supabase';
import { searchFood, getFoodNutrients } from '../../src/services/foodApi';

type UserNutritionProfile = {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
};

type Food = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size?: string;
};

type MealHistory = {
  id: string;
  meal_number: number;
  meal_name: string;
  foods: Food[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  logged_at: string;
};

type SearchResult = {
  food_name: string;
  serving_unit: string;
  serving_qty: number;
};

type DailyTotals = {
  [mealNumber: number]: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
};

export default function NutritionScreen() {
  const [profile, setProfile] = useState<UserNutritionProfile | null>(null);
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({});
  const [showHistory, setShowHistory] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const [stagedFoods, setStagedFoods] = useState<Food[]>([]);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [mealToCopy, setMealToCopy] = useState<MealHistory | null>(null);
  
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const [manualServing, setManualServing] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  };

  const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  };

  const getTodayEnd = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now.toISOString();
  };

  const calculateDailyTotals = (meals: MealHistory[]) => {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    
    const todayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.logged_at).toISOString();
      return mealDate >= todayStart && mealDate <= todayEnd;
    });

    const totals: DailyTotals = {};
    
    todayMeals.forEach(meal => {
      if (!totals[meal.meal_number]) {
        totals[meal.meal_number] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };
      }
      totals[meal.meal_number].calories += meal.total_calories;
      totals[meal.meal_number].protein += meal.total_protein;
      totals[meal.meal_number].carbs += meal.total_carbs;
      totals[meal.meal_number].fats += meal.total_fats;
    });

    return totals;
  };

  const loadUserData = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProfile({
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fats: 65
        });
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
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_nutrition_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          setProfile({
            daily_calories: 2000,
            daily_protein: 150,
            daily_carbs: 200,
            daily_fats: 65
          });
        } else if (profileData) {
          setProfile(profileData);
        }
      } catch (profErr) {
        console.error('Profile exception:', profErr);
        setProfile({
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fats: 65
        });
      }

      try {
        const { data: historyData } = await supabase
          .from('user_meals_history')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(50);

        if (historyData) {
          console.log('Raw history data:', historyData);
          const allMeals = historyData as MealHistory[];
          setMealHistory(allMeals.slice(0, 14));
          
          const totals = calculateDailyTotals(allMeals);
          setDailyTotals(totals);
        }
      } catch (histErr) {
        console.error('History exception:', histErr);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfile({
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 200,
        daily_fats: 65
      });
    }
  };

  const enforceHistoryLimit = async (userId: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: allMeals } = await supabase
        .from('user_meals_history')
        .select('id, logged_at')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      if (allMeals && allMeals.length > 14) {
        const mealsToDelete = allMeals.slice(14);
        const idsToDelete = mealsToDelete.map(m => m.id);
        
        await supabase
          .from('user_meals_history')
          .delete()
          .in('id', idsToDelete);
        
        console.log(`Deleted ${idsToDelete.length} old meals`);
      }
    } catch (error) {
      console.error('Error enforcing history limit:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchFood(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for food');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = async (foodName: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const foodData = await getFoodNutrients(foodName);
      
      const food: Food = {
        name: foodData.food_name,
        calories: Math.round(foodData.nf_calories),
        protein: Math.round(foodData.nf_protein),
        carbs: Math.round(foodData.nf_total_carbohydrate),
        fats: parseFloat(foodData.nf_total_fat.toFixed(2)),
        serving_size: `${foodData.serving_qty} ${foodData.serving_unit}`,
      };

      await supabase.from('food_cache').upsert({
        food_name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        serving_size: food.serving_size,
      });

      setStagedFoods([...stagedFoods, food]);
      setSearchQuery('');
      setSearchResults([]);
      Alert.alert('Added', `${food.name} added to meal`);
    } catch (error) {
      console.error('Error selecting food:', error);
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleRemoveStagedFood = (index: number) => {
    const newStaged = stagedFoods.filter((_, i) => i !== index);
    setStagedFoods(newStaged);
  };

  const handleFinishMeal = async () => {
    if (stagedFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food to the meal');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalCalories = stagedFoods.reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = stagedFoods.reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = stagedFoods.reduce((sum, f) => sum + f.carbs, 0);
      const totalFats = stagedFoods.reduce((sum, f) => sum + f.fats, 0);

      if (editingMealId) {
        const { error: updateError } = await supabase
          .from('user_meals_history')
          .update({
            foods: stagedFoods,
            total_calories: totalCalories,
            total_protein: totalProtein,
            total_carbs: totalCarbs,
            total_fats: totalFats,
          })
          .eq('id', editingMealId);

        if (updateError) {
          console.error('Update error:', updateError);
          Alert.alert('Error', 'Failed to update meal');
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_meals_history')
          .insert({
            user_id: user.id,
            meal_number: selectedMeal,
            meal_name: `Meal ${selectedMeal}`,
            foods: stagedFoods,
            total_calories: totalCalories,
            total_protein: totalProtein,
            total_carbs: totalCarbs,
            total_fats: totalFats,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          Alert.alert('Error', 'Failed to log meal');
          return;
        }

        await enforceHistoryLimit(user.id);
      }

      await loadUserData();
      
      setStagedFoods([]);
      setEditingMealId(null);
      setModalVisible(false);
      setShowHistory(true);
      
      Alert.alert('Success', editingMealId ? 'Meal updated successfully!' : 'Meal logged successfully!');
    } catch (error) {
      console.error('Error finishing meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const handleManualEntry = async () => {
    if (!manualName || !manualCalories || !manualProtein || !manualCarbs || !manualFats) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const food: Food = {
      name: manualName,
      calories: parseInt(manualCalories),
      protein: parseInt(manualProtein),
      carbs: parseInt(manualCarbs),
      fats: parseFloat(manualFats),
      serving_size: manualServing || 'serving',
    };

    setStagedFoods([...stagedFoods, food]);

    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setManualServing('');
    setShowManualEntry(false);

    Alert.alert('Added', `${food.name} added to meal`);
  };

  const handleEditMeal = (meal: MealHistory) => {
    setStagedFoods(meal.foods || []);
    setEditingMealId(meal.id);
    setSelectedMeal(meal.meal_number);
    setModalVisible(true);
  };

  const handleCopyMealClick = (meal: MealHistory) => {
    setMealToCopy(meal);
    setShowCopyPicker(true);
  };

  const handleCopyToMeal = async (targetMealNumber: number) => {
    if (!mealToCopy) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('user_meals_history').insert({
        user_id: user.id,
        meal_number: targetMealNumber,
        meal_name: `Meal ${targetMealNumber}`,
        foods: mealToCopy.foods,
        total_calories: mealToCopy.total_calories,
        total_protein: mealToCopy.total_protein,
        total_carbs: mealToCopy.total_carbs,
        total_fats: mealToCopy.total_fats,
      });

      if (error) {
        console.error('Copy error:', error);
        Alert.alert('Error', 'Failed to copy meal');
        return;
      }

      await enforceHistoryLimit(user.id);
      await loadUserData();
      
      setShowCopyPicker(false);
      setMealToCopy(null);
      Alert.alert('Success', `Meal copied to Meal ${targetMealNumber}!`);
    } catch (error) {
      console.error('Error copying meal:', error);
      Alert.alert('Error', 'Failed to copy meal');
    }
  };

  const handleOpenModal = (mealNum: number) => {
    setStagedFoods([]);
    setEditingMealId(null);
    setSelectedMeal(mealNum);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    if (stagedFoods.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved foods in this meal. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setStagedFoods([]);
              setEditingMealId(null);
              setModalVisible(false);
              setShowManualEntry(false);
            }
          }
        ]
      );
    } else {
      setStagedFoods([]);
      setEditingMealId(null);
      setModalVisible(false);
      setShowManualEntry(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const mealsPerDay = 4;
  const caloriesPerMeal = Math.round(profile.daily_calories / mealsPerDay);
  const proteinPerMeal = Math.round(profile.daily_protein / mealsPerDay);
  const carbsPerMeal = Math.round(profile.daily_carbs / mealsPerDay);
  const fatsPerMeal = Math.round(profile.daily_fats / mealsPerDay);

  const stagedTotals = {
    calories: stagedFoods.reduce((sum, f) => sum + f.calories, 0),
    protein: stagedFoods.reduce((sum, f) => sum + f.protein, 0),
    carbs: stagedFoods.reduce((sum, f) => sum + f.carbs, 0),
    fats: stagedFoods.reduce((sum, f) => sum + f.fats, 0),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyButtonText}>
            {showHistory ? 'Meal Slots' : 'History'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dailyTargets}>
        <Text style={styles.dailyTitle}>Daily Targets</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.daily_calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.daily_protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.daily_carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.daily_fats}g</Text>
            <Text style={styles.macroLabel}>Fats</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!showHistory ? (
          <>
            {[1, 2, 3, 4].map((mealNum) => {
              const logged = dailyTotals[mealNum] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
              return (
                <View key={mealNum} style={styles.mealSlot}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealTitle}>Meal {mealNum}</Text>
                    <TouchableOpacity
                      style={styles.logButton}
                      onPress={() => handleOpenModal(mealNum)}
                    >
                      <Text style={styles.logButtonText}>Log Meal</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.mealMacros}>
                    <Text style={styles.mealMacroText}>
                      {logged.calories} / {caloriesPerMeal} cal
                    </Text>
                    <Text style={styles.mealMacroText}>
                      {logged.protein}g / {proteinPerMeal}g P
                    </Text>
                    <Text style={styles.mealMacroText}>
                      {logged.carbs}g / {carbsPerMeal}g C
                    </Text>
                    <Text style={styles.mealMacroText}>
                      {logged.fats}g / {fatsPerMeal}g F
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.historyTitle}>Recent Meals (Last 14)</Text>
            {mealHistory.length === 0 ? (
              <Text style={styles.emptyText}>No meals logged yet</Text>
            ) : (
              mealHistory.map((meal) => (
                <View key={meal.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyMealName}>{meal.meal_name}</Text>
                      <Text style={styles.historyDate}>
                        {formatDate(meal.logged_at)}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditMeal(meal)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyMealClick(meal)}
                      >
                        <Text style={styles.copyButtonText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.foodsList}>
                    {meal.foods && meal.foods.map((food, idx) => (
                      <View key={idx} style={styles.foodItem}>
                        <Text style={styles.foodName}>• {food.name}</Text>
                        <Text style={styles.foodDetails}>
                          {food.calories} cal | {food.protein}g P | {food.carbs}g C | {food.fats}g F
                          {food.serving_size && ` | ${food.serving_size}`}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.historyMacros}>
                    <Text style={styles.historyMacroText}>
                      Total: {meal.total_calories} cal
                    </Text>
                    <Text style={styles.historyMacroText}>
                      {meal.total_protein}g P
                    </Text>
                    <Text style={styles.historyMacroText}>
                      {meal.total_carbs}g C
                    </Text>
                    <Text style={styles.historyMacroText}>
                      {meal.total_fats}g F
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMealId ? 'Edit' : 'Log'} Meal {selectedMeal}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {stagedFoods.length > 0 && (
              <View style={styles.stagedSection}>
                <Text style={styles.stagedTitle}>
                  Foods in this meal ({stagedFoods.length})
                </Text>
                {stagedFoods.map((food, idx) => (
                  <View key={idx} style={styles.stagedFood}>
                    <View style={styles.stagedFoodInfo}>
                      <Text style={styles.stagedFoodName}>{food.name}</Text>
                      <Text style={styles.stagedFoodMacros}>
                        {food.calories} cal | {food.protein}g P | {food.carbs}g C | {food.fats}g F
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveStagedFood(idx)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.stagedTotals}>
                  <Text style={styles.stagedTotalText}>
                    Total: {stagedTotals.calories} cal | {stagedTotals.protein}g P | {stagedTotals.carbs}g C | {stagedTotals.fats}g F
                  </Text>
                </View>
              </View>
            )}

            {!showManualEntry ? (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for food..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                />

                {searching && <ActivityIndicator style={styles.loader} />}

                <ScrollView style={styles.resultsContainer}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.resultItem}
                      onPress={() => handleSelectFood(result.food_name)}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{result.food_name}</Text>
                        <Text style={styles.resultServing}>
                          {result.serving_qty} {result.serving_unit}
                        </Text>
                      </View>
                      <Text style={styles.addButton}>+</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.manualButton}
                  onPress={() => setShowManualEntry(true)}
                >
                  <Text style={styles.manualButtonText}>Can't find your food? Add manually</Text>
                </TouchableOpacity>

                {stagedFoods.length > 0 && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleFinishMeal}
                  >
                    <Text style={styles.doneButtonText}>
                      {editingMealId ? 'Update Meal' : 'Finish Meal'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <ScrollView style={styles.manualForm}>
                <Text style={styles.formLabel}>Food Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="e.g., Homemade Chicken Salad"
                />

                <Text style={styles.formLabel}>Calories *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualCalories}
                  onChangeText={setManualCalories}
                  keyboardType="numeric"
                  placeholder="e.g., 350"
                />

                <Text style={styles.formLabel}>Protein (g) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualProtein}
                  onChangeText={setManualProtein}
                  keyboardType="numeric"
                  placeholder="e.g., 30"
                />

                <Text style={styles.formLabel}>Carbs (g) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualCarbs}
                  onChangeText={setManualCarbs}
                  keyboardType="numeric"
                  placeholder="e.g., 25"
                />

                <Text style={styles.formLabel}>Fats (g) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualFats}
                  onChangeText={setManualFats}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 12.5"
                />

                <Text style={styles.formLabel}>Serving Size (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualServing}
                  onChangeText={setManualServing}
                  placeholder="e.g., 1 bowl"
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setShowManualEntry(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleManualEntry}
                  >
                    <Text style={styles.submitButtonText}>Add to Meal</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCopyPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCopyPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Copy to which meal?</Text>
            {[1, 2, 3, 4].map((mealNum) => (
              <TouchableOpacity
                key={mealNum}
                style={styles.pickerOption}
                onPress={() => handleCopyToMeal(mealNum)}
              >
                <Text style={styles.pickerOptionText}>Meal {mealNum}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => {
                setShowCopyPicker(false);
                setMealToCopy(null);
              }}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  historyButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#10b981', borderRadius: 8 },
  historyButtonText: { color: '#fff', fontWeight: '600' },
  dailyTargets: { backgroundColor: '#fff', padding: 20, marginBottom: 10 },
  dailyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  macroLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  content: { flex: 1 },
  mealSlot: { backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  logButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#10b981', borderRadius: 6 },
  logButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  mealMacros: { flexDirection: 'row', justifyContent: 'space-around' },
  mealMacroText: { fontSize: 13, color: '#6b7280' },
  historyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginHorizontal: 20, marginVertical: 16 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16 },
  historyItem: { backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  historyMealName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fef3c7', borderRadius: 6 },
  editButtonText: { color: '#92400e', fontSize: 14, fontWeight: '600' },
  copyButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 6 },
  copyButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  foodsList: { marginBottom: 12, paddingLeft: 8 },
  foodItem: { marginBottom: 8 },
  foodName: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 2 },
  foodDetails: { fontSize: 12, color: '#6b7280', marginLeft: 10 },
  historyMacros: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  historyMacroText: { fontSize: 12, color: '#6b7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  closeButton: { fontSize: 24, color: '#6b7280' },
  stagedSection: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16 },
  stagedTitle: { fontSize: 14, fontWeight: '600', color: '#065f46', marginBottom: 8 },
  stagedFood: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 6, marginBottom: 6 },
  stagedFoodInfo: { flex: 1 },
  stagedFoodName: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 2 },
  stagedFoodMacros: { fontSize: 11, color: '#6b7280' },
  removeButton: { width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeButtonText: { color: '#991b1b', fontSize: 16, fontWeight: 'bold' },
  stagedTotals: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#d1fae5' },
  stagedTotalText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
  searchInput: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 16 },
  loader: { marginVertical: 20 },
  resultsContainer: { flex: 1 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  resultServing: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  addButton: { fontSize: 28, color: '#10b981', fontWeight: 'bold', marginLeft: 12 },
  manualButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  manualButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  doneButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  manualForm: { flex: 1 },
  formLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  formInput: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16 },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f3f4f6' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  submitButton: { backgroundColor: '#10b981' },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 300 },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20, textAlign: 'center' },
  pickerOption: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, marginBottom: 10 },
  pickerOptionText: { fontSize: 16, fontWeight: '500', color: '#111827', textAlign: 'center' },
  pickerCancel: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  pickerCancelText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});