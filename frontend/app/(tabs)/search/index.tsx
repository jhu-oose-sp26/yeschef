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

import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getRecentIds } from '@/lib/recentRecipes';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function SearchScreen() {
  const router = useRouter();
  const [recents, setRecents] = useState<Recipe[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const loadRecents = useCallback(async () => {
    setLoadingRecents(true);
    try {
      const ids = await getRecentIds();
      const recipes = await Promise.all(ids.map((id) => getRecipe(id).catch(() => null)));
      setRecents(recipes.filter((r): r is Recipe => r !== null));
    } catch {
      setRecents([]);
    } finally {
      setLoadingRecents(false);
    }
  }, []);

  useEffect(() => { loadRecents(); }, [loadRecents]);


  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SEARCH</Text>
        <Pressable style={styles.searchBar} onPress={() => router.push('/search/results')}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>What's on the menu...</Text>
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>

        {/* SEARCH BY */}
        <Text style={styles.sectionHeader}>SEARCH BY:</Text>
        <View style={styles.filterGroup}>
          <Pressable
            style={({ pressed }) => [styles.filterCard, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push('/search/ingredient')}
          >
            <Text style={styles.filterText}>ingredient</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.filterCard, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push('/search/time')}
          >
            <Text style={styles.filterText}>cook time</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.filterCard, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push('/search/results')}
          >
            <Text style={styles.filterText}>all recipes</Text>
          </Pressable>
        </View>

        {/* RECENTS */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>RECENTS:</Text>
        {loadingRecents ? (
          <ActivityIndicator size="small" color={TEAL} style={{ marginTop: 8 }} />
        ) : recents.length === 0 ? (
          <Text style={styles.emptyNote}>No recently viewed recipes yet.</Text>
        ) : (
          <View style={styles.recentsList}>
            {recents.map((recipe) => (
              <View key={recipe.id} style={styles.recentCard}>
                <Pressable
                  style={({ pressed }) => [styles.recentPressable, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'search' } })}
                >
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{recipe.title}</Text>
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <Text style={styles.recentSub}>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</Text>
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
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },

  // ── Header ──
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchPlaceholder: { flex: 1, fontSize: 15, color: '#A0A0A0' },

  // ── Content ──
  content: { padding: 20 },

  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1A0E',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // ── Filter cards ──
  filterGroup: { gap: 10 },
  filterCard: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: { fontSize: 15, fontWeight: '600', color: '#1E2A1E' },

  // ── Recents ──
  emptyNote: { fontSize: 14, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic' },
  recentsList: { gap: 10 },
  recentCard: {
    backgroundColor: GREEN,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recentPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentContent: { flex: 1, marginRight: 10 },
  recentTitle: { fontSize: 15, fontWeight: '700', color: '#1E2A1E', marginBottom: 4 },
  recentSub: { fontSize: 12, color: '#1E2A1E', opacity: 0.65, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { backgroundColor: RED, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 2 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 26, color: '#1E2A1E', fontWeight: '300' },
});
