import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function HelloWave() {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '18deg'] });
  return <Animated.Text style={{ transform: [{ rotate }], fontSize: 20 }}>👋</Animated.Text>;
}
