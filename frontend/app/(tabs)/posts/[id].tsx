import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { getPostById } from '@/lib/api/posts';
import type { PostResponse } from '@/lib/api/posts';
import { getCommentsByPost, createComment, deleteComment } from '@/lib/api/comments';
import type { CommentResponse } from '@/lib/api/comments';
import { getRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { getRatingsForRecipe } from '@/lib/api/ratings';
import type { RatingResponse } from '@/lib/api/ratings';
import { getUser } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const TEAL = '#05A8AA';
const CREAM = '#FFF8F2';

const AVATAR_COLORS = [RED, TEAL, '#7B68EE', '#E8A882', '#6DBF6D'];
function avatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser, token } = useAuth();
  const postId = Number(id);

  const [post, setPost] = useState<PostResponse | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ratings, setRatings] = useState<RatingResponse[]>([]);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentUsernames, setCommentUsernames] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(async () => {
    if (!postId || Number.isNaN(postId)) { setError('Invalid post'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const postData = await getPostById(postId);
      if (!postData) { setError('Post not found'); setLoading(false); return; }
      setPost(postData);

      const [recipeData, allRatings, allComments] = await Promise.all([
        getRecipe(postData.recipe.id),
        getRatingsForRecipe(postData.recipe.id).catch(() => [] as RatingResponse[]),
        getCommentsByPost(postId).catch(() => [] as CommentResponse[]),
      ]);
      setRecipe(recipeData);
      setRatings(allRatings);
      setComments(allComments);

      // batch-fetch unique commenters' usernames
      const uniqueIds = [...new Set(allComments.map((c) => c.userId))];
      const users = await Promise.all(uniqueIds.map((uid) => getUser(uid).catch(() => null)));
      const map = new Map<number, string>();
      users.forEach((u) => { if (u) map.set(u.id, u.username); });
      setCommentUsernames(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAddComment = async () => {
    if (!authUser || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const saved = await createComment(
        { postId, userId: authUser.id, text: commentText.trim() },
        token,
      );
      setComments((prev) => [...prev, saved]);
      setCommentUsernames((prev) => new Map(prev).set(authUser.id, authUser.username));
      setCommentText('');
    } catch {
      // silently ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={RED} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Post not found'}</Text>
        <Pressable style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnFallbackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const avgTaste = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.tasteQuality, 0) / ratings.length : null;
  const avgEase = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.easeOfExecution, 0) / ratings.length : null;

  const creatorInitial = (recipe?.creatorUsername ?? post.recipe.title)[0]?.toUpperCase() ?? '?';
  const creatorUsername = recipe?.creatorUsername ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.hero}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< HOME'}</Text>
        </Pressable>

        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={[styles.authorAvatar, { backgroundColor: RED }]}>
            <Text style={styles.authorAvatarText}>{creatorInitial}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{creatorUsername ?? 'unknown'}</Text>
            {creatorUsername ? (
              <Text style={styles.authorHandle}>@{creatorUsername}</Text>
            ) : null}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.postTitle}>{post.recipe.title}</Text>

        {/* Time pills */}
        <View style={styles.pillRow}>
          {post.recipe.prepTime != null && post.recipe.prepTime > 0 && (
            <View style={styles.prepPill}>
              <Text style={styles.prepPillText}>{post.recipe.prepTime}m prep</Text>
            </View>
          )}
          {post.recipe.cookTime != null && post.recipe.cookTime > 0 && (
            <View style={styles.cookPill}>
              <Text style={styles.cookPillText}>{post.recipe.cookTime}m cook</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>

        {/* Photo */}
        {post.image ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PHOTOS</Text>
            <Image source={{ uri: post.image }} style={styles.postImage} contentFit="cover" />
          </View>
        ) : null}

        {/* Notes */}
        {post.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {creatorUsername ? `${creatorUsername.toUpperCase()}'S NOTES` : 'NOTES'}
            </Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{post.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Linked recipe */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LINKED RECIPE</Text>
          <Pressable
            style={({ pressed }) => [styles.linkedRecipeCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.navigate({
              pathname: '/(tabs)/recipes/[id]',
              params: { id: String(post.recipe.id) },
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.linkedRecipeLabel}>VIEW FULL RECIPE</Text>
              <Text style={styles.linkedRecipeTitle}>{post.recipe.title}</Text>
              <View style={styles.pillRow}>
                {post.recipe.prepTime > 0 && (
                  <View style={styles.linkedPrepPill}>
                    <Text style={styles.linkedPrepPillText}>{post.recipe.prepTime}m prep</Text>
                  </View>
                )}
                {post.recipe.cookTime > 0 && (
                  <View style={styles.linkedCookPill}>
                    <Text style={styles.linkedCookPillText}>{post.recipe.cookTime}m cook</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.linkedChevron}>
              <IconSymbol name="chevron.right" size={16} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RATINGS</Text>
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
              <Text style={styles.statNum}>{ratings.length}</Text>
              <Text style={styles.statLabel}>REVIEWS</Text>
            </View>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMMENTS</Text>

          {/* Add comment */}
          {authUser && (
            <View style={styles.addCommentRow}>
              <View style={[styles.commentAvatar, { backgroundColor: RED }]}>
                <Text style={styles.commentAvatarText}>
                  {authUser.username[0].toUpperCase()}
                </Text>
              </View>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="add a comment..."
                placeholderTextColor="rgba(26,18,8,0.35)"
              />
              <Pressable
                style={[styles.commentSubmitBtn, { opacity: commentText.trim() ? 1 : 0.4 }]}
                onPress={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment
                  ? <ActivityIndicator size="small" color={DARK} />
                  : <IconSymbol name="chevron.right" size={14} color={DARK} />}
              </Pressable>
            </View>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <Text style={styles.emptyComments}>No comments yet. Be the first!</Text>
          ) : (
            comments.map((c) => {
              const uname = commentUsernames.get(c.userId) ?? `user${c.userId}`;
              const isOwn = authUser?.id === c.userId;
              return (
                <View key={c.id} style={styles.commentCard}>
                  <View style={[styles.commentAvatar, { backgroundColor: avatarColor(c.userId) }]}>
                    <Text style={styles.commentAvatarText}>{uname[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUsername}>@{uname}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                  {isOwn && (
                    <Pressable
                      onPress={async () => {
                        try {
                          await deleteComment(c.id);
                          setComments((prev) => prev.filter((x) => x.id !== c.id));
                        } catch { /* ignore */ }
                      }}
                    >
                      <IconSymbol name="xmark" size={13} color="rgba(26,18,8,0.35)" />
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TAN, gap: 16, padding: 24 },
  errorText: { color: RED, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  backBtnFallback: { backgroundColor: DARK, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20 },
  backBtnFallbackText: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 60 },

  // Hero
  hero: {
    backgroundColor: DARK, paddingHorizontal: 24,
    paddingTop: 56, paddingBottom: 28,
  },
  backBtn: { marginBottom: 20 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  authorAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  authorName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  authorHandle: { color: GREEN, fontSize: 13, fontWeight: '600', marginTop: 1 },
  postTitle: {
    color: TAN, fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 32, lineHeight: 38, marginBottom: 16,
  },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  prepPill: { backgroundColor: '#D0F0EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  prepPillText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  cookPill: {
    backgroundColor: '#FFEDE2', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(188,65,43,0.25)',
  },
  cookPillText: { color: RED, fontSize: 12, fontWeight: '700' },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 24 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: RED,
    letterSpacing: 1.4, marginBottom: 12,
  },

  // Photo
  postImage: { width: '100%', height: 220, borderRadius: 14 },

  // Notes
  notesCard: {
    backgroundColor: CREAM, borderRadius: 14,
    padding: 16, borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)',
  },
  notesText: { fontSize: 15, color: DARK, lineHeight: 23 },

  // Linked recipe
  linkedRecipeCard: {
    backgroundColor: DARK, borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  linkedRecipeLabel: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.4, marginBottom: 6,
  },
  linkedRecipeTitle: {
    color: TAN, fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 20, marginBottom: 10,
  },
  linkedPrepPill: { backgroundColor: '#D0F0EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  linkedPrepPillText: { color: TEAL, fontSize: 11, fontWeight: '700' },
  linkedCookPill: { backgroundColor: '#FFEDE2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  linkedCookPillText: { color: RED, fontSize: 11, fontWeight: '700' },
  linkedChevron: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Ratings
  statsBar: {
    backgroundColor: CREAM, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingVertical: 18,
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.06)',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800', color: DARK },
  statLabel: {
    fontSize: 11, fontWeight: '700', color: DARK,
    opacity: 0.5, marginTop: 2, letterSpacing: 0.8,
  },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(26,18,8,0.1)' },

  // Comments
  addCommentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  commentAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  commentInput: {
    flex: 1, backgroundColor: CREAM, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: DARK,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.1)',
  },
  commentSubmitBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  emptyComments: { color: DARK, opacity: 0.45, fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  commentCard: {
    backgroundColor: CREAM, borderRadius: 14, padding: 14,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10,
  },
  commentUsername: { fontSize: 13, fontWeight: '700', color: TEAL, marginBottom: 3 },
  commentText: { fontSize: 14, color: DARK, lineHeight: 20 },
});
