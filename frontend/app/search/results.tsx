import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import RecipeCard from '@/components/RecipeCard';

import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const router = useRouter();

  const accent = useThemeColor({}, 'accent');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const [query, setQuery] = useState(q || '');
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
    const qLower = query.toLowerCase();
    setFiltered(
      recipes.filter((r) =>
        r.title.toLowerCase().includes(qLower)
      )
    );
  }, [query, recipes]);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <IconSymbol name="chevron.left" size={22} color="#333" />
      </Pressable>
      
      <View style={[styles.searchBar, { borderColor: cardBorder }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes..."
          style={styles.input}
          autoFocus
        />
      </View>

      {/* saerch results */}
      {filtered.length === 0 ? (
        <ThemedText style={styles.empty}>
          No recipes found
        </ThemedText>
      ) : (
        filtered.map((recipe) => (
          <RecipeCard key={recipe.id} data={recipe} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  searchBar: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },

  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    padding: 6,
    borderRadius: 8,
  },

  input: {
    fontSize: 16,
  },

  empty: {
    marginTop: 20,
    opacity: 0.7,
  },
});