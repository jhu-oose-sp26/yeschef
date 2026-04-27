import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}

export function LoadingErrorView({ loading, error, onRetry, children }: Props) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.red} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '700',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.red,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
