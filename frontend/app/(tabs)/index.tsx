import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RecipeCard from '@/components/RecipeCard'
import { Link } from 'expo-router';
import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';


export default function HomeScreen() {
  const { isLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (isLoading) return;
    getRecipes().then(setRecipes).catch(() => {});
  }, [isLoading]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Home Page</ThemedText>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} data={recipe} />
      ))}
    </ThemedView>
  );
}

