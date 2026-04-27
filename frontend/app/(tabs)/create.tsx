import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { createPost, uploadPostImage } from '@/lib/api/posts';
import { searchRecipesByName } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const TEAL = '#05A8AA';
const CREAM = '#FFF8F2';

type Screen = 'choice' | 'post-existing' | 'new-recipe';

type IngredientDraft = { ingredient: string; quantity: string };
type StepDraft = { stepDescription: string };

export default function CreateScreen() {
  const { user, token } = useAuth();
  const [screen, setScreen] = useState<Screen>('choice');

  // ── Option 1: Post about existing recipe ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shared (notes + photo for both options) ──
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Option 2: New recipe ──
  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ ingredient: '', quantity: '' }]);
  const [steps, setSteps] = useState<StepDraft[]>([{ stepDescription: '' }]);

  const resetAll = () => {
    setSearchQuery(''); setSearchResults([]); setSelectedRecipe(null);
    setNotes(''); setImageUri(null); setSubmitError(null);
    setTitle(''); setPrepTime(''); setCookTime('');
    setIngredients([{ ingredient: '', quantity: '' }]);
    setSteps([{ stepDescription: '' }]);
  };

  const goBack = () => { resetAll(); setScreen('choice'); };

  // ── Recipe search (debounced) ──
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedRecipe(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchRecipesByName(q);
      setSearchResults(results.slice(0, 5));
      setSearching(false);
    }, 400);
  }, []);

  // ── Photo picker ──
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // ── Submit: post about existing recipe ──
  const handlePostExisting = async () => {
    if (!user || !selectedRecipe) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let imageUrl: string | undefined;
      if (imageUri) imageUrl = await uploadPostImage(imageUri);
      const post = await createPost({
        image: imageUrl,
        notes: notes.trim() || undefined,
        recipe: {
          title: selectedRecipe.title,
          sourceType: 'USER',
          userId: user.id,
          prepTime: selectedRecipe.instruction?.prepTime ?? 0,
          cookTime: selectedRecipe.instruction?.cookTime ?? 0,
          ingredients: selectedRecipe.ingredients?.map((i) => ({
            ingredient: i.ingredient,
            quantity: i.quantity ?? '',
          })) ?? [],
          steps: selectedRecipe.instruction?.steps?.map((s) => ({
            stepNumber: s.stepNumber,
            stepDescription: s.stepDescription,
          })) ?? [],
        },
      });
      resetAll();
      setScreen('choice');
      router.replace({ pathname: '/posts/[id]', params: { id: String(post.id) } });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not create post.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit: create new recipe ──
  const handlePostNew = async () => {
    if (!user) return;
    const cleanIngredients = ingredients
      .map((i) => ({ ingredient: i.ingredient.trim(), quantity: i.quantity.trim() }))
      .filter((i) => i.ingredient.length > 0);
    const cleanSteps = steps
      .map((s) => s.stepDescription.trim()).filter(Boolean)
      .map((desc, idx) => ({ stepNumber: idx + 1, stepDescription: desc }));
    if (!title.trim() || cleanIngredients.length === 0 || cleanSteps.length === 0) {
      setSubmitError('Add a title, at least one ingredient, and at least one step.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      let imageUrl: string | undefined;
      if (imageUri) imageUrl = await uploadPostImage(imageUri);
      const post = await createPost({
        image: imageUrl,
        notes: notes.trim() || undefined,
        recipe: {
          title: title.trim(),
          sourceType: 'USER',
          userId: user.id,
          prepTime: Number(prepTime) || 0,
          cookTime: Number(cookTime) || 0,
          ingredients: cleanIngredients,
          steps: cleanSteps,
        },
      });
      resetAll();
      setScreen('choice');
      router.replace({ pathname: '/posts/[id]', params: { id: String(post.id) } });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not create post.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Screens ──

  if (screen === 'choice') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>create{'\n'}a post</Text>
          <Text style={styles.heroSub}>what are you sharing today?</Text>
        </View>
        <View style={styles.choiceBody}>
          <Pressable
            style={({ pressed }) => [styles.choiceCard, styles.choiceCardDark, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => setScreen('post-existing')}
          >
            <View style={styles.choiceIcon}>
              <IconSymbol name="bookmark.fill" size={26} color="#fff" />
            </View>
            <Text style={styles.choiceCardTitleDark}>post about a recipe</Text>
            <Text style={styles.choiceCardDescDark}>
              Link an existing recipe and share your notes, photos, and experience making it.
            </Text>
            <View style={styles.choiceGetStarted}>
              <Text style={styles.choiceGetStartedText}>GET STARTED →</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.choiceCard, styles.choiceCardLight, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => setScreen('new-recipe')}
          >
            <View style={[styles.choiceIcon, { backgroundColor: GREEN }]}>
              <IconSymbol name="plus" size={26} color={DARK} />
            </View>
            <Text style={styles.choiceCardTitleLight}>create a new recipe</Text>
            <Text style={styles.choiceCardDescLight}>
              Write out a brand new recipe from scratch with ingredients, steps, notes, and photos.
            </Text>
            <View style={[styles.choiceGetStarted]}>
              <Text style={[styles.choiceGetStartedText, { color: RED }]}>GET STARTED →</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Option 1: Post about existing recipe ──
  if (screen === 'post-existing') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'< BACK'}</Text>
          </Pressable>
          <Text style={styles.heroTitle}>post about{'\n'}a recipe</Text>
          <Text style={styles.heroSub}>link a recipe & share your take</Text>
        </View>

        <View style={styles.formBody}>

          {/* Link a recipe */}
          <Text style={styles.sectionLabel}>LINK A RECIPE</Text>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.4)" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search for a recipe..."
              placeholderTextColor="rgba(26,18,8,0.4)"
            />
            {searching && <ActivityIndicator size="small" color={TEAL} />}
          </View>

          {/* Search results */}
          {searchResults.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.resultRow, selectedRecipe?.id === r.id && styles.resultRowSelected]}
              onPress={() => { setSelectedRecipe(r); setSearchResults([]); setSearchQuery(r.title); }}
            >
              {selectedRecipe?.id === r.id && (
                <IconSymbol name="bookmark.fill" size={16} color={TEAL} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{r.title}</Text>
                {r.creatorUsername ? (
                  <Text style={styles.resultSub}>by @{r.creatorUsername} · linked ✓</Text>
                ) : null}
              </View>
              <IconSymbol name="chevron.right" size={14} color="rgba(26,18,8,0.3)" />
            </Pressable>
          ))}

          {selectedRecipe && searchResults.length === 0 && (
            <View style={styles.resultRowSelected}>
              <IconSymbol name="bookmark.fill" size={16} color={TEAL} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{selectedRecipe.title}</Text>
                {selectedRecipe.creatorUsername ? (
                  <Text style={styles.resultSub}>by @{selectedRecipe.creatorUsername} · linked ✓</Text>
                ) : null}
              </View>
              <Pressable onPress={() => { setSelectedRecipe(null); setSearchQuery(''); }}>
                <IconSymbol name="xmark" size={14} color={RED} />
              </Pressable>
            </View>
          )}

          {/* Notes */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>YOUR NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go? Any tips or tweaks you made..."
            placeholderTextColor="rgba(26,18,8,0.35)"
            multiline
            textAlignVertical="top"
          />

          {/* Photos */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PHOTOS</Text>
          <Pressable style={styles.photoUpload} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <>
                <IconSymbol name="square.grid.2x2" size={28} color="rgba(26,18,8,0.3)" />
                <Text style={styles.photoUploadText}>upload photos</Text>
                <Text style={styles.photoUploadSub}>jpg, png · up to 5 photos</Text>
              </>
            )}
          </Pressable>
          {imageUri && (
            <Pressable onPress={() => setImageUri(null)} style={styles.removePhotoBtn}>
              <Text style={styles.removePhotoBtnText}>Remove photo</Text>
            </Pressable>
          )}

          {submitError && <Text style={styles.errorText}>{submitError}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.postBtn,
              { opacity: (!selectedRecipe || submitting) ? 0.45 : pressed ? 0.85 : 1 },
            ]}
            onPress={handlePostExisting}
            disabled={!selectedRecipe || submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : (
                <View style={styles.postBtnInner}>
                  <Text style={styles.postBtnText}>POST IT</Text>
                  <View style={styles.postBtnArrow}>
                    <IconSymbol name="chevron.right" size={18} color="#fff" />
                  </View>
                </View>
              )}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Option 2: Create new recipe ──
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.heroTitle}>create a{'\n'}new recipe</Text>
        <Text style={styles.heroSub}>write it out from scratch</Text>
      </View>

      <View style={styles.formBody}>

        {/* BASICS */}
        <Text style={styles.sectionLabel}>BASICS</Text>
        <TextInput
          style={styles.fieldInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
          placeholderTextColor="rgba(26,18,8,0.35)"
        />
        <View style={styles.timeRow}>
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="Prep (min)"
            placeholderTextColor="rgba(26,18,8,0.35)"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="Cook (min)"
            placeholderTextColor="rgba(26,18,8,0.35)"
            keyboardType="numeric"
          />
        </View>

        {/* INGREDIENTS */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>INGREDIENTS</Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientRow}>
            <TextInput
              style={[styles.fieldInput, { width: 80 }]}
              value={ing.quantity}
              onChangeText={(v) => setIngredients((prev) => prev.map((x, idx) => idx === i ? { ...x, quantity: v } : x))}
              placeholder="Qty"
              placeholderTextColor="rgba(26,18,8,0.35)"
            />
            <TextInput
              style={[styles.fieldInput, { flex: 1 }]}
              value={ing.ingredient}
              onChangeText={(v) => setIngredients((prev) => prev.map((x, idx) => idx === i ? { ...x, ingredient: v } : x))}
              placeholder="Ingredient"
              placeholderTextColor="rgba(26,18,8,0.35)"
            />
            {ingredients.length > 1 && (
              <Pressable onPress={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}>
                <IconSymbol name="xmark" size={14} color={RED} />
              </Pressable>
            )}
          </View>
        ))}
        <Pressable
          style={styles.addRowBtn}
          onPress={() => setIngredients((prev) => [...prev, { ingredient: '', quantity: '' }])}
        >
          <Text style={styles.addRowBtnText}>+ add ingredient</Text>
        </Pressable>

        {/* STEPS */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>STEPS</Text>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepBlock}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
              {steps.length > 1 && (
                <Pressable onPress={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}>
                  <IconSymbol name="xmark" size={13} color={RED} />
                </Pressable>
              )}
            </View>
            <TextInput
              style={styles.stepInput}
              value={step.stepDescription}
              onChangeText={(v) => setSteps((prev) => prev.map((x, idx) => idx === i ? { stepDescription: v } : x))}
              placeholder="Describe this step..."
              placeholderTextColor="rgba(26,18,8,0.35)"
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}
        <Pressable
          style={styles.addRowBtn}
          onPress={() => setSteps((prev) => [...prev, { stepDescription: '' }])}
        >
          <Text style={styles.addRowBtnText}>+ add step</Text>
        </Pressable>

        {/* YOUR NOTES */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>YOUR NOTES</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any tips, substitutions, or how it went..."
          placeholderTextColor="rgba(26,18,8,0.35)"
          multiline
          textAlignVertical="top"
        />

        {/* PHOTOS */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PHOTOS</Text>
        <Pressable style={styles.photoUpload} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <>
              <IconSymbol name="square.grid.2x2" size={28} color="rgba(26,18,8,0.3)" />
              <Text style={styles.photoUploadText}>upload photos</Text>
              <Text style={styles.photoUploadSub}>jpg, png · up to 5 photos</Text>
            </>
          )}
        </Pressable>
        {imageUri && (
          <Pressable onPress={() => setImageUri(null)} style={styles.removePhotoBtn}>
            <Text style={styles.removePhotoBtnText}>Remove photo</Text>
          </Pressable>
        )}

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.postBtn,
            { opacity: submitting ? 0.45 : pressed ? 0.85 : 1 },
          ]}
          onPress={handlePostNew}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <View style={styles.postBtnInner}>
                <Text style={styles.postBtnText}>POST RECIPE</Text>
                <View style={styles.postBtnArrow}>
                  <IconSymbol name="chevron.right" size={18} color="#fff" />
                </View>
              </View>
            )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 60 },

  // Hero
  hero: { backgroundColor: DARK, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 28 },
  backBtn: { marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: {
    color: '#fff', fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 38, lineHeight: 44, marginBottom: 8,
  },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '500' },

  // Choice screen
  choiceBody: { padding: 20, gap: 16 },
  choiceCard: { borderRadius: 18, padding: 22 },
  choiceCardDark: { backgroundColor: DARK },
  choiceCardLight: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)' },
  choiceIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  choiceCardTitleDark: {
    fontFamily: 'Fraunces_700Bold_Italic', fontSize: 22, color: '#fff', marginBottom: 8,
  },
  choiceCardTitleLight: {
    fontFamily: 'Fraunces_700Bold_Italic', fontSize: 22, color: DARK, marginBottom: 8,
  },
  choiceCardDescDark: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  choiceCardDescLight: { color: 'rgba(26,18,8,0.55)', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  choiceGetStarted: {},
  choiceGetStartedText: { color: TEAL, fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },

  // Shared form
  formBody: { padding: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: RED, letterSpacing: 1.4, marginBottom: 10 },
  fieldInput: {
    backgroundColor: CREAM, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: DARK,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)',
    marginBottom: 10,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  notesInput: {
    backgroundColor: CREAM, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: DARK, minHeight: 100,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)',
  },

  // Recipe search
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CREAM, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)',
    gap: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: DARK },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CREAM, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)', marginBottom: 8,
  },
  resultRowSelected: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F7F7', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: TEAL, marginBottom: 8,
  },
  resultTitle: { fontSize: 15, fontWeight: '700', color: DARK },
  resultSub: { fontSize: 12, color: TEAL, marginTop: 2, fontWeight: '600' },

  // Ingredients
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  // Steps
  stepBlock: { marginBottom: 12 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stepNum: { fontSize: 18, fontWeight: '800', color: 'rgba(26,18,8,0.2)' },
  stepInput: {
    backgroundColor: CREAM, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: DARK, minHeight: 80,
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.08)',
  },

  // Add row button
  addRowBtn: {
    borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 4,
  },
  addRowBtnText: { color: TEAL, fontSize: 13, fontWeight: '700' },

  // Photo upload
  photoUpload: {
    borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.15)', borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 32,
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
    backgroundColor: CREAM,
  },
  photoPreview: { width: '100%', height: 200, borderRadius: 12 },
  photoUploadText: { fontSize: 14, fontWeight: '700', color: 'rgba(26,18,8,0.5)' },
  photoUploadSub: { fontSize: 12, color: 'rgba(26,18,8,0.35)' },
  removePhotoBtn: { alignItems: 'center', marginBottom: 10 },
  removePhotoBtnText: { color: RED, fontSize: 13, fontWeight: '600' },

  // Submit
  postBtn: {
    backgroundColor: CREAM, borderRadius: 14,
    minHeight: 56, alignItems: 'center', justifyContent: 'center',
    marginTop: 24, borderWidth: 1.5, borderColor: 'rgba(26,18,8,0.12)',
  },
  postBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postBtnText: { fontSize: 16, fontWeight: '900', color: DARK, letterSpacing: 1.2 },
  postBtnArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
  },
  errorText: { color: RED, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 12 },
});
