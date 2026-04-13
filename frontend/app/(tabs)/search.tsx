import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RecipeCard from '@/components/RecipeCard'
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEffect, useState } from 'react';

import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

/**
 * Search screen: ""
 * Wired to XXX and XXXX APIs. Without auth we use the first user from the API.
 */
export default function SearchScreen() {

  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filtered, setFiltered] = useState<Recipe[]>([]);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      const data = await getRecipes();
      setRecipes(data);
      setFiltered(data);
    }
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.length > 0) {
        router.push(`../search/results?q=${encodeURIComponent(query)}`);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setFiltered(recipes);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        recipes.filter((r) => r.title.toLowerCase().includes(q))
      );
    }
  }, [query, recipes]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="title" style={styles.title}>
          Search
        </ThemedText>

        <View style={[styles.searchBar, { borderColor: cardBorder }]}>
          <IconSymbol name="magnifyingglass" size={18} color="#888" />

          <TextInput
          placeholder="What's on the menu..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Browse by
        </ThemedText>

       <BrowseCard
          label="Ingredient"
          onPress={() => router.push('../browse/ingredient')}
          accent={accent}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
        <BrowseCard
          label="Cook Time"
          onPress={() => router.push('../browse/time')}
          accent={accent}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      </View>
    </ScrollView>
  );
}


function BrowseCard({
  label,
  onPress,
  accent,
  cardBg,
  cardBorder,
}: {
  label: string;
  onPress: () => void;
  accent: string;
  cardBg: string;
  cardBorder: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.browseCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemedText style={styles.browseText}>{label}</ThemedText>
      <IconSymbol name="chevron.right" size={18} color={accent} />
    </Pressable>
  );
}


const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Header */
  headerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },

  title: {
    marginBottom: 12,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
  },

  /* Sections */
  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  /* Browse cards */
  browseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },

  browseText: {
    fontSize: 15,
  },
});
