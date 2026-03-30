import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getSavedRecipes, getUsers, getUserRecipes } from '@/lib/api/users';
import type { User } from '@/lib/api/users';

/**
 * Profile screen: "As a reflective user, I want to see my own profile so I can keep track
 * of my stats and my own digital cookbook."
 * Wired to User and hasSaved APIs. Without auth we use the first user from the API.
 */
export default function ProfileScreen() {
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const [user, setUser] = useState<User | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getUsers();
      const currentUser = users[0] ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setSavedCount(0);
        setSavedRecipes([]);
        setCreatedRecipes([]);
        return;
      }

      const [saved, created] = await Promise.all([
        getSavedRecipes(currentUser.id),
        getUserRecipes(currentUser.id),
      ]);

      setSavedCount(saved.length);
      setCreatedRecipes(created);

      const recipeIds = saved.map((s) => s.recipeId).filter((id): id is number => id != null);
      const recipes = await Promise.all(recipeIds.map((id) => getRecipe(id)));
      setSavedRecipes(recipes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading profile…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.errorText}>{error}</ThemedText>
        <Pressable style={[styles.retryBtn, { backgroundColor: accent }]} onPress={loadProfile}>
          <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText
          type="title"
          style={[styles.profileTitle, { fontFamily: Fonts.rounded }]}>
          My Profile
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {user ? `@${user.username}` : 'No user yet — create one via the API'}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          My stats
        </ThemedText>
        <View style={styles.statsRow}>
          <StatCard label="Recipes tried" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
          <StatCard label="Recipes saved" value={String(savedCount)} cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Recipes created" value={String(createdRecipes.length)} cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
          <StatCard label="Avg. rating" value="—" cardBg={cardBg} cardBorder={cardBorder} accent={accent} />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          My digital cookbook
        </ThemedText>
        {!user ? (
          <View style={[styles.cookbookPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cookbookIconWrap, { backgroundColor: accent + '18' }]}>
              <IconSymbol name="book.closed.fill" size={40} color={accent} />
            </View>
            <ThemedText style={styles.cookbookMessage}>
              Create a user via the API to see your saved recipes here.
            </ThemedText>
          </View>
        ) : savedRecipes.length === 0 ? (
          <View style={[styles.cookbookPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cookbookIconWrap, { backgroundColor: accent + '18' }]}>
              <IconSymbol name="book.closed.fill" size={40} color={accent} />
            </View>
            <ThemedText style={styles.cookbookMessage}>
              Save recipes from the Recipes tab to add them to your cookbook.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.cookbookList}>
            {savedRecipes.map((recipe) => (
              <Link key={recipe.id} href={{ pathname: '/recipes/[id]', params: { id: String(recipe.id) } }} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.cookbookCard,
                    { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={2}>
                    {recipe.title}
                  </ThemedText>
                  {recipe.instruction && (
                    <ThemedText style={styles.cardMeta}>
                      {recipe.instruction.prepTime + recipe.instruction.cookTime} min
                    </ThemedText>
                  )}
                  <IconSymbol name="chevron.right" size={20} color={cardBorder} style={styles.cardChevron} />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          My recipes
        </ThemedText>
        {createdRecipes.length === 0 ? (
          <View style={[styles.cookbookPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.cookbookIconWrap, { backgroundColor: accent + '18' }]}>
              <IconSymbol name="pencil" size={40} color={accent} />
            </View>
            <ThemedText style={styles.cookbookMessage}>
              You haven't created any recipes yet.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.cookbookList}>
            {createdRecipes.map((recipe) => (
              <Link key={recipe.id} href={{ pathname: '/recipes/[id]', params: { id: String(recipe.id) } }} asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.cookbookCard,
                    { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.9 : 1 },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={2}>
                    {recipe.title}
                  </ThemedText>
                  {recipe.instruction && (
                    <ThemedText style={styles.cardMeta}>
                      {recipe.instruction.prepTime + recipe.instruction.cookTime} min
                    </ThemedText>
                  )}
                  <IconSymbol name="chevron.right" size={20} color={cardBorder} style={styles.cardChevron} />
                </Pressable>
              </Link>
            ))}
          </View>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    color: '#c00',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  cookbookList: {
    gap: 12,
  },
  cookbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
  },
  cardMeta: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardChevron: {
    marginLeft: 'auto',
  },
});
