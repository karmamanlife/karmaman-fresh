import { ReactNode, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  title?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
};

export default function Collapsible({ title = 'Details', children, defaultCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <View style={s.wrap}>
      <Pressable style={s.header} onPress={() => setCollapsed(v => !v)}>
        <Text style={s.title}>{title}</Text>
        <Text>{collapsed ? '▸' : '▾'}</Text>
      </Pressable>
      {!collapsed && <View style={s.body}>{children}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden' },
  header: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600' },
  body: { padding: 12, gap: 8 },
});
