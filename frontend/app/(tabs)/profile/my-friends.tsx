import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getFriends, getUsers, removeFriend } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import type { User } from '@/lib/api/users';

const TEAL = '#05A8AA';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function MyFriendsScreen() {
  const router = useRouter();
  const { userId, username } = useLocalSearchParams<{ userId: string; username?: string }>();
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

  const isOwnProfile = authUser && String(authUser.id) === userId;

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
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isOwnProfile ? 'My Friends' : `@${username ?? 'user'}`}</Text>
        <Text style={styles.headerSubtitle}>{isOwnProfile ? 'your circle' : 'friends list'}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {isOwnProfile ? 'No friends yet.' : `@${username ?? 'user'} has no friends yet.`}
          </Text>
          {isOwnProfile ? (
            <Pressable style={styles.findBtn} onPress={() => router.navigate('/browse')}>
              <Text style={styles.findBtnText}>Find Friends</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {friends.map((friend) => (
            <Pressable
              key={friend.id}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() =>
                router.push({
                  pathname: '/profile/user-profile',
                  params: {
                    userId: String(friend.id),
                    username: friend.username,
                    from: 'my-friends',
                  },
                })
              }>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{friend.username[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <Text style={styles.username} numberOfLines={1}>@{friend.username}</Text>
              {isOwnProfile ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    void handleRemove(friend);
                  }}
                  disabled={pending.has(friend.id)}
                  style={({ pressed }) => [styles.removeBtn, { opacity: pending.has(friend.id) || pressed ? 0.6 : 1 }]}>
                  {pending.has(friend.id) ? (
                    <ActivityIndicator size="small" color={RED} />
                  ) : (
                    <Text style={styles.removeBtnText}>Remove</Text>
                  )}
                </Pressable>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TAN },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  errorText: { color: '#c00', textAlign: 'center' },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: RED },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '800' },
  headerSubtitle: { color: '#fff', fontSize: 14, opacity: 0.82, marginTop: 2 },
  emptyText: { fontSize: 15, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' },
  findBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  findBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  username: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E2A1E' },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RED,
  },
  removeBtnText: { color: RED, fontSize: 13, fontWeight: '700' },
});
