import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getUsers, getFriends, addFriend, removeFriend } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import type { User } from '@/lib/api/users';

const TEAL = '#05A8AA';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function FindFriendsScreen() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendUsernames, setFriendUsernames] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const [users, friends] = await Promise.all([
        getUsers(),
        getFriends(authUser.id).catch(() => [] as string[]),
      ]);
      setAllUsers(users.filter((u) => u.id !== authUser.id));
      setFriendUsernames(new Set(friends));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { load(); }, [load]);

  const handleToggleFriend = async (targetUser: User) => {
    if (!authUser) return;
    setPending((p) => new Set(p).add(targetUser.id));
    try {
      if (friendUsernames.has(targetUser.username)) {
        await removeFriend(authUser.id, targetUser.id);
        setFriendUsernames((prev) => { const s = new Set(prev); s.delete(targetUser.username); return s; });
      } else {
        await addFriend(authUser.id, targetUser.id);
        setFriendUsernames((prev) => new Set(prev).add(targetUser.username));
      }
    } catch {
      // silently ignore
    } finally {
      setPending((p) => { const s = new Set(p); s.delete(targetUser.id); return s; });
    }
  };

  const filtered = query.trim()
    ? allUsers.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : allUsers;

  if (!authUser) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Log in to find friends.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Friends</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <Text style={styles.emptyNote}>No users found.</Text>
          ) : (
            filtered.map((u) => {
              const isFriend = friendUsernames.has(u.username);
              const isWorking = pending.has(u.id);
              return (
                <Pressable
                  key={u.id}
                  style={({ pressed }) => [styles.userCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push({ pathname: '/profile/user-posts', params: { userId: String(u.id), username: u.username, from: 'find-friends' } })}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{u.username[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <Text style={styles.username} numberOfLines={1}>@{u.username}</Text>
                  <Pressable
                    onPress={() => handleToggleFriend(u)}
                    disabled={isWorking}
                    style={({ pressed }) => [
                      styles.friendBtn,
                      isFriend ? styles.friendBtnActive : styles.friendBtnInactive,
                      { opacity: isWorking || pressed ? 0.7 : 1 },
                    ]}
                  >
                    {isWorking ? (
                      <ActivityIndicator size="small" color={isFriend ? '#fff' : TEAL} />
                    ) : (
                      <Text style={[styles.friendBtnText, { color: isFriend ? '#fff' : TEAL }]}>
                        {isFriend ? '✓ Friends' : '+ Add'}
                      </Text>
                    )}
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TAN },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // ── Header ──
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  clearBtn: { fontSize: 14, color: '#999', paddingLeft: 8 },

  // ── List ──
  scroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 48 },
  emptyNote: { fontSize: 14, color: '#2C1A0E', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' },

  // ── User card ──
  userCard: {
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

  friendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  friendBtnInactive: { borderColor: TEAL, backgroundColor: 'transparent' },
  friendBtnActive: { borderColor: TEAL, backgroundColor: TEAL },
  friendBtnText: { fontSize: 13, fontWeight: '700' },
});
