import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface StarRatingProps {
  /** Current value (1-5). 0 means nothing selected. */
  value: number;
  /** If provided, stars are tappable. */
  onChange?: (value: number) => void;
  size?: number;
  color?: string;
  emptyColor?: string;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  color = '#F5A623',
  emptyColor = '#D0D0D0',
}: StarRatingProps) {
  const interactive = !!onChange;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <MaterialIcons
            key={star}
            name={filled ? 'star' : 'star-border'}
            size={size}
            color={filled ? color : emptyColor}
          />
        );

        if (!interactive) return icon;

        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            style={styles.starBtn}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starBtn: {
    padding: 2,
  },
});
