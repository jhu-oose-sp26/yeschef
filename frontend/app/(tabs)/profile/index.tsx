import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getFriends, getSavedRecipes } from '@/lib/api/users';
import { getUserPosts } from '@/lib/api/posts';
import type { FeedPost } from '@/lib/api/posts';
import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '@/constants/colors';

const DARK = Colors.dark;
const TEAL = Colors.teal;
const GREEN = Colors.green;
const TAN = Colors.tan;
const RED = Colors.red;
const CREAM = Colors.cream;

function getPossessiveTitle(username?: string | null) {
  if (!username) return 'MY KITCHEN';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' KITCHEN` : `${base}'S KITCHEN`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const [recentPosts, setRecentPosts] = useState<FeedPost[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const [saved, posts, friends] = await Promise.all([
        getSavedRecipes(authUser.id),
        getUserPosts(authUser.id),
        getFriends(authUser.id).catch(() => [] as string[]),
      ]);
      setSavedCount(saved.length);
      setFriendsCount(friends.length);
      setPostsCount(posts.length);
      setRecentPosts(posts.slice(0, 6));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
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

        {recentPosts.length === 0 ? (
          <Text style={styles.emptyNote}>No recent activity yet.</Text>
        ) : (
          <View style={styles.postsGrid}>
            {recentPosts.map((item) => {
              const prep = item.recipe.instruction?.prepTime;
              const cook = item.recipe.instruction?.cookTime;
              return (
                <Pressable
                  key={item.postId}
                  style={({ pressed }) => [styles.miniCard, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/posts/[id]',
                      params: { id: String(item.postId) },
                    })
                  }>
                  <View style={styles.miniCardAccent} />
                  <View style={styles.miniCardBody}>
                    <Text style={styles.miniCardTitle} numberOfLines={2}>
                      {item.recipe.title}
                    </Text>
                    <View style={styles.miniPillRow}>
                      {prep != null && (
                        <View style={[styles.miniPill, styles.prepPill]}>
                          <Text style={styles.prepPillText}>{prep}m prep</Text>
                        </View>
                      )}
                      {cook != null && (
                        <View style={[styles.miniPill, styles.cookPill]}>
                          <Text style={styles.cookPillText}>{cook}m cook</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
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

      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalBody}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.pressed]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalLogoutBtn, pressed && styles.pressed]}
                onPress={() => { setShowLogoutConfirm(false); logout(); }}
              >
                <Text style={styles.modalLogoutText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyNote: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 28,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  miniCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.07)',
    overflow: 'hidden',
  },
  miniCardAccent: {
    height: 5,
    backgroundColor: GREEN,
  },
  miniCardBody: {
    padding: 12,
  },
  miniCardTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  miniPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  miniPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prepPill: {
    backgroundColor: '#FFF0E8',
  },
  prepPillText: {
    color: RED,
    fontSize: 10,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#D9F3F2',
  },
  cookPillText: {
    color: TEAL,
    fontSize: 10,
    fontWeight: '800',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: CREAM,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: DARK,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    color: 'rgba(26,18,8,0.6)',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(26,18,8,0.15)',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  modalLogoutBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: RED,
  },
  modalLogoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
