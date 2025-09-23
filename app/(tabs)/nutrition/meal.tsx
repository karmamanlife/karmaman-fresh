import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getMealDetails,
  removeFoodFromMeal,
  Meal,
  MealFood
} from '../../../lib/nutrition';

export default function MealDetailScreen() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  
  const [meal, setMeal] = useState<Meal | null>(null);
  const [mealFoods, setMealFoods] = useState<MealFood[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadMealData = async () => {
    if (!mealId) return;
    
    try {
      setLoading(true);
      const mealData = await getMealDetails(mealId);
      setMeal(mealData.meal);
      setMealFoods(mealData.foods);
    } catch (error) {
      console.error('Error loading meal data:', error);
      Alert.alert('Error', 'Failed to load meal data');
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMealData();
    }, [mealId])
  );

  const handleRemoveFood = async (mealFoodId: string) => {
    Alert.alert(
      'Remove Food',
      'Are you sure you want to remove this food from the meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFoodFromMeal(mealFoodId);
              await loadMealData(); // Refresh the meal data immediately
            } catch (error) {
              console.error('Error removing food:', error);
              Alert.alert('Error', 'Failed to remove food');
            }
          }
        }
      ]
    );
  };

  const handleAddFood = () => {
    router.push(`/nutrition/add?mealId=${mealId}`);
  };

  const calculateTotalMacros = () => {
    return mealFoods.reduce(
      (totals, mealFood) => {
        if (!mealFood.food) return totals;
        
        const servings = mealFood.servings || 1;
        const calories = (mealFood.food.calories_per_100g || mealFood.food.calories || 0) * servings;
        const protein = (mealFood.food.protein_per_100g || mealFood.food.protein || 0) * servings;
        const carbs = (mealFood.food.carbs_per_100g || mealFood.food.carbs || 0) * servings;
        const fat = (mealFood.food.fat_per_100g || mealFood.food.fat || 0) * servings;
        
        return {
          calories: totals.calories + calories,
          protein: totals.protein + protein,
          carbs: totals.carbs + carbs,
          fat: totals.fat + fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading meal...</Text>
        </View>
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Meal not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalMacros = calculateTotalMacros();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{meal.name}</Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleAddFood}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Meal Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Meal Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Calories</Text>
            <Text style={styles.summaryValue}>{Math.round(totalMacros.calories)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Protein</Text>
            <Text style={styles.summaryValue}>{Math.round(totalMacros.protein)}g</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Carbs</Text>
            <Text style={styles.summaryValue}>{Math.round(totalMacros.carbs)}g</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fat</Text>
            <Text style={styles.summaryValue}>{Math.round(totalMacros.fat)}g</Text>
          </View>
        </View>
      </View>

      {/* Foods List */}
      <ScrollView style={styles.foodsList} showsVerticalScrollIndicator={false}>
        <View style={styles.foodsHeader}>
          <Text style={styles.foodsTitle}>Foods in this meal</Text>
          <Text style={styles.foodsCount}>{mealFoods.length} items</Text>
        </View>

        {mealFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color="#666" />
            <Text style={styles.emptyTitle}>No foods added yet</Text>
            <Text style={styles.emptyText}>Tap the + button to add foods to this meal</Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={handleAddFood}
            >
              <Text style={styles.addFirstButtonText}>Add Food</Text>
            </TouchableOpacity>
          </View>
        ) : (
          mealFoods.map((mealFood) => {
            if (!mealFood.food) return null;
            
            const servings = mealFood.servings || 1;
            const calories = Math.round((mealFood.food.calories_per_100g || mealFood.food.calories || 0) * servings);
            const protein = Math.round((mealFood.food.protein_per_100g || mealFood.food.protein || 0) * servings);
            const carbs = Math.round((mealFood.food.carbs_per_100g || mealFood.food.carbs || 0) * servings);
            const fat = Math.round((mealFood.food.fat_per_100g || mealFood.food.fat || 0) * servings);
            
            return (
              <View key={mealFood.id} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{mealFood.food.name}</Text>
                  {mealFood.food.brand && (
                    <Text style={styles.foodBrand}>{mealFood.food.brand}</Text>
                  )}
                  <Text style={styles.foodQuantity}>{servings} serving{servings !== 1 ? 's' : ''}</Text>
                  <Text style={styles.foodMacros}>
                    {calories} cal â€¢ P: {protein}g â€¢ C: {carbs}g â€¢ F: {fat}g
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFood(mealFood.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      {mealFoods.length > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.addMoreButton}
            onPress={handleAddFood}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addMoreButtonText}>Add More Foods</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  foodsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  foodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  foodsCount: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 25,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 8,
    marginLeft: 10,
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
  },
  addMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

