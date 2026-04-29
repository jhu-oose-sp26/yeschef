import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
import type { FeedPost } from '@/lib/api/posts';

const DARK = Colors.dark;
const GREEN = Colors.green;
const TAN = Colors.tan;
const RED = Colors.red;
const TEAL = Colors.teal;
const CREAM = Colors.cream;

interface Props {
  item: FeedPost;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
}

export default function PostCard({ item, onPress, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, style, { opacity: pressed ? 0.92 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.inner}>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>{item.recipe.title}</Text>
          {item.recipe.creatorUsername ? (
            <Text style={styles.username}>@{item.recipe.creatorUsername}</Text>
          ) : null}
          <View style={styles.pillRow}>
            {item.recipe.instruction?.prepTime != null && (
              <View style={styles.prepPill}>
                <Text style={styles.prepPillText}>{item.recipe.instruction.prepTime}m prep</Text>
              </View>
            )}
            {item.recipe.instruction?.cookTime != null && (
              <View style={styles.cookPill}>
                <Text style={styles.cookPillText}>{item.recipe.instruction.cookTime}m cook</Text>
              </View>
            )}
          </View>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          ) : null}
        </View>
        <View style={styles.rightCol}>
          <Image
            source={item.image ? { uri: item.image } : require('@/assets/images/default-post.png')}
            style={styles.image}
            contentFit="cover"
          />
          <IconSymbol name="chevron.right" size={16} color={DARK} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: CREAM, borderRadius: 16, padding: 16, overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  text: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: DARK, marginBottom: 4 },
  username: { fontSize: 13, fontWeight: '600', color: GREEN, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  prepPill: { backgroundColor: '#D0F0EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  prepPillText: { color: TEAL, fontSize: 12, fontWeight: '700' },
  cookPill: {
    backgroundColor: TAN, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(188,65,43,0.2)',
  },
  cookPillText: { color: RED, fontSize: 12, fontWeight: '700' },
  notes: { fontSize: 13, color: DARK, opacity: 0.7, lineHeight: 19 },
  rightCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  image: { width: 72, height: 72, borderRadius: 10 },
});
