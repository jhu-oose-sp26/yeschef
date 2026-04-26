import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Fraunces_700Bold_Italic } from '@expo-google-fonts/fraunces';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Inner layout — can safely call useAuth because AuthProvider is its ancestor. */
function AppShell() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const onAuthScreen = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !onAuthScreen) {
      router.replace('/login');
    } else if (user && onAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_700Bold_Italic });
  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
