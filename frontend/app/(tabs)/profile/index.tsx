import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';

import RecipeCard from '@/components/RecipeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getSavedRecipes, getUserRecipes } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

const PAPRIKA = '#DC602E';
const CELADON = '#B8D5B8';
const RECENT_LIMIT = 5;

export default function ProfileScreen() {
  const router = useRouter();
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const { user: authUser, logout } = useAuth();

  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3-dot menu overlay
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const openMenu = () => {
    setMenuVisible(true);
    slideAnim.setValue(400);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  };

  const closeMenu = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      callback?.();
    });
  };

  const loadProfile = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const [saved, created] = await Promise.all([
        getSavedRecipes(authUser.id),
        getUserRecipes(authUser.id),
      ]);

      setCreatedRecipes(created);

      // prefetch saved so the saved page loads faster (optional)
      const recipeIds = saved.map((s) => s.recipeId).filter((id): id is number => id != null);
      await Promise.all(recipeIds.map((id) => getRecipe(id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={PAPRIKA} />
        <ThemedText style={styles.loadingText}>Loading profile…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryBtn} onPress={loadProfile}>
          <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const initial = authUser?.username?.[0]?.toUpperCase() ?? '?';
  const userId = authUser?.id;
  const recentActivity = createdRecipes.slice(0, RECENT_LIMIT);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.headerCard, { backgroundColor: CELADON }]}>
          <Pressable style={styles.dotsBtn} onPress={openMenu} hitSlop={12}>
            <ThemedText style={styles.dotsText}>···</ThemedText>
          </Pressable>

          <View style={styles.avatarCircle}>
            <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
          </View>

          <ThemedText style={[styles.displayName, { fontFamily: Fonts?.rounded }]}>
            {authUser?.username ?? 'Guest'}
          </ThemedText>
          <ThemedText style={styles.handle}>
            {authUser ? `@${authUser.username}` : 'No user yet'}
          </ThemedText>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>

          {recentActivity.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <IconSymbol name="fork.knife" size={36} color={PAPRIKA} />
              <ThemedText style={styles.emptyText}>No recipes created yet.</ThemedText>
            </View>
          ) : (
            <View style={styles.cardList}>
              {recentActivity.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={{ pathname: '/recipes/[id]', params: { id: String(recipe.id), from: 'profile' } }}
                  asChild
                >
                  <Pressable>
                    <RecipeCard data={recipe} />
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1, backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={() => router.push({ pathname: '/profile/my-posts', params: { userId: String(userId ?? '') } })}
          >
            <IconSymbol name="square.grid.2x2" size={20} color={PAPRIKA} />
            <ThemedText style={styles.actionLabel}>View my posts</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={PAPRIKA} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1, backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={() => router.push({ pathname: '/profile/my-saved', params: { userId: String(userId ?? '') } })}
          >
            <IconSymbol name="bookmark.fill" size={20} color={PAPRIKA} />
            <ThemedText style={styles.actionLabel}>View my saved</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={PAPRIKA} />
          </Pressable>
        </View>

        {/* ── Sign Out ── */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={logout}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={PAPRIKA} />
          <ThemedText style={styles.signOutText}>Sign out</ThemedText>
        </Pressable>
      </ScrollView>

      {/* ── 3-dot Menu Overlay ── */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={() => closeMenu()}>
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.menuPanel, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.panelHeader}>
            <ThemedText type="subtitle" style={styles.panelTitle}>Options</ThemedText>
            <Pressable onPress={() => closeMenu()} hitSlop={12} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={PAPRIKA} />
            </Pressable>
          </View>

          <View style={styles.menuList}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => closeMenu(() => router.push({ pathname: '/profile/my-posts', params: { userId: String(userId ?? '') } }))}
            >
              <IconSymbol name="square.grid.2x2" size={20} color={PAPRIKA} />
              <ThemedText style={styles.menuItemText}>View all posts</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={PAPRIKA} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => closeMenu(() => router.push({ pathname: '/profile/my-saved', params: { userId: String(userId ?? '') } }))}
            >
              <IconSymbol name="bookmark.fill" size={20} color={PAPRIKA} />
              <ThemedText style={styles.menuItemText}>View saved recipes</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={PAPRIKA} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => closeMenu(logout)}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={PAPRIKA} />
              <ThemedText style={styles.menuItemText}>Log out</ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 32 },

  headerCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  dotsBtn: { position: 'absolute', top: 16, right: 16, padding: 6 },
  dotsText: { fontSize: 22, fontWeight: '700', letterSpacing: 2, color: '#1a1a1a' },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PAPRIKA,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  avatarInitial: { fontSize: 38, fontWeight: '700', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  handle: { fontSize: 14, color: '#3a3a3a', opacity: 0.75 },

  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  cardList: { gap: 0, alignItems: 'center' },

  emptyBox: {
    padding: 36,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyText: { textAlign: 'center', fontSize: 14, opacity: 0.75 },

  actionGroup: { gap: 10 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12 },
  errorText: { color: '#c00', textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: PAPRIKA },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  menuPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '72%',
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: -3, height: 0 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
      default: {},
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    backgroundColor: CELADON,
  },
  panelTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { padding: 4 },

  menuList: { padding: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: { flex: 1, fontSize: 16 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PAPRIKA,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: PAPRIKA },
});
