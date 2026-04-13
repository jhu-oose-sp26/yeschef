import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Recipe } from '@/lib/api/types';
import { getRecipes } from '@/lib/api/recipes';

import RecipeCard from '@/components/RecipeCard';

export default function BrowseTabScreen() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'cardBorder');

  useEffect(() => {
    async function load() {
      const data = await getRecipes();
      setRecipes(data);
    }
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* HEADER */}
      <ThemedText type="title" style={styles.title}>
        Explore
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Discover new recipes
      </ThemedText>

      <View style={styles.stack}>
        {recipes.map((recipe, index) => {
          const isFirst = index === 0;

          return (
            <Pressable
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                  opacity: pressed ? 0.85 : 1,

                  marginTop: isFirst ? 0 : -14,

                  zIndex: recipes.length - index, // higher = on top
                  elevation: recipes.length - index, // Android fix

                  position: 'relative',
                },
              ]}
            >
              <ThemedText style={styles.name} numberOfLines={1}>
                {recipe.title}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  title: {
    marginBottom: 4,
  },

  subtitle: {
    marginBottom: 16,
    opacity: 0.6,
  },

  stack: {
    paddingBottom: 20,
  },

  card: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,

    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
  },
});