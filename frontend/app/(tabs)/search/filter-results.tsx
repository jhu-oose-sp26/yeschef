import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Recipe } from '@/lib/api/types';
import { getRecipesByIngredient, getRecipesByTime } from '@/lib/api/recipes';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function SearchFilterResultsScreen() {
  const { type, value, label } = useLocalSearchParams<{
    type: string;
    value: string;
    label?: string;
  }>();
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
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load recipes');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [type, value]);

  const backRoute = type === 'time' ? '/search/time' : '/search/ingredient';
  const displayValue =
    typeof label === 'string' && label.length > 0
      ? label
      : value
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : '';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.navigate(backRoute as '/search/time' | '/search/ingredient')}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{displayValue}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No recipes found for &quot;{displayValue}&quot;.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/recipes/[id]',
                  params: {
                    id: String(recipe.id),
                    from: 'filter-results',
                    filterType: type,
                    filterValue: value,
                    filterLabel: displayValue,
                  },
                })
              }
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {recipe.title}
                </Text>
                {recipe.creatorUsername ? (
                  <Text style={styles.cardUsername}>@{recipe.creatorUsername}</Text>
                ) : null}
                <Text style={styles.cardSub}>
                  {recipe.ingredients?.length ?? 0} ingredient
                  {(recipe.ingredients?.length ?? 0) === 1 ? '' : 's'}
                </Text>
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
              <IconSymbol name="chevron.right" size={20} color={DARK} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TAN,
  },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: '#FFF8F2',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerTitle: {
    color: '#FFF8F2',
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(26,18,8,0.62)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    color: RED,
    textAlign: 'center',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardUsername: {
    color: TEAL,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSub: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 12,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: RED,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: '#FFF8F2',
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
});
