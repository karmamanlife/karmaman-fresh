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
  Pressable,
  Image,
} from 'react-native';
import { getSupabase } from '../../src/lib/supabase';
import { searchFood, getFoodNutrients } from '../../src/services/foodApi';
import { Card, CardHeader, CardContent } from '../../src/components/ui/Card';
import { KoruBackground } from '../../src/components/KoruBackground';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';

const COMMON_FOODS_BY_MEAL = {
  1: [ // Breakfast
    { name: 'Oats (100g)', calories: 389, protein: 17, carbs: 66, fats: 7 },
    { name: 'Eggs (2 large)', calories: 144, protein: 12, carbs: 0.8, fats: 10 },
    { name: 'Greek Yogurt (100g)', calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
    { name: 'Whole Wheat Toast (2 slices)', calories: 160, protein: 8, carbs: 28, fats: 2 },
    { name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    { name: 'Avocado (100g)', calories: 160, protein: 2, carbs: 9, fats: 15 },
  ],
  2: [ // Lunch
    { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    { name: 'Brown Rice (100g)', calories: 111, protein: 2.6, carbs: 23, fats: 0.9 },
    { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fats: 13 },
    { name: 'Sweet Potato (100g)', calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
    { name: 'Broccoli (100g)', calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
    { name: 'Turkey Breast (100g)', calories: 135, protein: 30, carbs: 0, fats: 1 },
  ],
  3: [ // Dinner
    { name: 'Steak (100g)', calories: 271, protein: 25, carbs: 0, fats: 19 },
    { name: 'White Rice (100g)', calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fats: 13 },
    { name: 'Pasta (100g)', calories: 131, protein: 5, carbs: 25, fats: 1.1 },
    { name: 'Ground Beef (100g)', calories: 250, protein: 26, carbs: 0, fats: 15 },
    { name: 'Mixed Vegetables (100g)', calories: 65, protein: 3, carbs: 13, fats: 0.3 },
  ],
  4: [ // Snacks
    { name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fats: 14 },
    { name: 'Protein Bar', calories: 200, protein: 20, carbs: 22, fats: 7 },
    { name: 'Apple (1 medium)', calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    { name: 'Greek Yogurt (100g)', calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
    { name: 'Peanut Butter (32g)', calories: 190, protein: 8, carbs: 7, fats: 16 },
    { name: 'Cottage Cheese (100g)', calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  ],
};

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

const MEAL_TYPES = [
  { number: 1, name: 'Breakfast', emoji: '🍳' },
  { number: 2, name: 'Lunch', emoji: '🥗' },
  { number: 3, name: 'Dinner', emoji: '🍝' },
  { number: 4, name: 'Snack', emoji: '🍎' },
];

const getMealLabel = (mealNumber: number): string => {
  const meal = MEAL_TYPES.find(m => m.number === mealNumber);
  return meal ? meal.name : `Meal ${mealNumber}`;
};

const getMealEmoji = (mealNumber: number): string => {
  const meal = MEAL_TYPES.find(m => m.number === mealNumber);
  return meal ? meal.emoji : '🍽️';
};

export default function NutritionScreen() {
  const [profile, setProfile] = useState<UserNutritionProfile | null>(null);
  const [userGoal, setUserGoal] = useState<'cut' | 'bulk' | 'maintain'>('maintain');
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({});
  const [showHistory, setShowHistory] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
  const [foodQuantity, setFoodQuantity] = useState('1');
  const [selectedFoodForQuantity, setSelectedFoodForQuantity] = useState<any>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedServingOption, setSelectedServingOption] = useState<any>(null);

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
        totals[meal.meal_number] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
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
      console.log('❌ Supabase client is null');
      setProfile({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 65 });
      return;
    }

    console.log('✅ Supabase client OK');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in - using defaults');
      setProfile({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 65 });
      setMealHistory([]);
      setDailyTotals({});
      return;
    }

 console.log('✅ User logged in:', user.id);

try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_nutrition_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        setProfile({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 65 });
      } else if (profileData) {
        setProfile(profileData);
      }
    } catch (profErr) {
      setProfile({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 65 });
    }

    try {
      const { data: historyData } = await supabase
        .from('user_meals_history')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(50);

      if (historyData) {
  const allMeals = historyData as MealHistory[];
  console.log('🔵 Loaded meals from DB, total count:', allMeals.length);
  console.log('🔵 First meal ID:', allMeals[0]?.id);
  console.log('🔵 Last meal ID:', allMeals[allMeals.length - 1]?.id);
  console.log('🔵 Setting meal history, count:', allMeals.slice(0, 14).length);
  setMealHistory(allMeals.slice(0, 14));
        const totals = calculateDailyTotals(allMeals);
       setDailyTotals({...totals});

if (allMeals.length > 14) {
  console.log('🔵 Cleaning up', allMeals.length - 14, 'old meals');
  const mealsToDelete = allMeals.slice(14);
  const idsToDelete = mealsToDelete.map(m => m.id);
  await supabase.from('user_meals_history').delete().in('id', idsToDelete);
  console.log('✅ Cleanup complete -', idsToDelete.length, 'meals deleted');
}
} else {
  setDailyTotals({});
}
    } catch (histErr) {
      setMealHistory([]);
      setDailyTotals({});
    }
  } catch (error) {
    setProfile({ daily_calories: 2000, daily_protein: 150, daily_carbs: 200, daily_fats: 65 });
  }
};

 const enforceHistoryLimit = async (userId: string) => {
  try {
    console.log('🔵 Enforcing history limit for user:', userId);
    const supabase = getSupabase();
    if (!supabase) {
      console.log('❌ Supabase client is null');
      return;
    }
   
    console.log('✅ Supabase client OK');
   
    const { data: allMeals } = await supabase
      .from('user_meals_history')
      .select('id, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });
   
    if (allMeals && allMeals.length > 14) {
      const mealsToDelete = allMeals.slice(14);
      const idsToDelete = mealsToDelete.map(m => m.id);
      console.log('🔵 Deleting', idsToDelete.length, 'old meals');
      await supabase.from('user_meals_history').delete().in('id', idsToDelete);
      console.log('✅ Old meals deleted');
    }
  } catch (error) {
    console.error('❌ Error enforcing history limit:', error);
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
      Alert.alert('Error', 'Failed to search for food');
    } finally {
      setSearching(false);
    }
  };

 const handleSelectFood = async (food: any) => {
  try {
   const foodData = await getFoodNutrients(
  food.food_name,
  food._edamam_food_id,
  food._edamam_measures?.[0]?.uri
);

foodData.alt_measures = food._edamam_measures?.map((measure: any) => ({
  serving_weight: measure.weight || 100,
  measure: measure.label || 'serving',
  qty: 1
}));

setSelectedFoodForQuantity(foodData);
   
    if (food._edamam_measures && food._edamam_measures.length > 0) {
      const edamamMeasure = food._edamam_measures[0];
      setSelectedServingOption({
        serving_weight: edamamMeasure.weight || 100,
        measure: edamamMeasure.label || 'serving',
        qty: 1
      });
    } else {
      setSelectedServingOption({
        serving_weight: foodData?.serving_weight_grams || 100,
        measure: foodData?.serving_unit || 'serving',
        qty: foodData?.serving_qty || 1
      });
    }
    setShowQuantityModal(true);
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch food data');
  }
};

  const handleConfirmQuantity = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      if (!selectedFoodForQuantity || !selectedServingOption) return;

      const quantity = parseFloat(foodQuantity) || 1;
      const baseWeight = selectedFoodForQuantity.serving_weight_grams;
      const selectedWeight = selectedServingOption.serving_weight;
      const weightMultiplier = selectedWeight / baseWeight;
      const totalMultiplier = weightMultiplier * quantity;

      const food: Food = {
        name: selectedFoodForQuantity.food_name,
        calories: Math.round(selectedFoodForQuantity.nf_calories * totalMultiplier),
        protein: Math.round(selectedFoodForQuantity.nf_protein * totalMultiplier),
        carbs: Math.round(selectedFoodForQuantity.nf_total_carbohydrate * totalMultiplier),
        fats: parseFloat((selectedFoodForQuantity.nf_total_fat * totalMultiplier).toFixed(2)),
        serving_size: `${quantity} ${selectedServingOption.measure}${quantity > 1 ? 's' : ''} (${Math.round(selectedWeight * quantity)}g)`,
      };

      await supabase.from('food_cache').upsert({
        food_name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        serving_size: food.serving_size,
      });

      setStagedFoods(prev => [...prev, food]);
      setShowQuantityModal(false);
      setSelectedFoodForQuantity(null);
      setSelectedServingOption(null);
      setFoodQuantity('1');
      setRefreshKey(prev => prev + 1);
      Alert.alert('Added', `${food.name} added to meal`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

 const handleRemoveStagedFood = async (index: number) => {
  const newStaged = stagedFoods.filter((_, i) => i !== index);
 
  if (editingMealId) {
    try {
      console.log('🔵 Removing food from meal, editingMealId:', editingMealId);
     
      const supabase = getSupabase();
      if (!supabase) {
        console.log('❌ Supabase client is null');
        Alert.alert('Error', 'Database not initialized');
        return;
      }
     
      console.log('✅ Supabase client OK');
     
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user logged in');
        Alert.alert('Error', 'Not logged in');
        return;
      }
   
     
      console.log('✅ User logged in:', user.id);
     
      if (newStaged.length === 0) {
        console.log('🔵 No foods left, deleting entire meal ID:', editingMealId);
console.log('🔵 Attempting to delete meal with ID:', editingMealId);
const { error: deleteError } = await supabase
  .from('user_meals_history')
  .delete()
  .eq('id', editingMealId);
console.log('🔵 Delete error:', deleteError);
console.log('🔵 Delete successful:', !deleteError);
        if (deleteError) {
          console.log('❌ Delete error:', deleteError);
          Alert.alert('Error', 'Failed to delete meal');
          return;
        }
       
      console.log('✅ Meal deleted successfully');
await new Promise(resolve => setTimeout(resolve, 500));
await loadUserData();
setStagedFoods([]);
        setEditingMealId(null);
        setModalVisible(false);
        setRefreshKey(prev => prev + 1);
        Alert.alert('Success', 'Meal deleted');
        return;
      }
     
      console.log('🔵 Updating meal with', newStaged.length, 'foods remaining');
     
      const totalCalories = newStaged.reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = newStaged.reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = newStaged.reduce((sum, f) => sum + f.carbs, 0);
      const totalFats = newStaged.reduce((sum, f) => sum + f.fats, 0);
     
      const { error: updateError } = await supabase
        .from('user_meals_history')
        .update({
          foods: newStaged,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fats: totalFats,
        })
        .eq('id', editingMealId);
     
      if (updateError) {
        console.log('❌ Update error:', updateError);
        Alert.alert('Error', 'Failed to update meal');
        return;
      }
     
      console.log('✅ Meal updated successfully');
     
      await loadUserData();
      setStagedFoods(newStaged);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.log('❌ Catch error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  } else {
    setStagedFoods(newStaged);
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

    setStagedFoods(prev => [...prev, food]);
    setRefreshKey(prev => prev + 1);
    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setManualServing('');
    setShowManualEntry(false);
    Alert.alert('Added', `${food.name} added to meal`);
  };

 const handleFinishMeal = async () => {
  console.log('🔵 FINISH MEAL BUTTON PRESSED');
 
  if (stagedFoods.length === 0) {
    Alert.alert('Error', 'Please add at least one food to the meal');
    return;
  }
 
  try {
    console.log('🔵 Starting meal save...');
   
    const supabase = getSupabase();
    if (!supabase) {
      console.log('❌ Supabase client is null');
      Alert.alert('Error', 'Database not initialized');
      return;
    }
   
    console.log('✅ Supabase client OK');
   
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in');
      Alert.alert('Error', 'Not logged in');
      return;
    }
    console.log('✅ User logged in:', user.id);
   
   
    const totalCalories = stagedFoods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = stagedFoods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = stagedFoods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFats = stagedFoods.reduce((sum, f) => sum + f.fats, 0);
    const mealName = getMealLabel(selectedMeal);
   
    console.log('🔵 Inserting meal:', mealName, totalCalories, 'cal');
   
    const { error } = await supabase.from('user_meals_history').insert({
      user_id: user.id,
      meal_number: selectedMeal,
      meal_name: mealName,
      foods: stagedFoods,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fats: totalFats,
    });
   
    if (error) {
      console.log('❌ Insert error:', error);
      Alert.alert('Error', 'Failed to save meal');
      return;
    }
   
    console.log('✅ Meal saved successfully');
   
    await enforceHistoryLimit(user.id);
    await loadUserData();
    setStagedFoods([]);
    setModalVisible(false);
    setRefreshKey(prev => prev + 1);
    Alert.alert('Success', `${mealName} logged successfully!`);
  } catch (error) {
    console.log('❌ Catch error:', error);
    Alert.alert('Error', 'Failed to save meal');
  }
};

  const handleEditMeal = (meal: MealHistory) => {
    setStagedFoods([...(meal.foods || [])]);
    setEditingMealId(meal.id);
    setSelectedMeal(meal.meal_number);
    setModalVisible(true);
    setRefreshKey(prev => prev + 1);
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

      const targetMealName = getMealLabel(targetMealNumber);

      const { error } = await supabase.from('user_meals_history').insert({
        user_id: user.id,
        meal_number: targetMealNumber,
        meal_name: targetMealName,
        foods: mealToCopy.foods,
        total_calories: mealToCopy.total_calories,
        total_protein: mealToCopy.total_protein,
        total_carbs: mealToCopy.total_carbs,
        total_fats: mealToCopy.total_fats,
      });

      if (error) {
        Alert.alert('Error', 'Failed to copy meal');
        return;
      }

      await enforceHistoryLimit(user.id);
      await loadUserData();
      setShowCopyPicker(false);
      setMealToCopy(null);
      Alert.alert('Success', `Meal copied to ${targetMealName}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy meal');
    }
  };

  const handleOpenModal = (mealNum: number) => {
    setStagedFoods([]);
    setEditingMealId(null);
    setSelectedMeal(mealNum);
    setModalVisible(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseModal = () => {
    if (stagedFoods.length > 0 && !editingMealId) {
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
        <KoruBackground />
        <ActivityIndicator size="large" color="#3F6B5C" />
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

  const totalConsumed = {
    calories: Object.values(dailyTotals).reduce((sum, meal) => sum + meal.calories, 0),
    protein: Object.values(dailyTotals).reduce((sum, meal) => sum + meal.protein, 0),
    carbs: Object.values(dailyTotals).reduce((sum, meal) => sum + meal.carbs, 0),
    fats: Object.values(dailyTotals).reduce((sum, meal) => sum + meal.fats, 0),
  };

  const remaining = {
    calories: profile.daily_calories - totalConsumed.calories,
    protein: profile.daily_protein - totalConsumed.protein,
    carbs: profile.daily_carbs - totalConsumed.carbs,
    fats: profile.daily_fats - totalConsumed.fats,
  };

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
 
    <Card variant="outlined" style={styles.targetsCard}>
        <CardHeader title="Daily Targets" />
        <CardContent>
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{profile.daily_calories}</Text>
              <Text style={styles.macroLabel}>Target</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{profile.daily_protein}g</Text>
              <Text style={styles.macroLabel}>Target</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{profile.daily_carbs}g</Text>
              <Text style={styles.macroLabel}>Target</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{profile.daily_fats}g</Text>
              <Text style={styles.macroLabel}>Target</Text>
            </View>
          </View>
          <View style={styles.remainingRow}>
            <View style={styles.remainingItem}>
              <Text style={[styles.remainingValue, remaining.calories < 0 && styles.overTarget]}>
                {remaining.calories}
              </Text>
              <Text style={styles.remainingLabel}>Remaining</Text>
            </View>
            <View style={styles.remainingItem}>
              <Text style={[styles.remainingValue, remaining.protein < 0 && styles.overTarget]}>
                {Math.round(remaining.protein)}g
              </Text>
              <Text style={styles.remainingLabel}>Remaining</Text>
            </View>
            <View style={styles.remainingItem}>
              <Text style={[styles.remainingValue, remaining.carbs < 0 && styles.overTarget]}>
                {Math.round(remaining.carbs)}g
              </Text>
              <Text style={styles.remainingLabel}>Remaining</Text>
            </View>
            <View style={styles.remainingItem}>
              <Text style={[styles.remainingValue, remaining.fats < 0 && styles.overTarget]}>
                {Math.round(remaining.fats)}g
              </Text>
              <Text style={styles.remainingLabel}>Remaining</Text>
            </View>
          </View>
        </CardContent>
      </Card>

<Pressable
  style={styles.historyButton}
  onPress={() => setShowHistory(!showHistory)}
>
  <Text style={styles.historyButtonText}>
    {showHistory ? 'Today' : 'History'}
  </Text>
</Pressable>

      <ScrollView
  style={styles.content}
  contentContainerStyle={styles.contentContainer}
  key={refreshKey}
>
        {!showHistory ? (
          <>
            {MEAL_TYPES.map((mealType) => {
              const logged = dailyTotals[mealType.number] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
              return (
                <Card key={`${mealType.number}-${logged.calories}`} variant="outlined">
                  <CardHeader
                    title={mealType.name}
                    icon={<Text style={styles.mealEmoji}>{mealType.emoji}</Text>}
                    action={
                      <Pressable
                        style={styles.logButton}
                        onPress={() => handleOpenModal(mealType.number)}
                      >
                        <Text style={styles.logButtonText}>Log</Text>
                      </Pressable>
                    }
                  />
                  <CardContent>
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
                  </CardContent>
                </Card>
              );
            })}
          </>
        ) : (
          <>
            {mealHistory.length === 0 ? (
              <Card variant="outlined">
                <CardContent>
                  <Text style={styles.emptyText}>No meals logged yet</Text>
                </CardContent>
              </Card>
            ) : (
              mealHistory.map((meal) => (
                <Card key={meal.id} variant="default">
                  <CardHeader
                    title={meal.meal_name}
                    subtitle={formatDate(meal.logged_at)}
                    icon={<Text style={styles.mealEmoji}>{getMealEmoji(meal.meal_number)}</Text>}
                    action={
                      <View style={styles.actionButtons}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => handleEditMeal(meal)}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.copyButton}
                          onPress={() => handleCopyMealClick(meal)}
                        >
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </Pressable>
                      </View>
                    }
                  />
                  <CardContent>
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
                  </CardContent>
                </Card>
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
                {editingMealId ? 'Edit' : 'Log'} {getMealLabel(selectedMeal)}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {stagedFoods.length > 0 && (
              <View style={styles.stagedSection} key={`staged-${refreshKey}`}>
                <Text style={styles.stagedTitle}>
                  Foods in this meal ({stagedFoods.length})
                </Text>
                <ScrollView style={styles.stagedFoodsScroll} nestedScrollEnabled={true}>
                  {stagedFoods.map((food, idx) => (
                    <View key={`${food.name}-${idx}-${refreshKey}`} style={styles.stagedFood}>
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
                </ScrollView>
                <View style={styles.stagedTotals}>
                  <Text style={styles.stagedTotalText}>
                    Total: {stagedTotals.calories} cal | {stagedTotals.protein}g P | {stagedTotals.carbs}g C | {stagedTotals.fats}g F
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={styles.modalScroll}>
              {!showManualEntry ? (
                <>
                {/* Common Foods Quick Add */}
      {/* Quick Add Card */}
    <View style={styles.quickAddCard}>
      <Text style={styles.quickAddTitle}>Quick Add</Text>
      {COMMON_FOODS_BY_MEAL[selectedMeal]?.map((food, index) => (
        <View key={index} style={styles.quickAddItem}>
          <View style={styles.quickAddFoodInfo}>
            <Text style={styles.quickAddFoodName}>{food.name}</Text>
            <Text style={styles.quickAddFoodMacros}>
              {food.calories}cal • P{food.protein}g • C{food.carbs}g • F{food.fats}g
            </Text>
          </View>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => {
             setSelectedFoodForQuantity({
  food_name: food.name,
  serving_weight_grams: 100,
  serving_unit: 'g',
  serving_qty: 1,
  nf_calories: food.calories,
  nf_protein: food.protein,
  nf_total_carbohydrate: food.carbs,
  nf_total_fat: food.fats,
  alt_measures: [{
    serving_weight: 100,
    measure: 'serving',
    qty: 1,
    seq: null,
  }]
});
setSelectedServingOption({
  serving_weight: 100,
  measure: 'serving',
  qty: 1,
});
setShowQuantityModal(true);
            }}
          >
            <Text style={styles.quickAddButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>

    <View style={styles.searchSection}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search foods..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={() => handleSearch(searchQuery)}
      />
      {searching && <ActivityIndicator style={styles.searchLoader} />}
    </View>

    {searchResults.length > 0 && (
      <View style={styles.resultsSection}>
        {searchResults.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={styles.resultItem}
            onPress={() => handleSelectFood(result)}
          >
            <Text style={styles.resultName}>{result.food_name}</Text>
            <Text style={styles.resultServing}>{result.food_description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

                  <TouchableOpacity
                    style={styles.manualEntryButton}
                    onPress={() => setShowManualEntry(true)}
                  >
                    <Text style={styles.manualEntryButtonText}>+ Manual Entry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.manualEntryForm}>
                  <Text style={styles.manualEntryTitle}>Manual Food Entry</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Food name *"
                    value={manualName}
                    onChangeText={setManualName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Calories *"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                    keyboardType="numeric"
                  />
                 
                  <TextInput
                    style={styles.input}
                    placeholder="Protein (g) *"
                    value={manualProtein}
                    onChangeText={setManualProtein}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Carbs (g) *"
                    value={manualCarbs}
                    onChangeText={setManualCarbs}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Fats (g) *"
                    value={manualFats}
                    onChangeText={setManualFats}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Serving size (optional)"
                    value={manualServing}
                    onChangeText={setManualServing}
                  />
                  <View style={styles.manualButtonsRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowManualEntry(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleManualEntry}
                    >
                      <Text style={styles.addButtonText}>Add Food</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {stagedFoods.length > 0 && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={editingMealId ? () => setModalVisible(false) : handleFinishMeal}
              >
                <Text style={styles.doneButtonText}>
                  {editingMealId ? 'Done Editing' : 'Finish Meal'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQuantityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quantityModalContent}>
            <Text style={styles.quantityModalTitle}>{selectedFoodForQuantity?.food_name}</Text>
           
            <View style={styles.servingOptionsContainer}>
              <Text style={styles.servingOptionsLabel}>Serving Size:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.servingOptions}
                contentContainerStyle={styles.servingOptionsContent}
              >
                {selectedFoodForQuantity?.alt_measures?.map((option: any, idx: number) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.servingOption,
                      selectedServingOption?.measure === option.measure && styles.servingOptionSelected
                    ]}
                    onPress={() => setSelectedServingOption(option)}
                  >
                    <Text style={[
                      styles.servingOptionText,
                      selectedServingOption?.measure === option.measure && styles.servingOptionTextSelected
                    ]}>
                      {option.qty} {option.measure}
                    </Text>
                    <Text style={styles.servingOptionWeight}>({Math.round(option.serving_weight)}g)</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.quantityInputContainer}>
              <Text style={styles.quantityInputLabel}>How many?</Text>
              <TextInput
                style={styles.quantityModalInput}
                value={foodQuantity}
                onChangeText={setFoodQuantity}
                keyboardType="decimal-pad"
                placeholder="1"
                autoFocus
              />
            </View>

            {selectedServingOption && (
              <View style={styles.quantityPreview}>
                <Text style={styles.quantityPreviewText}>
                  Total: {Math.round((selectedFoodForQuantity?.nf_calories || 0) * (parseFloat(foodQuantity) || 1) * (selectedServingOption.serving_weight / selectedFoodForQuantity.serving_weight_grams))} cal | {' '}
                  {Math.round((selectedFoodForQuantity?.nf_protein || 0) * (parseFloat(foodQuantity) || 1) * (selectedServingOption.serving_weight / selectedFoodForQuantity.serving_weight_grams))}g P | {' '}
                  {Math.round((selectedFoodForQuantity?.nf_total_carbohydrate || 0) * (parseFloat(foodQuantity) || 1) * (selectedServingOption.serving_weight / selectedFoodForQuantity.serving_weight_grams))}g C | {' '}
                  {((selectedFoodForQuantity?.nf_total_fat || 0) * (parseFloat(foodQuantity) || 1) * (selectedServingOption.serving_weight / selectedFoodForQuantity.serving_weight_grams)).toFixed(1)}g F
                </Text>
              </View>
            )}

            <View style={styles.quantityModalButtons}>
              <TouchableOpacity
                style={[styles.quantityModalButton, styles.quantityCancelButton]}
                onPress={() => {
                  setShowQuantityModal(false);
                  setSelectedFoodForQuantity(null);
                  setSelectedServingOption(null);
                  setFoodQuantity('1');
                }}
              >
                <Text style={styles.quantityCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quantityModalButton, styles.quantityDoneButton]}
                onPress={handleConfirmQuantity}
              >
                <Text style={styles.quantityDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCopyPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCopyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.copyPickerContent}>
            <Text style={styles.copyPickerTitle}>Copy meal to:</Text>
            {MEAL_TYPES.map((mealType) => (
              <TouchableOpacity
                key={mealType.number}
                style={styles.copyPickerOption}
                onPress={() => handleCopyToMeal(mealType.number)}
              >
                <Text style={styles.copyPickerEmoji}>{mealType.emoji}</Text>
                <Text style={styles.copyPickerText}>{mealType.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.copyPickerCancel}
              onPress={() => setShowCopyPicker(false)}
            >
              <Text style={styles.copyPickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
  paddingHorizontal: 16,
  paddingTop: 48,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  marginBottom: 16,
},
quickAddCard: {
  margin: 16,
  marginBottom: 12,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
},
  quickAddTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
  },
  quickAddItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickAddFoodInfo: {
    flex: 1,
  },
  quickAddFoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  quickAddFoodMacros: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3F6B5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  quickAddButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#065f46' },
  historyButton: {
  alignSelf: 'flex-end',
  paddingVertical: 4,
  paddingHorizontal: 8,
  backgroundColor: '#3F6B5C',
  borderRadius: 6,
  marginBottom: 8,
  marginRight: 8,
},
  historyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  targetsCard: { marginHorizontal: 16, marginTop: 4 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 10, fontWeight: 'bold', color: '#065f46' },
  macroLabel: { fontSize: 7, color: '#6b7280', marginTop: 1 },
  remainingRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 3, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  remainingItem: { alignItems: 'center' },
  remainingValue: { fontSize: 9, fontWeight: '600', color: '#059669' },
  overTarget: { color: '#dc2626' },
  remainingLabel: { fontSize: 6, color: '#6b7280', marginTop: 0 },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 12 },
  mealEmoji: { fontSize: 24 },
  logButton: { backgroundColor: '#3F6B5C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mealMacros: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  mealMacroText: { fontSize: 12, color: '#374151' },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 20 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#3F6B5C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  editButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  copyButton: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  copyButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  foodsList: { marginBottom: 12 },
  foodItem: { marginBottom: 8 },
  foodName: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  foodDetails: { fontSize: 11, color: '#6b7280', marginLeft: 12 },
  historyMacros: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  historyMacroText: { fontSize: 11, color: '#374151', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#065f46' },
  closeButton: { fontSize: 28, color: '#6b7280', lineHeight: 28 },
  stagedSection: { padding: 16, backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#d1fae5' },
  stagedTitle: { fontSize: 14, fontWeight: '600', color: '#065f46', marginBottom: 8 },
  stagedFoodsScroll: { maxHeight: 200 },
  stagedFood: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#d1fae5' },
  stagedFoodInfo: { flex: 1 },
  stagedFoodName: { fontSize: 13, fontWeight: '600', color: '#065f46', marginBottom: 2 },
  stagedFoodMacros: { fontSize: 11, color: '#6b7280' },
  removeButton: { marginLeft: 8, padding: 4 },
  removeButtonText: { fontSize: 18, color: '#dc2626', fontWeight: 'bold' },
  stagedTotals: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#d1fae5' },
  stagedTotalText: { fontSize: 12, fontWeight: '600', color: '#065f46', textAlign: 'center' },
  modalScroll: { maxHeight: 400 },
  searchSection: { padding: 16 },
  searchInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fff' },
  searchLoader: { marginTop: 12 },
  resultsSection: { paddingHorizontal: 16 },
  resultItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  resultName: { fontSize: 14, fontWeight: '500', color: '#1f2937', marginBottom: 2 },
  resultServing: { fontSize: 12, color: '#6b7280' },
  manualEntryButton: { margin: 16, padding: 14, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  manualEntryButtonText: { textAlign: 'center', color: '#3F6B5C', fontSize: 14, fontWeight: '600' },
  manualEntryForm: { padding: 16 },
  manualEntryTitle: { fontSize: 16, fontWeight: 'bold', color: '#065f46', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, backgroundColor: '#fff' },
  manualButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, padding: 14, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelButtonText: { textAlign: 'center', color: '#6b7280', fontSize: 14, fontWeight: '600' },
  addButton: { flex: 1, padding: 14, backgroundColor: '#3F6B5C', borderRadius: 8 },
  addButtonText: { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '600' },
  doneButton: { margin: 16, padding: 16, backgroundColor: '#3F6B5C', borderRadius: 8, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  quantityModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  quantityModalTitle: { fontSize: 18, fontWeight: '600', color: '#24534A', marginBottom: 16, textAlign: 'center' },
  servingOptionsContainer: { marginBottom: 20 },
  servingOptionsLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  servingOptions: { maxHeight: 100 },
  servingOptionsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  servingOption: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', minWidth: 120 },
  servingOptionSelected: { backgroundColor: '#f0fdf4', borderColor: '#3F6B5C' },
  servingOptionText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  servingOptionTextSelected: { color: '#3F6B5C', fontWeight: '600' },
  servingOptionWeight: { fontSize: 11, color: '#666', marginTop: 2 },
  quantityInputContainer: { marginBottom: 20 },
  quantityInputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  quantityModalInput: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 20, textAlign: 'center', fontWeight: '600' },
  quantityPreview: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 20 },
  quantityPreviewText: { fontSize: 12, color: '#065f46', textAlign: 'center' },
  quantityModalButtons: { flexDirection: 'row', gap: 12 },
  quantityModalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  quantityCancelButton: { backgroundColor: '#f3f4f6' },
  quantityCancelButtonText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  quantityDoneButton: { backgroundColor: '#3F6B5C' },
  quantityDoneButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  copyPickerContent: { backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 20 },
  copyPickerTitle: { fontSize: 16, fontWeight: 'bold', color: '#065f46', marginBottom: 16, textAlign: 'center' },
  copyPickerOption: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 10 },
  copyPickerEmoji: { fontSize: 24, marginRight: 12 },
  copyPickerText: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  copyPickerCancel: { marginTop: 8, padding: 14, backgroundColor: '#f3f4f6', borderRadius: 8 },
  copyPickerCancelText: { textAlign: 'center', color: '#6b7280', fontSize: 14, fontWeight: '600' },
});