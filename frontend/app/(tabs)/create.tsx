import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { createRecipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';

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
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !!user &&
    title.trim().length > 0 &&
    ingredients.some((item) => item.ingredient.trim().length > 0) &&
    steps.some((item) => item.stepDescription.trim().length > 0) &&
    !submitting;

  const updateIngredient = (index: number, key: keyof IngredientDraft, value: string) => {
    setIngredients((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  };

  const updateStep = (index: number, value: string) => {
    setSteps((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, stepDescription: value } : item,
      ),
    );
  };

  const removeIngredient = (index: number) => {
    setIngredients((current) =>
      current.length === 1
        ? [emptyIngredient()]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const removeStep = (index: number) => {
    setSteps((current) =>
      current.length === 1 ? [emptyStep()] : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Log in to create and share a recipe.');
      return;
    }

    const cleanedIngredients = ingredients
      .map((item) => ({
        ingredient: item.ingredient.trim(),
        quantity: item.quantity.trim(),
      }))
      .filter((item) => item.ingredient.length > 0);

    const cleanedSteps = steps
      .map((item) => item.stepDescription.trim())
      .filter((stepDescription) => stepDescription.length > 0)
      .map((stepDescription, index) => ({
        stepNumber: index + 1,
        stepDescription,
      }));

    if (
      cleanedIngredients.length === 0 ||
      cleanedSteps.length === 0 ||
      title.trim().length === 0
    ) {
      setError('Add a title, at least one ingredient, and at least one instruction step.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const recipe = await createRecipe({
        title: title.trim(),
        sourceType: 'USER',
        userId: user.id,
        prepTime: Number(prepTime) || 0,
        cookTime: Number(cookTime) || 0,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
      });

      setMessage('Recipe posted successfully.');
      setTitle('');
      setPrepTime('');
      setCookTime('');
      setIngredients([emptyIngredient()]);
      setSteps([emptyStep()]);
      router.replace({ pathname: '/recipes/[id]', params: { id: String(recipe.id) } });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Could not create recipe.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={accent} />
        <ThemedText style={styles.helper}>Loading your account…</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="title" style={styles.authTitle}>
          Create a Recipe
        </ThemedText>
        <ThemedText style={styles.authMessage}>
          This page is for posting your own recipe to YesChef. Log in first so we can attach it to
          your profile and show it to friends.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.hero, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="title">Create a Recipe Post</ThemedText>
        <ThemedText style={styles.helper}>
          Share a recipe your friends can browse, save, and rate.
        </ThemedText>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Basics
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
          placeholderTextColor="#8A8A8A"
          style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
        />
        <View style={styles.row}>
          <TextInput
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="Prep (min)"
            placeholderTextColor="#8A8A8A"
            keyboardType="number-pad"
            style={[
              styles.input,
              styles.halfInput,
              { backgroundColor, borderColor: cardBorder, color: textColor },
            ]}
          />
          <TextInput
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="Cook (min)"
            placeholderTextColor="#8A8A8A"
            keyboardType="number-pad"
            style={[
              styles.input,
              styles.halfInput,
              { backgroundColor, borderColor: cardBorder, color: textColor },
            ]}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ingredients
          </ThemedText>
          <Pressable onPress={() => setIngredients((current) => [...current, emptyIngredient()])}>
            <ThemedText style={[styles.addAction, { color: accent }]}>+ Add</ThemedText>
          </Pressable>
        </View>
        {ingredients.map((item, index) => (
          <View key={`ingredient-${index}`} style={styles.stack}>
            <View style={styles.inlineHeader}>
              <ThemedText type="defaultSemiBold">Ingredient {index + 1}</ThemedText>
              <Pressable onPress={() => removeIngredient(index)}>
                <ThemedText style={styles.removeAction}>Remove</ThemedText>
              </Pressable>
            </View>
            <View style={styles.row}>
              <TextInput
                value={item.quantity}
                onChangeText={(value) => updateIngredient(index, 'quantity', value)}
                placeholder="1 tbsp"
                placeholderTextColor="#8A8A8A"
                style={[
                  styles.input,
                  styles.quantityInput,
                  { backgroundColor, borderColor: cardBorder, color: textColor },
                ]}
              />
              <TextInput
                value={item.ingredient}
                onChangeText={(value) => updateIngredient(index, 'ingredient', value)}
                placeholder="Olive oil"
                placeholderTextColor="#8A8A8A"
                style={[
                  styles.input,
                  styles.ingredientInput,
                  { backgroundColor, borderColor: cardBorder, color: textColor },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Instructions
          </ThemedText>
          <Pressable onPress={() => setSteps((current) => [...current, emptyStep()])}>
            <ThemedText style={[styles.addAction, { color: accent }]}>+ Add</ThemedText>
          </Pressable>
        </View>
        {steps.map((item, index) => (
          <View key={`step-${index}`} style={styles.stack}>
            <View style={styles.inlineHeader}>
              <ThemedText type="defaultSemiBold">Step {index + 1}</ThemedText>
              <Pressable onPress={() => removeStep(index)}>
                <ThemedText style={styles.removeAction}>Remove</ThemedText>
              </Pressable>
            </View>
            <TextInput
              value={item.stepDescription}
              onChangeText={(value) => updateStep(index, value)}
              placeholder="Describe what to do in this step"
              placeholderTextColor="#8A8A8A"
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor, borderColor: cardBorder, color: textColor },
              ]}
            />
          </View>
        ))}
      </View>

      {(error || message) && (
        <View style={[styles.feedbackCard, { borderColor: error ? '#C0392B' : cardBorder }]}>
          <ThemedText style={{ color: error ? '#C0392B' : textColor }}>
            {error ?? message}
          </ThemedText>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          {
            backgroundColor: canSubmit ? accent : cardBorder,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.submitButtonText}>Post Recipe</ThemedText>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  stack: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  halfInput: {
    flex: 1,
  },
  quantityInput: {
    width: 110,
  },
  ingredientInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 96,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeAction: {
    fontSize: 13,
    color: '#C0392B',
  },
  helper: {
    marginTop: 8,
    opacity: 0.75,
    lineHeight: 20,
  },
  authTitle: {
    textAlign: 'center',
  },
  authMessage: {
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 320,
    lineHeight: 22,
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
});
