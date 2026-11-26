import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react-native';
import { AuthBackdrop } from '~/components/AuthBackdrop';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { getProfile, passwordProblem, setFirstPassword } from '~/api/profile';
import { apiErrorMessage } from '~/utils/errors';
import { sessionStore } from './sessionStore';
import { useSession } from './useSession';

/**
 * An account an admin created starts with a temporary password, and the web will not let it past "Set your password".
 * This is the same stop for the phone. If the profile can't be loaded the app carries on, as it does for other optional
 * lookups, and the next launch asks again.
 */
export function PasswordChangeGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const profile = useQuery({
    queryKey: ['profile', 'must-change-password', userId],
    queryFn: getProfile,
    enabled: Boolean(userId),
    networkMode: 'always',
    staleTime: Infinity,
  });

  if (!userId || !profile.data?.must_change_password) return <>{children}</>;
  return <SetPasswordScreen />;
}

function SetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = useMutation({
    networkMode: 'always',
    mutationFn: () => setFirstPassword(password),
    onSuccess: () => sessionStore.endAfterPasswordChange('Password set. Sign in with your new password.'),
  });

  const problem = password ? passwordProblem(password) : null;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = Boolean(password) && !problem && confirm === password;

  return (
    <AuthBackdrop>
      <SafeAreaView className="flex-1" testID="set-password">
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView contentContainerClassName="flex-grow justify-center px-4 py-6" keyboardShouldPersistTaps="handled">
            <View className="w-full max-w-md gap-4 self-center rounded-3xl bg-white/95 p-7 shadow-2xl">
              <View className="items-center gap-2">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                  <KeyRound size={26} color="#7c3aed" />
                </View>
                <Text className="font-manrope text-2xl text-gray-900">Set your password</Text>
                <Text className="text-center text-sm text-gray-600">
                  You signed in with a temporary password. Choose your own to keep using the app.
                </Text>
              </View>
              <View className="gap-1.5">
                <Label nativeID="set-password-label">New password</Label>
                <Input
                  testID="set-password-input"
                  aria-labelledby="set-password-label"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  editable={!save.isPending}
                  className="h-12 rounded-xl bg-white"
                />
                <Text testID="set-password-hint" className={problem ? 'text-xs text-red-700' : 'text-xs text-gray-500'}>
                  {problem ?? 'At least 8 characters with an uppercase letter, a lowercase letter and a number.'}
                </Text>
              </View>
              <View className="gap-1.5">
                <Label nativeID="set-password-confirm-label">Confirm password</Label>
                <Input
                  testID="set-password-confirm"
                  aria-labelledby="set-password-confirm-label"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  editable={!save.isPending}
                  className="h-12 rounded-xl bg-white"
                />
                {mismatch ? <Text testID="set-password-mismatch" className="text-xs text-red-700">The passwords do not match.</Text> : null}
              </View>
              {save.isError ? (
                <View accessibilityRole="alert" testID="set-password-error" className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <Text className="text-sm text-red-700">{apiErrorMessage(save.error, "Couldn't set your password. Try again.")}</Text>
                </View>
              ) : null}
              <Button testID="set-password-save" disabled={!ready || save.isPending} onPress={() => save.mutate()} className="h-12 rounded-xl bg-black">
                <Text className="font-manrope text-base text-white">{save.isPending ? 'Saving' : 'Save password'}</Text>
              </Button>
              <Button testID="set-password-sign-out" variant="ghost" disabled={save.isPending} onPress={() => void sessionStore.logout()} className="h-11 rounded-xl">
                <Text className="text-gray-700">Sign out</Text>
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackdrop>
  );
}
