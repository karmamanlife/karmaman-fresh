// src/components/CoachingCue.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CueType = 'form_tip' | 'progression' | 'motivation' | 'recovery';

interface CoachingCueProps {
  cueType: CueType;
  content: string;
}

export function CoachingCue({ cueType, content }: CoachingCueProps) {
  const getIcon = () => {
    switch (cueType) {
      case 'form_tip': return '🎯';
      case 'progression': return '📈';
      case 'motivation': return '💪';
      case 'recovery': return '😌';
      default: return '💡';
    }
  };

  const getColor = () => {
    switch (cueType) {
      case 'form_tip': return '#3F6B5C';
      case 'progression': return '#D28A41';
      case 'motivation': return '#D40C19';
      case 'recovery': return '#A3D9A1';
      default: return '#24534A';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getColor() }]}>
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 10,
    marginVertical: 8,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    fontSize: 14,
    color: '#24534A',
    lineHeight: 20,
  },
});