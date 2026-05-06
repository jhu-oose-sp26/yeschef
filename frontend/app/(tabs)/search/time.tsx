import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getRecipes } from '@/lib/api/recipes';
import type { Recipe } from '@/lib/api/types';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

const MIN_TIME = 5;
const MAX_TIME = 120;
const STEP = 5;
const QUICK_PICKS = [15, 30, 45, 60];

function clampTime(value: number) {
  return Math.max(MIN_TIME, Math.min(MAX_TIME, value));
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${minutes} min`;
}

export default function SearchTimeScreen() {
  const router = useRouter();
  const { maxTime: maxTimeParam } = useLocalSearchParams<{ maxTime?: string }>();
  const initialTime = clampTime(Number(maxTimeParam) || 30);

  const [maxTime, setMaxTime] = useState(initialTime);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  useEffect(() => {
    setMaxTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = useMemo(() => {
    return [...recipes]
      .filter((recipe) => (recipe.instruction?.cookTime ?? Number.MAX_SAFE_INTEGER) <= maxTime)
      .sort((left, right) => (left.instruction?.cookTime ?? 0) - (right.instruction?.cookTime ?? 0));
  }, [maxTime, recipes]);

  const fillWidth =
    trackWidth > 0
      ? ((maxTime - MIN_TIME) / (MAX_TIME - MIN_TIME)) * trackWidth
      : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const tw = trackWidthRef.current;
        const locationX = evt.nativeEvent.locationX;
        if (tw <= 0 || !isFinite(locationX)) return;
        const fraction = Math.max(0, Math.min(1, locationX / tw));
        const snapped = Math.round((MIN_TIME + fraction * (MAX_TIME - MIN_TIME)) / STEP) * STEP;
        setMaxTime(clampTime(snapped));
      },
      onPanResponderMove: (evt) => {
        const tw = trackWidthRef.current;
        const locationX = evt.nativeEvent.locationX;
        if (tw <= 0 || !isFinite(locationX)) return;
        const fraction = Math.max(0, Math.min(1, locationX / tw));
        const snapped = Math.round((MIN_TIME + fraction * (MAX_TIME - MIN_TIME)) / STEP) * STEP;
        setMaxTime(clampTime(snapped));
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} style={styles.backPill}>
          <Text style={styles.backPillText}>{'< SEARCH'}</Text>
        </Pressable>
        <Text style={styles.headerEyebrow}>SEARCH BY</Text>
        <Text style={styles.headerTitle}>cook time</Text>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        <View style={styles.sliderCard}>
          <Text style={styles.sliderPrompt}>HOW LONG DO YOU HAVE?</Text>
          <Text style={styles.sliderLabel}>MAX COOK TIME</Text>
          <Text style={styles.sliderValue}>{formatTime(maxTime)}</Text>

          <View
            onLayout={(event) => {
              const w = event.nativeEvent.layout.width;
              trackWidthRef.current = w;
              setTrackWidth(w);
            }}
            style={[styles.trackPressable, { cursor: 'pointer' } as any]}
            {...panResponder.panHandlers}
          >
            <View style={styles.trackBase} />
            <View style={[styles.trackFill, { width: fillWidth }]} />
            <View style={[styles.trackThumb, { left: Math.max(0, fillWidth - 11) }]} />
          </View>

          <View style={styles.trackLabels}>
            <Text style={styles.trackLabelText}>5 min</Text>
            <Text style={styles.trackLabelText}>2 hrs</Text>
          </View>

          <Text style={styles.quickPickLabel}>QUICK PICKS</Text>
          <View style={styles.quickPickRow}>
            {QUICK_PICKS.map((minutes) => {
              const selected = maxTime === minutes;
              return (
                <Pressable
                  key={minutes}
                  style={[styles.quickPickChip, selected && styles.quickPickChipActive]}
                  onPress={() => setMaxTime(minutes)}
                >
                  <Text style={[styles.quickPickText, selected && styles.quickPickTextActive]}>
                    {formatTime(minutes)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.resultsEyebrow}>RESULTS - UNDER {formatTime(maxTime).toUpperCase()}</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={RED} />
          </View>
        ) : (
          <View style={styles.list}>
            {filteredRecipes.length === 0 ? (
              <Text style={styles.emptyText}>No recipes fit this cook time yet.</Text>
            ) : (
              filteredRecipes.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({
                      pathname: '/recipes/[id]',
                      params: {
                        id: String(recipe.id),
                        from: 'search-time',
                        maxTime: String(maxTime),
                      },
                    })
                  }
                >
                  <View style={styles.cardAccent} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {recipe.ingredients?.length ?? 0} ingredients
                      {recipe.creatorUsername ? ` - @${recipe.creatorUsername}` : ''}
                    </Text>
                    <View style={styles.cardPills}>
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
                  </View>
                  <View style={styles.cardArrow}>
                    <IconSymbol name="chevron.right" size={16} color="#FFF8F2" />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RED,
  },
  header: {
    backgroundColor: RED,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backPillText: {
    color: '#FFF8F2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerEyebrow: {
    color: 'rgba(255,248,242,0.62)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 42,
    lineHeight: 42,
  },
  sheet: {
    flex: 1,
    backgroundColor: CREAM,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    marginBottom: 18,
  },
  sliderPrompt: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sliderLabel: {
    color: 'rgba(26,18,8,0.48)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  sliderValue: {
    color: RED,
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 14,
  },
  trackPressable: {
    height: 28,
    justifyContent: 'center',
    marginBottom: 8,
  },
  trackBase: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(26,18,8,0.12)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: RED,
  },
  trackThumb: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: RED,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackLabelText: {
    color: 'rgba(26,18,8,0.44)',
    fontSize: 11,
    fontWeight: '700',
  },
  quickPickLabel: {
    color: 'rgba(26,18,8,0.48)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  quickPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickPickChip: {
    borderRadius: 999,
    backgroundColor: CREAM,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickPickChipActive: {
    backgroundColor: '#F7E2DA',
    borderWidth: 1.5,
    borderColor: RED,
  },
  quickPickText: {
    color: DARK,
    fontSize: 12,
    fontWeight: '800',
  },
  quickPickTextActive: {
    color: RED,
  },
  resultsEyebrow: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  list: {
    gap: 12,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
  },
  cardAccent: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: GREEN,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMeta: {
    color: 'rgba(26,18,8,0.52)',
    fontSize: 12,
    marginBottom: 8,
  },
  cardPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prepPill: {
    backgroundColor: '#F7E2DA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  prepPillText: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
  },
  cookPill: {
    backgroundColor: '#E3F3E3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cookPillText: {
    color: '#4D8B4D',
    fontSize: 11,
    fontWeight: '800',
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
