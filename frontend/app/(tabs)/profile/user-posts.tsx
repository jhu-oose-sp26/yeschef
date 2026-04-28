import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingErrorView } from '@/components/ui/LoadingErrorView';
import { Colors } from '@/constants/colors';
import { getUserPosts } from '@/lib/api/posts';
import type { FeedPost } from '@/lib/api/posts';
import type { Recipe } from '@/lib/api/recipes';

function getPossessiveKitchenLabel(username?: string | null) {
  if (!username) return 'KITCHEN';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' KITCHEN` : `${base}'S KITCHEN`;
}

function getPostsTitle(username?: string | null) {
  if (!username) return 'their posts';
  return `${username}'s posts`;
}

function buildExcerpt(recipe: Recipe) {
  const firstStep = recipe.instruction?.steps?.[0]?.stepDescription?.trim();
  if (firstStep) return firstStep;
  if (recipe.ingredients?.length) {
    return `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? '' : 's'} ready to cook.`;
  }
  return 'Tap to open the full recipe details.';
}

export default function UserPostsScreen() {
  const router = useRouter();
  const { userId, username, from } = useLocalSearchParams<{
    userId: string;
    username: string;
    from?: string;
  }>();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserPosts(Number(userId));
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const heroLabel = useMemo(() => getPossessiveKitchenLabel(username), [username]);
  const heroTitle = useMemo(() => getPostsTitle(username), [username]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else if (from === 'find-friends') router.navigate('/browse');
    else if (from === 'user-profile') {
      router.navigate({
        pathname: '/profile/user-profile',
        params: { userId, username },
      });
    } else router.navigate('/(tabs)/profile');
  };

  const backLabel = from === 'find-friends' ? 'FRIENDS' : 'PROFILE';

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Pressable style={styles.backPill} onPress={handleBack}>
          <MaterialIcons name="chevron-left" size={18} color={Colors.dark} />
          <Text style={styles.backPillText}>{backLabel}</Text>
        </Pressable>

        <Text style={styles.heroEyebrow}>{heroLabel}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </View>

      <View style={styles.body}>
        <LoadingErrorView loading={loading} error={error} onRetry={load}>
          {posts.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                @{username ?? 'user'} has not posted any recipes yet.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <Text style={styles.sectionLabel}>
                {posts.length} POST{posts.length === 1 ? '' : 'S'}
              </Text>

              {posts.map((post) => {
                const prep = post.recipe.instruction?.prepTime;
                const cook = post.recipe.instruction?.cookTime;
                const excerpt = post.notes?.trim() || buildExcerpt(post.recipe);

                return (
                  <Pressable
                    key={post.postId}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() => router.push({ pathname: '/posts/[id]', params: { id: String(post.postId) } })}>
                    <View style={styles.cardTopAccent} />
                    <View style={styles.cardMain}>
                      <View style={styles.cardTextWrap}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {post.recipe.title}
                        </Text>
                        <Text style={styles.cardHandle}>@{username ?? 'user'}</Text>

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

                        <Text style={styles.cardExcerpt}>{excerpt}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.footerText}>@{username ?? 'user'} tap to view post</Text>
                      <View style={styles.arrowCircle}>
                        <MaterialIcons name="chevron-right" size={22} color={Colors.sand} />
                      </View>
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
    backgroundColor: Colors.green,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A4C69D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  backPillText: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroEyebrow: {
    color: 'rgba(26,18,8,0.34)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.dark,
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardTopAccent: {
    height: 6,
    backgroundColor: Colors.green,
  },
  cardMain: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.dark,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardHandle: {
    color: Colors.teal,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  cardExcerpt: {
    color: 'rgba(26,18,8,0.82)',
    fontSize: 15,
    lineHeight: 24,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,18,8,0.08)',
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    flex: 1,
    color: 'rgba(26,18,8,0.5)',
    fontSize: 14,
    lineHeight: 18,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
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
