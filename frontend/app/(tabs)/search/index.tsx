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

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';
import { getRecentIds } from '@/lib/recentRecipes';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

export default function SearchScreen() {
  const router = useRouter();
  const [recents, setRecents] = useState<Recipe[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const loadRecents = useCallback(async () => {
    setLoadingRecents(true);
    try {
      const ids = await getRecentIds();
      const recipes = await Promise.all(ids.map((id) => getRecipe(id).catch(() => null)));
      setRecents(recipes.filter((recipe): recipe is Recipe => recipe !== null));
    } catch {
      setRecents([]);
    } finally {
      setLoadingRecents(false);
    }
  }, []);

  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>SEARCH</Text>
        <Pressable
          style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/search/results', params: { query: '' } })}
        >
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.38)" />
          <Text style={styles.searchPlaceholder}>What&apos;s on the menu...</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.sectionTitle}>search by:</Text>
        <View style={styles.filterGroup}>
          <Pressable
            style={({ pressed }) => [styles.filterCard, pressed && styles.pressed]}
            onPress={() => router.push('/search/ingredient')}
          >
            <Text style={styles.filterLabel}>ingredient</Text>
            <Text style={styles.filterSubtext}>Jump through A-Z ingredients with quick letter access.</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.filterCard, pressed && styles.pressed]}
            onPress={() => router.push('/search/time')}
          >
            <Text style={styles.filterLabel}>cook time</Text>
            <Text style={styles.filterSubtext}>Browse by minute ranges with fast sidebar shortcuts.</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, styles.recentsHeader]}>recents:</Text>
        {loadingRecents ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={RED} />
          </View>
        ) : recents.length === 0 ? (
          <View style={styles.emptyRecentCard}>
            <Text style={styles.emptyRecentText}>recently viewed recipes</Text>
            <Text style={styles.emptyRecentSubtext}>
              Open a recipe from search and it will live here for quick access.
            </Text>
          </View>
        ) : (
          <View style={styles.recentsList}>
            {recents.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={({ pressed }) => [styles.recipeCard, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/recipes/[id]',
                    params: { id: String(recipe.id), from: 'search' },
                  })
                }
              >
                <View style={styles.recipeCardBody}>
                  <Text style={styles.recipeTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.recipeMeta}>
                    {recipe.ingredients?.length ?? 0} ingredient
                    {(recipe.ingredients?.length ?? 0) === 1 ? '' : 's'}
                  </Text>
                  <View style={styles.pillRow}>
                    {recipe.instruction?.prepTime != null && (
                      <View style={styles.timePill}>
                        <Text style={styles.timePillText}>prep {recipe.instruction.prepTime} min</Text>
                      </View>
                    )}
                    {recipe.instruction?.cookTime != null && (
                      <View style={styles.timePill}>
                        <Text style={styles.timePillText}>cook {recipe.instruction.cookTime} min</Text>
                      </View>
                    )}
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={DARK} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: TAN,
  },
  container: {
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: TEAL,
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroTitle: {
    color: '#FFF8F2',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 18,
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
  searchPlaceholder: {
    color: 'rgba(26,18,8,0.4)',
    fontSize: 15,
    flex: 1,
  },
  sheet: {
    backgroundColor: TAN,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -6,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 28,
    marginBottom: 14,
  },
  filterGroup: {
    gap: 14,
  },
  filterCard: {
    backgroundColor: GREEN,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  filterLabel: {
    color: DARK,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  filterSubtext: {
    color: 'rgba(26,18,8,0.62)',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 270,
  },
  recentsHeader: {
    marginTop: 28,
  },
  loadingWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyRecentCard: {
    backgroundColor: GREEN,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptyRecentText: {
    color: DARK,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyRecentSubtext: {
    color: 'rgba(26,18,8,0.62)',
    fontSize: 13,
    lineHeight: 19,
  },
  recentsList: {
    gap: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  recipeCardBody: {
    flex: 1,
    marginRight: 10,
  },
  recipeTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  recipeMeta: {
    color: 'rgba(26,18,8,0.55)',
    fontSize: 12,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    backgroundColor: RED,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timePillText: {
    color: '#FFF8F2',
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
});
