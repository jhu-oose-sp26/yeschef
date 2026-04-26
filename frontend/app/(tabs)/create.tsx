import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createPost, uploadPostImage } from '@/lib/api/posts';
import { useAuth } from '@/lib/auth/AuthContext';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

interface IngredientDraft {
  ingredient: string;
  quantity: string;
}

interface StepDraft {
  stepDescription: string;
}

const emptyIngredient = (): IngredientDraft => ({ ingredient: '', quantity: '' });
const emptyStep = (): StepDraft => ({ stepDescription: '' });

export default function CreateScreen() {
  const { user, isLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !!user &&
    title.trim().length > 0 &&
    ingredients.some((item) => item.ingredient.trim().length > 0) &&
    steps.some((item) => item.stepDescription.trim().length > 0) &&
    !submitting;

  const updateIngredient = (index: number, key: keyof IngredientDraft, value: string) => {
    setIngredients((curr) =>
      curr.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const updateStep = (index: number, value: string) => {
    setSteps((curr) =>
      curr.map((item, i) => (i === index ? { ...item, stepDescription: value } : item)),
    );
  };

  const removeIngredient = (index: number) => {
    setIngredients((curr) =>
      curr.length === 1 ? [emptyIngredient()] : curr.filter((_, i) => i !== index),
    );
  };

  const removeStep = (index: number) => {
    setSteps((curr) =>
      curr.length === 1 ? [emptyStep()] : curr.filter((_, i) => i !== index),
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Log in to create and share a recipe.');
      return;
    }

    const cleanedIngredients = ingredients
      .map((item) => ({ ingredient: item.ingredient.trim(), quantity: item.quantity.trim() }))
      .filter((item) => item.ingredient.length > 0);

    const cleanedSteps = steps
      .map((item) => item.stepDescription.trim())
      .filter((s) => s.length > 0)
      .map((stepDescription, index) => ({ stepNumber: index + 1, stepDescription }));

    if (cleanedIngredients.length === 0 || cleanedSteps.length === 0 || title.trim().length === 0) {
      setError('Add a title, at least one ingredient, and at least one step.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadPostImage(imageUri);
      }

      const post = await createPost({
        image: imageUrl,
        recipe: {
          title: title.trim(),
          sourceType: 'USER',
          userId: user.id,
          prepTime: Number(prepTime) || 0,
          cookTime: Number(cookTime) || 0,
          ingredients: cleanedIngredients,
          steps: cleanedSteps,
        },
      });

      setTitle('');
      setPrepTime('');
      setCookTime('');
      setIngredients([emptyIngredient()]);
      setSteps([emptyStep()]);
      setImageUri(null);
      router.replace({ pathname: '/recipes/[id]', params: { id: String(post.recipe.id), from: 'create' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create post.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="title" style={{ textAlign: 'center' }}>Create a Recipe</ThemedText>
        <ThemedText style={styles.authMessage}>
          Log in so we can attach your recipe to your profile and share it with friends.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* ── Teal Hero ── */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Create Recipe</Text>
        <Text style={styles.heroSub}>
          Share a recipe your friends can browse, save, and rate.
        </Text>
      </View>

      {/* ── Form ── */}
      <View style={styles.form}>

        {/* BASICS card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>BASICS</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe title"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, { color: '#333' }]}
          />
          <View style={styles.row}>
            <TextInput
              value={prepTime}
              onChangeText={setPrepTime}
              placeholder="Prep (min)"
              placeholderTextColor="#A0A0A0"
              keyboardType="number-pad"
              style={[styles.input, styles.halfInput, { color: '#333' }]}
            />
            <TextInput
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="Cook (min)"
              placeholderTextColor="#A0A0A0"
              keyboardType="number-pad"
              style={[styles.input, styles.halfInput, { color: '#333' }]}
            />
          </View>
        </View>

        {/* PHOTO card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>PHOTO</Text>
          {imageUri ? (
            <View style={{ gap: 10 }}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
              <Pressable onPress={() => setImageUri(null)} style={styles.addBtn}>
                <Text style={styles.addBtnText}>Remove Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add Photo</Text>
            </Pressable>
          )}
        </View>

        {/* INGREDIENTS card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>INGREDIENTS</Text>
            <Pressable
              onPress={() => setIngredients((curr) => [...curr, emptyIngredient()])}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Add Ingredient</Text>
            </Pressable>
          </View>

          {ingredients.map((item, index) => (
            <View key={`ing-${index}`} style={styles.ingredientBlock}>
              <View style={styles.inlineHeader}>
                <Text style={styles.fieldLabel}>Ingredient {index + 1}</Text>
                {ingredients.length > 1 && (
                  <Pressable onPress={() => removeIngredient(index)}>
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.row}>
                <TextInput
                  value={item.quantity}
                  onChangeText={(v) => updateIngredient(index, 'quantity', v)}
                  placeholder="1 tbsp"
                  placeholderTextColor="#A0A0A0"
                  style={[styles.input, styles.quantityInput, { color: item.quantity.length > 0 ? TEAL : '#333' }]}
                />
                <TextInput
                  value={item.ingredient}
                  onChangeText={(v) => updateIngredient(index, 'ingredient', v)}
                  placeholder="Olive oil"
                  placeholderTextColor="#A0A0A0"
                  style={[styles.input, styles.ingredientInput, { color: '#333' }]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* INSTRUCTIONS card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>INSTRUCTIONS</Text>
            <Pressable
              onPress={() => setSteps((curr) => [...curr, emptyStep()])}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Add Step</Text>
            </Pressable>
          </View>

          {steps.map((item, index) => (
            <View key={`step-${index}`} style={styles.stepBlock}>
              <View style={styles.inlineHeader}>
                <Text style={styles.fieldLabel}>STEP {index + 1}:</Text>
                {steps.length > 1 && (
                  <Pressable onPress={() => removeStep(index)}>
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                value={item.stepDescription}
                onChangeText={(v) => updateStep(index, v)}
                placeholder="Describe this step..."
                placeholderTextColor="#A0A0A0"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textArea, { color: '#333' }]}
              />
            </View>
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* POST RECIPE button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.postBtn,
            { opacity: !canSubmit ? 0.45 : pressed ? 0.85 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>POST RECIPE!</Text>
          )}
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  authMessage: { marginTop: 10, textAlign: 'center', opacity: 0.8, maxWidth: 300, lineHeight: 22 },

  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 48 },

  // ── Hero ──
  hero: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
  },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 6 },
  heroSub: { color: '#fff', fontSize: 14, opacity: 0.9, lineHeight: 20 },

  // ── Form wrapper ──
  form: { padding: 20, gap: 16 },

  // ── Cards ──
  card: {
    backgroundColor: GREEN,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E2A1E',
    letterSpacing: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Inputs ──
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  quantityInput: { width: 100 },
  ingredientInput: { flex: 1 },
  textArea: { minHeight: 100 },

  // ── Ingredient / Step blocks ──
  ingredientBlock: { gap: 6 },
  stepBlock: { gap: 6 },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#1E2A1E', opacity: 0.7, letterSpacing: 0.3 },
  removeText: { fontSize: 14, color: RED, fontWeight: '700' },

  // ── Buttons ──
  addBtn: {
    backgroundColor: RED,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  postBtn: {
    backgroundColor: RED,
    borderRadius: 14,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 },

  imagePreview: { width: '100%', height: 200, borderRadius: 10 },
  errorText: { color: RED, fontSize: 14, textAlign: 'center' },
});
