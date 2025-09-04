// File: App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import LogsScreen from './src/screens/LogsScreen';

export type RootStackParamList = {
  Home: undefined;
  Workout: undefined;
  Nutrition: undefined;
  Logs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0F15' },
          headerTintColor: 'white',
          contentStyle: { backgroundColor: '#0B0F15' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Karmaman' }}
        />
        <Stack.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Today’s Workout' }} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Nutrition' }} />
        <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'Logs' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
