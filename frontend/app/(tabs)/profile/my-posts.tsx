import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import PostCard from '@/components/PostCard';
import { getUserPosts } from '@/lib/api/posts';
import type { FeedPost } from '@/lib/api/posts';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingErrorView } from '@/components/ui/LoadingErrorView';
import { Colors } from '@/constants/colors';

function getPossessiveKitchenLabel(username?: string | null) {
  if (!username) return 'MY KITCHEN';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' KITCHEN` : `${base}'S KITCHEN`;
}

export default function MyPostsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: authUser } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserPosts(Number(userId));
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const heroLabel = getPossessiveKitchenLabel(authUser?.username);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Pressable style={styles.backPill} onPress={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile')}>
          <MaterialIcons name="chevron-left" size={18} color={Colors.dark} />
          <Text style={styles.backPillText}>PROFILE</Text>
        </Pressable>
        <Text style={styles.heroEyebrow}>{heroLabel}</Text>
        <Text style={styles.heroTitle}>my posts</Text>
      </View>

      <View style={styles.body}>
        <LoadingErrorView loading={loading} error={error} onRetry={load}>
          {posts.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>You haven&apos;t posted any recipes yet.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <Text style={styles.sectionLabel}>
                {posts.length} POST{posts.length === 1 ? '' : 'S'}
              </Text>
              {posts.reduce<FeedPost[][]>((rows, post, i) => {
                if (i % 2 === 0) rows.push([post]); else rows[rows.length - 1].push(post);
                return rows;
              }, []).map((row) => (
                <View key={row[0].postId} style={styles.cardRow}>
                  {row.map((item) => (
                    <PostCard
                      key={item.postId}
                      item={item}
                      style={styles.cardHalf}
                      onPress={() => router.push({ pathname: '/posts/[id]', params: { id: String(item.postId), from: 'my-posts' } })}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.cardHalf} />}
                </View>
              ))}
            </ScrollView>
          )}
        </LoadingErrorView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  hero: {
    backgroundColor: Colors.green,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A4C69D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  backPillText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroEyebrow: {
    color: 'rgba(26,18,8,0.34)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.dark,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  sectionLabel: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.8,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cardHalf: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.12)', borderRadius: 16 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.84,
  },
});
