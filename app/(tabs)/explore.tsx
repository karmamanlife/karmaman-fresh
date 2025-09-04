import { StyleSheet } from 'react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function Explore() {
  return (
    <ParallaxScrollView headerBackgroundColor={{ light: '#F0E7FF', dark: '#1B1633' }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Explore</ThemedText>
        <ThemedText>
          This is the starter “Explore” tab. Keep or repurpose it for docs/help.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}
const styles = StyleSheet.create({ container: { gap: 8 } });
