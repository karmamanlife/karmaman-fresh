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
import { Ionicons } from '@expo/vector-icons';
import { fetchFoods, deleteFood, Food } from '../../../lib/nutrition';

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const foodId = params.id as string;
  
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadFood();
  }, [foodId]);

  const loadFood = async () => {
    try {
      const foods = await fetchFoods();
      const foundFood = foods.find(f => f.id === foodId);
      setFood(foundFood || null);
    } catch (error) {
      console.error('Load food error:', error);
      Alert.alert('Error', 'Failed to load food details');
    }
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete "${food?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!food) return;
    
    setDeleting(true);
    try {
      await deleteFood(food.id);
      Alert.alert('Success', 'Food deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Delete food error:', error);
      Alert.alert('Error', 'Failed to delete food');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Food Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Food Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Food not found</Text>
        </View>
      </View>
    );
  }

  const renderNutritionRow = (label: string, value: number | null, unit: string) => {
    if (value === null || value === undefined) return null;
    
    return (
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>{value}{unit}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Food Details</Text>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={styles.deleteButton}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.brand && <Text style={styles.brand}>{food.brand}</Text>}
        </View>

        <View style={styles.nutritionCard}>
          <Text style={styles.cardTitle}>Nutrition per 100g</Text>
          
          {renderNutritionRow('Calories', food.calories_per_100g, ' kcal')}
          {renderNutritionRow('Protein', food.protein_per_100g, 'g')}
          {renderNutritionRow('Carbohydrates', food.carbs_per_100g, 'g')}
          {renderNutritionRow('Fat', food.fat_per_100g, 'g')}
          {renderNutritionRow('Fiber', food.fiber_per_100g, 'g')}
          {renderNutritionRow('Sugar', food.sugar_per_100g, 'g')}
          {renderNutritionRow('Sodium', food.sodium_per_100g, 'mg')}
        </View>

        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            Created: {new Date(food.created_at).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  foodInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    color: '#666',
  },
  nutritionCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#333',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  metaInfo: {
    padding: 20,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
});
