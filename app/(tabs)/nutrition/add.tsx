import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  searchFoods, 
  addFoodToMeal, 
  searchUSDAFoods, 
  saveUSDAFoodToDatabase,
  convertUSDAToFood,
  Food, 
  USDAFood 
} from '../../../lib/nutrition';

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealId = params.mealId as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [localResults, setLocalResults] = useState<Food[]>([]);
  const [usdaResults, setUSDAResults] = useState<USDAFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setLocalResults([]);
      setUSDAResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Search both local database and USDA API simultaneously
      const [localData, usdaData] = await Promise.all([
        searchFoods(searchQuery),
        searchUSDAFoods(searchQuery)
      ]);
      
      setLocalResults(localData);
      setUSDAResults(usdaData.slice(0, 10)); // Limit USDA results
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search foods');
    }
    setLoading(false);
  };

  const handleAddLocalFood = async (food: Food) => {
    if (!mealId) {
      Alert.alert('Error', 'No meal selected');
      return;
    }

    setAddingFoodId(food.id);
    try {
      await addFoodToMeal(mealId, food.id, 1);
      Alert.alert('Success', `${food.name} added to meal`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Add food error:', error);
      Alert.alert('Error', 'Failed to add food to meal');
    }
    setAddingFoodId(null);
  };

  const handleAddUSDAFood = async (usdaFood: USDAFood) => {
    if (!mealId) {
      Alert.alert('Error', 'No meal selected');
      return;
    }

    setAddingFoodId(`usda-${usdaFood.fdcId}`);
    try {
      // Save USDA food to our database first
      const savedFood = await saveUSDAFoodToDatabase(usdaFood);
      // Then add it to the meal
      await addFoodToMeal(mealId, savedFood.id, 1);
      Alert.alert('Success', `${savedFood.name} added to meal`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Add USDA food error:', error);
      Alert.alert('Error', 'Failed to add food to meal');
    }
    setAddingFoodId(null);
  };

  const handleCreateNewFood = () => {
    router.push('/nutrition/create');
  };

  const renderLocalFood = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleAddLocalFood(item)}
      disabled={addingFoodId === item.id}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDetails}>
          {item.calories_per_100g || item.calories} cal per 100g • {item.brand || 'Custom'}
        </Text>
        {(item.protein_per_100g || item.protein) ? (
          <Text style={styles.macros}>
            P: {item.protein_per_100g || item.protein}g | C: {item.carbs_per_100g || item.carbs || 0}g | F: {item.fat_per_100g || item.fat || 0}g
          </Text>
        ) : null}
      </View>
      {addingFoodId === item.id ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  const renderUSDAFood = ({ item }: { item: USDAFood }) => {
    const foodData = convertUSDAToFood(item);
    
    return (
      <TouchableOpacity
        style={[styles.foodItem, styles.usdaFoodItem]}
        onPress={() => handleAddUSDAFood(item)}
        disabled={addingFoodId === `usda-${item.fdcId}`}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{foodData.name}</Text>
          <Text style={styles.foodDetails}>
            {foodData.calories} cal per 100g • {foodData.brand}
          </Text>
          <Text style={styles.macros}>
            P: {foodData.protein}g | C: {foodData.carbs}g | F: {foodData.fat}g
          </Text>
        </View>
        <View style={styles.usdaIndicator}>
          <Text style={styles.usdaText}>USDA</Text>
          {addingFoodId === `usda-${item.fdcId}` ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const sections = [];
  
  if (localResults.length > 0) {
    sections.push({
      title: `Your Foods (${localResults.length})`,
      data: localResults,
      renderItem: renderLocalFood,
    });
  }
  
  if (usdaResults.length > 0) {
    sections.push({
      title: `USDA Database (${usdaResults.length})`,
      data: usdaResults,
      renderItem: renderUSDAFood,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Food</Text>
        <TouchableOpacity onPress={handleCreateNewFood}>
          <Text style={styles.createButton}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => 
          'fdcId' in item ? `usda-${item.fdcId}` : `local-${item.id}`
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length >= 2 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No foods found</Text>
              <TouchableOpacity
                style={styles.createFromSearchButton}
                onPress={handleCreateNewFood}
              >
                <Text style={styles.createFromSearchText}>
                  Create "{searchQuery}"
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
  createButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  usdaFoodItem: {
    backgroundColor: '#f9f9ff',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  macros: {
    fontSize: 12,
    color: '#999',
  },
  usdaIndicator: {
    alignItems: 'center',
  },
  usdaText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createFromSearchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFromSearchText: {
    color: '#fff',
    fontWeight: '500',
  },
});

