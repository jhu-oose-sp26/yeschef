import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getPostByRecipeId } from '@/lib/api/posts';
import { addRecentId } from '@/lib/recentRecipes';
import {
  getRatingsForRecipe,
  getUserRatingForRecipe,
  createRating,
  updateRating,
} from '@/lib/api/ratings';
import type { RatingResponse } from '@/lib/api/ratings';
import { getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

export default function RecipeDetailScreen() {
  const { id, from, userId: fromUserId, filterType, filterValue } = useLocalSearchParams<{ id: string; from?: string; userId?: string; filterType?: string; filterValue?: string }>();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<RatingResponse[]>([]);
  const [myRating, setMyRating] = useState<RatingResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [tasteDraft, setTasteDraft] = useState(0);
  const [easeDraft, setEaseDraft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const numId = Number(id);

  const loadRecipe = useCallback(async () => {
    if (!id || Number.isNaN(numId)) {
      setError('Invalid recipe id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [data, allRatings, post] = await Promise.all([
        getRecipe(numId),
        getRatingsForRecipe(numId).catch(() => [] as RatingResponse[]),
        getPostByRecipeId(numId).catch(() => null),
      ]);
      setRecipe(data);
      setRatings(allRatings);
      if (post?.image) setRecipeImage(post.image);
      addRecentId(numId);

      if (authUser) {
        setCurrentUserId(authUser.id);
        const [existing, savedList] = await Promise.all([
          getUserRatingForRecipe(authUser.id, numId),
          getSavedRecipes(authUser.id).catch(() => []),
        ]);
        if (existing) {
          setMyRating(existing);
          setTasteDraft(existing.tasteQuality);
          setEaseDraft(existing.easeOfExecution);
        }
        setIsSaved(savedList.some((s) => s.recipeId === numId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id, numId, authUser]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleBack = () => {
    if (from === 'create') router.navigate('/');
    else if (from === 'filter-results') router.navigate(`/search/filter-results?type=${filterType ?? ''}&value=${filterValue ?? ''}`);
    else if (from === 'browse') router.navigate('/browse');
    else if (from === 'search') router.navigate('/search');
    else if (from === 'profile') router.navigate('/(tabs)/profile');
    else if (from === 'my-posts') router.navigate({ pathname: '/(tabs)/profile/my-posts', params: { userId: fromUserId ?? '' } });
    else if (from === 'my-saved') router.navigate({ pathname: '/(tabs)/profile/my-saved', params: { userId: fromUserId ?? '' } });
    else router.back();
  };

  const handleToggleSave = async () => {
    if (!currentUserId) return;
    setSavingToggle(true);
    try {
      if (isSaved) {
        await unsaveRecipe(currentUserId, numId);
        setIsSaved(false);
      } else {
        await saveRecipe(currentUserId, numId);
        setIsSaved(true);
      }
    } catch (e) {
      // silently ignore
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!currentUserId || tasteDraft === 0 || easeDraft === 0) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const body = {
        recipeId: numId,
        userId: currentUserId,
        tasteQuality: tasteDraft,
        easeOfExecution: easeDraft,
      };
      let saved: RatingResponse;
      if (myRating) {
        saved = await updateRating(myRating.id, body);
      } else {
        saved = await createRating(body);
      }
      setMyRating(saved);
      setSubmitMsg(myRating ? 'Rating updated!' : 'Rating submitted!');
      const refreshed = await getRatingsForRecipe(numId).catch(() => ratings);
      setRatings(refreshed);
    } catch (e) {
      setSubmitMsg(e instanceof Error ? e.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
        <ThemedText style={{ marginTop: 12 }}>Loading recipe…</ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.errorText}>
          {error ?? 'Recipe not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  const avgTaste =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.tasteQuality, 0) / ratings.length
      : null;
  const avgEase =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.easeOfExecution, 0) / ratings.length
      : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Teal Hero ── */}
      <View style={styles.hero}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>

            {recipe.source?.sourceType === 'USER' && recipe.creatorUsername ? (
              <Text style={styles.byUsername}>by @{recipe.creatorUsername}</Text>
            ) : recipe.source?.sourceType === 'API' ? (
              <Text style={styles.byUsername}>via API</Text>
            ) : null}

            <View style={styles.timePillRow}>
              {recipe.instruction?.prepTime != null && (
                <View style={styles.timePill}>
                  <Text style={styles.timePillText}>prep {recipe.instruction.prepTime} min</Text>
                </View>
              )}
              {recipe.instruction?.cookTime != null && (
                <View style={styles.timePill}>
                  <Text style={styles.timePillText}>cook {recipe.instruction.cookTime} min</Text>
                </View>
              )}
            </View>

            {currentUserId != null && (
              <Pressable
                onPress={handleToggleSave}
                disabled={savingToggle}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                {savingToggle ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isSaved ? '✓ Saved' : '+ Save recipe'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {recipeImage && (
            <Image
              source={{ uri: recipeImage }}
              style={styles.heroImage}
              contentFit="cover"
            />
          )}
        </View>
      </View>

      {/* ── Green Ratings Section ── */}
      <View style={styles.ratingsSection}>
        <Text style={styles.ratingsHeader}>RATINGS</Text>

        {ratings.length === 0 ? (
          <Text style={styles.emptyNote}>No ratings yet — be the first to rate!</Text>
        ) : (
          <View style={styles.ratingsSummaryRow}>
            <View style={styles.ratingCol}>
              <Text style={styles.ratingColLabel}>taste</Text>
              <View style={styles.ratingStarRow}>
                <StarRating value={avgTaste ?? 0} size={20} />
                <Text style={styles.ratingNum}>{avgTaste!.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.ratingCol}>
              <Text style={styles.ratingColLabel}>ease of making</Text>
              <View style={styles.ratingStarRow}>
                <StarRating value={avgEase ?? 0} size={20} />
                <Text style={styles.ratingNum}>{avgEase!.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        )}

        {currentUserId != null && (
          <>
            <View style={styles.ratingsDivider} />
            <Text style={styles.updateRatingHeader}>UPDATE RATING</Text>

            <View style={styles.draftRow}>
              <Text style={styles.draftLabel}>taste</Text>
              <StarRating value={tasteDraft} onChange={setTasteDraft} size={26} />
            </View>
            <View style={styles.draftRow}>
              <Text style={styles.draftLabel}>ease of making</Text>
              <StarRating value={easeDraft} onChange={setEaseDraft} size={26} />
            </View>

            <View style={styles.submitRow}>
              <Pressable
                onPress={handleSubmitRating}
                disabled={submitting || tasteDraft === 0 || easeDraft === 0}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { opacity: (submitting || tasteDraft === 0 || easeDraft === 0) ? 0.45 : pressed ? 0.8 : 1 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </Pressable>
            </View>

            {submitMsg && <Text style={styles.submitMsg}>{submitMsg}</Text>}
          </>
        )}
      </View>

      {/* ── Tan Content Section ── */}
      <View style={styles.contentSection}>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <>
            <Text style={styles.contentHeader}>Ingredients</Text>
            <View style={styles.ingredientGrid}>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientBox}>
                  {ing.quantity ? (
                    <Text style={styles.ingredientQty}>{ing.quantity}</Text>
                  ) : null}
                  <Text style={styles.ingredientName}>{ing.ingredient}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {recipe.instruction?.steps && recipe.instruction.steps.length > 0 && (
          <>
            <Text style={[styles.contentHeader, { marginTop: 28 }]}>STEPS:</Text>
            {recipe.instruction.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.stepNumber}</Text>
                </View>
                <Text style={styles.stepText}>{step.stepDescription}</Text>
              </View>
            ))}
          </>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#c00' },
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },

  // ── Hero (teal) ──
  hero: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 30,
  },
  backBtn: { marginBottom: 20 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1 },
  heroImage: { width: 120, height: 120, borderRadius: 12 },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 38,
  },
  byUsername: { color: '#fff', fontSize: 15, opacity: 0.9, marginBottom: 18 },
  timePillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  timePill: {
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
  },
  timePillText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  saveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── Ratings (green card) ──
  ratingsSection: {
    backgroundColor: GREEN,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingsHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E2A1E',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  ratingsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingCol: { gap: 4 },
  ratingColLabel: { fontSize: 13, color: '#1E2A1E', opacity: 0.75, fontWeight: '500' },
  ratingStarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#1E2A1E' },
  emptyNote: { fontSize: 14, color: '#1E2A1E', opacity: 0.65, fontStyle: 'italic' },
  ratingsDivider: {
    height: 1.5,
    backgroundColor: '#1E2A1E',
    opacity: 0.15,
    marginVertical: 18,
  },
  updateRatingHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E2A1E',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  draftLabel: { fontSize: 14, color: '#1E2A1E', fontWeight: '600' },
  submitRow: { alignItems: 'flex-end', marginTop: 6 },
  submitBtn: {
    backgroundColor: RED,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  submitMsg: { marginTop: 10, fontSize: 13, color: '#1E2A1E', textAlign: 'center', opacity: 0.8 },

  // ── Content (tan background, no card) ──
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  contentHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1A0E',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2C1A0E',
    padding: 10,
    width: '30%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientQty: {
    fontSize: 13,
    fontWeight: '800',
    color: TEAL,
    textAlign: 'center',
  },
  ingredientName: {
    fontSize: 13,
    color: '#2C1A0E',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 23, color: '#2C1A0E' },
});
