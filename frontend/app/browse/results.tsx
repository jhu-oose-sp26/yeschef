import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import RecipeCard from '@/components/RecipeCard';

import type { Recipe } from '@/lib/api/types';
import { getRecipes, getRecipesByIngredient } from '@/lib/api/recipes'; // adjust if needed

export default function BrowseResultsScreen() {
  const { type, value } = useLocalSearchParams<{
    type: string;
    value: string;
  }>();

  const router = useRouter();

  const accent = useThemeColor({}, 'accent');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        let data: Recipe[] = [];

        if (type === 'ingredient') {
          data = await getRecipesByIngredient(value);
        } else if (type === 'time') {
          const all = await getRecipes();
          const minutes = parseInt(value);

          data = all.filter((r) => {
            if (!r.instruction) return false;
            const total = r.instruction.prepTime + r.instruction.cookTime;
            return total <= minutes;
          });
        }

        setRecipes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [type, value]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={[styles.backText, { color: accent }]}>
            ← Back
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.title}>
          {value}
        </ThemedText>
      </View>

      {/* Results */}
      <View style={styles.list}>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : recipes.length === 0 ? (
          <ThemedText>No recipes found.</ThemedText>
        ) : (
          recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={{ pathname: '/recipes/[id]', params: { id: String(recipe.id) } }}
              asChild
            >
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <RecipeCard data={recipe} />
              </Pressable>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  header: {
    marginBottom: 20,
    gap: 6,
  },

  backText: {
    fontSize: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  list: {
    gap: 10,
  },
});