import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

type NotificationKind = 'comment' | 'save' | 'friend' | 'rating';

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  actor: string;
  message: string;
  highlight: string;
  timeLabel: string;
  isNew: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    kind: 'comment',
    actor: '@mike_eats',
    message: 'commented on your post',
    highlight: '"made this last night!"',
    timeLabel: '2m ago',
    isNew: true,
  },
  {
    id: '2',
    kind: 'save',
    actor: '@sarah_m',
    message: 'saved your recipe',
    highlight: 'Crispy parmesan chicken',
    timeLabel: '14m ago',
    isNew: true,
  },
  {
    id: '3',
    kind: 'friend',
    actor: '@dessert_queen',
    message: 'added you as a friend',
    highlight: '',
    timeLabel: '1h ago',
    isNew: true,
  },
  {
    id: '4',
    kind: 'comment',
    actor: '@laylacooks',
    message: 'commented',
    highlight: '"what parmesan do you use?"',
    timeLabel: '3h ago',
    isNew: false,
  },
  {
    id: '5',
    kind: 'rating',
    actor: '@ryangrills',
    message: 'rated your recipe',
    highlight: '4 stars for ease',
    timeLabel: '5h ago',
    isNew: false,
  },
  {
    id: '6',
    kind: 'save',
    actor: '@mike_eats',
    message: 'saved your recipe',
    highlight: 'Brown butter pasta',
    timeLabel: 'yesterday',
    isNew: false,
  },
];

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

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const newNotifications = useMemo(
    () => notifications.filter((notification) => notification.isNew),
    [notifications],
  );
  const earlierNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isNew),
    [notifications],
  );

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isNew: false })),
    );
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
              style={({ pressed }) => [styles.markReadButton, pressed && styles.pressed]}
              onPress={markAllRead}
            >
              <Text style={styles.markReadText}>MARK ALL READ</Text>
            </Pressable>
          </View>

          <Text style={styles.eyebrow}>ACTIVITY</Text>
          <Text style={styles.title}>notifications</Text>
        </View>

        <View style={styles.sheet}>
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
        </View>
      </ScrollView>
    </View>
  );
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const meta = META_BY_KIND[notification.kind];

  return (
    <Pressable style={({ pressed }) => [styles.card, { borderLeftColor: meta.accent }, pressed && styles.pressed]}>
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
  pressed: {
    opacity: 0.82,
  },
});
