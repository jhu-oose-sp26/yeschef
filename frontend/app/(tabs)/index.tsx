import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RecipeCard from '@/components/RecipeCard'
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Home Page</ThemedText>
      <RecipeCard data={{ name: "Pasta"}} />
    </ThemedView>
   
    
  );
}

