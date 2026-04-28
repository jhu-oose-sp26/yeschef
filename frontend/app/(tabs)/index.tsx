import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getFriendsFeed } from '@/lib/api/posts';
import type { FeedPost } from '@/lib/api/posts';
import { getFriends } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '@/constants/colors';

const DARK = Colors.dark;
const GREEN = Colors.green;
const TAN = Colors.tan;
const RED = Colors.red;
const TEAL = Colors.teal;
const CREAM = Colors.cream;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [hasFriends, setHasFriends] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else if (feed.length === 0) setLoading(true);
    setError(null);
    try {
      const [posts, friends] = await Promise.all([
        getFriendsFeed(user.id),
        getFriends(user.id).catch(() => [] as string[]),
      ]);
      setHasFriends(friends.length > 0);
      setFeed(posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feed.length, user]);

  useFocusEffect(useCallback(() => { loadFeed(); }, [loadFeed]));

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} tintColor={RED} />
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.bellBtn} onPress={() => router.navigate('/(tabs)/notifications')}>
            <IconSymbol name="bell.fill" size={20} color={GREEN} />
          </Pressable>
          <Pressable style={styles.avatar} onPress={() => router.navigate('/(tabs)/profile')}>
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </View>

        <Text style={styles.heroHeading}>
          {"what's\n"}
          <Text style={styles.heroHeadingAccent}>cooking?</Text>
        </Text>

        <Pressable style={styles.searchBar} onPress={() => router.navigate('/(tabs)/search')}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.4)" />
          <Text style={styles.searchPlaceholder}>Find a recipe...</Text>
        </Pressable>
      </View>

      {/* Feed */}
      <View style={styles.feedSection}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>fresh posts</Text>
          <View style={styles.allBtn}>
            <Text style={styles.allBtnText}>ALL</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={RED} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Could not load feed</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadFeed()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : !user ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Log in to see your friends&apos; posts.</Text>
          </View>
        ) : !hasFriends ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Add friends to see their posts here.</Text>
          </View>
        ) : feed.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Your friends haven&apos;t posted any recipes yet.</Text>
          </View>
        ) : (
          feed.map((item, index) => (
            <View key={item.postId}>
              {index > 0 && <View style={styles.cardDivider} />}
              <Pressable
                style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
                onPress={() => router.navigate({
                  pathname: '/(tabs)/posts/[id]',
                  params: { id: String(item.postId) },
                })}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.recipe.title}</Text>
                    {item.recipe.creatorUsername ? (
                      <Text style={styles.cardUsername}>@{item.recipe.creatorUsername}</Text>
                    ) : null}
                    <View style={styles.pillRow}>
                      {item.recipe.instruction?.prepTime != null && (
                        <View style={styles.prepPill}>
                          <Text style={styles.prepPillText}>{item.recipe.instruction.prepTime}m prep</Text>
                        </View>
                      )}
                      {item.recipe.instruction?.cookTime != null && (
                        <View style={styles.cookPill}>
                          <Text style={styles.cookPillText}>{item.recipe.instruction.cookTime}m cook</Text>
                        </View>
                      )}
                    </View>
                    {item.notes ? (
                      <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.chevronBtn}
                    onPress={() => router.navigate({
                      pathname: '/(tabs)/posts/[id]',
                      params: { id: String(item.postId) },
                    })}
                  >
                    <IconSymbol name="chevron.right" size={16} color="#fff" />
                  </Pressable>
                </View>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },
  hero: {
    backgroundColor: DARK, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: GREEN, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  heroHeading: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 50, marginBottom: 22 },
  heroHeadingAccent: { color: RED, fontFamily: 'Fraunces_700Bold_Italic', fontSize: 42 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: GREEN,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  searchPlaceholder: { color: 'rgba(26,18,8,0.45)', fontSize: 15, flex: 1 },
  feedSection: { paddingHorizontal: 20, paddingTop: 28 },
  feedHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  feedTitle: { fontFamily: 'Fraunces_700Bold_Italic', fontSize: 22, color: DARK },
  allBtn: {
    borderWidth: 1.5, borderColor: DARK, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  allBtnText: { fontSize: 12, fontWeight: '800', color: DARK, letterSpacing: 0.8 },
  cardDivider: { height: 2, backgroundColor: GREEN, borderRadius: 1, marginVertical: 2 },
  card: { backgroundColor: CREAM, borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: DARK, marginBottom: 4 },
  cardUsername: { fontSize: 13, fontWeight: '600', color: GREEN, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  prepPill: { backgroundColor: '#D0F0EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  prepPillText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  cookPill: {
    backgroundColor: TAN, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(188,65,43,0.2)',
  },
  cookPillText: { color: RED, fontSize: 12, fontWeight: '700' },
  cardNotes: { fontSize: 13, color: DARK, opacity: 0.7, lineHeight: 19 },
  chevronBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  centered: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 15, color: DARK, opacity: 0.5, textAlign: 'center', maxWidth: 280 },
  errorText: { fontSize: 15, color: RED, fontWeight: '700', marginBottom: 12 },
  retryBtn: { backgroundColor: RED, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
