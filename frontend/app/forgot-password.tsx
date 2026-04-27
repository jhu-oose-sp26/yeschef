import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Linking from 'expo-linking';
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

import { forgotPassword } from '@/lib/api/auth';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';
const RED = '#BC412B';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // createURL returns frontend://update-password on native, http://host/update-password on web
      const redirectTo = Linking.createURL('update-password');
      await forgotPassword(email.trim(), redirectTo);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.screenLabel}>RESET PASSWORD</Text>

          <View style={styles.panel}>
            <View style={styles.hero}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="chef-hat" size={30} color={GREEN} />
                <Text style={styles.brandText}>
                  Yes<Text style={styles.brandAccent}>Chef</Text>
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>we'll send you a reset link</Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.curveLeft} />
              <View style={styles.curveRight} />

              {sent ? (
                <>
                  <Text style={styles.eyebrow}>CHECK YOUR EMAIL</Text>
                  <Text style={styles.successText}>
                    If <Text style={styles.emailHighlight}>{email}</Text> is registered, a password
                    reset link is on its way.
                  </Text>
                  <Link href="/login" asChild>
                    <Pressable
                      style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
                      <Text style={styles.primaryButtonText}>BACK TO LOGIN</Text>
                      <View style={[styles.arrowBadge, { backgroundColor: RED }]}>
                        <Text style={styles.arrowText}>{'>'}</Text>
                      </View>
                    </Pressable>
                  </Link>
                </>
              ) : (
                <>
                  <Text style={styles.eyebrow}>FORGOT YOUR PASSWORD?</Text>

                  <Text style={styles.fieldLabel}>EMAIL</Text>
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
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (pressed || loading) && styles.buttonPressed,
                    ]}
                    onPress={handleSend}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={DARK} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>SEND RESET EMAIL</Text>
                        <View style={[styles.arrowBadge, { backgroundColor: RED }]}>
                          <Text style={styles.arrowText}>{'>'}</Text>
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
                    <Pressable
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                      <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
                      <View style={[styles.arrowBadge, { backgroundColor: DARK }]}>
                        <Text style={styles.arrowText}>{'<'}</Text>
                      </View>
                    </Pressable>
                  </Link>
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
  emailHighlight: { fontWeight: '900', color: TEAL },
  fieldLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
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
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(26,18,8,0.12)' },
  dividerText: {
    color: 'rgba(26,18,8,0.32)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  buttonPressed: { opacity: 0.8 },
});
