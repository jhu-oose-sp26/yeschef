import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const loadRecipe = useCallback(async () => {
    const numId = Number(id);
    if (!id || Number.isNaN(numId)) {
      setError('Invalid recipe id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRecipe(numId);
      setRecipe(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.error}>
          {error ?? 'Recipe not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  const totalTime =
    recipe.instruction != null
      ? recipe.instruction.prepTime + recipe.instruction.cookTime
      : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.hero, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="title" style={styles.heroTitle}>{recipe.title}</ThemedText>
        {recipe.source && (
          <ThemedText style={styles.source}>
            {recipe.source.sourceType}
            {recipe.source.api_url ? ` · ${recipe.source.api_url}` : ''}
          </ThemedText>
        )}
        {totalTime != null && (
          <View style={[styles.timePill, { backgroundColor: accent + '22' }]}>
            <ThemedText style={[styles.timePillText, { color: accent }]}>
              {totalTime} min total
            </ThemedText>
          </View>
        )}
      </View>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={[styles.bullet, { backgroundColor: accent }]} />
              <ThemedText style={styles.ingredient}>
                {ing.quantity ? `${ing.quantity} ` : ''}{ing.ingredient}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {recipe.instruction && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
          <ThemedText style={styles.meta}>
            Prep {recipe.instruction.prepTime} min · Cook {recipe.instruction.cookTime} min
          </ThemedText>
          {recipe.instruction.steps?.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: accent }]}>
                <ThemedText style={styles.stepNumText}>{step.stepNumber}</ThemedText>
              </View>
              <ThemedText style={styles.step}>{step.stepDescription}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  heroTitle: {
    marginBottom: 6,
    paddingRight: 8,
  },
  source: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  timePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  sectionTitle: {
    marginBottom: 14,
  },
  meta: {
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.85,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredient: {
    flex: 1,
    fontSize: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  step: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#c00',
  },
});
