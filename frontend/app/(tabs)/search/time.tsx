import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';

interface TimeOption {
  label: string;   // shown on the green card
  sidebar: string; // shown in the sidebar
  value: number;   // minutes passed to API (9999 = >3 hr)
}

const TIMES: TimeOption[] = [
  { label: '5 min',   sidebar: '5',   value: 5 },
  { label: '10 min',  sidebar: '10',  value: 10 },
  { label: '15 min',  sidebar: '15',  value: 15 },
  { label: '20 min',  sidebar: '20',  value: 20 },
  { label: '25 min',  sidebar: '25',  value: 25 },
  { label: '30 min',  sidebar: '30',  value: 30 },
  { label: '35 min',  sidebar: '35',  value: 35 },
  { label: '40 min',  sidebar: '40',  value: 40 },
  { label: '45 min',  sidebar: '45',  value: 45 },
  { label: '50 min',  sidebar: '50',  value: 50 },
  { label: '55 min',  sidebar: '55',  value: 55 },
  { label: '1 hr',    sidebar: '1h',  value: 60 },
  { label: '1.5 hr',  sidebar: '1.5h', value: 90 },
  { label: '2 hr',    sidebar: '2h',  value: 120 },
  { label: '2.5 hr',  sidebar: '2.5h', value: 150 },
  { label: '3 hr',    sidebar: '3h',  value: 180 },
  { label: '> 3 hr',  sidebar: '>3h', value: 9999 },
];

export default function SearchTimeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const itemOffsets = useRef<Record<string, number>>({});

  function jumpTo(sidebar: string) {
    const offset = itemOffsets.current[sidebar];
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
        <Text style={styles.headerTitle}>Search by cook time</Text>
      </View>

      {/* ── Body: list + sidebar ── */}
      <View style={styles.body}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {TIMES.map((time) => (
            <View
              key={time.sidebar}
              onLayout={(e) => { itemOffsets.current[time.sidebar] = e.nativeEvent.layout.y; }}
            >
              <View style={styles.card}>
                <Pressable
                  style={({ pressed }) => [styles.cardPressable, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => router.push(
                    `/search/filter-results?type=time&value=${time.value}&label=${encodeURIComponent(time.label)}`
                  )}
                >
                  <Text style={styles.cardText}>{time.label}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Time Sidebar ── */}
        <View style={styles.sidebar}>
          {TIMES.map((time) => (
            <Pressable
              key={time.sidebar}
              onPress={() => jumpTo(time.sidebar)}
              hitSlop={4}
              style={styles.sidebarBtn}
            >
              <Text style={styles.sidebarLabel}>{time.sidebar}</Text>
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

  // ── Time card ──
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

  // ── Sidebar ──
  sidebar: {
    width: 36,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarBtn: { paddingVertical: 1 },
  sidebarLabel: { fontSize: 13, fontWeight: '600', color: RED },
});
