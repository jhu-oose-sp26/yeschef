import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getSavedRecipes, getUserRecipes, getFriends } from '@/lib/api/users';
import type { Recipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const RECENT_LIMIT = 5;

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const [saved, created, friends] = await Promise.all([
        getSavedRecipes(authUser.id),
        getUserRecipes(authUser.id),
        getFriends(authUser.id).catch(() => [] as string[]),
      ]);
      setSavedCount(saved.length);
      setFriendsCount(friends.length);
      setCreatedRecipes(created.slice(0, RECENT_LIMIT));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={{ color: '#c00' }}>{error}</ThemedText>
        <Pressable style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </ThemedView>
    );
  }

  const initial = authUser?.username?.[0]?.toUpperCase() ?? '?';
  const userId = authUser?.id;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Teal Hero ── */}
      <View style={styles.hero}>
        {/* ··· button */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.dotsBtn, { backgroundColor: pressed ? RED : 'transparent' }]}
          hitSlop={12}
        >
          <Text style={styles.dotsText}>•••</Text>
        </Pressable>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>

        {/* Name + handle */}
        <Text style={styles.displayName}>{authUser?.username ?? 'Guest'}</Text>
        <Text style={styles.handle}>@{authUser?.username ?? ''}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{savedCount}</Text>
            <Text style={styles.statLabel}>saved recipes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{friendsCount}</Text>
            <Text style={styles.statLabel}>friends</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{createdRecipes.length}</Text>
            <Text style={styles.statLabel}>recipe created</Text>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>

        {/* RECENT ACTIVITY */}
        <Text style={styles.sectionHeader}>RECENT ACTIVITY</Text>

        {createdRecipes.length === 0 ? (
          <Text style={styles.emptyNote}>No recipes created yet.</Text>
        ) : (
          <View style={styles.activityList}>
            {createdRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.activityRow}>
                <Pressable
                  style={({ pressed }) => [styles.activityPressable, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'profile' } })}
                >
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{recipe.title}</Text>
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <Text style={styles.activitySub}>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</Text>
                    )}
                    <View style={styles.pillRow}>
                      {recipe.instruction?.prepTime != null && (
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>prep {recipe.instruction.prepTime} min</Text>
                        </View>
                      )}
                      {recipe.instruction?.cookTime != null && (
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>cook {recipe.instruction.cookTime} min</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── Nav Buttons ── */}
        <View style={styles.navGroup}>
          <Pressable
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push({ pathname: '/profile/my-posts', params: { userId: String(userId ?? '') } })}
          >
            <Text style={styles.navBtnText}>View my posts</Text>
            <Text style={styles.navChevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.navBtnText}>View my friends</Text>
            <Text style={styles.navChevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push({ pathname: '/profile/my-saved', params: { userId: String(userId ?? '') } })}
          >
            <Text style={styles.navBtnText}>View my saved</Text>
            <Text style={styles.navChevron}>›</Text>
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: RED },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },

  // ── Hero ──
  hero: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dotsBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  handle: { fontSize: 14, color: '#fff', opacity: 0.8, marginBottom: 20 },

  statsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: TEAL },
  statLabel: { fontSize: 11, color: '#333', textAlign: 'center', fontWeight: '500' },

  // ── Content ──
  content: { padding: 20, gap: 16 },

  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1A0E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyNote: { fontSize: 14, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic' },

  activityList: { marginTop: 4 },
  activityRow: {
    backgroundColor: GREEN,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  activityPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityContent: { flex: 1, marginRight: 10 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: '#1E2A1E', marginBottom: 4 },
  activitySub: { fontSize: 12, color: '#1E2A1E', opacity: 0.65, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { backgroundColor: RED, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 26, color: '#1E2A1E', fontWeight: '300' },

  // ── Nav buttons ──
  navGroup: { gap: 12, marginTop: 4 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  navBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: TEAL },
  navChevron: { fontSize: 22, color: TEAL, fontWeight: '300' },
});
