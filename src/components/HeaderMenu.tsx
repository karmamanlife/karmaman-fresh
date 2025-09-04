// File: src/components/HeaderMenu.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function HeaderMenu() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <TouchableOpacity onPress={() => nav.navigate('Logs')}>
        <Text style={{ color: '#93C5FD', fontWeight: '600' }}>Logs ▾</Text>
      </TouchableOpacity>
    </View>
  );
}
