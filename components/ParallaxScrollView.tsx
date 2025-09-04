import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
  headerImage?: ReactNode;
  headerBackgroundColor?: { light: string; dark: string } | string;
};

export default function ParallaxScrollView({ children, headerImage }: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.header}>{headerImage}</View>
      <View style={s.body}>{children}</View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { height: 160, marginBottom: 12, overflow: 'hidden', borderRadius: 12 },
  body: { gap: 12 },
});
