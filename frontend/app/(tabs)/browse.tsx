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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getUsers, getFriends, getFriendsRecipes } from '@/lib/api/users';
import { getRatingsForRecipe } from '@/lib/api/ratings';
import type { Recipe, User, RatingResponse } from '@/lib/api/types';

interface FeedRecipe extends Recipe {
  avgTaste: number | null;
  avgEase: number | null;
  ratingCount: number;
}

export default function FeedScreen() {
  const [feedRecipes, setFeedRecipes] = useState<FeedRecipe[]>([]);
  const [friendNames, setFriendNames] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const users = await getUsers();
      const user = users[0] ?? null;
      setCurrentUser(user);

      if (!user) {
        setFeedRecipes([]);
        setFriendNames([]);
        return;
      }

      const [recipes, friends] = await Promise.all([
        getFriendsRecipes(user.id),
        getFriends(user.id).catch(() => [] as string[]),
      ]);
      setFriendNames(friends);

      const withRatings: FeedRecipe[] = await Promise.all(
        recipes.map(async (r) => {
          let ratings: RatingResponse[] = [];
          try {
            ratings = await getRatingsForRecipe(r.id);
          } catch {
            // ratings unavailable — leave empty
          }
          const avg = (arr: number[]) =>
            arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
          return {
            ...r,
            avgTaste: avg(ratings.map((rt) => rt.tasteQuality)),
            avgEase: avg(ratings.map((rt) => rt.easeOfExecution)),
            ratingCount: ratings.length,
          };
        }),
      );
      setFeedRecipes(withRatings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.message}>Loading feed…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.error}>Could not load feed</ThemedText>
        <ThemedText style={styles.message}>{error}</ThemedText>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: tintColor }]}
          onPress={() => loadFeed()}
        >
          <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!currentUser) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="person.2.fill" size={48} color={accent} />
        </View>
        <ThemedText type="subtitle" style={styles.emptyTitle}>No user found</ThemedText>
        <ThemedText style={styles.message}>
          Create a user via the API to see your friends feed here.
        </ThemedText>
      </ThemedView>
    );
  }

  if (friendNames.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="person.2.fill" size={48} color={accent} />
        </View>
        <ThemedText type="subtitle" style={styles.emptyTitle}>No friends yet</ThemedText>
        <ThemedText style={styles.message}>
          Add friends via the API to see their recipes in your feed.
        </ThemedText>
      </ThemedView>
    );
  }

  if (feedRecipes.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="book.fill" size={48} color={accent} />
        </View>
        <ThemedText type="subtitle" style={styles.emptyTitle}>Feed is empty</ThemedText>
        <ThemedText style={styles.message}>
          Your friends ({friendNames.join(', ')}) haven't created any recipes yet.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={feedRecipes}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <ThemedText type="title" style={styles.screenTitle}>Friends Feed</ThemedText>
          <ThemedText style={styles.screenSubtitle}>
            Recipes from {friendNames.length}{' '}
            {friendNames.length === 1 ? 'friend' : 'friends'}
          </ThemedText>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadFeed(true)}
          tintColor={tintColor}
        />
      }
      renderItem={({ item }) => {
        const totalMin = item.instruction
          ? item.instruction.prepTime + item.instruction.cookTime
          : null;
        return (
          <Link
            href={{ pathname: '/recipes/[id]', params: { id: String(item.id) } }}
            asChild
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </ThemedText>

              <View style={styles.badgeRow}>
                {totalMin != null && (
                  <View style={[styles.badge, { backgroundColor: accent + '22' }]}>
                    <ThemedText style={[styles.badgeText, { color: accent }]}>
                      {totalMin} min
                    </ThemedText>
                  </View>
                )}
                {item.avgTaste != null && (
                  <View style={[styles.badge, { backgroundColor: '#F5A62322' }]}>
                    <MaterialIcons name="star" size={14} color="#D4920B" />
                    <ThemedText style={[styles.badgeText, { color: '#D4920B' }]}>
                      {item.avgTaste.toFixed(1)}
                    </ThemedText>
                  </View>
                )}
                {item.ratingCount > 0 && (
                  <ThemedText style={styles.ratingMeta}>
                    {item.ratingCount} {item.ratingCount === 1 ? 'rating' : 'ratings'}
                  </ThemedText>
                )}
              </View>

              {item.ingredients && item.ingredients.length > 0 && (
                <ThemedText style={styles.ingredientPreview} numberOfLines={1}>
                  {item.ingredients
                    .slice(0, 4)
                    .map((ing) => ing.ingredient)
                    .join(', ')}
                  {item.ingredients.length > 4 && ` +${item.ingredients.length - 4} more`}
                </ThemedText>
              )}

              <View style={styles.cardFooter}>
                <IconSymbol name="chevron.right" size={20} color={cardBorder} />
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

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
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  cardTitle: {
    fontSize: 17,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingMeta: {
    fontSize: 12,
    opacity: 0.6,
  },
  ingredientPreview: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 6,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
    fontSize: 14,
    opacity: 0.8,
  },
  error: {
    color: '#c00',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
});
