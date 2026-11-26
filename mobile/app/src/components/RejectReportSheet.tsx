import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { NotifyOwnerRow } from '~/components/NotifyOwnerRow';
import { REJECTION_MAX, rejectionReasonError, type RejectInput } from '~/api/adminReports';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the trimmed reason once it passes the length rules. */
  onSubmit: (input: RejectInput) => void;
  pending: boolean;
  /** The server's message when the last attempt failed. */
  error?: string | null;
}

// Bottom sheet that collects the rejection reason. The server also enforces "reason required" (400).
export function RejectReportSheet({ visible, onClose, onSubmit, pending, error }: Props) {
  const close = () => {
    if (!pending) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView className="flex-1 justify-end bg-black/50" behavior="padding">
        <Pressable className="flex-1" accessibilityLabel="Close" onPress={close} />
        {/* The form's state lives inside the Modal, so it starts empty every time the sheet opens. */}
        <ReasonForm onSubmit={onSubmit} onCancel={close} pending={pending} error={error} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReasonForm({ onSubmit, onCancel, pending, error }: Pick<Props, 'onSubmit' | 'pending' | 'error'> & { onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const problem = rejectionReasonError(reason);

  return (
    <View testID="reject-sheet" className="gap-4 rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 0) + 24 }}>
      <View className="gap-1">
        <Text className="font-manrope text-xl text-gray-900">Reject report</Text>
        <Text className="text-sm text-gray-600">Say what needs to change. The report owner will see this reason.</Text>
      </View>
      <View className="gap-1.5">
        <Label nativeID="reject-reason-label">Reason</Label>
        <Textarea
          testID="reject-reason"
          aria-labelledby="reject-reason-label"
          value={reason}
          onChangeText={(t) => {
            setReason(t);
            setTouched(true);
          }}
          maxLength={REJECTION_MAX}
          editable={!pending}
          numberOfLines={4}
          placeholder="For example: bank statements are missing"
          className="min-h-24 rounded-xl bg-white"
        />
        <View className="flex-row justify-between">
          <Text testID="reject-reason-hint" className={touched && problem ? 'text-xs text-red-700' : 'text-xs text-gray-500'}>
            {touched && problem ? problem : 'At least 5 characters.'}
          </Text>
          <Text className="text-xs text-gray-400">{reason.trim().length}/{REJECTION_MAX}</Text>
        </View>
      </View>
      <NotifyOwnerRow testID="reject-send-email" label="Send rejection email to the report owner" checked={sendEmail} onChange={setSendEmail} disabled={pending} />
      {error ? (
        <View accessibilityRole="alert" testID="reject-error" className="rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}
      <View className="gap-2">
        <Button
          testID="reject-confirm"
          variant="destructive"
          className="h-12 rounded-xl"
          disabled={pending || problem !== null}
          onPress={() => onSubmit({ rejection_reason: reason.trim(), send_email: sendEmail })}>
          <Text>{pending ? 'Rejecting' : 'Reject report'}</Text>
        </Button>
        <Button testID="reject-cancel" variant="outline" className="h-12 rounded-xl" disabled={pending} onPress={onCancel}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
}
