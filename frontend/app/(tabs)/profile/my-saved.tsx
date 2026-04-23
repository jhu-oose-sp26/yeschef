import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import RecipeCard from '@/components/RecipeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getSavedRecipes } from '@/lib/api/users';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';

const PAPRIKA = '#DC602E';
const CELADON = '#B8D5B8';

export default function MySavedScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await getSavedRecipes(Number(userId));
      const ids = saved.map((s) => s.recipeId).filter((id): id is number => id != null);
      const data = await Promise.all(ids.map((id) => getRecipe(id)));
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load saved recipes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <ThemedView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={PAPRIKA} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>My Saved</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PAPRIKA} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={load}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centered}>
          <IconSymbol name="bookmark.fill" size={48} color={PAPRIKA} />
          <ThemedText style={styles.emptyText}>No saved recipes yet.</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={{ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'my-saved', userId } }}
              asChild
            >
              <Pressable>
                <RecipeCard data={recipe} />
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: CELADON,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  list: { alignItems: 'center', paddingVertical: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText: { fontSize: 15, textAlign: 'center', opacity: 0.7 },
  errorText: { color: '#c00', textAlign: 'center' },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: PAPRIKA },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
