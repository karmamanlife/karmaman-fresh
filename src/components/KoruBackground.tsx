import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const KoruBackground: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../../assets/images/Koru.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -140,
    left: -100,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
});