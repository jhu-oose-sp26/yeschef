import React from 'react'
import { StyleSheet, Dimensions} from 'react-native'
import { ThemedView } from './themed-view'
import { ThemedText } from './themed-text'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

export default function RecipeCard({data}: any) {
    const colorScheme = useColorScheme() ?? 'light' // finds if in light or dark mode
    const cardBg = Colors[colorScheme].card // finds the color of the cards based on the colorScheme
    return (
        <ThemedView style={[styles.card, { backgroundColor: cardBg}]}>
            <ThemedText></ThemedText>
            <ThemedText>{data.name}</ThemedText>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
  card: {
    height: 0.15 * Dimensions.get('window').height,
    width: 0.9 * Dimensions.get('window').width,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000', // iOS Shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android Shadow
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { fontSize: 14, color: '#666', marginTop: 5 },
  image: { width: '100%', height: 150, borderRadius: 8 },
  textContainer: { marginTop: 10 }
});