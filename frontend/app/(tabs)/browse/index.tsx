import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  addFriend,
  getFriends,
  getUserRecipes,
  getUsers,
  removeFriend,
} from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import type { User } from '@/lib/api/users';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const CREAM = '#FFF8F2';

type TabKey = 'friends' | 'discover';

type UserSummary = User & {
  mutualCount: number;
  recipeCount: number;
};

const AVATAR_COLORS = ['#BC412B', '#05A8AA', '#5A9B5A', '#8E5DB7', '#C96A3D', '#6E93B5', '#8A6D2E'];

function getAvatarColor(username: string) {
  let total = 0;
  for (const char of username) total += char.charCodeAt(0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

export default function FriendsScreen() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserSummary[]>([]);
  const [friendUsernames, setFriendUsernames] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>('friends');

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const [users, currentFriends] = await Promise.all([
        getUsers(),
        getFriends(authUser.id).catch(() => [] as string[]),
      ]);

      const friendSet = new Set(currentFriends);
      const otherUsers = users.filter((user) => user.id !== authUser.id);

      const summaries = await Promise.all(
        otherUsers.map(async (user) => {
          const [recipes, theirFriends] = await Promise.all([
            getUserRecipes(user.id).catch(() => []),
            getFriends(user.id).catch(() => [] as string[]),
          ]);

          const mutualCount = theirFriends.filter((friend) => friendSet.has(friend)).length;
          return {
            ...user,
            recipeCount: recipes.length,
            mutualCount,
          };
        }),
      );

      setProfiles(summaries);
      setFriendUsernames(friendSet);
    } catch {
      setProfiles([]);
      setFriendUsernames(new Set());
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) return profiles;
    return profiles.filter((profile) => profile.username.toLowerCase().includes(normalizedQuery));
  }, [profiles, query]);

  const friendProfiles = useMemo(() => {
    return filteredProfiles
      .filter((profile) => friendUsernames.has(profile.username))
      .sort((left, right) => left.username.localeCompare(right.username));
  }, [filteredProfiles, friendUsernames]);

  const discoverProfiles = useMemo(() => {
    return filteredProfiles
      .filter((profile) => !friendUsernames.has(profile.username))
      .sort((left, right) => {
        if (right.mutualCount !== left.mutualCount) return right.mutualCount - left.mutualCount;
        if (right.recipeCount !== left.recipeCount) return right.recipeCount - left.recipeCount;
        return left.username.localeCompare(right.username);
      });
  }, [filteredProfiles, friendUsernames]);

  const handleToggleFriend = async (targetUser: UserSummary) => {
    if (!authUser) return;
    setPending((current) => new Set(current).add(targetUser.id));
    try {
      if (friendUsernames.has(targetUser.username)) {
        await removeFriend(authUser.id, targetUser.id);
      } else {
        await addFriend(authUser.id, targetUser.id);
      }
      await load();
    } catch {
      // ignore friend toggle failures in the UI
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  if (!authUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Log in to browse friends.</Text>
      </View>
    );
  }

  const currentList = activeTab === 'friends' ? friendProfiles : discoverProfiles;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.backPill}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.navigate('/(tabs)');
          }}
        >
          <Text style={styles.backPillText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>my friends</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.36)" />
          <TextInput
            placeholder="search friends..."
            placeholderTextColor="rgba(26,18,8,0.34)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.tabRow}>
          <Pressable style={styles.tabButton} onPress={() => setActiveTab('friends')}>
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>FRIENDS</Text>
            <View style={[styles.tabUnderline, activeTab === 'friends' && styles.tabUnderlineActive]} />
          </Pressable>
          <Pressable style={styles.tabButton} onPress={() => setActiveTab('discover')}>
            <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>DISCOVER</Text>
            <View style={[styles.tabUnderline, activeTab === 'discover' && styles.tabUnderlineActive]} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
            <Text style={styles.sectionLabel}>
              {activeTab === 'friends' ? `${friendProfiles.length} FRIENDS` : 'SUGGESTED FOR YOU'}
            </Text>

            {currentList.length === 0 ? (
              <Text style={styles.emptyText}>
                {activeTab === 'friends' ? 'No friends match that search yet.' : 'No users to discover right now.'}
              </Text>
            ) : (
              currentList.map((profile) => {
                const isFriend = friendUsernames.has(profile.username);
                const isWorking = pending.has(profile.id);
                return (
                  <Pressable
                    key={profile.id}
                    style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
                    onPress={() =>
                      router.push({
                        pathname: '/profile/user-profile',
                        params: {
                          userId: String(profile.id),
                          username: profile.username,
                          from: 'find-friends',
                        },
                      })
                    }
                  >
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(profile.username) }]}>
                      <Text style={styles.avatarText}>{profile.username[0]?.toUpperCase() ?? '?'}</Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{profile.username}</Text>
                      <Text style={styles.userHandle}>@{profile.username}</Text>
                      <Text style={styles.userMeta}>
                        {activeTab === 'friends'
                          ? `${profile.recipeCount} recipes`
                          : `${profile.mutualCount} mutual friend${profile.mutualCount === 1 ? '' : 's'}`}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleToggleFriend(profile);
                      }}
                      disabled={isWorking}
                      style={({ pressed }) => [
                        styles.actionButton,
                        isFriend ? styles.friendButton : styles.addButton,
                        (isWorking || pressed) && styles.actionButtonPressed,
                      ]}
                    >
                      {isWorking ? (
                        <ActivityIndicator size="small" color={DARK} />
                      ) : (
                        <Text style={styles.actionButtonText}>{isFriend ? 'FRIENDS' : '+ ADD'}</Text>
                      )}
                    </Pressable>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK,
  },
  header: {
    backgroundColor: DARK,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: {
    color: '#FFF8F2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 42,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: DARK,
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,18,8,0.08)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(26,18,8,0.34)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  tabTextActive: {
    color: TEAL,
  },
  tabUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: TEAL,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingBottom: 48,
    gap: 12,
  },
  sectionLabel: {
    color: '#5C9F89',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF8F2',
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    color: DARK,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  userHandle: {
    color: 'rgba(26,18,8,0.48)',
    fontSize: 12,
    marginBottom: 2,
  },
  userMeta: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    minWidth: 94,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendButton: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(26,18,8,0.14)',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(26,18,8,0.14)',
  },
  actionButtonText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.86,
  },
});
