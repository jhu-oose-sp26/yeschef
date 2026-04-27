import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getRecipe, getRecipeEntityByIdSafe, updateRecipe } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/recipes';
import { useAuth } from '@/lib/auth/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const TEAL = '#05A8AA';
const CREAM = '#FFF8F2';

type IngredientDraft = { ingredient: string; quantity: string };
type StepDraft = { stepDescription: string };

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const numId = Number(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entityBase, setEntityBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);

  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([]);

  const load = useCallback(async () => {
    let title = '';
    try {
      const recipe = await getRecipe(numId);
      title = recipe.title;
      // Populate form immediately — never blocked by the entity fetch below
      setTitle(recipe.title);
      setPrepTime(String(recipe.instruction?.prepTime ?? ''));
      setCookTime(String(recipe.instruction?.cookTime ?? ''));
      setIngredients(
        (recipe.ingredients ?? []).map((i) => ({
          ingredient: i.ingredient,
          quantity: i.quantity ?? '',
        })),
      );
      setSteps(
        (recipe.instruction?.steps ?? [])
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((s) => ({ stepDescription: s.stepDescription })),
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load recipe.');
      setLoading(false);
      return;
    }
    // Show the form now, then fetch the entity base in the background.
    // getRecipeEntityByIdSafe never throws and never clears the auth token,
    // so this cannot cause the "session expired" bug.
    setLoading(false);
    const entity = await getRecipeEntityByIdSafe(numId, title);
    setEntityBase(entity);
  }, [numId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    // If the background entity fetch hasn't arrived yet, try once more now
    let base = entityBase;
    if (!base) {
      base = await getRecipeEntityByIdSafe(numId, title);
      if (base) setEntityBase(base);
    }
    if (!base) {
      setSaveError('Could not load recipe data. Please go back and try again.');
      return;
    }
    setTitleError(false);
    setSaveError(null);
    setSaving(true);
    try {
      // Build body using raw entity (which has correct source.id and instruction.id)
      // then overlay the user's edits
      const body = {
        ...base,
        title: title.trim(),
        instruction: base.instruction
          ? {
              ...entityBase.instruction,
              prepTime: Number(prepTime) || 0,
              cookTime: Number(cookTime) || 0,
              steps: steps
                .filter((s) => s.stepDescription.trim())
                .map((s, i) => ({ stepNumber: i + 1, stepDescription: s.stepDescription.trim() })),
            }
          : undefined,
        ingredients: ingredients.filter((i) => i.ingredient.trim()).map((i) => ({
          ingredient: i.ingredient.trim(),
          quantity: i.quantity.trim() || null,
        })),
      };
      await updateRecipe(numId, body as Recipe, token);
      router.back();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { ingredient: '', quantity: '' }]);

  const removeIngredient = (i: number) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const updateIngredient = (i: number, field: keyof IngredientDraft, value: string) =>
    setIngredients((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    );

  const addStep = () => setSteps((prev) => [...prev, { stepDescription: '' }]);

  const removeStep = (i: number) =>
    setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const updateStep = (i: number, value: string) =>
    setSteps((prev) =>
      prev.map((item, idx) => (idx === i ? { stepDescription: value } : item)),
    );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={RED} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, { opacity: saving || pressed ? 0.7 : 1 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      {saveError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{saveError}</Text>
        </View>
      )}

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TITLE</Text>
        <TextInput
          style={[styles.input, titleError && styles.inputError]}
          value={title}
          onChangeText={(v) => { setTitle(v); setTitleError(false); }}
          placeholder="Recipe title"
          placeholderTextColor="rgba(26,18,8,0.35)"
        />
        {titleError && <Text style={styles.fieldError}>Title is required.</Text>}
      </View>

      {/* Times */}
      <View style={styles.timeRow}>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionLabel}>PREP TIME (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="rgba(26,18,8,0.35)"
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionLabel}>COOK TIME (min)</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="rgba(26,18,8,0.35)"
          />
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>INGREDIENTS</Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={styles.listRow}>
            <TextInput
              style={[styles.input, styles.qtyInput]}
              value={ing.quantity}
              onChangeText={(v) => updateIngredient(i, 'quantity', v)}
              placeholder="qty"
              placeholderTextColor="rgba(26,18,8,0.35)"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={ing.ingredient}
              onChangeText={(v) => updateIngredient(i, 'ingredient', v)}
              placeholder="ingredient"
              placeholderTextColor="rgba(26,18,8,0.35)"
            />
            <Pressable onPress={() => removeIngredient(i)} style={styles.removeBtn}>
              <IconSymbol name="xmark" size={14} color={RED} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addBtn} onPress={addIngredient}>
          <Text style={styles.addBtnText}>+ Add ingredient</Text>
        </Pressable>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>STEPS</Text>
        {steps.map((step, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={step.stepDescription}
              onChangeText={(v) => updateStep(i, v)}
              placeholder={`Step ${i + 1}`}
              placeholderTextColor="rgba(26,18,8,0.35)"
              multiline
            />
            <Pressable onPress={() => removeStep(i)} style={styles.removeBtn}>
              <IconSymbol name="xmark" size={14} color={RED} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addBtn} onPress={addStep}>
          <Text style={styles.addBtnText}>+ Add step</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TAN, gap: 16, padding: 24 },
  errorText: { color: RED, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorBanner: {
    backgroundColor: 'rgba(188,65,43,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: RED,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: { color: RED, fontSize: 13, fontWeight: '600' },
  inputError: { borderColor: RED },
  fieldError: { color: RED, fontSize: 12, marginTop: 4 },
  scroll: { flex: 1, backgroundColor: TAN },
  container: { paddingBottom: 60 },

  header: {
    backgroundColor: DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
  },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  saveBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: RED,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  input: {
    backgroundColor: CREAM,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    borderWidth: 1.5,
    borderColor: 'rgba(26,18,8,0.1)',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  qtyInput: {
    width: 70,
  },
  stepNum: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(26,18,8,0.2)',
    width: 32,
    textAlign: 'right',
    flexShrink: 0,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(188,65,43,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEAL,
  },
});
