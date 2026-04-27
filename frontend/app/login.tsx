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
const TEAL = '#05A8AA';
const GREEN = '#B8D5B8';
const CREAM = '#FFF8F2';
const RED = '#BC412B';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
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
          <Text style={styles.screenLabel}>LOGIN</Text>

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

              <Text style={styles.eyebrow}>WELCOME BACK</Text>

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
              />

              <Text style={[styles.fieldLabel, styles.fieldSpacing]}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor="rgba(26,18,8,0.28)"
                secureTextEntry
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || loading) && styles.buttonPressed,
                ]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>LOG IN</Text>
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

              <Link href="/signup" asChild>
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.secondaryButtonText}>CREATE AN ACCOUNT</Text>
                  <View style={[styles.arrowBadge, { backgroundColor: DARK }]}>
                    <Text style={styles.arrowText}>{'>'}</Text>
                  </View>
                </Pressable>
              </Link>

              <Text style={styles.footerNote}>
                forgot password? <Text style={styles.footerLink}>reset it</Text>
              </Text>
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
    color: RED,
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
  footerNote: {
    color: 'rgba(26,18,8,0.42)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 18,
  },
  footerLink: {
    color: TEAL,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
