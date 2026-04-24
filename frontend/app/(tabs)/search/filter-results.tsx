import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import type { Recipe } from '@/lib/api/types';
import { getRecipesByIngredient, getRecipesByTime } from '@/lib/api/recipes';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function SearchFilterResultsScreen() {
  const { type, value, label } = useLocalSearchParams<{ type: string; value: string; label?: string }>();
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !value) return;
    setLoading(true);
    setError(null);
    async function load() {
      try {
        let data: Recipe[] = [];
        if (type === 'ingredient') data = await getRecipesByIngredient(value);
        else if (type === 'time') data = await getRecipesByTime(Number(value));
        setRecipes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load recipes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, value]);

  const backRoute = type === 'time' ? '/search/time' : '/search/ingredient';
  const displayValue = label
    ? label
    : value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : '';

  return (
    <ThemedView style={styles.screen}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate(backRoute as any)} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{displayValue}</Text>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No recipes found for "{displayValue}".</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {recipes.map((recipe) => (
            <View key={recipe.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'filter-results', filterType: type, filterValue: value } })}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <Text style={styles.cardSub}>
                      {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                    </Text>
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
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', textTransform: 'capitalize' },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' },
  errorText: { color: '#c00', textAlign: 'center' },

  // ── List ──
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },

  // ── Recipe card (same as My Saved) ──
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
