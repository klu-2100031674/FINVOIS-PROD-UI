import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { changePassword, passwordProblem } from '~/api/profile';
import { sessionStore } from '~/auth/sessionStore';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

export function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-end bg-black/50" behavior="padding">
        <Pressable className="flex-1" accessibilityLabel="Close" onPress={onClose} />
        {/* Inside the Modal, so the typed passwords are gone as soon as the sheet closes. */}
        <ChangePasswordForm onCancel={onClose} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChangePasswordForm({ onCancel }: { onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = useMutation({
    networkMode: 'always',
    mutationFn: () => changePassword(current, next),
    onSuccess: () => sessionStore.endAfterPasswordChange('Password changed. Sign in with your new password.'),
  });

  const problem = next ? passwordProblem(next) : null;
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = Boolean(current) && Boolean(next) && !problem && confirm === next;

  const failure = save.isError
    ? apiErrorStatus(save.error) === 400
      ? apiErrorMessage(save.error, 'Check the passwords and try again.')
      : apiErrorMessage(save.error, "Couldn't change your password. Try again.")
    : null;

  return (
    <View testID="change-password-sheet" className="max-h-[92%] rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 0) + 24 }}>
      <ScrollView className="grow-0" keyboardShouldPersistTaps="handled">
        <View className="gap-4 pb-4">
          <View className="gap-1">
            <Text className="font-manrope text-xl text-gray-900">Change password</Text>
            <Text className="text-sm text-gray-600">You will be signed out on your phones and need to sign in again.</Text>
          </View>
          <View className="gap-1.5">
            <Label nativeID="current-password-label">Current password</Label>
            <Input
              testID="current-password"
              aria-labelledby="current-password-label"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => nextRef.current?.focus()}
              editable={!save.isPending}
              className="h-12 rounded-xl bg-white"
            />
          </View>
          <View className="gap-1.5">
            <Label nativeID="new-password-label">New password</Label>
            <Input
              ref={nextRef}
              testID="new-password"
              aria-labelledby="new-password-label"
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmRef.current?.focus()}
              editable={!save.isPending}
              className="h-12 rounded-xl bg-white"
            />
            <Text testID="new-password-hint" className={problem ? 'text-xs text-red-700' : 'text-xs text-gray-500'}>
              {problem ?? 'At least 8 characters with an uppercase letter, a lowercase letter and a number.'}
            </Text>
          </View>
          <View className="gap-1.5">
            <Label nativeID="confirm-password-label">Confirm new password</Label>
            <Input
              ref={confirmRef}
              testID="confirm-password"
              aria-labelledby="confirm-password-label"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              editable={!save.isPending}
              className="h-12 rounded-xl bg-white"
            />
            {mismatch ? <Text testID="confirm-password-error" className="text-xs text-red-700">The passwords do not match.</Text> : null}
          </View>
          {failure ? (
            <View accessibilityRole="alert" testID="change-password-error" className="rounded-xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-700">{failure}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View className="gap-2">
        <Button testID="change-password-confirm" className="h-12 rounded-xl" disabled={!ready || save.isPending} onPress={() => save.mutate()}>
          <Text className="font-manrope">{save.isPending ? 'Changing password' : 'Change password'}</Text>
        </Button>
        <Button testID="change-password-cancel" variant="outline" className="h-12 rounded-xl" disabled={save.isPending} onPress={onCancel}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
}
