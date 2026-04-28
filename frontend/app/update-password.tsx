import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { updatePassword } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';
const RED = '#BC412B';

// Supabase appends the session as a URL hash fragment after redirecting:
// frontend://update-password#access_token=xxx&refresh_token=yyy&type=recovery
function parseTokenFromHash(url: string): string | null {
  const hash = url.split('#')[1];
  if (!hash) return null;
  // URLSearchParams handles key=value&key=value format used in hash fragments
  try {
    return new URLSearchParams(hash).get('access_token');
  } catch {
    for (const part of hash.split('&')) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const key = part.slice(0, eq);
      const val = part.slice(eq + 1);
      if (key === 'access_token') return decodeURIComponent(val);
    }
    return null;
  }
}

export default function UpdatePasswordScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Token extracted from the deep-link URL hash (recovery flow).
  // null means "not yet checked" until tokenChecked === true.
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Web: hash is available synchronously on window.location
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const token = parseTokenFromHash(window.location.href);
      if (token) setRecoveryToken(token);
      setTokenChecked(true);
      return;
    }

    // Native — two cases:
    // 1. Cold start: app launched by the deep link → getInitialURL has the URL
    // 2. Warm start: app was backgrounded → URL arrives via the 'url' event
    let mounted = true;

    Linking.getInitialURL()
      .then((url) => {
        if (!mounted) return;
        if (url) {
          const token = parseTokenFromHash(url);
          if (token) setRecoveryToken(token);
        }
        setTokenChecked(true);
      })
      .catch(() => {
        if (mounted) setTokenChecked(true);
      });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const token = parseTokenFromHash(url);
      if (token) setRecoveryToken(token);
      setTokenChecked(true);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  async function handleUpdate() {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Recovery flow: use the token from the URL. Logged-in flow: use the stored session.
      await updatePassword(newPassword, recoveryToken ?? undefined);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessContinue() {
    // Recovery flow: send them to login to authenticate with the new password.
    // Logged-in flow: return to the app.
    if (recoveryToken) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)');
    }
  }

  // Checking the URL — show a neutral loading state
  if (!tokenChecked) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  // No recovery token and not logged in — the link is expired or invalid
  if (!recoveryToken && !user) {
    return (
      <View style={styles.screen}>
        <View style={styles.expiredContainer}>
          <MaterialCommunityIcons name="link-off" size={48} color={RED} />
          <Text style={styles.expiredTitle}>LINK EXPIRED</Text>
          <Text style={styles.expiredBody}>
            This password reset link has expired or is invalid. Please request a new one.
          </Text>
          <Link href="/forgot-password" asChild>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
              <Text style={styles.primaryButtonText}>REQUEST NEW LINK</Text>
              <View style={[styles.arrowBadge, { backgroundColor: RED }]}>
                <Text style={styles.arrowText}>{'>'}</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.screenLabel}>UPDATE PASSWORD</Text>

          <View style={styles.panel}>
            <View style={styles.hero}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="chef-hat" size={30} color={GREEN} />
                <Text style={styles.brandText}>
                  Yes<Text style={styles.brandAccent}>Chef</Text>
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>choose a new password</Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.curveLeft} />
              <View style={styles.curveRight} />

              {done ? (
                <>
                  <Text style={styles.eyebrow}>PASSWORD UPDATED</Text>
                  <Text style={styles.successText}>
                    Your password has been changed successfully.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                    onPress={handleSuccessContinue}>
                    <Text style={styles.primaryButtonText}>
                      {recoveryToken ? 'GO TO LOGIN' : 'BACK TO APP'}
                    </Text>
                    <View style={[styles.arrowBadge, { backgroundColor: RED }]}>
                      <Text style={styles.arrowText}>{'>'}</Text>
                    </View>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.eyebrow}>SET NEW PASSWORD</Text>

                  <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="rgba(26,18,8,0.28)"
                    secureTextEntry
                    textContentType="newPassword"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!loading}
                  />

                  <Text style={[styles.fieldLabel, styles.fieldSpacing]}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="rgba(26,18,8,0.28)"
                    secureTextEntry
                    textContentType="newPassword"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                    onSubmitEditing={handleUpdate}
                    returnKeyType="done"
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (pressed || loading) && styles.buttonPressed,
                    ]}
                    onPress={handleUpdate}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={DARK} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>UPDATE PASSWORD</Text>
                        <View style={[styles.arrowBadge, { backgroundColor: RED }]}>
                          <Text style={styles.arrowText}>{'>'}</Text>
                        </View>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: CREAM },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  expiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  expiredTitle: {
    color: RED,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginTop: 8,
  },
  expiredBody: {
    color: DARK,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  screenLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
  },
  panel: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: CREAM,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#100B05',
  },
  hero: {
    backgroundColor: DARK,
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 118,
    paddingHorizontal: 28,
  },
  brandRow: { alignItems: 'center', gap: 10, marginBottom: 12 },
  brandText: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
  },
  brandAccent: { color: RED },
  heroSubtitle: {
    color: 'rgba(255,248,242,0.58)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: CREAM,
    marginTop: -56,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 30,
  },
  curveLeft: {
    position: 'absolute',
    left: -8,
    top: -48,
    width: 190,
    height: 110,
    borderRadius: 999,
    backgroundColor: CREAM,
  },
  curveRight: {
    position: 'absolute',
    right: -18,
    top: -58,
    width: 220,
    height: 120,
    borderRadius: 999,
    backgroundColor: CREAM,
  },
  eyebrow: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginBottom: 18,
  },
  successText: {
    color: DARK,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 24,
  },
  fieldLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  fieldSpacing: { marginTop: 16 },
  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26,18,8,0.12)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    color: DARK,
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: RED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  primaryButton: {
    marginTop: 22,
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(26,18,8,0.18)',
    backgroundColor: CREAM,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  primaryButtonText: {
    color: DARK,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  arrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFF8F2',
    fontSize: 18,
    fontWeight: '900',
    marginTop: -1,
  },
  buttonPressed: { opacity: 0.8 },
});
