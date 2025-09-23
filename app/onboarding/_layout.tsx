import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent back swipes during onboarding
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="nutrition" />
      <Stack.Screen name="workout" />
      <Stack.Screen name="ai-mentor" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

