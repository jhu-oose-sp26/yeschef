import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { getRecipe, deleteRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPostByRecipeId, deletePost } from '@/lib/api/posts';
import { addRecentId } from '@/lib/recentRecipes';
import {
  getRatingsForRecipe,
  getUserRatingForRecipe,
  createRating,
  updateRating,
} from '@/lib/api/ratings';
import type { RatingResponse } from '@/lib/api/ratings';
import { getFriends, getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const TEAL = '#05A8AA';
const CREAM = '#FFF8F2';

function RatingDots({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: i <= filled ? RED : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </View>
  );
}

export default function RecipeDetailScreen() {
  const {
    id,
    from,
    userId: fromUserId,
    filterType,
    filterValue,
    filterLabel,
    maxTime,
    query,
    username,
  } = useLocalSearchParams<{
    id: string;
    from?: string;
    userId?: string;
    filterType?: string;
    filterValue?: string;
    filterLabel?: string;
    maxTime?: string;
    query?: string;
    username?: string;
  }>();
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
  const [saveCount, setSaveCount] = useState(0);
  const [canSaveRecipe, setCanSaveRecipe] = useState(true);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      setSaveCount(Array.isArray(data.saves) ? data.saves.length : 0);
      if (post?.image) setRecipeImage(post.image);
      addRecentId(numId);

      if (authUser) {
        setCurrentUserId(authUser.id);
        const [existing, savedList, friendUsernames] = await Promise.all([
          getUserRatingForRecipe(authUser.id, numId),
          getSavedRecipes(authUser.id).catch(() => []),
          getFriends(authUser.id).catch(() => [] as string[]),
        ]);
        if (existing) {
          setMyRating(existing);
          setTasteDraft(existing.tasteQuality);
          setEaseDraft(existing.easeOfExecution);
        }
        setIsSaved(savedList.some((s) => s.recipeId === numId));

        const recipeOwner = data.creatorUsername?.trim();
        const isOwnRecipe = recipeOwner != null && recipeOwner === authUser.username;
        const isFriendRecipe = recipeOwner != null && friendUsernames.includes(recipeOwner);
        const isPublicApiRecipe = data.source?.sourceType !== 'USER';
        setCanSaveRecipe(isPublicApiRecipe || !recipeOwner || isOwnRecipe || isFriendRecipe);
      } else {
        setCanSaveRecipe(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id, numId, authUser]);

  useFocusEffect(useCallback(() => { loadRecipe(); }, [loadRecipe]));

  const handleBack = () => {
    if (from === 'home') router.navigate('/(tabs)');
    else if (from === 'create') router.navigate('/');
    else if (from === 'filter-results') {
      router.navigate({
        pathname: '/search/filter-results',
        params: {
          type: filterType ?? '',
          value: filterValue ?? '',
          label: filterLabel ?? '',
        },
      });
    }
    else if (from === 'browse') router.navigate('/browse');
    else if (from === 'search-results') {
      router.navigate({
        pathname: '/search/results',
        params: { query: query ?? '' },
      });
    }
    else if (from === 'search-time') {
      router.navigate({
        pathname: '/search/time',
        params: { maxTime: maxTime ?? '' },
      });
    }
    else if (from === 'notifications') router.navigate('/notifications');
    else if (from === 'search') router.navigate('/search');
    else if (from === 'profile') router.navigate('/(tabs)/profile');
    else if (from === 'my-posts') router.navigate({ pathname: '/(tabs)/profile/my-posts', params: { userId: fromUserId ?? '' } });
    else if (from === 'my-saved') router.navigate({ pathname: '/(tabs)/profile/my-saved', params: { userId: fromUserId ?? '', username: username ?? '' } });
    else if (from === 'user-posts') router.navigate({ pathname: '/(tabs)/profile/user-posts', params: { userId: fromUserId ?? '', username: username ?? '' } });
    else router.back();
  };

  const handleToggleSave = async () => {
    if (!currentUserId || !canSaveRecipe) return;
    setSavingToggle(true);
    try {
      if (isSaved) {
        await unsaveRecipe(currentUserId, numId);
        setIsSaved(false);
        setSaveCount((c) => Math.max(0, c - 1));
      } else {
        await saveRecipe(currentUserId, numId);
        setIsSaved(true);
        setSaveCount((c) => c + 1);
      }
    } catch {
      // silently ignore
    } finally {
      setSavingToggle(false);
    }
  };

  const isOwner =
    recipe !== null &&
    recipe.source?.sourceType === 'USER' &&
    recipe.creatorUsername === authUser?.username;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Must delete the associated post first to avoid FK constraint violation
      const post = await getPostByRecipeId(numId).catch(() => null);
      if (post) await deletePost(post.id);
      await deleteRecipe(numId);
      handleBack();
    } catch (e) {
      setDeleting(false);
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete recipe.');
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
        <ActivityIndicator size="large" color={RED} />
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
  const overallAvg =
    avgTaste != null && avgEase != null ? (avgTaste + avgEase) / 2 : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Dark Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'< BACK'}</Text>
          </Pressable>
          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.ownerBtn}
                onPress={() => router.navigate({
                  pathname: '/(tabs)/recipes/edit',
                  params: { id: String(numId) },
                })}
              >
                <IconSymbol name="pencil" size={18} color={GREEN} />
              </Pressable>
              <Pressable style={styles.ownerBtn} onPress={() => { setConfirmDelete(true); setDeleteError(null); }}>
                <IconSymbol name="trash" size={18} color={RED} />
              </Pressable>
            </View>
          )}
        </View>

        {confirmDelete && (
          <View style={styles.deleteConfirmBanner}>
            <Text style={styles.deleteConfirmText}>Delete this recipe? This cannot be undone.</Text>
            {deleteError && <Text style={styles.deleteErrorText}>{deleteError}</Text>}
            <View style={styles.deleteConfirmBtns}>
              <Pressable style={styles.deleteCancelBtn} onPress={() => { setConfirmDelete(false); setDeleteError(null); }}>
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteConfirmBtn, { opacity: deleting ? 0.6 : 1 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.deleteConfirmBtnText}>Delete</Text>}
              </Pressable>
            </View>
          </View>
        )}

        {/* Rating display */}
        {overallAvg != null && (
          <View style={styles.heroRatingRow}>
            <Text style={styles.heroRatingNum}>{overallAvg.toFixed(1)}</Text>
            <Text style={styles.heroRatingDenom}> /5</Text>
            <View style={{ marginLeft: 12 }}>
              <RatingDots value={overallAvg} size={14} />
            </View>
          </View>
        )}

        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>

            {recipe.source?.sourceType === 'USER' && recipe.creatorUsername ? (
              <Text style={styles.byUsername}>@{recipe.creatorUsername}</Text>
            ) : recipe.source?.sourceType === 'API' ? (
              <Text style={styles.byUsername}>via API</Text>
            ) : null}

            <View style={styles.timePillRow}>
              {recipe.instruction?.prepTime != null && (
                <View style={styles.prepPill}>
                  <Text style={styles.prepPillText}>{recipe.instruction.prepTime}m prep</Text>
                </View>
              )}
              {recipe.instruction?.cookTime != null && (
                <View style={styles.cookPill}>
                  <Text style={styles.cookPillText}>{recipe.instruction.cookTime}m cook</Text>
                </View>
              )}
            </View>

            {currentUserId != null && canSaveRecipe && (
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

            {currentUserId != null && !canSaveRecipe && recipe.source?.sourceType === 'USER' && (
              <Text style={styles.saveRuleText}>
                You can rate this recipe, but saving is limited to your own and friends&apos; recipes.
              </Text>
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

      {/* ── Stats Bar ── */}
      <View style={styles.statsBar}>
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{avgTaste != null ? avgTaste.toFixed(1) : '—'}</Text>
          <Text style={styles.statLabel}>TASTE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{avgEase != null ? avgEase.toFixed(1) : '—'}</Text>
          <Text style={styles.statLabel}>EASE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{saveCount}</Text>
          <Text style={styles.statLabel}>SAVES</Text>
        </View>
      </View>

      {/* ── Content Section ── */}
      <View style={styles.contentSection}>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <>
            <Text style={styles.contentHeader}>INGREDIENTS</Text>
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
            <Text style={[styles.contentHeader, { marginTop: 32 }]}>METHOD</Text>
            {recipe.instruction.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNumber}>
                  {String(step.stepNumber).padStart(2, '0')}
                </Text>
                <View style={styles.stepDividerLine} />
                <Text style={styles.stepText}>{step.stepDescription}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* ── Rate This Dish ── */}
      {currentUserId != null && (
        <View style={styles.rateCard}>
          <Text style={styles.rateCardHeader}>RATE THIS DISH</Text>

          <View style={styles.draftRow}>
            <Text style={styles.draftLabel}>TASTE</Text>
            <StarRating value={tasteDraft} onChange={setTasteDraft} size={26} />
          </View>
          <View style={styles.draftRow}>
            <Text style={styles.draftLabel}>EASE</Text>
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
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#c00' },
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },

  // ── Hero (dark) ──
  hero: {
    backgroundColor: DARK,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 30,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  ownerActions: { flexDirection: 'row', gap: 8 },
  ownerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBanner: {
    backgroundColor: 'rgba(188,65,43,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(188,65,43,0.4)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  deleteErrorText: {
    color: RED,
    fontSize: 12,
    marginBottom: 8,
  },
  deleteConfirmBtns: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  deleteCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  deleteCancelBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  deleteConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: RED,
    minWidth: 70,
    alignItems: 'center',
  },
  deleteConfirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  heroRatingNum: {
    color: '#5E5447',
    fontSize: 50,
    fontWeight: '800',
    lineHeight: 44,
  },
  heroRatingDenom: {
    color: '#5E5447',
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.55,
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1 },
  heroImage: { width: 110, height: 110, borderRadius: 12 },
  heroTitle: {
    color: TAN,
    fontSize: 45,
    fontFamily: 'Fraunces_700Bold_Italic',
    marginBottom: 6,
    lineHeight: 38,
  },
  byUsername: { color: GREEN, fontSize: 14, fontWeight: '600', marginBottom: 16 },
  timePillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  prepPill: {
    backgroundColor: '#D0F0EE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
  },
  prepPillText: { color: '#05A8AA', fontSize: 13, fontWeight: '700' },
  cookPill: {
    backgroundColor: '#FFEDE2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
  },
  cookPillText: { color: '#BC412B', fontSize: 13, fontWeight: '700' },
  saveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  saveRuleText: {
    color: 'rgba(255,248,242,0.68)',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 240,
  },

  // ── Stats Bar ──
  statsBar: {
    backgroundColor: CREAM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#2C1A0E' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#2C1A0E', opacity: 0.5, marginTop: 2, letterSpacing: 0.8 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(0,0,0,0.1)' },

  // ── Content ──
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  contentHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: RED,
    marginBottom: 16,
    letterSpacing: 1.2,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(44,26,14,0.15)',
    padding: 10,
    width: '30%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientQty: {
    fontSize: 14,
    fontWeight: '800',
    color: TEAL,
    textAlign: 'center',
  },
  ingredientName: {
    fontSize: 12,
    color: '#2C1A0E',
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
    opacity: 0.65,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  stepNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(44,26,14,0.18)',
    width: 36,
    flexShrink: 0,
    lineHeight: 26,
  },
  stepDividerLine: {
    width: 2,
    backgroundColor: GREEN,
    marginTop: 4,
    height: 16,
    borderRadius: 2,
    flexShrink: 0,
  },
  stepText: { flex: 1, fontSize: 15, lineHeight: 23, color: '#2C1A0E' },

  // ── Rate This Dish card ──
  rateCard: {
    backgroundColor: DARK,
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
  },
  rateCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  draftLabel: { fontSize: 13, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  submitRow: { alignItems: 'flex-end', marginTop: 8 },
  submitBtn: {
    backgroundColor: RED,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  submitMsg: { marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});
