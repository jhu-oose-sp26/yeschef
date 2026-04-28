import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';
const SOFT_TEAL = '#D8F1F2';
const SOFT_RED = '#F6DDD4';

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
        <Text style={styles.heroLabel}>EXPLORE</Text>
        <Text style={styles.heroTitle}>find a{'\n'}recipe</Text>
        <Pressable
          style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/search/results', params: { query: '' } })}
        >
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.38)" />
          <Text style={styles.searchPlaceholder}>what&apos;s on the menu.</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.sectionEyebrow}>SEARCH BY</Text>
        <View style={styles.searchByGroup}>
          <Pressable
            style={({ pressed }) => [styles.searchByCard, styles.ingredientCard, pressed && styles.pressed]}
            onPress={() => router.push('/search/ingredient')}
          >
            <View style={[styles.searchByIconWrap, { backgroundColor: '#BFE8EA' }]}>
              <MaterialIcons name="spa" size={20} color={TEAL} />
            </View>
            <View style={styles.searchByTextWrap}>
              <Text style={styles.searchByTitle}>by ingredient</Text>
              <Text style={styles.searchBySubtext}>search what you have</Text>
            </View>
            <View style={styles.searchByArrow}>
              <IconSymbol name="chevron.right" size={16} color="#FFF8F2" />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.searchByCard, styles.timeCard, pressed && styles.pressed]}
            onPress={() => router.push('/search/time')}
          >
            <View style={[styles.searchByIconWrap, { backgroundColor: '#F9EAE3' }]}>
              <MaterialIcons name="schedule" size={20} color={RED} />
            </View>
            <View style={styles.searchByTextWrap}>
              <Text style={styles.searchByTitle}>by cook time</Text>
              <Text style={styles.searchBySubtext}>filter by how long it takes</Text>
            </View>
            <View style={[styles.searchByArrow, { backgroundColor: RED }]}>
              <IconSymbol name="chevron.right" size={16} color="#FFF8F2" />
            </View>
          </Pressable>
        </View>

        <Text style={[styles.sectionEyebrow, styles.recentsEyebrow]}>RECENTLY VIEWED</Text>
        {loadingRecents ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={RED} />
          </View>
        ) : recents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No recent recipes yet</Text>
            <Text style={styles.emptyStateText}>
              Open a recipe from search and it will show up here for quick access.
            </Text>
          </View>
        ) : (
          <View style={styles.recentsList}>
            {recents.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/recipes/[id]',
                    params: { id: String(recipe.id), from: 'search' },
                  })
                }
              >
                <View style={styles.recentBody}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {recipe.creatorUsername ? `@${recipe.creatorUsername}` : 'recently viewed'}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color="rgba(26,18,8,0.45)" />
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
    backgroundColor: DARK,
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  heroLabel: {
    color: 'rgba(255,248,242,0.6)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 44,
    lineHeight: 44,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FBF4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchPlaceholder: {
    color: 'rgba(26,18,8,0.45)',
    fontSize: 15,
    flex: 1,
  },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    minHeight: 560,
  },
  sectionEyebrow: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  searchByGroup: {
    gap: 14,
  },
  searchByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  ingredientCard: {
    backgroundColor: SOFT_TEAL,
  },
  timeCard: {
    backgroundColor: SOFT_RED,
  },
  searchByIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchByTextWrap: {
    flex: 1,
  },
  searchByTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  searchBySubtext: {
    color: 'rgba(26,18,8,0.56)',
    fontSize: 12,
  },
  searchByArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentsEyebrow: {
    marginTop: 26,
  },
  loadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  emptyStateTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 13,
    lineHeight: 18,
  },
  recentsList: {
    gap: 12,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  recentBody: {
    flex: 1,
    marginRight: 10,
  },
  recentTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  recentMeta: {
    color: 'rgba(26,18,8,0.52)',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.82,
  },
});
