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
const TAN = '#FFEDE2';
const RED = '#BC412B';

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
  const filtered =
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

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>SEARCHING</Text>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.38)" />
          <TextInput
            ref={inputRef}
            placeholder="What's on the menu..."
            placeholderTextColor="rgba(26,18,8,0.34)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Text style={styles.clearBtn}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyNote}>No recipes found for &quot;{query.trim()}&quot;.</Text>
          ) : (
            filtered.map((recipe) => (
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
            ))
          )}
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
    paddingBottom: 20,
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
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFDF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK,
  },
  clearBtn: {
    color: 'rgba(26,18,8,0.42)',
    fontSize: 22,
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
  },
  emptyNote: {
    fontSize: 14,
    color: 'rgba(26,18,8,0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
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
