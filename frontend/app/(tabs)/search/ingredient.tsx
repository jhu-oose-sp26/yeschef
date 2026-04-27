import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const RED = '#BC412B';
const CREAM = '#FFF8F2';
const SOFT_TEAL = '#D8F1F2';

const LETTER_ROWS = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O'],
  ['P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W'],
];

const DATA = [
  'Almond', 'Apple', 'Apricot', 'Artichoke', 'Avocado',
  'Banana', 'Barley', 'Beef', 'Brisket', 'Brown Rice', 'Buckwheat',
  'Cheese', 'Cherries', 'Chia Seed', 'Chicken', 'Chicken Breast',
  'Chicken Leg', 'Chicken Thigh', 'Chicken Wings', 'Chocolate', 'Coconut',
  'Coconut Milk', 'Corn Flour', 'Cornmeal', 'Cornstarch',
  'Duck',
  'Egg',
  'Fish', 'Flax Seeds',
  'Goat', 'Ground Beef', 'Ground Chicken', 'Ground Pork', 'Ground Turkey',
  'Lamb',
  'Mango', 'Mushroom',
  'Nectarine',
  'Oat Flour', 'Oats',
  'Peach', 'Peanut', 'Peanut Butter', 'Pear', 'Pineapple', 'Plum', 'Pork',
  'Pork Belly', 'Pork Rib', 'Prune',
  'Quinoa',
  'Rice',
  'Sausage', 'Shellfish',
  'Turkey',
].sort((a, b) => a.localeCompare(b));

export default function SearchIngredientScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('A');

  const filteredIngredients = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length > 0) {
      return DATA.filter((item) => item.toLowerCase().includes(trimmed));
    }
    return DATA.filter((item) => item.startsWith(selectedLetter));
  }, [query, selectedLetter]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} style={styles.backPill}>
          <Text style={styles.backPillText}>{'< SEARCH'}</Text>
        </Pressable>
        <Text style={styles.headerEyebrow}>SEARCH BY</Text>
        <Text style={styles.headerTitle}>ingredient</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(26,18,8,0.36)" />
          <TextInput
            placeholder="search ingredients..."
            placeholderTextColor="rgba(26,18,8,0.34)"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.letterGrid}>
          {LETTER_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.letterRow}>
              {row.map((letter) => {
                const selected = selectedLetter === letter && query.trim().length === 0;
                return (
                  <Pressable
                    key={letter}
                    style={[styles.letterChip, selected && styles.letterChipSelected]}
                    onPress={() => {
                      setQuery('');
                      setSelectedLetter(letter);
                    }}
                  >
                    <Text style={[styles.letterChipText, selected && styles.letterChipTextSelected]}>
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.resultsLabel}>
          {query.trim().length > 0 ? 'MATCHING INGREDIENTS' : `${selectedLetter} INGREDIENTS`}
        </Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {filteredIngredients.length === 0 ? (
            <Text style={styles.emptyText}>No ingredients match your search.</Text>
          ) : (
            filteredIngredients.map((item) => (
              <Pressable
                key={item}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/search/filter-results',
                    params: {
                      type: 'ingredient',
                      value: item.toLowerCase(),
                      label: item,
                    },
                  })
                }
              >
                <Text style={styles.cardText}>{item}</Text>
                <IconSymbol name="chevron.right" size={18} color={DARK} />
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TEAL,
  },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
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
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.08)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK,
  },
  letterGrid: {
    marginBottom: 18,
  },
  letterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  letterChip: {
    minWidth: 50,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,18,8,0.12)',
  },
  letterChipSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  letterChipText: {
    color: DARK,
    fontSize: 20,
    fontWeight: '800',
  },
  letterChipTextSelected: {
    color: '#FFF8F2',
  },
  resultsLabel: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingBottom: 48,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SOFT_TEAL,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardText: {
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  emptyText: {
    color: 'rgba(26,18,8,0.58)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 18,
  },
  pressed: {
    opacity: 0.82,
  },
});
