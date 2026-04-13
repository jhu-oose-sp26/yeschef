import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import {
  getRatingsForRecipe,
  getUserRatingForRecipe,
  createRating,
  updateRating,
} from '@/lib/api/ratings';
import type { RatingResponse } from '@/lib/api/ratings';
import { getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<RatingResponse[]>([]);
  const [myRating, setMyRating] = useState<RatingResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [tasteDraft, setTasteDraft] = useState(0);
  const [easeDraft, setEaseDraft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');
  const accentMuted = useThemeColor({}, 'accentMuted');

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
      const [data, allRatings] = await Promise.all([
        getRecipe(numId),
        getRatingsForRecipe(numId).catch(() => [] as RatingResponse[]),
      ]);
      setRecipe(data);
      setRatings(allRatings);

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
      // silently ignore — state stays unchanged
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
        <ActivityIndicator size="large" color={accent} />
        <ThemedText style={{ marginTop: 12 }}>Loading recipe…</ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.error}>
          {error ?? 'Recipe not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  const totalTime =
    recipe.instruction != null
      ? recipe.instruction.prepTime + recipe.instruction.cookTime
      : null;

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
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="title" style={styles.heroTitle}>{recipe.title}</ThemedText>
        {recipe.source && (
          <ThemedText style={styles.source}>
            {recipe.source.sourceType}
            {recipe.source.api_url ? ` · ${recipe.source.api_url}` : ''}
          </ThemedText>
        )}
        <View style={styles.pillRow}>
          {totalTime != null && (
            <View style={[styles.pill, { backgroundColor: accent + '22' }]}>
              <ThemedText style={[styles.pillText, { color: accent }]}>
                {totalTime} min total
              </ThemedText>
            </View>
          )}
          {avgTaste != null && (
            <View style={[styles.pill, { backgroundColor: '#F5A62322' }]}>
              <ThemedText style={[styles.pillText, { color: '#D4920B' }]}>
                ★ {avgTaste.toFixed(1)} taste
              </ThemedText>
            </View>
          )}
        </View>
        {currentUserId != null && (
          <Pressable
            onPress={handleToggleSave}
            disabled={savingToggle}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: isSaved ? accent : 'transparent',
                borderColor: accent,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {savingToggle ? (
              <ActivityIndicator size="small" color={isSaved ? '#fff' : accent} />
            ) : (
              <ThemedText style={[styles.saveBtnText, { color: isSaved ? '#fff' : accent }]}>
                {isSaved ? '✓ Saved' : '+ Save recipe'}
              </ThemedText>
            )}
          </Pressable>
        )}
      </View>

      {/* Ratings summary */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Ratings</ThemedText>
        {ratings.length === 0 ? (
          <ThemedText style={styles.emptyNote}>
            No ratings yet — be the first to rate this recipe!
          </ThemedText>
        ) : (
          <View style={styles.ratingSummary}>
            <View style={styles.ratingRow}>
              <ThemedText style={styles.ratingLabel}>Taste quality</ThemedText>
              <StarRating value={avgTaste ?? 0} size={20} />
              <ThemedText style={styles.ratingValue}>{avgTaste!.toFixed(1)}</ThemedText>
            </View>
            <View style={styles.ratingRow}>
              <ThemedText style={styles.ratingLabel}>Ease of making</ThemedText>
              <StarRating value={avgEase ?? 0} size={20} />
              <ThemedText style={styles.ratingValue}>{avgEase!.toFixed(1)}</ThemedText>
            </View>
            <ThemedText style={styles.ratingCount}>
              Based on {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Rate this recipe */}
      {currentUserId != null && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {myRating ? 'Update your rating' : 'Rate this recipe'}
          </ThemedText>

          <View style={styles.draftRow}>
            <ThemedText style={styles.draftLabel}>Taste quality</ThemedText>
            <StarRating value={tasteDraft} onChange={setTasteDraft} size={28} />
          </View>
          <View style={styles.draftRow}>
            <ThemedText style={styles.draftLabel}>Ease of making</ThemedText>
            <StarRating value={easeDraft} onChange={setEaseDraft} size={28} />
          </View>

          <Pressable
            onPress={handleSubmitRating}
            disabled={submitting || tasteDraft === 0 || easeDraft === 0}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor:
                  tasteDraft === 0 || easeDraft === 0 ? accentMuted : accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.submitBtnText}>
                {myRating ? 'Update rating' : 'Submit rating'}
              </ThemedText>
            )}
          </Pressable>

          {submitMsg && (
            <ThemedText style={styles.submitMsg}>{submitMsg}</ThemedText>
          )}
        </View>
      )}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={[styles.bullet, { backgroundColor: accent }]} />
              <ThemedText style={styles.ingredient}>
                {ing.quantity ? `${ing.quantity} ` : ''}{ing.ingredient}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      {recipe.instruction && (
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
          <ThemedText style={styles.meta}>
            Prep {recipe.instruction.prepTime} min · Cook {recipe.instruction.cookTime} min
          </ThemedText>
          {recipe.instruction.steps?.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: accent }]}>
                <ThemedText style={styles.stepNumText}>{step.stepNumber}</ThemedText>
              </View>
              <ThemedText style={styles.step}>{step.stepDescription}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
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
  heroTitle: {
    marginBottom: 6,
    paddingRight: 8,
  },
  source: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  sectionTitle: {
    marginBottom: 14,
  },
  meta: {
    marginBottom: 12,
    fontSize: 14,
    opacity: 0.85,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredient: {
    flex: 1,
    fontSize: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  step: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#c00',
  },
  // Ratings summary
  ratingSummary: {
    gap: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingLabel: {
    width: 120,
    fontSize: 14,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
  },
  ratingCount: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.7,
  },
  emptyNote: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  // Rate form
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  draftLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  submitMsg: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.85,
  },
});
