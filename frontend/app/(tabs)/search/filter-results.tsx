import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Recipe } from '@/lib/api/types';
import { getRecipesByIngredient, getRecipesByTime } from '@/lib/api/recipes';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

export default function SearchFilterResultsScreen() {
  const { type, value, label } = useLocalSearchParams<{
    type: string;
    value: string;
    label?: string;
  }>();
  const router = useRouter();

  const headerColor = type === 'time' ? RED : TEAL;
  const displayValue =
    typeof label === 'string' && label.length > 0
      ? label
      : value
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : '';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(type === 'ingredient' ? displayValue.toLowerCase() : '');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(type === 'ingredient' ? displayValue.toLowerCase() : '');
  }, [displayValue, type]);

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

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) return recipes;
    return recipes.filter((recipe) => {
      const ingredientText = recipe.ingredients
        ?.map((ingredient) => ingredient.ingredient.toLowerCase())
        .join(' ');
      return (
        recipe.title.toLowerCase().includes(normalizedQuery) ||
        recipe.creatorUsername?.toLowerCase().includes(normalizedQuery) ||
        ingredientText?.includes(normalizedQuery)
      );
    });
  }, [deferredQuery, recipes]);

  const backRoute = type === 'time' ? '/search/time' : '/search/ingredient';

  return (
    <View style={[styles.screen, { backgroundColor: headerColor }]}>
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <Pressable
          onPress={() => router.navigate(backRoute as '/search/time' | '/search/ingredient')}
          style={styles.backPill}
        >
          <Text style={styles.backPillText}>{type === 'time' ? '< TIME' : '< INGREDIENT'}</Text>
        </Pressable>
        <Text style={styles.headerEyebrow}>RESULTS FOR</Text>
        <Text style={styles.headerTitle}>{displayValue}</Text>

        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(255,248,242,0.76)" />
          <TextInput
            placeholder={type === 'ingredient' ? 'search ingredients...' : 'search results...'}
            placeholderTextColor="rgba(255,248,242,0.62)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={headerColor} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>{filteredRecipes.length} RECIPES FOUND</Text>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              {filteredRecipes.length === 0 ? (
                <Text style={styles.emptyText}>No recipes found for &quot;{displayValue}&quot;.</Text>
              ) : (
                filteredRecipes.map((recipe) => (
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
                    <View style={[styles.cardAccent, { backgroundColor: type === 'time' ? TEAL : GREEN }]} />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {recipe.title}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {recipe.ingredients?.length ?? 0} ingredients
                        {recipe.creatorUsername ? ` - @${recipe.creatorUsername}` : ''}
                      </Text>
                      <View style={styles.pillRow}>
                        {recipe.instruction?.prepTime != null && (
                          <View style={styles.prepPill}>
                            <Text style={styles.prepPillText}>{recipe.instruction.prepTime}m prep</Text>
                          </View>
                        )}
                        {recipe.instruction?.cookTime != null && (
                          <View style={styles.cookPill}>
                            <Text style={styles.cookPillText}>{recipe.instruction.cookTime}m cook</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardArrow}>
                      <IconSymbol name="chevron.right" size={16} color="#FFF8F2" />
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: {
    color: '#FFF8F2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerEyebrow: {
    color: 'rgba(255,248,242,0.62)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 40,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF8F2',
    fontSize: 15,
  },
  sheet: {
    flex: 1,
    backgroundColor: CREAM,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    color: RED,
    textAlign: 'center',
    fontWeight: '700',
  },
  resultCount: {
    color: '#5C9F89',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingBottom: 48,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  cardAccent: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMeta: {
    color: 'rgba(26,18,8,0.52)',
    fontSize: 12,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prepPill: {
    backgroundColor: '#F7E2DA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  prepPillText: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#D8F1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cookPillText: {
    color: TEAL,
    fontSize: 11,
    fontWeight: '800',
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
