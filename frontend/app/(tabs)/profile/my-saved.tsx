import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getSavedRecipes } from '@/lib/api/users';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function MySavedScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

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

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/(tabs)/profile')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Saved</Text>
      </View>

      {/* ── Body ── */}
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
          <Text style={styles.emptyText}>No saved recipes yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {recipes.map((recipe) => (
            <View key={recipe.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'my-saved', userId } })}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <Text style={styles.cardSub}>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</Text>
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
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TAN },

  // ── Header ──
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '800' },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic' },
  errorText: { color: '#c00', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: RED },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // ── List ──
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },

  // ── Recipe card ──
  card: {
    backgroundColor: GREEN,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
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
