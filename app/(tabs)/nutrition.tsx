import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('overview');

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
          <Text style={styles.subtitle}>Daily Macros</Text>
          <Text>Macro tracking will go here</Text>
        </View>
      )}

      {selectedTab === 'meals' && (
        <View style={styles.content}>
          <Text style={styles.subtitle}>Your Meals</Text>
          <Text>Meal planning will go here</Text>
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
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 }
});
