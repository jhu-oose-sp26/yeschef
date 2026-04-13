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
import { getFriends, getFriendsRecipes } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Recipe } from '@/lib/api/types';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [friendNames, setFriendNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const loadFeed = useCallback(
    async (isRefresh = false) => {
      if (isLoading) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        if (!user) {
          setRecipes([]);
          setFriendNames([]);
          return;
        }

        const [friendRecipeData, friendNameData] = await Promise.all([
          getFriendsRecipes(user.id),
          getFriends(user.id).catch(() => [] as string[]),
        ]);

        setRecipes(friendRecipeData);
        setFriendNames(friendNameData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load feed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isLoading, user],
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.message}>Loading your home feed…</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="house.fill" size={42} color={accent} />
        </View>
        <ThemedText type="title" style={styles.emptyTitle}>
          Home Feed
        </ThemedText>
        <ThemedText style={styles.message}>
          Log in to scroll through recipes shared by your friends.
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.error}>
          Could not load the home feed
        </ThemedText>
        <ThemedText style={styles.message}>{error}</ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={() => loadFeed()}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (friendNames.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="person.2.fill" size={42} color={accent} />
        </View>
        <ThemedText type="title" style={styles.emptyTitle}>
          No friends yet
        </ThemedText>
        <ThemedText style={styles.message}>
          Once you add friends, their recipe posts will show up here in a scrollable feed.
        </ThemedText>
      </ThemedView>
    );
  }

  if (recipes.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: accent + '18' }]}>
          <IconSymbol name="book.fill" size={42} color={accent} />
        </View>
        <ThemedText type="title" style={styles.emptyTitle}>
          Nothing to scroll yet
        </ThemedText>
        <ThemedText style={styles.message}>
          Your friends ({friendNames.join(', ')}) have not posted any recipes yet.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadFeed(true)}
          tintColor={tintColor}
        />
      }
      ListHeaderComponent={
        <View style={[styles.hero, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="title">Friends&apos; Recipes</ThemedText>
          <ThemedText style={styles.heroText}>
            Scroll through the latest recipes shared by {friendNames.length}{' '}
            {friendNames.length === 1 ? 'friend' : 'friends'}.
          </ThemedText>
        </View>
      }
      renderItem={({ item, index }) => {
        const totalTime = item.instruction
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
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View style={styles.cardHeader}>
                <View style={[styles.orderBadge, { backgroundColor: accent + '15' }]}>
                  <ThemedText style={[styles.orderBadgeText, { color: accent }]}>
                    {String(index + 1).padStart(2, '0')}
                  </ThemedText>
                </View>
                <View style={styles.cardCopy}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.cardMeta}>
                    {item.ingredients?.length ?? 0} ingredients
                    {totalTime != null ? ` · ${totalTime} min total` : ''}
                  </ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={18} color={accent} />
              </View>
              {item.ingredients && item.ingredients.length > 0 && (
                <ThemedText style={styles.preview} numberOfLines={2}>
                  {item.ingredients
                    .slice(0, 5)
                    .map((ingredient) => ingredient.ingredient)
                    .join(', ')}
                </ThemedText>
              )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  heroText: {
    marginTop: 8,
    opacity: 0.78,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 17,
  },
  cardMeta: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 13,
  },
  preview: {
    marginTop: 12,
    opacity: 0.78,
    lineHeight: 20,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    maxWidth: 320,
  },
  error: {
    color: '#C0392B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
