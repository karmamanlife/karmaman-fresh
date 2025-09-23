import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addFood } from '../../../lib/nutrition';

export default function CreateFoodScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    fiber_per_100g: '',
    sugar_per_100g: '',
    sodium_per_100g: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Food name is required');
      return;
    }

    if (!formData.calories_per_100g) {
      Alert.alert('Error', 'Calories per 100g is required');
      return;
    }

    setLoading(true);
    try {
      const foodData = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        calories_per_100g: parseFloat(formData.calories_per_100g),
        protein_per_100g: formData.protein_per_100g ? parseFloat(formData.protein_per_100g) : null,
        carbs_per_100g: formData.carbs_per_100g ? parseFloat(formData.carbs_per_100g) : null,
        fat_per_100g: formData.fat_per_100g ? parseFloat(formData.fat_per_100g) : null,
        fiber_per_100g: formData.fiber_per_100g ? parseFloat(formData.fiber_per_100g) : null,
        sugar_per_100g: formData.sugar_per_100g ? parseFloat(formData.sugar_per_100g) : null,
        sodium_per_100g: formData.sodium_per_100g ? parseFloat(formData.sodium_per_100g) : null,
      };

      await addFood(foodData);
      Alert.alert('Success', 'Food created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Create food error:', error);
      Alert.alert('Error', 'Failed to create food');
    }
    setLoading(false);
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    required: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={formData[field as keyof typeof formData]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Food</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderInput('Food Name', 'name', 'Enter food name', 'default', true)}
        {renderInput('Brand', 'brand', 'Enter brand (optional)')}
        
        <Text style={styles.sectionTitle}>Nutrition per 100g</Text>
        {renderInput('Calories', 'calories_per_100g', '0', 'numeric', true)}
        {renderInput('Protein (g)', 'protein_per_100g', '0', 'numeric')}
        {renderInput('Carbohydrates (g)', 'carbs_per_100g', '0', 'numeric')}
        {renderInput('Fat (g)', 'fat_per_100g', '0', 'numeric')}
        {renderInput('Fiber (g)', 'fiber_per_100g', '0', 'numeric')}
        {renderInput('Sugar (g)', 'sugar_per_100g', '0', 'numeric')}
        {renderInput('Sodium (mg)', 'sodium_per_100g', '0', 'numeric')}

        <View style={styles.bottomPadding} />
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
  saveButton: {
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bottomPadding: {
    height: 50,
  },
});

