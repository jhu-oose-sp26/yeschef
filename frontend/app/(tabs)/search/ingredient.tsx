import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const DATA = [
  'Almond', 'Apple', 'Apricot', 'Avocado',
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
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const [activeLetter, setActiveLetter] = useState('a');

  const grouped = useMemo(
    () =>
      DATA.reduce<Record<string, string[]>>((acc, item) => {
        const letter = item[0].toLowerCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(item);
        return acc;
      }, {}),
    [],
  );

  const activeLetters = new Set(Object.keys(grouped));

  function jumpToLetter(letter: string) {
    const offset = sectionOffsets.current[letter];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
      setActiveLetter(letter);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search by ingredient</Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(grouped)
            .sort()
            .map((letter) => (
              <View
                key={letter}
                onLayout={(event) => {
                  sectionOffsets.current[letter] = event.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.sectionBadge}>{letter}</Text>
                {grouped[letter].map((item) => (
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
                  </Pressable>
                ))}
              </View>
            ))}
        </ScrollView>

        <View style={styles.sidebar}>
          {ALPHABET.map((letter) => {
            const enabled = activeLetters.has(letter);
            const selected = activeLetter === letter;
            return (
              <Pressable
                key={letter}
                onPress={() => enabled && jumpToLetter(letter)}
                hitSlop={4}
                style={[
                  styles.sidebarLetterBtn,
                  selected && enabled && styles.sidebarLetterBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.sidebarLetter,
                    !enabled && styles.sidebarLetterDisabled,
                    selected && enabled && styles.sidebarLetterActive,
                  ]}
                >
                  {letter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TAN,
  },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: '#FFF8F2',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerTitle: {
    color: '#FFF8F2',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    maxWidth: 240,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
  },
  sectionBadge: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: GREEN,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardText: {
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
  },
  sidebar: {
    width: 34,
    paddingTop: 18,
    paddingBottom: 18,
    paddingRight: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarLetterBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLetterBtnActive: {
    backgroundColor: RED,
  },
  sidebarLetter: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
  },
  sidebarLetterDisabled: {
    color: 'rgba(188,65,43,0.28)',
  },
  sidebarLetterActive: {
    color: CREAM,
  },
  pressed: {
    opacity: 0.82,
  },
});
