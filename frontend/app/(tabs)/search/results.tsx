import { useDeferredValue, useEffect, useRef, useState } from 'react';
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
import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';

function titleCase(value: string) {
  if (!value.trim()) return 'all recipes';
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const { query: queryParam } = useLocalSearchParams<{ query?: string }>();
  const inputRef = useRef<TextInput>(null);

  const initialQuery = typeof queryParam === 'string' ? queryParam : '';
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    getRecipes()
      .then(setAllRecipes)
      .catch(() => setAllRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredRecipes =
    normalizedQuery.length === 0
      ? allRecipes
      : allRecipes.filter((recipe) => {
          const ingredientText = recipe.ingredients
            ?.map((ingredient) => ingredient.ingredient.toLowerCase())
            .join(' ');
          return (
            recipe.title.toLowerCase().includes(normalizedQuery) ||
            recipe.creatorUsername?.toLowerCase().includes(normalizedQuery) ||
            ingredientText?.includes(normalizedQuery)
          );
        });

  const heading = titleCase(query);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} style={styles.backPill}>
          <Text style={styles.backPillText}>{'< SEARCH'}</Text>
        </Pressable>
        <Text style={styles.headerEyebrow}>RESULTS FOR</Text>
        <Text style={styles.headerTitle}>{heading}</Text>

        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(255,248,242,0.76)" />
          <TextInput
            ref={inputRef}
            placeholder="search recipes..."
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
            <ActivityIndicator size="small" color={TEAL} />
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>{filteredRecipes.length} RECIPES FOUND</Text>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              {filteredRecipes.length === 0 ? (
                <Text style={styles.emptyText}>No recipes match &quot;{query.trim()}&quot;.</Text>
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
                          from: 'search-results',
                          query,
                        },
                      })
                    }
                  >
                    <View style={styles.cardAccent} />
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
    backgroundColor: TEAL,
  },
  header: {
    backgroundColor: TEAL,
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
    backgroundColor: GREEN,
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
    color: '#BC412B',
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
