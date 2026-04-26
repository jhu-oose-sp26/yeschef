import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const TAN = '#FFEDE2';
const RED = '#BC412B';
const CREAM = '#FFF8F2';

interface TimeOption {
  label: string;
  sidebar: string;
  value: number;
}

const TIMES: TimeOption[] = [
  { label: '5 min', sidebar: '5', value: 5 },
  { label: '10 min', sidebar: '10', value: 10 },
  { label: '15 min', sidebar: '15', value: 15 },
  { label: '20 min', sidebar: '20', value: 20 },
  { label: '25 min', sidebar: '25', value: 25 },
  { label: '30 min', sidebar: '30', value: 30 },
  { label: '35 min', sidebar: '35', value: 35 },
  { label: '40 min', sidebar: '40', value: 40 },
  { label: '45 min', sidebar: '45', value: 45 },
  { label: '50 min', sidebar: '50', value: 50 },
  { label: '55 min', sidebar: '55', value: 55 },
  { label: '1 hr', sidebar: '1h', value: 60 },
  { label: '1.5 hr', sidebar: '1.5h', value: 90 },
  { label: '2 hr', sidebar: '2h', value: 120 },
  { label: '2.5 hr', sidebar: '2.5h', value: 150 },
  { label: '3 hr', sidebar: '3h', value: 180 },
  { label: '> 3 hr', sidebar: '>3h', value: 9999 },
];

export default function SearchTimeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const itemOffsets = useRef<Record<string, number>>({});
  const [activeSidebar, setActiveSidebar] = useState('20');

  function jumpTo(sidebar: string) {
    const offset = itemOffsets.current[sidebar];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
      setActiveSidebar(sidebar);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.navigate('/search')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Search by cook time</Text>
      </View>

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
              onLayout={(event) => {
                itemOffsets.current[time.sidebar] = event.nativeEvent.layout.y;
              }}
            >
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/search/filter-results',
                    params: {
                      type: 'time',
                      value: String(time.value),
                      label: time.label,
                    },
                  })
                }
              >
                <Text style={styles.cardText}>{time.label}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sidebar}>
          {TIMES.map((time) => {
            const selected = activeSidebar === time.sidebar;
            return (
              <Pressable
                key={time.sidebar}
                onPress={() => jumpTo(time.sidebar)}
                hitSlop={4}
                style={[styles.sidebarBtn, selected && styles.sidebarBtnActive]}
              >
                <Text style={[styles.sidebarLabel, selected && styles.sidebarLabelActive]}>
                  {time.sidebar}
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
    width: 42,
    paddingTop: 18,
    paddingBottom: 18,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarBtn: {
    minWidth: 28,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
  },
  sidebarBtnActive: {
    backgroundColor: RED,
  },
  sidebarLabel: {
    color: RED,
    fontSize: 10,
    fontWeight: '800',
  },
  sidebarLabelActive: {
    color: CREAM,
  },
  pressed: {
    opacity: 0.82,
  },
});
