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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { getUserRecipes } from '@/lib/api/users';
import type { Recipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const TEAL = '#05A8AA';
const RED = '#BC412B';
const CREAM = '#F8F1E5';

function getPossessiveKitchenLabel(username?: string | null) {
  if (!username) return 'MY KITCHEN';
  const base = username.toUpperCase();
  return base.endsWith('S') ? `${base}' KITCHEN` : `${base}'S KITCHEN`;
}

function buildExcerpt(recipe: Recipe) {
  const firstStep = recipe.instruction?.steps?.[0]?.stepDescription?.trim();
  if (firstStep) return firstStep;
  if (recipe.ingredients?.length) {
    return `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? '' : 's'} ready to cook.`;
  }
  return 'Tap to open the full recipe details.';
}

export default function MyPostsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: authUser } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserRecipes(Number(userId));
      setRecipes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const username = authUser?.username ?? 'my';
  const heroLabel = useMemo(() => getPossessiveKitchenLabel(username), [username]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/(tabs)/profile');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Pressable style={styles.backPill} onPress={handleBack}>
          <MaterialIcons name="chevron-left" size={18} color={DARK} />
          <Text style={styles.backPillText}>PROFILE</Text>
        </Pressable>

        <Text style={styles.heroEyebrow}>{heroLabel}</Text>
        <Text style={styles.heroTitle}>my posts</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={RED} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>You haven&apos;t posted any recipes yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={styles.sectionLabel}>
              {recipes.length} POST{recipes.length === 1 ? '' : 'S'}
            </Text>

            {recipes.map((recipe) => {
              const prep = recipe.instruction?.prepTime;
              const cook = recipe.instruction?.cookTime;
              return (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({
                      pathname: '/recipes/[id]',
                      params: { id: String(recipe.id), from: 'my-posts', userId },
                    })
                  }>
                  <View style={styles.cardTopAccent} />
                  <View style={styles.cardMain}>
                    <View style={styles.cardTextWrap}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      <Text style={styles.cardHandle}>@{authUser?.username ?? 'you'}</Text>

                      <View style={styles.pillRow}>
                        {prep != null ? (
                          <View style={[styles.timePill, styles.prepPill]}>
                            <Text style={styles.prepPillText}>{prep}m prep</Text>
                          </View>
                        ) : null}
                        {cook != null ? (
                          <View style={[styles.timePill, styles.cookPill]}>
                            <Text style={styles.cookPillText}>{cook}m cook</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.cardExcerpt}>{buildExcerpt(recipe)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>
                      @{authUser?.username ?? 'you'} tap to view full recipe
                    </Text>
                    <View style={styles.arrowCircle}>
                      <MaterialIcons name="chevron-right" size={22} color={CREAM} />
                    </View>
                  </View>
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
    backgroundColor: GREEN,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A4C69D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  backPillText: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroEyebrow: {
    color: 'rgba(26,18,8,0.34)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: DARK,
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardTopAccent: {
    height: 6,
    backgroundColor: GREEN,
  },
  cardMain: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardHandle: {
    color: TEAL,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timePill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  prepPill: {
    backgroundColor: '#FFF0E8',
  },
  prepPillText: {
    color: RED,
    fontSize: 12,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#D8F0EF',
  },
  cookPillText: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '800',
  },
  cardExcerpt: {
    color: 'rgba(26,18,8,0.82)',
    fontSize: 15,
    lineHeight: 24,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,18,8,0.08)',
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    flex: 1,
    color: 'rgba(26,18,8,0.5)',
    fontSize: 14,
    lineHeight: 18,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    marginBottom: 14,
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
  pressed: {
    opacity: 0.84,
  },
});
