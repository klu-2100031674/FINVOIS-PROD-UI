import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, CircleAlert, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { sessionStore } from '~/auth/sessionStore';
import { ensureServerAwake, wakeConfigured } from '~/auth/wakeServer';
import { useSession } from '~/auth/useSession';
import { API_BASE_URL, APP_VERSION } from '~/config';
import { cn } from '~/lib/utils';
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from '~/utils/errors';

const logo = require('../../../assets/finvois-logo.png');

type Field = 'email' | 'password';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const notice = session.status === 'signedOut' ? session.notice : undefined;
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waking, setWaking] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (wakeConfigured()) {
        setWaking(true);
        const awake = await ensureServerAwake();
        setWaking(false);
        if (!awake) {
          setError('Server is taking too long to start. Please try again in 1 minute.');
          return;
        }
      }
      await sessionStore.login(email, password);
    } catch (err) {
      setError(
        apiErrorCode(err) === 'ROLE_NOT_ALLOWED'
          ? 'This app is for admin and support staff.'
          : apiErrorStatus(err) === 401
            ? 'Email or password is incorrect.'
            : apiErrorMessage(err)
      );
    } finally {
      setWaking(false);
      setBusy(false);
    }
  };

  const goodNotice = !error && session.status === 'signedOut' && session.noticeIsGood ? notice : null;
  const shownError = goodNotice ? null : (error ?? notice ?? null);
  const fieldClass = (field: Field) =>
    cn(
      'h-14 rounded-2xl border-gray-200 bg-gray-50 pl-12 font-inter text-base text-gray-900',
      focused === field && 'border-purple-500 bg-white',
      shownError && focused !== field && 'border-red-300'
    );
  const iconColor = (field: Field) => (focused === field ? '#7c3aed' : '#9ca3af');

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <LinearGradient
            colors={['#e9d5ff', '#fdf2f8', '#fef3c7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 40, paddingBottom: 56, alignItems: 'center' }}>
            <Image
              source={logo}
              accessibilityLabel="Finvois logo"
              style={{ width: 210, height: 100 }}
              resizeMode="contain"
            />
            <Text className="mt-3 font-inter-medium text-sm text-gray-600">DPR management</Text>
          </LinearGradient>

          <View
            className="-mt-8 flex-1 rounded-t-[32px] bg-white px-6 pt-8"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <Text className="font-manrope-extrabold text-[28px] leading-9 text-gray-900">Sign in</Text>
            <Text className="mt-1 font-inter text-[15px] leading-6 text-gray-600">
              Use the staff account your administrator created.
            </Text>

            <View className="mt-8 gap-5">
              <View className="gap-2">
                <Label nativeID="email-label" className="font-inter-medium text-sm text-gray-700">
                  Email
                </Label>
                <View className="justify-center">
                  <Input
                    aria-labelledby="email-label"
                    testID="email-input"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@company.com"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="username"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    editable={!busy}
                    className={fieldClass('email')}
                  />
                  <View style={{ pointerEvents: 'none' }} className="absolute left-4">
                    <Mail size={20} color={iconColor('email')} />
                  </View>
                </View>
              </View>

              <View className="gap-2">
                <Label nativeID="password-label" className="font-inter-medium text-sm text-gray-700">
                  Password
                </Label>
                <View className="justify-center">
                  <Input
                    ref={passwordRef}
                    aria-labelledby="password-label"
                    testID="password-input"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    editable={!busy}
                    className={cn(fieldClass('password'), 'pr-14')}
                  />
                  <View style={{ pointerEvents: 'none' }} className="absolute left-4">
                    <Lock size={20} color={iconColor('password')} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={show ? 'Hide password' : 'Show password'}
                    testID="toggle-password"
                    hitSlop={8}
                    onPress={() => setShow((s) => !s)}
                    className="absolute right-2 h-11 w-11 items-center justify-center rounded-full active:bg-gray-100">
                    {show ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                  </Pressable>
                </View>
              </View>

              {goodNotice ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  testID="login-notice"
                  className="flex-row items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 size={18} color="#15803d" style={{ marginTop: 1 }} />
                  <Text className="flex-1 font-inter text-sm leading-5 text-green-800">{goodNotice}</Text>
                </View>
              ) : null}

              {shownError ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  testID="login-error"
                  className="flex-row items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <CircleAlert size={18} color="#b91c1c" style={{ marginTop: 1 }} />
                  <Text className="flex-1 font-inter text-sm leading-5 text-red-700">{shownError}</Text>
                </View>
              ) : null}

              <Button
                testID="login-button"
                accessibilityLabel={waking ? 'Starting server' : busy ? 'Signing in' : 'Sign in'}
                onPress={submit}
                disabled={busy}
                className="mt-1 h-14 rounded-2xl bg-black active:bg-gray-800">
                {busy ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text className="font-manrope text-base text-white">{waking ? 'Starting server…' : 'Signing in'}</Text>
                  </>
                ) : (
                  <Text className="font-manrope text-base text-white">Sign in</Text>
                )}
              </Button>
            </View>

            <View className="mt-auto items-center gap-1.5 pt-10">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck size={16} color="#7c3aed" />
                <Text className="font-inter-medium text-[13px] text-gray-600">Admin and support staff only</Text>
              </View>
              <Text className="font-inter text-xs text-gray-400">Version {APP_VERSION}</Text>
              {__DEV__ ? (
                <Text testID="api-host" className="font-inter text-xs text-gray-400">
                  Server: {API_BASE_URL.replace(/^https?:\/\//, '')}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
