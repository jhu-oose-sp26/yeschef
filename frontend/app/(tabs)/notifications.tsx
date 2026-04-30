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

import {
  getNotifications,
  markAllNotificationsRead,
  type NotificationResponse,
  type NotificationType,
} from '@/lib/api/notifications';
import { getPostByRecipeId } from '@/lib/api/posts';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

type NotificationKind = 'comment' | 'liked' | 'save' | 'friend' | 'rating';

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  actor: string;
  actorId: number;
  actorUsername: string;
  message: string;
  highlight: string;
  timeLabel: string;
  isNew: boolean;
  postId: number | null;
  recipeId: number | null;
};

const META_BY_KIND: Record<
  NotificationKind,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    accent: string;
    tint: string;
    iconColor: string;
  }
> = {
  comment: {
    icon: 'chat-bubble-outline',
    accent: TEAL,
    tint: '#DDF7F7',
    iconColor: TEAL,
  },
  save: {
    icon: 'bookmark-border',
    accent: '#E07A5F',
    tint: '#FFF0E8',
    iconColor: '#E07A5F',
  },
  liked: {
    icon: 'favorite-border',
    accent: '#E07A5F',
    tint: '#FFF0E8',
    iconColor: '#E07A5F',
  },
  friend: {
    icon: 'person-add-alt-1',
    accent: RED,
    tint: '#EEF7EC',
    iconColor: '#6E9B6E',
  },
  rating: {
    icon: 'star-border',
    accent: '#E07A5F',
    tint: '#FFF0E8',
    iconColor: '#E07A5F',
  },
};

function formatTimeLabel(createdAt: string) {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return '';

  const diffMs = Date.now() - createdMs;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString();
}

function mapNotificationType(type: NotificationType): NotificationKind {
  switch (type) {
    case 'COMMENT':
      return 'comment';
    case 'RATING':
      return 'rating';
    case 'FRIEND_REQUEST':
      return 'friend';
    case 'SAVED':
      return 'save';
    case 'LIKED':
      return 'liked';
  }
}

function toNotificationItem(notification: NotificationResponse): NotificationItem {
  const base = {
    id: String(notification.id),
    kind: mapNotificationType(notification.type),
    actor: `@${notification.actorUsername}`,
    actorId: notification.actorId,
    actorUsername: notification.actorUsername,
    timeLabel: formatTimeLabel(notification.createdAt),
    isNew: !notification.isRead,
  };
  const title = notification.referenceTitle ?? '';

  switch (notification.type) {
    case 'COMMENT':
      return { ...base, message: 'commented on your post', highlight: title, postId: notification.referenceId, recipeId: null };
    case 'RATING':
      return { ...base, message: 'rated your recipe', highlight: title, postId: null, recipeId: notification.recipeId };
    case 'FRIEND_REQUEST':
      return { ...base, message: 'added you as a friend', highlight: '', postId: null, recipeId: null };
    case 'SAVED':
      return { ...base, message: 'saved your recipe', highlight: title, postId: null, recipeId: notification.recipeId };
    case 'LIKED':
      return { ...base, message: 'liked your recipe', highlight: title, postId: null, recipeId: notification.recipeId };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!authUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(authUser.id);
      setNotifications(data.map(toNotificationItem));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  const newNotifications = useMemo(
    () => notifications.filter((notification) => notification.isNew),
    [notifications],
  );
  const earlierNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isNew),
    [notifications],
  );

  const markAllRead = async () => {
    if (!authUser || newNotifications.length === 0) return;

    setMarkingRead(true);
    try {
      await markAllNotificationsRead(authUser.id);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isNew: false })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark notifications as read.');
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }}
            >
              <MaterialIcons name="chevron-left" size={18} color="#F5F0E8" />
              <Text style={styles.backButtonText}>BACK</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.markReadButton,
                (pressed || markingRead || newNotifications.length === 0) && styles.pressed,
              ]}
              onPress={() => void markAllRead()}
              disabled={markingRead || newNotifications.length === 0}
            >
              {markingRead ? (
                <ActivityIndicator size="small" color={RED} />
              ) : (
                <Text style={styles.markReadText}>MARK ALL READ</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.eyebrow}>ACTIVITY</Text>
          <Text style={styles.title}>notifications</Text>
        </View>

        <View style={styles.sheet}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={TEAL} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadNotifications()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No notifications yet. Real activity will show up here.</Text>
            </View>
          ) : (
            <>
              {newNotifications.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>NEW</Text>
                  <View style={styles.list}>
                    {newNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </View>
                </>
              )}

              {earlierNotifications.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, styles.earlierLabel]}>EARLIER</Text>
                  <View style={styles.list}>
                    {earlierNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const meta = META_BY_KIND[notification.kind];
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderLeftColor: meta.accent }, pressed && styles.pressed]}
      onPress={async () => {
        if (notification.kind === 'friend' && notification.actorId != null) {
          router.push({
            pathname: '/(tabs)/profile/user-profile',
            params: { userId: String(notification.actorId), username: notification.actorUsername },
          });
        } else if (notification.postId != null) {
          router.push({ pathname: '/posts/[id]', params: { id: String(notification.postId) } });
        } else if (notification.recipeId != null) {
          const post = await getPostByRecipeId(notification.recipeId);
          if (post != null) {
            router.push({ pathname: '/posts/[id]', params: { id: String(post.id) } });
          }
        }
      }}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.tint }]}>
        <MaterialIcons name={meta.icon} size={22} color={meta.iconColor} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardText}>
          <Text style={styles.actor}>{notification.actor}</Text>
          <Text>{' '}{notification.message}</Text>
        </Text>
        {notification.highlight ? (
          <Text style={styles.highlight}>{notification.highlight}</Text>
        ) : null}
        <Text style={styles.timeLabel}>{notification.timeLabel}</Text>
      </View>

      {notification.isNew ? <View style={[styles.unreadDot, { backgroundColor: meta.accent }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK,
  },
  scroll: {
    flex: 1,
    backgroundColor: TAN,
  },
  container: {
    paddingBottom: 44,
  },
  hero: {
    backgroundColor: DARK,
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#F5F0E8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  markReadButton: {
    minWidth: 108,
    alignItems: 'flex-end',
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  markReadText: {
    color: RED,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eyebrow: {
    color: 'rgba(255,237,226,0.52)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 40,
    lineHeight: 44,
  },
  sheet: {
    backgroundColor: TAN,
    marginTop: -4,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
    minHeight: 640,
  },
  sectionLabel: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.4,
    marginBottom: 14,
  },
  earlierLabel: {
    marginTop: 28,
    color: 'rgba(26,18,8,0.35)',
  },
  list: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CREAM,
    borderRadius: 22,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    paddingRight: 10,
  },
  cardText: {
    color: DARK,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  actor: {
    fontWeight: '900',
  },
  highlight: {
    color: TEAL,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 3,
  },
  timeLabel: {
    color: 'rgba(26,18,8,0.4)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: RED,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: RED,
  },
  retryButtonText: {
    color: '#FFF8F2',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
