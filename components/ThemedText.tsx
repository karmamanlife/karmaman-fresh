import { Text, TextProps, StyleSheet } from 'react-native';
import { PropsWithChildren } from 'react';

type Kind = 'default' | 'defaultSemiBold' | 'title' | 'subtitle' | 'link';
type P = PropsWithChildren<TextProps & { type?: Kind }>;

export function ThemedText({ style, type = 'default', ...props }: P) {
  return <Text {...props} style={[styles[type], style]} />;
}

const styles = StyleSheet.create({
  default: { fontSize: 16 },
  defaultSemiBold: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 20, fontWeight: '600' },
  link: { color: '#2563eb', fontWeight: '600' },
});
