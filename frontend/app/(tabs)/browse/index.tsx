import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import type { Recipe } from '@/lib/api/types';
import { getRecipes } from '@/lib/api/recipes';
import RecipeCard from '@/components/RecipeCard';

export default function BrowseTabScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getRecipes();
      setRecipes(data);
    }
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.title}>Browse</ThemedText>
      <ThemedText style={styles.subtitle}>All recipes</ThemedText>

      <View style={styles.list}>
        {recipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            onPress={() => router.push(`/recipes/${recipe.id}?from=browse`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <RecipeCard data={recipe} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    marginBottom: 4,
  },

  subtitle: {
    marginBottom: 16,
    opacity: 0.6,
  },

  list: {
    gap: 12,
  },
});
