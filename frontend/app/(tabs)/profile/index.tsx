import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getFriends, getSavedRecipes, getUserRecipes } from '@/lib/api/users';
import type { Recipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

function formatCookLabel(recipe: Recipe) {
  const prep = recipe.instruction?.prepTime;
  const cook = recipe.instruction?.cookTime;
  return {
    prep: prep != null ? `${prep}m prep` : null,
    cook: cook != null ? `${cook}m cook` : null,
  };
}

function getPossessiveTitle(username?: string | null) {
  if (!username) return 'MY KITCHEN';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' KITCHEN` : `${base}'S KITCHEN`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const [saved, created, friends] = await Promise.all([
        getSavedRecipes(authUser.id),
        getUserRecipes(authUser.id),
        getFriends(authUser.id).catch(() => [] as string[]),
      ]);
      setSavedCount(saved.length);
      setFriendsCount(friends.length);
      setPostsCount(created.length);
      setCreatedRecipes(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const recentRecipe = useMemo(() => createdRecipes[0] ?? null, [createdRecipes]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const initial = authUser?.username?.[0]?.toUpperCase() ?? '?';
  const userId = authUser?.id;
  const heroLabel = getPossessiveTitle(authUser?.username);
  const timeLabels = recentRecipe ? formatCookLabel(recentRecipe) : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
          hitSlop={12}>
          <MaterialIcons name="more-horiz" size={26} color={CREAM} />
        </Pressable>

        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>

        <Text style={styles.heroEyebrow}>{heroLabel}</Text>
        <Text style={styles.displayName}>{authUser?.username ?? 'guest'}</Text>
        <Text style={styles.handle}>@{authUser?.username ?? ''}</Text>

        <View style={styles.statsShell}>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{savedCount}</Text>
            <Text style={styles.statLabel}>saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{friendsCount}</Text>
            <Text style={styles.statLabel}>friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>posts</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrowRed}>RECENT ACTIVITY</Text>
        {recentRecipe ? (
          <Pressable
            style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/recipes/[id]',
                params: { id: String(recentRecipe.id), from: 'profile' },
              })
            }>
            <View style={styles.recentTextWrap}>
              <Text style={styles.recentTitle} numberOfLines={2}>
                {recentRecipe.title}
              </Text>
              <View style={styles.pillRow}>
                {timeLabels?.prep ? (
                  <View style={[styles.timePill, styles.prepPill]}>
                    <Text style={styles.prepPillText}>{timeLabels.prep}</Text>
                  </View>
                ) : null}
                {timeLabels?.cook ? (
                  <View style={[styles.timePill, styles.cookPill]}>
                    <Text style={styles.cookPillText}>{timeLabels.cook}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.circleArrow}>
              <MaterialIcons name="chevron-right" size={22} color={CREAM} />
            </View>
          </Pressable>
        ) : (
          <Text style={styles.emptyNote}>No recent activity yet.</Text>
        )}

        <Text style={styles.eyebrowTeal}>MY STUFF</Text>

        <Pressable
          style={({ pressed }) => [styles.navCard, styles.postsCard, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/profile/my-posts', params: { userId: String(userId ?? '') } })
          }>
          <View style={styles.leadingAccentGreen} />
          <View style={[styles.iconBubble, styles.postsBubble]}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#7A9474" />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navTitle}>my posts</Text>
            <Text style={styles.navSubtitle}>
              {postsCount} post{postsCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.softArrow}>
            <MaterialIcons name="chevron-right" size={22} color="#C4BCAE" />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.navCard, styles.friendsCard, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/profile/my-friends', params: { userId: String(userId ?? '') } })
          }>
          <View style={styles.leadingAccentTeal} />
          <View style={[styles.iconBubble, styles.friendsBubble]}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color={TEAL} />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navTitle}>my friends</Text>
            <Text style={styles.navSubtitle}>
              {friendsCount} friend{friendsCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.softArrow}>
            <MaterialIcons name="chevron-right" size={22} color="#C4BCAE" />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.navCard, styles.savedCard, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: '/profile/my-saved', params: { userId: String(userId ?? '') } })
          }>
          <View style={styles.leadingAccentRed} />
          <View style={[styles.iconBubble, styles.savedBubble]}>
            <MaterialCommunityIcons name="bookmark-outline" size={24} color={RED} />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navTitle}>my saved</Text>
            <Text style={styles.navSubtitle}>
              {savedCount} recipe{savedCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.softArrow}>
            <MaterialIcons name="chevron-right" size={22} color="#C4BCAE" />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: TAN,
  },
  container: {
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: TAN,
  },
  errorText: {
    color: RED,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: RED,
  },
  retryBtnText: {
    color: CREAM,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: DARK,
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 0,
  },
  moreButton: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#C94932',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '900',
    color: CREAM,
  },
  heroEyebrow: {
    color: 'rgba(255,248,242,0.72)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 6,
  },
  displayName: {
    color: CREAM,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 42,
    marginBottom: 4,
  },
  handle: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 18,
  },
  statsShell: {
    backgroundColor: '#F8F1E5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(26,18,8,0.08)',
    marginVertical: 10,
  },
  statNumber: {
    color: DARK,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(26,18,8,0.34)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  body: {
    backgroundColor: '#F8F1E5',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  eyebrowRed: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 14,
  },
  eyebrowTeal: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 14,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  recentTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  recentTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prepPill: {
    backgroundColor: '#FFF0E8',
  },
  prepPillText: {
    color: RED,
    fontSize: 12,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#D9F3F2',
  },
  cookPillText: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '800',
  },
  circleArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNote: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 28,
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.06)',
  },
  postsCard: {
    marginTop: 2,
  },
  friendsCard: {},
  savedCard: {
    marginBottom: 8,
  },
  leadingAccentGreen: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: GREEN,
  },
  leadingAccentTeal: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: TEAL,
  },
  leadingAccentRed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: RED,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  postsBubble: {
    backgroundColor: '#EEF4EA',
  },
  friendsBubble: {
    backgroundColor: '#D9F3F2',
  },
  savedBubble: {
    backgroundColor: '#FFF0E8',
  },
  navTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  navTitle: {
    color: DARK,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  navSubtitle: {
    color: 'rgba(26,18,8,0.52)',
    fontSize: 14,
    fontWeight: '700',
  },
  softArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.84,
  },
});
