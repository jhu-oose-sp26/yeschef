import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getFriends, getUsers, removeFriend } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import type { User } from '@/lib/api/users';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const RED = '#BC412B';
const CREAM = '#F8F1E5';

const AVATAR_COLORS = ['#BC412B', '#05A8AA', '#5A9B5A', '#8E5DB7', '#C96A3D', '#6E93B5', '#8A6D2E'];

function getAvatarColor(username: string) {
  let total = 0;
  for (const char of username) total += char.charCodeAt(0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function getCircleLabel(username?: string | null, isOwnProfile?: boolean) {
  if (isOwnProfile) return 'MY CIRCLE';
  if (!username) return 'CIRCLE';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' CIRCLE` : `${base}'S CIRCLE`;
}

function getFriendsTitle(isOwnProfile: boolean, username?: string) {
  if (isOwnProfile) return 'my friends';
  return username ? `${username}'s friends` : 'friends';
}

export default function MyFriendsScreen() {
  const router = useRouter();
  const { userId, username, from } = useLocalSearchParams<{
    userId: string;
    username?: string;
    from?: string;
  }>();
  const { user: authUser } = useAuth();

  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [friendUsernames, allUsers] = await Promise.all([
        getFriends(Number(userId)),
        getUsers(),
      ]);
      const usernameSet = new Set(friendUsernames);
      setFriends(allUsers.filter((user) => usernameSet.has(user.username)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (target: User) => {
    if (!authUser) return;
    setPending((current) => new Set(current).add(target.id));
    try {
      await removeFriend(authUser.id, target.id);
      setFriends((prev) => prev.filter((friend) => friend.id !== target.id));
    } catch {
      // silently ignore
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(target.id);
        return next;
      });
    }
  };

  const isOwnProfile = Boolean(authUser && String(authUser.id) === userId);

  const heroEyebrow = useMemo(
    () => getCircleLabel(username ?? authUser?.username, isOwnProfile),
    [authUser?.username, isOwnProfile, username],
  );

  const heroTitle = useMemo(
    () => getFriendsTitle(isOwnProfile, username),
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

  const backLabel = from === 'find-friends' ? 'FRIENDS' : 'PROFILE';

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Pressable style={styles.backPill} onPress={handleBack}>
          <MaterialIcons name="chevron-left" size={18} color={CREAM} />
          <Text style={styles.backPillText}>{backLabel}</Text>
        </Pressable>

        <Text style={styles.heroEyebrow}>{heroEyebrow}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {isOwnProfile
                ? 'No friends yet — go find your people.'
                : `@${username ?? 'user'} has no friends yet.`}
            </Text>
            {isOwnProfile ? (
              <Pressable style={styles.findBtn} onPress={() => router.navigate('/browse')}>
                <Text style={styles.findBtnText}>Find Friends</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={styles.sectionLabel}>
              {friends.length} FRIEND{friends.length === 1 ? '' : 'S'}
            </Text>

            {friends.map((friend, index) => {
              const isWorking = pending.has(friend.id);
              const isMe = authUser?.id === friend.id;
              return (
                <Pressable
                  key={friend.id}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() => {
                    if (isMe) {
                      router.navigate('/(tabs)/profile');
                      return;
                    }
                    router.push({
                      pathname: '/profile/user-profile',
                      params: {
                        userId: String(friend.id),
                        username: friend.username,
                        from: 'my-friends',
                      },
                    });
                  }}>
                  <View style={styles.rankWrap}>
                    <Text style={styles.rankText}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>

                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: getAvatarColor(friend.username) },
                    ]}>
                    <Text style={styles.avatarText}>
                      {friend.username[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {friend.username}
                    </Text>
                    <Text style={styles.cardHandle}>@{friend.username}</Text>
                  </View>

                  {isOwnProfile && !isMe ? (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleRemove(friend);
                      }}
                      disabled={isWorking}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.statusPill,
                        (isWorking || pressed) && styles.statusPillPressed,
                      ]}>
                      {isWorking ? (
                        <ActivityIndicator size="small" color={TEAL} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={14}
                            color={TEAL}
                            style={styles.statusIcon}
                          />
                          <Text style={styles.statusPillText}>FRIENDS</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.statusPill}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={14}
                        color={TEAL}
                        style={styles.statusIcon}
                      />
                      <Text style={styles.statusPillText}>FRIENDS</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  hero: {
    backgroundColor: TEAL,
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
    color: CREAM,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroEyebrow: {
    color: 'rgba(255,248,242,0.78)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: CREAM,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    backgroundColor: CREAM,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  sectionLabel: {
    color: RED,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rankText: {
    color: '#E0D6C9',
    fontSize: 18,
    fontWeight: '900',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: CREAM,
    fontSize: 18,
    fontWeight: '900',
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 18,
    lineHeight: 22,
  },
  cardHandle: {
    color: 'rgba(26,18,8,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9F3F2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 30,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusPillText: {
    color: TEAL,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  statusPillPressed: {
    opacity: 0.65,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: RED,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '700',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: RED,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  findBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  findBtnText: {
    color: '#FFF8F2',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.84,
  },
});
