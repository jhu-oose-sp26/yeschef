import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingErrorView } from '@/components/ui/LoadingErrorView';
import { Colors } from '@/constants/colors';
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

              {recipes.map((recipe, index) => {
                const prep = recipe.instruction?.prepTime;
                const cook = recipe.instruction?.cookTime;
                const creator = recipe.creatorUsername ? `@${recipe.creatorUsername}` : null;
                return (
                  <Pressable
                    key={recipe.id}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() =>
                      router.push({
                        pathname: '/recipes/[id]',
                        params: {
                          id: String(recipe.id),
                          from: 'my-saved',
                          userId,
                          username: username ?? '',
                        },
                      })
                    }>
                    <View style={styles.rankWrap}>
                      <Text style={styles.rankText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {recipe.ingredients?.length ?? 0} ingredient
                        {(recipe.ingredients?.length ?? 0) === 1 ? '' : 's'}
                        {creator ? ` · ${creator}` : ''}
                      </Text>

                      <View style={styles.pillRow}>
                        {prep != null ? (
                          <View style={[styles.timePill, styles.prepPill]}>
                            <Text style={styles.prepPillText}>{prep}m prep</Text>
                          </View>
                        ) : null}
                        {cook != null ? (
                          <View style={[styles.timePill, styles.cookPill]}>
                            <Text style={styles.cookPillText}>{cook}m cook</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.arrowCircle}>
                      <MaterialIcons name="chevron-right" size={22} color={Colors.sand} />
                    </View>
                  </Pressable>
                );
              })}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankWrap: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#E0D6C9',
    fontSize: 22,
    fontWeight: '900',
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: Colors.dark,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardMeta: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  prepPill: {
    backgroundColor: '#FFF0E8',
  },
  prepPillText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#D8F0EF',
  },
  cookPillText: {
    color: Colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
