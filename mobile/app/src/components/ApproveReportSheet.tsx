import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotifyOwnerRow } from '~/components/NotifyOwnerRow';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { isValidAmount, needsAmountToCollect, type AdminReport, type ApproveInput } from '~/api/adminReports';

interface Props {
  visible: boolean;
  onClose: () => void;
  report: AdminReport;
  onSubmit: (input: ApproveInput) => void;
  pending: boolean;
  error?: string | null;
}

// The form's state lives inside the Modal, so it starts fresh every time the sheet opens.
export function ApproveReportSheet({ visible, onClose, report, onSubmit, pending, error }: Props) {
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView className="flex-1 justify-end bg-black/50" behavior="padding">
        <Pressable className="flex-1" accessibilityLabel="Close" onPress={close} />
        <ApproveForm report={report} onSubmit={onSubmit} onCancel={close} pending={pending} error={error} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ApproveForm({ report, onSubmit, onCancel, pending, error }: Pick<Props, 'report' | 'onSubmit' | 'pending' | 'error'> & { onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const needsAmount = needsAmountToCollect(report);
  const [amount, setAmount] = useState(report.payment?.template_amount !== undefined ? String(report.payment.template_amount) : '');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const amountOk = !needsAmount || isValidAmount(amount);

  const submit = () => {
    const trimmed = notes.trim();
    onSubmit({
      send_email: sendEmail,
      ...(trimmed ? { validation_notes: trimmed } : {}),
      ...(needsAmount ? { amount_to_collect: Number(amount) } : {}),
    });
  };

  return (
    <View testID="approve-dialog" className="max-h-[92%] rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 0) + 24 }}>
      <ScrollView className="grow-0" keyboardShouldPersistTaps="handled">
        <View className="gap-4 pb-4">
          <View className="gap-1">
            <Text className="font-manrope text-xl text-gray-900">Approve this report?</Text>
            <Text className="text-sm text-gray-600">The customer service team can then send it.</Text>
          </View>

          {needsAmount ? (
            <View className="gap-1.5">
              <Label nativeID="approve-amount-label">Amount to collect (₹)</Label>
              <Input
                testID="approve-amount"
                aria-labelledby="approve-amount-label"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="For example 1000, 2500 or 5000"
                editable={!pending}
                className="h-12 rounded-xl bg-white"
              />
              <Text testID="approve-amount-hint" className={amountOk ? 'text-xs text-gray-500' : 'text-xs text-red-700'}>
                {amountOk
                  ? 'Channel partner report. The partner pays this amount when they download it. 0 is allowed.'
                  : 'Enter an amount of 0 or more.'}
              </Text>
            </View>
          ) : null}

          <View className="gap-1.5">
            <Label nativeID="approve-notes-label">Notes (optional)</Label>
            <Textarea
              testID="approve-notes"
              aria-labelledby="approve-notes-label"
              value={notes}
              onChangeText={setNotes}
              editable={!pending}
              numberOfLines={3}
              placeholder="Add any notes for internal reference"
              className="min-h-20 rounded-xl bg-white"
            />
          </View>

          <NotifyOwnerRow testID="approve-send-email" label="Send approval email to the report owner" checked={sendEmail} onChange={setSendEmail} disabled={pending} />

          {error ? (
            <View accessibilityRole="alert" testID="approve-error" className="rounded-xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View className="gap-2">
        <Button testID="approve-confirm" className="h-12 rounded-xl" disabled={pending || !amountOk} onPress={submit}>
          <Text className="font-manrope">{pending ? 'Approving' : 'Approve'}</Text>
        </Button>
        <Button testID="approve-cancel" variant="outline" className="h-12 rounded-xl" disabled={pending} onPress={onCancel}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
}
