import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { getFriends, getSavedRecipes, getUser, getUserRecipes } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';
const RED = '#BC412B';

type ProfileData = {
  id: number;
  username: string;
  friendsCount: number;
  savedCount: number;
  postsCount: number;
  isFriend: boolean;
};

const AVATAR_COLORS = ['#BC412B', '#05A8AA', '#5A9B5A', '#8E5DB7', '#C96A3D', '#6E93B5', '#8A6D2E'];

function getAvatarColor(username: string) {
  let total = 0;
  for (const char of username) total += char.charCodeAt(0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { userId, username, from } = useLocalSearchParams<{ userId: string; username?: string; from?: string }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericUserId = Number(userId);
  const isOwnProfile = authUser?.id === numericUserId;

  const load = useCallback(async () => {
    if (!userId || Number.isNaN(numericUserId)) {
      setError('Invalid user profile.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [userRecord, saved, posts, friends, myFriends] = await Promise.all([
        typeof username === 'string' && username.length > 0
          ? Promise.resolve({ id: numericUserId, username })
          : getUser(numericUserId),
        getSavedRecipes(numericUserId).catch(() => []),
        getUserRecipes(numericUserId).catch(() => []),
        getFriends(numericUserId).catch(() => [] as string[]),
        authUser ? getFriends(authUser.id).catch(() => [] as string[]) : Promise.resolve([] as string[]),
      ]);

      setProfile({
        id: numericUserId,
        username: userRecord.username,
        friendsCount: friends.length,
        savedCount: saved.length,
        postsCount: posts.length,
        isFriend: authUser ? myFriends.includes(userRecord.username) : false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [authUser, numericUserId, userId, username]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (from === 'find-friends') router.navigate('/browse');
    else if (router.canGoBack()) router.back();
    else if (isOwnProfile) router.navigate('/(tabs)/profile');
    else router.navigate('/browse');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Profile not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Pressable onPress={handleBack} style={styles.backPill}>
          <Text style={styles.backPillText}>{'< BACK'}</Text>
        </Pressable>

        <View style={[styles.avatar, { backgroundColor: getAvatarColor(profile.username) }]}>
          <Text style={styles.avatarText}>{profile.username[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <Text style={styles.displayName}>{profile.username}</Text>
        <Text style={styles.handle}>@{profile.username}</Text>

        {!isOwnProfile ? (
          <View style={[styles.relationshipPill, profile.isFriend ? styles.friendPill : styles.publicPill]}>
            <Text style={styles.relationshipText}>
              {profile.isFriend ? 'FRIEND PROFILE' : 'PUBLIC PROFILE'}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.savedCount}</Text>
            <Text style={styles.statLabel}>saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.friendsCount}</Text>
            <Text style={styles.statLabel}>friends</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.postsCount}</Text>
            <Text style={styles.statLabel}>posts</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionEyebrow}>BROWSE PROFILE</Text>
        <Text style={styles.sectionTitle}>
          {isOwnProfile ? 'Your profile shortcuts' : `Everything @${profile.username} has shared`}
        </Text>

        <Pressable
          style={({ pressed }) => [styles.navCard, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/profile/user-posts',
              params: {
                userId: String(profile.id),
                username: profile.username,
                from: 'user-profile',
              },
            })
          }>
          <View style={styles.navIconWrap}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={TEAL} />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navTitle}>posts</Text>
            <Text style={styles.navSubtitle}>See every recipe they have posted.</Text>
          </View>
          <Text style={styles.navArrow}>{'>'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.navCard, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/profile/my-friends',
              params: {
                userId: String(profile.id),
                username: profile.username,
                from: 'user-profile',
              },
            })
          }>
          <View style={styles.navIconWrap}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color={TEAL} />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navTitle}>friends</Text>
            <Text style={styles.navSubtitle}>Browse the people in their circle.</Text>
          </View>
          <Text style={styles.navArrow}>{'>'}</Text>
        </Pressable>

        {isOwnProfile ? (
          <Pressable
            style={({ pressed }) => [styles.navCard, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: '/profile/my-saved',
                params: {
                  userId: String(profile.id),
                  username: profile.username,
                  from: 'user-profile',
                },
              })
            }>
            <View style={styles.navIconWrap}>
              <MaterialCommunityIcons name="bookmark-outline" size={20} color={TEAL} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={styles.navTitle}>saved recipes</Text>
              <Text style={styles.navSubtitle}>Look through the recipes you have saved.</Text>
            </View>
            <Text style={styles.navArrow}>{'>'}</Text>
          </Pressable>
        ) : null}

        {!profile.isFriend && !isOwnProfile ? (
          <Text style={styles.noticeText}>
            You can view this full profile and rate their recipes, but saving stays limited to your own and
            friends&apos; recipes.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  container: {
    paddingBottom: 44,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: CREAM,
  },
  errorText: {
    color: RED,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: RED,
  },
  retryButtonText: {
    color: '#FFF8F2',
    fontWeight: '800',
  },
  hero: {
    backgroundColor: DARK,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 24,
  },
  backPillText: {
    color: '#FFF8F2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFF8F2',
    fontSize: 34,
    fontWeight: '900',
  },
  displayName: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 36,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 6,
  },
  handle: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  relationshipPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },
  publicPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  friendPill: {
    backgroundColor: 'rgba(184,213,184,0.16)',
  },
  relationshipText: {
    color: '#FFF8F2',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8F2',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNumber: {
    color: DARK,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(26,18,8,0.48)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionEyebrow: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  sectionTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 30,
    lineHeight: 34,
    marginBottom: 20,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(5,168,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  navTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  navSubtitle: {
    color: 'rgba(26,18,8,0.56)',
    fontSize: 13,
    lineHeight: 18,
  },
  navArrow: {
    color: DARK,
    fontSize: 24,
    fontWeight: '700',
  },
  noticeText: {
    color: 'rgba(26,18,8,0.56)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
