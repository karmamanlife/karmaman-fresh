import React, { useState } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { SplashAnimation } from '../components/SplashAnimation';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashAnimation onFinish={() => setShowSplash(false)} />;
  }

  return <Slot />;
}