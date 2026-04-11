import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function IngredientScreen() {
  const router = useRouter();

  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const DATA = [
    5,
    10,
    15,
    20,
    25,
    30,
    35,
    40,
    45,
    50,
    55,
    60,
    90,
    120,
    150,
    180,
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={[styles.backText, { color: accent }]}>
            ← Browse
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.title}>Ingredient</ThemedText>
      </View>

      <View style={styles.list}>
        {DATA.map((item) => (
          <Pressable
            key={item}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: cardBg,
                borderColor: border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => {
                router.push(
                    `/browse/results?type=ingredient&value=${encodeURIComponent(item.toString().toLowerCase())}`
                );
            }}
          >
            <ThemedText style={styles.rowText}>{item}</ThemedText>
            <IconSymbol name="chevron.right" size={18} color={accent} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  header: {
    marginBottom: 20,
    gap: 6,
  },

  backText: {
    fontSize: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  list: {
    gap: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  rowText: {
    fontSize: 16,
  },
});