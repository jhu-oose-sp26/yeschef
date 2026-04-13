import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SignupScreen() {
  const { signup, resendConfirmation } = useAuth();
  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSignup() {
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must contain uppercase, lowercase, a number, and a symbol.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup(email.trim(), password, username.trim());
      setConfirming(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendSent(false);
    setResendLoading(true);
    try {
      await resendConfirmation(email.trim());
      setResendSent(true);
    } catch {
      // silently ignore — user can try again
    } finally {
      setResendLoading(false);
    }
  }

  if (confirming) {
    return (
      <ThemedView style={styles.root}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
              YesChef
            </ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, marginBottom: 8 }}>
              Check your email
            </ThemedText>
            <ThemedText style={{ opacity: 0.7, lineHeight: 20 }}>
              We sent a confirmation link to <ThemedText type="defaultSemiBold">{email}</ThemedText>.
              {'\n\n'}Once confirmed, come back and sign in.
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: accent, opacity: pressed || resendLoading ? 0.75 : 1 },
              ]}
              onPress={handleResend}
              disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {resendSent ? 'Email sent!' : 'Resend confirmation email'}
                </ThemedText>
              )}
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Link href="/login" asChild>
              <Pressable>
                <ThemedText style={[styles.footerLink, { color: accent }]}>
                  Go to sign in
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
            YesChef
          </ThemedText>
          <ThemedText style={styles.subtitle}>Create your account</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Username
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: cardBorder, color: textColor }]}
            placeholder="chefgordon"
            placeholderTextColor={cardBorder}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />

          <ThemedText type="defaultSemiBold" style={[styles.label, styles.labelSpacing]}>
            Email
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: cardBorder, color: textColor }]}
            placeholder="you@example.com"
            placeholderTextColor={cardBorder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <ThemedText type="defaultSemiBold" style={[styles.label, styles.labelSpacing]}>
            Password
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: cardBorder, color: textColor }]}
            placeholder="••••••••"
            placeholderTextColor={cardBorder}
            secureTextEntry
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleSignup}
            returnKeyType="go"
          />

          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: accent, opacity: pressed || loading ? 0.75 : 1 },
            ]}
            onPress={handleSignup}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Create Account</ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Already have an account?</ThemedText>
          <Link href="/login" asChild>
            <Pressable>
              <ThemedText style={[styles.footerLink, { color: accent }]}>
                {' '}Sign in
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  labelSpacing: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 12,
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
