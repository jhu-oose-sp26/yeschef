import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Profile screen: "As a reflective user, I want to see my own profile so I can keep track
 * of my stats and my own digital cookbook."
 *
 * Stats and cookbook will be wired to User / hasSaved APIs once those are available
 * (Julia's in-progress work). For now we show the structure with placeholders.
 */
export default function ProfileScreen() {
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText
          type="title"
          style={[styles.profileTitle, { fontFamily: Fonts.rounded }]}>
          My Profile
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your stats and digital cookbook
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          My stats
        </ThemedText>
        <View style={styles.statsRow}>
          <StatCard label="Recipes tried" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
          <StatCard label="Recipes saved" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Recipes created" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
          <StatCard label="Avg. rating" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
        </View>
        <ThemedText style={styles.placeholderNote}>
          Stats will appear here once you're signed in and user APIs are connected.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          My digital cookbook
        </ThemedText>
        <View style={[styles.cookbookPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.cookbookIconWrap, { backgroundColor: accent + '18' }]}>
            <IconSymbol name="book.closed.fill" size={40} color={accent} />
          </View>
          <ThemedText style={styles.cookbookMessage}>
            Your saved and created recipes will appear here when you're signed in
            and the save feature is connected.
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  cardBg,
  cardBorder,
  accent,
}: {
  label: string;
  value: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <ThemedText type="defaultSemiBold" style={[styles.statValue, { color: accent }]}>
        {value}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  profileTitle: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  statValue: {
    fontSize: 26,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.8,
  },
  placeholderNote: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  cookbookPlaceholder: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  cookbookIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cookbookMessage: {
    textAlign: 'center',
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
