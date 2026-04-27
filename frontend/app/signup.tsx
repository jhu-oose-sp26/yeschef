import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link } from 'expo-router';
import { useState } from 'react';
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

import { useAuth } from '@/lib/auth/AuthContext';

const DARK = '#1A1208';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';
const RED = '#BC412B';

export default function SignupScreen() {
  const { signup, resendConfirmation } = useAuth();

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
    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
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
      // silently ignore
    } finally {
      setResendLoading(false);
    }
  }

  if (confirming) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerWrap}>
          <Text style={styles.screenLabel}>SIGN UP</Text>

          <View style={styles.panel}>
            <View style={styles.hero}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="chef-hat" size={30} color={GREEN} />
                <Text style={styles.brandText}>
                  Yes<Text style={styles.brandAccent}>Chef</Text>
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>share recipes with your people</Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.curveLeft} />
              <View style={styles.curveRight} />

              <Text style={[styles.eyebrow, { color: GREEN }]}>CHECK YOUR EMAIL</Text>
              <Text style={styles.confirmTitle}>almost there</Text>
              <Text style={styles.confirmBody}>
                We sent a confirmation link to <Text style={styles.confirmStrong}>{email}</Text>.
                {'\n\n'}Once you confirm it, come back here and log in.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.primaryButtonGreen,
                  (pressed || resendLoading) && styles.buttonPressed,
                ]}
                onPress={handleResend}
                disabled={resendLoading}>
                {resendLoading ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {resendSent ? 'EMAIL SENT' : 'RESEND EMAIL'}
                    </Text>
                    <View style={[styles.arrowBadge, { backgroundColor: GREEN }]}>
                      <Text style={[styles.arrowText, { color: DARK }]}>{'>'}</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <Link href="/login" asChild>
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.secondaryButtonText}>GO TO LOG IN</Text>
                  <View style={[styles.arrowBadge, { backgroundColor: DARK }]}>
                    <Text style={styles.arrowText}>{'>'}</Text>
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>
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
          <Text style={styles.screenLabel}>SIGN UP</Text>

          <View style={styles.panel}>
            <View style={styles.hero}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="chef-hat" size={30} color={GREEN} />
                <Text style={styles.brandText}>
                  Yes<Text style={styles.brandAccent}>Chef</Text>
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>share recipes with your people</Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.curveLeft} />
              <View style={styles.curveRight} />

              <Text style={[styles.eyebrow, { color: GREEN }]}>CREATE YOUR ACCOUNT</Text>

              <Text style={styles.fieldLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="chefjulia"
                placeholderTextColor="rgba(26,18,8,0.28)"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
              />

              <Text style={[styles.fieldLabel, styles.fieldSpacing]}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(26,18,8,0.28)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />

              <Text style={[styles.fieldLabel, styles.fieldSpacing]}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor="rgba(26,18,8,0.28)"
                secureTextEntry
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                onSubmitEditing={handleSignup}
                returnKeyType="go"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.primaryButtonGreen,
                  (pressed || loading) && styles.buttonPressed,
                ]}
                onPress={handleSignup}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                    <View style={[styles.arrowBadge, { backgroundColor: GREEN }]}>
                      <Text style={[styles.arrowText, { color: DARK }]}>{'>'}</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Link href="/login" asChild>
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.secondaryButtonText}>LOG IN</Text>
                  <View style={[styles.arrowBadge, { backgroundColor: DARK }]}>
                    <Text style={styles.arrowText}>{'>'}</Text>
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
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
  brandRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  brandText: {
    color: '#FFF8F2',
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
  },
  brandAccent: {
    color: RED,
  },
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginBottom: 18,
  },
  fieldLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  fieldSpacing: {
    marginTop: 16,
  },
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
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  primaryButtonGreen: {
    backgroundColor: '#EDF8ED',
  },
  primaryButtonText: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  secondaryButton: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(26,18,8,0.18)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  secondaryButtonText: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.1,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(26,18,8,0.12)',
  },
  dividerText: {
    color: 'rgba(26,18,8,0.32)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  confirmTitle: {
    color: DARK,
    fontFamily: 'Fraunces_700Bold_Italic',
    fontSize: 34,
    lineHeight: 38,
    marginBottom: 12,
  },
  confirmBody: {
    color: 'rgba(26,18,8,0.66)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmStrong: {
    color: DARK,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
