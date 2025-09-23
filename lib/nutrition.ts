import { supabase } from "@/lib/supabase";

// USDA API Configuration
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = 'jQUY6q28slUv3DdDcHU8PlB9cEaaIQghHcsygqv0';

// USDA Nutrient IDs (standardized)
const CALORIES_ID = 1008;
const PROTEIN_ID = 1003;
const CARBS_ID = 1005;
const FAT_ID = 1004;
const FIBER_ID = 1079;
const SUGAR_ID = 2000;
const SODIUM_ID = 1093;

export interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  foodNutrients: Array<{
    nutrientId: number;
    value: number;
  }>;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  source?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_number: number;
  date: string;
  created_at: string;
}

export interface MealFood {
  id: string;
  meal_id: string;
  food_id: string;
  servings: number;
  created_at: string;
  food?: Food;
}

export interface UserNutritionProfile {
  user_id: string;
  meals_per_day: number;
  daily_calories_goal?: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  goal_type?: string;
  created_at: string;
  updated_at: string;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMacros {
  consumed: MacroTotals;
  goals: MacroTotals;
  remaining: MacroTotals;
  meals: Array<{
    meal_number: number;
    macros: MacroTotals;
    foods: MealFood[];
  }>;
}

// User Profile Functions
export async function getUserNutritionProfile(): Promise<UserNutritionProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_nutrition_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch nutrition profile: ${error.message}`);
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching nutrition profile:', error);
    return null;
  }
}

export async function createOrUpdateNutritionProfile(profile: {
  meals_per_day: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  goal_type?: string;
}): Promise<UserNutritionProfile> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const profileData = {
      user_id: user.id,
      ...profile,
      daily_calories_goal: (profile.daily_protein_goal * 4) + (profile.daily_carbs_goal * 4) + (profile.daily_fat_goal * 9),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_nutrition_profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save nutrition profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error saving nutrition profile:', error);
    throw error;
  }
}

// Meal Functions
export async function createDailyMeals(date: string): Promise<Meal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const profile = await getUserNutritionProfile();
    
    if (!user || !profile) {
      throw new Error('User or profile not found');
    }

    // Check if meals already exist for this date
    const existingMeals = await fetchMealsForDate(date);
    if (existingMeals.length > 0) {
      return existingMeals;
    }

    // Create meals based on user preference
    const mealsToCreate = [];
    for (let i = 1; i <= profile.meals_per_day; i++) {
      mealsToCreate.push({
        user_id: user.id,
        name: `Meal ${i}`,
        meal_number: i,
        date,
      });
    }

    const { data, error } = await supabase
      .from('meals')
      .insert(mealsToCreate)
      .select();

    if (error) {
      throw new Error(`Failed to create daily meals: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating daily meals:', error);
    throw error;
  }
}

export async function fetchMealsForDate(date: string): Promise<Meal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('meal_number');

    if (error) {
      throw new Error(`Failed to fetch meals: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching meals:', error);
    return [];
  }
}

export async function getMealFoods(mealId: string): Promise<MealFood[]> {
  try {
    const { data, error } = await supabase
      .from('meal_foods')
      .select(`
        *,
        food:foods(*)
      `)
      .eq('meal_id', mealId);

    if (error) {
      throw new Error(`Failed to fetch meal foods: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching meal foods:', error);
    return [];
  }
}

// Macro Calculation Functions
export function calculateFoodMacros(food: Food, servings: number): MacroTotals {
  const calories = (food.calories_per_100g || food.calories) * servings;
  const protein = (food.protein_per_100g || food.protein) * servings;
  const carbs = (food.carbs_per_100g || food.carbs) * servings;
  const fat = (food.fat_per_100g || food.fat) * servings;

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  };
}

export async function getDayMacros(date: string): Promise<DayMacros> {
  try {
    const profile = await getUserNutritionProfile();
    if (!profile) {
      throw new Error('No nutrition profile found');
    }

    const meals = await fetchMealsForDate(date);
    const mealMacros = [];
    let totalConsumed: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (const meal of meals) {
      const mealFoods = await getMealFoods(meal.id);
      let mealTotal: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      for (const mealFood of mealFoods) {
        if (mealFood.food) {
          const foodMacros = calculateFoodMacros(mealFood.food, mealFood.servings);
          mealTotal.calories += foodMacros.calories;
          mealTotal.protein += foodMacros.protein;
          mealTotal.carbs += foodMacros.carbs;
          mealTotal.fat += foodMacros.fat;
        }
      }

      mealMacros.push({
        meal_number: meal.meal_number,
        macros: mealTotal,
        foods: mealFoods,
      });

      totalConsumed.calories += mealTotal.calories;
      totalConsumed.protein += mealTotal.protein;
      totalConsumed.carbs += mealTotal.carbs;
      totalConsumed.fat += mealTotal.fat;
    }

    const goals: MacroTotals = {
      calories: profile.daily_calories_goal || 0,
      protein: profile.daily_protein_goal,
      carbs: profile.daily_carbs_goal,
      fat: profile.daily_fat_goal,
    };

    const remaining: MacroTotals = {
      calories: Math.max(0, goals.calories - totalConsumed.calories),
      protein: Math.max(0, goals.protein - totalConsumed.protein),
      carbs: Math.max(0, goals.carbs - totalConsumed.carbs),
      fat: Math.max(0, goals.fat - totalConsumed.fat),
    };

    return {
      consumed: totalConsumed,
      goals,
      remaining,
      meals: mealMacros,
    };
  } catch (error) {
    console.error('Error calculating day macros:', error);
    throw error;
  }
}

// Existing Food Functions
export async function fetchFoods(): Promise<Food[]> {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch foods: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching foods:', error);
    throw error;
  }
}

export async function addFood(foodData: {
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
}): Promise<Food> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const insertData = {
      name: foodData.name,
      brand: foodData.brand || null,
      description: null,
      calories: foodData.calories_per_100g,
      protein: foodData.protein_per_100g || 0,
      carbs: foodData.carbs_per_100g || 0,
      fat: foodData.fat_per_100g || 0,
      servings: 1,
      source: 'user_created',
      calories_per_100g: foodData.calories_per_100g,
      protein_per_100g: foodData.protein_per_100g,
      carbs_per_100g: foodData.carbs_per_100g,
      fat_per_100g: foodData.fat_per_100g,
      fiber_per_100g: foodData.fiber_per_100g,
      sugar_per_100g: foodData.sugar_per_100g,
      sodium_per_100g: foodData.sodium_per_100g,
    };

    const { data, error } = await supabase
      .from('foods')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add food: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
}

export async function searchFoods(query: string): Promise<Food[]> {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .order('name')
      .limit(50);

    if (error) {
      throw new Error(`Failed to search foods: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
}

export async function deleteFood(foodId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', foodId);

    if (error) {
      throw new Error(`Failed to delete food: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
}

export async function addFoodToMeal(mealId: string, foodId: string, servings: number): Promise<MealFood> {
  try {
    const { data, error } = await supabase
      .from('meal_foods')
      .insert([{
        meal_id: mealId,
        food_id: foodId,
        servings,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add food to meal: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error adding food to meal:', error);
    throw error;
  }
}

export async function getMealDetails(mealId: string): Promise<{
  meal: Meal;
  foods: MealFood[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get meal info
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('*')
    .eq('id', mealId)
    .eq('user_id', user.id)
    .single();

  if (mealError) throw mealError;

  // Get foods in the meal
  const { data: mealFoods, error: foodsError } = await supabase
    .from('meal_foods')
    .select(`
      *,
      food:foods(*)
    `)
    .eq('meal_id', mealId);

  if (foodsError) throw foodsError;

  return {
    meal,
    foods: mealFoods || []
  };
}

export async function removeFoodFromMeal(mealFoodId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('meal_foods')
    .delete()
    .eq('id', mealFoodId);

  if (error) throw error;
}

