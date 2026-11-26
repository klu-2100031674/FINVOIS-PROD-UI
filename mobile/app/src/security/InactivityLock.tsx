import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint } from 'lucide-react-native';
import { AuthBackdrop } from '~/components/AuthBackdrop';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { deleteSecure, getSecure, setSecure } from '~/auth/storage';
import { sessionStore } from '~/auth/sessionStore';
import { useSession } from '~/auth/useSession';
import { apiErrorMessage } from '~/utils/errors';
import { biometricUnlockEnabled, promptBiometric, setBiometricUnlock } from './biometrics';
import { IntegrityBanner } from './IntegrityBanner';
import { LOCK_TIMEOUT_MS, isWrongPassword, parseLeftAt, recordFailure, shouldLock } from './lockLogic';
import { useAppSwitcherProtection } from './secureScreen';

const logo = require('../../assets/finvois-logo.png');

// Only a timestamp, no secret. It outlives the process so that a cold start after the OS killed the app in the
// background still locks. It exists while the app is away or locked, and is removed on unlock or sign-out.
const LEFT_KEY = 'finovis.leftAt';
const forget = () => deleteSecure(LEFT_KEY).catch(() => undefined);

/**
 * Wraps the whole app. When the app was away (background, or hidden tab on web) for longer than the timeout,
 * a full-screen lock asks for the account password again (or a biometric if the user turned that on). Three wrong
 * passwords sign out. While the app is not active a plain cover hides the content from the app switcher.
 * The lock never replaces the server: every API call still needs a live session.
 */
export function InactivityLock({ children }: { children: ReactNode }) {
  const session = useSession();
  const signedIn = session.status === 'signedIn';
  const [covered, setCovered] = useState(false);
  const [locked, setLockedState] = useState(false);
  const lockedRef = useRef(false); // readable from the AppState callback, which is registered once
  const leftAt = useRef<number | null>(null);
  const setLocked = useCallback((on: boolean) => {
    lockedRef.current = on;
    setLockedState(on);
  }, []);

  useAppSwitcherProtection(signedIn);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        if (leftAt.current === null) {
          leftAt.current = Date.now(); // iOS goes inactive then background: keep the first time
          // While locked the stored time stays as it is, so leaving the lock screen never restarts the clock.
          if (!lockedRef.current && sessionStore.getState().status === 'signedIn') {
            setSecure(LEFT_KEY, String(leftAt.current)).catch(() => undefined);
          }
        }
        setCovered(true);
        return;
      }
      const lock = sessionStore.getState().status === 'signedIn' && shouldLock(leftAt.current, Date.now(), LOCK_TIMEOUT_MS);
      leftAt.current = null;
      setCovered(false);
      if (lock) setLocked(true);
      else if (!lockedRef.current) void forget();
    });
    return () => sub?.remove();
  }, [setLocked]);

  // Cold start: the OS may have killed the app while it was away. The session is restored from secure-store,
  // so without this check the lock would be skipped.
  useEffect(() => {
    getSecure(LEFT_KEY)
      .then((raw) => {
        if (raw === null || sessionStore.getState().status === 'signedOut') return;
        if (shouldLock(parseLeftAt(raw), Date.now(), LOCK_TIMEOUT_MS)) setLocked(true);
        else void forget();
      })
      .catch(() => undefined);
  }, [setLocked]);

  // A sign-out for any reason clears the lock and forgets the biometric choice (it belongs to the person who set it).
  useEffect(
    () =>
      sessionStore.subscribe(() => {
        if (sessionStore.getState().status !== 'signedOut') return;
        setLocked(false);
        void forget(); // also covers the launch path that signs out without running the sign-out hooks
      }),
    [setLocked]
  );
  useEffect(
    () =>
      sessionStore.onSignOut(async () => {
        await Promise.all([setBiometricUnlock(false), forget()]);
      }),
    []
  );

  const unlock = () => {
    setLocked(false);
    void forget();
  };

  return (
    <View style={{ flex: 1 }}>
      <IntegrityBanner />
      <View style={{ flex: 1 }}>{children}</View>
      {signedIn && covered ? (
        <View testID="privacy-cover" className="absolute inset-0 items-center justify-center bg-white">
          <Image source={logo} accessibilityLabel="Finvois logo" style={{ width: 160, height: 48 }} resizeMode="contain" />
        </View>
      ) : null}
      <Modal visible={signedIn && locked} animationType="none" statusBarTranslucent onRequestClose={() => undefined}>
        <LockScreen onUnlock={unlock} />
      </Modal>
    </View>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState(false);

  const unlockWithBiometric = async () => {
    if (!(await promptBiometric('Unlock Finvois'))) return;
    // Refresh asks the server whether this session is still valid. A revoked one signs out; if the server cannot
    // be reached the lock stays closed (fail closed), and the password path says the same thing.
    if (await sessionStore.refresh()) return onUnlock();
    if (sessionStore.getState().status === 'signedIn') {
      setError("Couldn't confirm your session. Check your connection, then try again or use your password.");
    }
  };

  useEffect(() => {
    void biometricUnlockEnabled().then((on) => {
      setBio(on);
      if (on) void unlockWithBiometric();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offer the prompt once when the lock appears
  }, []);

  const submit = async () => {
    const user = sessionStore.getState();
    if (busy || !password || user.status !== 'signedIn') return;
    setBusy(true);
    setError(null);
    try {
      // Login creates the new session first; the current one is only replaced when the password was right.
      await sessionStore.login(user.user.email, password);
      setPassword('');
      onUnlock();
    } catch (err) {
      if (!isWrongPassword(err)) return setError(apiErrorMessage(err));
      const next = recordFailure(failures);
      setFailures(next.failures);
      if (next.signOut) return void (await sessionStore.logout());
      setError(`Incorrect password. ${next.left} ${next.left === 1 ? 'attempt' : 'attempts'} left.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthBackdrop>
      <SafeAreaView className="flex-1" testID="lock-screen">
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView contentContainerClassName="flex-grow justify-center px-4 py-6" keyboardShouldPersistTaps="handled">
            <View className="w-full max-w-md gap-4 self-center rounded-3xl bg-white/95 p-7 shadow-2xl">
              <View className="items-center">
                <Image
                  source={logo}
                  accessibilityLabel="Finvois logo"
                  style={{ width: 160, height: 48, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <Text className="font-manrope text-2xl text-gray-900">Finvois is locked</Text>
                <Text className="mt-2 text-center text-gray-600">Enter your password to continue.</Text>
              </View>

              <Input
                testID="lock-password"
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                editable={!busy}
                onSubmitEditing={submit}
                returnKeyType="go"
                className="h-12 rounded-xl px-4"
              />

              {error ? (
                <View accessibilityRole="alert" testID="lock-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-700">{error}</Text>
                </View>
              ) : null}

              <Button testID="lock-unlock" onPress={submit} disabled={busy || !password} className="h-12 rounded-xl bg-black">
                {busy ? <ActivityIndicator color="#ffffff" /> : <Text className="font-manrope text-base text-white">Unlock</Text>}
              </Button>
              {bio ? (
                <Button testID="lock-biometric" variant="outline" onPress={unlockWithBiometric} disabled={busy} className="h-12 rounded-xl">
                  <Fingerprint size={18} color="#111827" />
                  <Text className="text-gray-900">Use biometrics</Text>
                </Button>
              ) : null}
              <Button testID="lock-signout" variant="ghost" onPress={() => void sessionStore.logout()} disabled={busy}>
                <Text className="text-gray-600">Sign out</Text>
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackdrop>
  );
}
