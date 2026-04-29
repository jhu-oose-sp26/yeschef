import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import PostCard from '@/components/PostCard';
import { LoadingErrorView } from '@/components/ui/LoadingErrorView';
import { Colors } from '@/constants/colors';
import type { FeedPost } from '@/lib/api/posts';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getSavedRecipes } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

function getCookbookLabel(username?: string | null, isOwnProfile?: boolean) {
  if (isOwnProfile) return 'MY COOKBOOK';
  if (!username) return 'COOKBOOK';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' COOKBOOK` : `${base}'S COOKBOOK`;
}

function getSavedTitle(isOwnProfile: boolean, username?: string) {
  if (isOwnProfile) return 'my saved';
  return username ? `${username}'s saved` : 'saved recipes';
}

export default function MySavedScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { userId, username } = useLocalSearchParams<{ userId: string; username?: string }>();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await getSavedRecipes(Number(userId));
      const ids = saved.map((item) => item.recipeId).filter((id): id is number => id != null);
      const data = await Promise.all(ids.map((id) => getRecipe(id)));
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load saved recipes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwnProfile = authUser && String(authUser.id) === userId;
  const heroEyebrow = useMemo(
    () => getCookbookLabel(username ?? authUser?.username, Boolean(isOwnProfile)),
    [authUser?.username, isOwnProfile, username],
  );
  const heroTitle = useMemo(
    () => getSavedTitle(Boolean(isOwnProfile), username),
    [isOwnProfile, username],
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else if (isOwnProfile) router.navigate('/(tabs)/profile');
    else {
      router.navigate({
        pathname: '/profile/user-profile',
        params: {
          userId,
          username: username ?? '',
        },
      });
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Pressable style={styles.backPill} onPress={handleBack}>
          <MaterialIcons name="chevron-left" size={18} color={Colors.sand} />
          <Text style={styles.backPillText}>PROFILE</Text>
        </Pressable>

        <Text style={styles.heroEyebrow}>{heroEyebrow}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </View>

      <View style={styles.body}>
        <LoadingErrorView loading={loading} error={error} onRetry={load}>
          {recipes.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {isOwnProfile ? 'No saved recipes yet.' : `@${username ?? 'user'} has no saved recipes yet.`}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <Text style={styles.sectionLabel}>
                {recipes.length} SAVED RECIPE{recipes.length === 1 ? '' : 'S'}
              </Text>

              {recipes.reduce<Recipe[][]>((rows, r, i) => {
                if (i % 2 === 0) rows.push([r]); else rows[rows.length - 1].push(r);
                return rows;
              }, []).map((row) => (
                <View key={row[0].id} style={styles.cardRow}>
                  {row.map((recipe) => {
                    const feedPost: FeedPost = { postId: recipe.id, image: null, notes: null, recipe };
                    return (
                      <PostCard
                        key={recipe.id}
                        item={feedPost}
                        style={styles.cardHalf}
                        onPress={() => router.push({
                          pathname: '/recipes/[id]',
                          params: { id: String(recipe.id), from: 'my-saved', userId, username: username ?? '' },
                        })}
                      />
                    );
                  })}
                  {row.length === 1 && <View style={styles.cardHalf} />}
                </View>
              ))}
            </ScrollView>
          )}
        </LoadingErrorView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.sand,
  },
  hero: {
    backgroundColor: Colors.red,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  backPillText: {
    color: Colors.sand,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroEyebrow: {
    color: 'rgba(255,248,242,0.72)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.sand,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.sand,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  sectionLabel: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.8,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cardHalf: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.84,
  },
});
