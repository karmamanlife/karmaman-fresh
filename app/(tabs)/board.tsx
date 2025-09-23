import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '../../src/lib/supabase';

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export default function Board() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Require auth before showing the board
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace('/auth/sign-in');
    })();
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setPosts((data ?? []) as Post[]);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        fetchPosts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const submit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error(userErr?.message || 'Not signed in');

      // Optimistic UI
      const optimistic: Post = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        content: trimmed,
        image_url: null,
        created_at: new Date().toISOString(),
      };
      setPosts(p => [optimistic, ...p]);
      setContent('');

      const { data, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, content: trimmed })
        .select('*')
        .single();
      if (error) throw error;

      setPosts(p => [data as Post, ...p.filter(x => x.id !== optimistic.id)]);
    } catch (e: any) {
      Alert.alert('Post failed', e.message);
      setPosts(p => p.filter(x => !x.id.startsWith('temp-')));
    } finally {
      setLoading(false);
    }
  }, [content]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      <View style={s.container}>
        <Text style={s.title}>Board Posts</Text>

        <View style={s.composer}>
          <TextInput
            placeholder="Share something helpful…"
            value={content}
            onChangeText={setContent}
            editable={!loading}
            multiline
            style={s.input}
          />
          <Button title={loading ? 'Posting…' : 'Post'} onPress={submit} disabled={loading} />
        </View>

        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.cardContent}>{item.content}</Text>
              <Text style={s.meta}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  composer: { gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, minHeight: 60 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12 },
  cardContent: { fontSize: 16 },
  meta: { marginTop: 6, fontSize: 12, color: '#666' },
});
