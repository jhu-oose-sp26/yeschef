import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function SearchResultsScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes()
      .then(setAllRecipes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-focus the input when the screen mounts
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = query.trim().length === 0
    ? allRecipes
    : allRecipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <ThemedView style={styles.screen}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>SEARCHING</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            placeholder="What's on the menu..."
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <Text style={styles.emptyNote}>No recipes found for "{query}".</Text>
          ) : (
            filtered.map((recipe) => (
              <View key={recipe.id} style={styles.card}>
                <Pressable
                  style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'search' } })}
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
            ))
          )}
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  clearBtn: { fontSize: 14, color: '#999', paddingLeft: 8 },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyNote: { fontSize: 14, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic', textAlign: 'center', marginTop: 16 },

  // ── List ──
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },

  // ── Recipe cards ──
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
