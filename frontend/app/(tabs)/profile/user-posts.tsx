import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getUserRecipes } from '@/lib/api/users';
import type { Recipe } from '@/lib/api/recipes';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function UserPostsScreen() {
  const router = useRouter();
  const { userId, username, from } = useLocalSearchParams<{ userId: string; username: string; from?: string }>();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserRecipes(Number(userId));
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else if (from === 'find-friends') router.navigate('/browse');
    else if (from === 'user-profile') {
      router.navigate({
        pathname: '/profile/user-profile',
        params: { userId, username },
      });
    } else router.navigate('/(tabs)/profile');
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>@{username ?? 'user'}</Text>
        <Text style={styles.headerSub}>recipes posted</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>@{username} has not posted any recipes yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {recipes.map((recipe) => (
            <View key={recipe.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() =>
                  router.push({
                    pathname: '/recipes/[id]',
                    params: {
                      id: String(recipe.id),
                      from: 'user-posts',
                      userId,
                      username,
                    },
                  })
                }>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    <Text style={styles.cardSub}>
                      {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                    </Text>
                  ) : null}
                  <View style={styles.pillRow}>
                    {recipe.instruction?.prepTime != null ? (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>prep {recipe.instruction.prepTime} min</Text>
                      </View>
                    ) : null}
                    {recipe.instruction?.cookTime != null ? (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>cook {recipe.instruction.cookTime} min</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.chevron}>{'>'}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TAN },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: '#c00', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: RED },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: '#fff', fontSize: 14, opacity: 0.85 },
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },
  card: {
    backgroundColor: GREEN,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardContent: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E2A1E', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#1E2A1E', opacity: 0.65, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { backgroundColor: RED, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 2 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 26, color: '#1E2A1E', fontWeight: '300' },
});
