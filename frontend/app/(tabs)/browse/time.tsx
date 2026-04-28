import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function IngredientScreen() {
  const router = useRouter();

  const cardBg = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'cardBorder');
  const accent = useThemeColor({}, 'accent');

  const DATA = [
    '<5 minutes',
    '<10 minutes',
    '<15 minutes',
    '<20 minutes',
    '<25 minutes',
    '<30 minutes',
    '<35 minutes',
    '<40 minutes',
    '<45 minutes',
    '<50 minutes',
    '<55 minutes',
    '<1 hour',
    '<1.5 hours',
    '<2 hours',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={[styles.backText, { color: accent }]}>
            ← Browse
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.title}>Cook Time</ThemedText>
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
                const valueMap: Record<string, number> = {
                    '<5 minutes': 5,
                    '<10 minutes': 10,
                    '<15 minutes': 15,
                    '<20 minutes': 20,
                    '<25 minutes': 25,
                    '<30 minutes': 30,
                    '<35 minutes': 35,
                    '<40 minutes': 40,
                    '<45 minutes': 45,
                    '<50 minutes': 50,
                    '<55 minutes': 55,
                    '<1 hour': 60,
                    '<1.5 hours': 90,
                    '<2 hours': 120,
                };

                const minutes = valueMap[item];

                router.push(
                    `./results?type=time&value=${minutes}`
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
