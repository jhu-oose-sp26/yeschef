import { useRef, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

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

  const grouped = useMemo(() => {
    return DATA.reduce<Record<string, string[]>>((acc, item) => {
      const letter = item[0].toLowerCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    }, {});
  }, []);

  const activeLetters = new Set(Object.keys(grouped));

  function jumpToLetter(letter: string) {
    const offset = sectionOffsets.current[letter];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
    }
  }

  return (
    <View style={styles.screen}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search by ingredient</Text>
      </View>

      {/* ── Body: list + alphabet sidebar ── */}
      <View style={styles.body}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(grouped).sort().map((letter) => (
            <View
              key={letter}
              onLayout={(e) => { sectionOffsets.current[letter] = e.nativeEvent.layout.y; }}
            >
              {grouped[letter].map((item) => (
                <View key={item} style={styles.card}>
                  <Pressable
                    style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => router.push(
                      `/search/filter-results?type=ingredient&value=${encodeURIComponent(item.toLowerCase())}`
                    )}
                  >
                    <Text style={styles.cardText}>{item}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* ── A–Z Sidebar ── */}
        <View style={styles.sidebar}>
          {ALPHABET.map((letter) => (
            <Pressable
              key={letter}
              onPress={() => jumpToLetter(letter)}
              hitSlop={4}
              style={styles.sidebarLetterBtn}
            >
              <Text style={[
                styles.sidebarLetter,
                { color: activeLetters.has(letter) ? RED : '#C4A89A' },
              ]}>
                {letter}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TAN },

  // ── Header ──
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },

  // ── Body ──
  body: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  list: { padding: 16, paddingRight: 8, paddingBottom: 48 },

  // ── Ingredient card ──
  card: {
    backgroundColor: GREEN,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressable: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardText: { fontSize: 16, fontWeight: '600', color: '#1E2A1E' },

  // ── Alphabet sidebar ──
  sidebar: {
    width: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarLetterBtn: { paddingVertical: 1 },
  sidebarLetter: { fontSize: 13, fontWeight: '600' },
});
