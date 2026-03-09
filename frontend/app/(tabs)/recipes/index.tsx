import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const loadRecipes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getRecipes();
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.message}>Loading recipes…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.error}>
          Could not load recipes
        </ThemedText>
        <ThemedText style={styles.message}>{error}</ThemedText>
        <ThemedText style={styles.hint}>
          Ensure the backend is running (e.g. in backend: ./mvnw spring-boot:run) and
          EXPO_PUBLIC_API_URL points to it.
        </ThemedText>
        <Pressable style={[styles.retry, { backgroundColor: tintColor }]} onPress={() => loadRecipes()}>
          <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (recipes.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">No recipes yet</ThemedText>
        <ThemedText style={styles.message}>
          The API is connected. Add recipes via the backend or API to see them here.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <ThemedText type="title" style={styles.screenTitle}>Recipes</ThemedText>
          <ThemedText style={styles.screenSubtitle}>
            Tap a recipe to view details
          </ThemedText>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadRecipes(true)} tintColor={tintColor} />
      }
      renderItem={({ item }) => {
        const totalMin = item.instruction
          ? item.instruction.prepTime + item.instruction.cookTime
          : null;
        return (
          <Link href={{ pathname: '/recipes/[id]', params: { id: String(item.id) } }} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity: pressed ? 0.9 : 1,
                  ...cardShadow,
                },
              ]}>
              <View style={styles.cardInner}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </ThemedText>
                {totalMin != null && (
                  <View style={[styles.timeBadge, { backgroundColor: accent + '22' }]}>
                    <ThemedText style={[styles.timeBadgeText, { color: accent }]}>
                      {totalMin} min
                    </ThemedText>
                  </View>
                )}
                <IconSymbol name="chevron.right" size={22} color={cardBorder} style={styles.cardChevron} />
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  screenTitle: {
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    opacity: 0.75,
  },
  card: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    minWidth: 0,
  },
  cardChevron: {
    marginLeft: 'auto',
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.8,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
  error: {
    color: '#c00',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
});
