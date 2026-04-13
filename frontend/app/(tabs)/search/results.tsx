import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedView } from '@/components/themed-view';
import RecipeCard from '@/components/RecipeCard';

import { IconSymbol } from '@/components/ui/icon-symbol';

import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

export default function SearchResultsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const [query, setQuery] = useState(q ?? '');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filtered, setFiltered] = useState<Recipe[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getRecipes();
      setRecipes(data);
    }
    load();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(recipes);
    } else {
      const qLower = query.toLowerCase();
      setFiltered(
        recipes.filter((r) =>
          r.title.toLowerCase().includes(qLower)
        )
      );
    }
  }, [query, recipes]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* BACK BUTTON */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={22} color="#333" />
        </Pressable>

        {/* SEARCH HEADER */}
        <View style={styles.header}>
          <ThemedText type="title">Search</ThemedText>

          {/* SEARCH BAR */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: '#05A8AA', // darker for contrast
                borderColor: cardBorder,
              },
            ]}
          >
            <IconSymbol name="magnifyingglass" size={18} color="#ffffff" />

            <TextInput
              placeholder="What's on the menu..."
              placeholderTextColor="#aaa"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
          </View>
        </View>

        {/* RESULTS */}
        <View style={styles.resultsList}>
          {filtered.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={({ pressed }) => [
                styles.resultCard,
                { backgroundColor: cardBg, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                router.push(`/recipes/${recipe.id}?from=search`)
              }}
            >
              <View style={styles.cardLeft}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {recipe.title}
                </ThemedText>

                <ThemedText style={styles.meta}>
                  {recipe.ingredients?.length ?? 0} ingredients
                </ThemedText>
              </View>

              {/* CHEVRON */}
              <IconSymbol name="chevron.right" size={18} color="#999" />
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    padding: 6,
    borderRadius: 8,
  },

  header: {
    marginBottom: 16,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderRadius: 12,

    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
  },

  resultsList: {
    gap: 12,
    marginTop: 10,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    padding: 16,
    borderRadius: 14,

    borderWidth: 1,
    borderColor: '#e6e6e6',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardLeft: {
    flex: 1,
    paddingRight: 10,
  },

  meta: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
  },
});