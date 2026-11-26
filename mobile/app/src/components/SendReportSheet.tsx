import { useEffect, useRef, useState, type ComponentProps, type MutableRefObject, type Ref } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Mail, MessageCircle, Send, TriangleAlert, XCircle } from 'lucide-react-native';
import { whatsappConnected } from '~/api/adminReports';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import {
  CHANNELS,
  RECIPIENTS,
  buildRequest,
  defaultRecipients,
  emailError,
  mergeResults,
  phoneError,
  retryParts,
  sendErrorMessage,
  sendReport,
  type SendChannel,
  type SendPart,
  type SendRecipient,
  type SendResult,
  type SendRole,
} from '~/api/send';
import { useSendBlockedByIntegrity } from '~/security/deviceIntegrity';
import { cn } from '~/lib/utils';

// Props are the contract other screens rely on; keep them stable.
export interface SendReportSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Report to send (Report._id). */
  reportId: string;
  /** Who is sending: sets default recipients (admin: me + staff, agent: applicant). */
  role: SendRole;
  /** True when the linked request has an assigned or claiming staff member. */
  hasStaff: boolean;
  /** Prefilled applicant contact, editable in the sheet. */
  applicant?: { name?: string; phone?: string; email?: string };
  /** Called after at least one delivery succeeded so the caller can refetch. */
  onSent?: () => void;
}

const RECIPIENT_LABEL: Record<SendRecipient, string> = { me: 'Me', staff: 'Assigned staff', applicant: 'Applicant' };
const CHANNEL_LABEL: Record<SendChannel, string> = { whatsapp: 'WhatsApp', email: 'Email' };
const CHANNEL_ICON = { whatsapp: MessageCircle, email: Mail };

// The form state lives inside the Modal, which renders nothing while hidden, so every opening starts clean.
export function SendReportSheet(props: SendReportSheetProps) {
  // The Android back button must follow the same rules as Cancel (no closing mid-send, report what was delivered).
  const closeRef = useRef<(() => void) | null>(null);
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={() => (closeRef.current ?? props.onClose)()} statusBarTranslucent>
      <SheetBody {...props} closeRef={closeRef} />
    </Modal>
  );
}

function SheetBody({ onClose, reportId, role, hasStaff, applicant, onSent, closeRef }: SendReportSheetProps & { closeRef: MutableRefObject<(() => void) | null> }) {
  const insets = useSafeAreaInsets();
  const integrity = useSendBlockedByIntegrity();
  const emailRef = useRef<TextInput>(null);
  const inFlight = useRef(false);

  const [recipients, setRecipients] = useState<Set<SendRecipient>>(() => new Set(defaultRecipients(role, hasStaff)));
  const [channels, setChannels] = useState<Set<SendChannel>>(() => new Set(CHANNELS));
  const [phone, setPhone] = useState(applicant?.phone?.trim() ?? '');
  const [email, setEmail] = useState(applicant?.email?.trim() ?? '');
  const [touched, setTouched] = useState({ phone: false, email: false });
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only the CA may ask about the gateway. If the check itself fails, no warning: the delivery results will say.
  const whatsapp = useQuery({ queryKey: ['admin', 'whatsapp-status'], queryFn: whatsappConnected, enabled: role === 'admin', staleTime: 60000, retry: false });

  // Runs one or more requests in order. What already came back is kept even if a later request fails.
  const run = useMutation({
    mutationFn: async (parts: SendPart[]) => {
      const got: SendResult[] = [];
      let failure: string | null = null;
      for (const part of parts) {
        try {
          const outcome = await sendReport(reportId, buildRequest(part, { phone, email }));
          got.push(...outcome.results);
          failure = outcome.message ?? failure;
        } catch (err) {
          failure = sendErrorMessage(err);
          break;
        }
      }
      return { got, failure };
    },
    onSuccess: ({ got, failure }) => {
      if (got.length) setResults((prev) => mergeResults(prev ?? [], got));
      setError(failure);
    },
  });

  // The ref closes the gap before a re-render disables the button, so a fast double tap cannot send twice.
  const start = (parts: SendPart[]) => {
    if (inFlight.current || !parts.length) return;
    inFlight.current = true;
    setError(null);
    run.mutate(parts, { onSettled: () => (inFlight.current = false) });
  };

  const picked = RECIPIENTS.filter((r) => recipients.has(r) && (r !== 'staff' || hasStaff));
  const chosen = CHANNELS.filter((c) => channels.has(c));
  const phoneProblem = picked.includes('applicant') && chosen.includes('whatsapp') ? phoneError(phone) : null;
  const emailProblem = picked.includes('applicant') && chosen.includes('email') ? emailError(email) : null;
  const ready = picked.length > 0 && chosen.length > 0 && !phoneProblem && !emailProblem;

  const failed = results?.filter((r) => r.status === 'failed') ?? [];
  const delivered = (results?.length ?? 0) - failed.length;

  // `run.isPending` reaches the screen a tick after mutate(), so the ref is what blocks an immediate back press.
  const close = () => {
    if (inFlight.current || run.isPending) return;
    if (delivered > 0) onSent?.();
    onClose();
  };
  useEffect(() => {
    closeRef.current = close;
    return () => {
      closeRef.current = null;
    };
  });

  const toggle = <T,>(set: Set<T>, value: T, apply: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (!next.delete(value)) next.add(value);
    apply(next);
  };

  return (
    <KeyboardAvoidingView className="flex-1 justify-end bg-black/40" behavior="padding">
      <Pressable accessibilityLabel="Close" testID="send-sheet-backdrop" className="flex-1" onPress={close} />
      <View
        testID="send-sheet"
        className="max-h-[92%] rounded-t-3xl bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}>
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-300" />

        {results ? (
          <>
            <Text className="font-manrope text-xl text-gray-900">Delivery results</Text>
            <Text testID="send-summary" className="mb-4 mt-1 text-sm text-gray-600">
              {failed.length === 0
                ? `Delivered ${delivered} of ${results.length}.`
                : delivered === 0
                  ? 'Nothing was delivered.'
                  : `Delivered ${delivered} of ${results.length}. ${failed.length} failed.`}
            </Text>
            <ScrollView className="grow-0" testID="send-results">
              <View className="gap-2">
                {results.map((r) => (
                  <ResultRow key={`${r.recipient}-${r.channel}`} result={r} />
                ))}
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            <Text className="mb-4 font-manrope text-xl text-gray-900">Send report</Text>
            <ScrollView className="grow-0" keyboardShouldPersistTaps="handled">
              <View className="gap-5 pb-1">
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-gray-900">Recipients</Text>
                  <OptionRow
                    id="me"
                    label={role === 'admin' ? 'Me (CA)' : 'Me'}
                    checked={recipients.has('me')}
                    disabled={run.isPending}
                    onPress={() => toggle(recipients, 'me', setRecipients)}
                  />
                  <OptionRow
                    id="staff"
                    label="Assigned staff"
                    note={hasStaff ? undefined : 'No staff member is assigned to this request yet.'}
                    checked={recipients.has('staff') && hasStaff}
                    disabled={run.isPending || !hasStaff}
                    onPress={() => toggle(recipients, 'staff', setRecipients)}
                  />
                  <OptionRow
                    id="applicant"
                    label="Applicant"
                    note={applicant?.name?.trim() || undefined}
                    checked={recipients.has('applicant')}
                    disabled={run.isPending}
                    onPress={() => toggle(recipients, 'applicant', setRecipients)}
                  />
                  {recipients.has('applicant') ? (
                    <View testID="send-applicant-contact" className="gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      {chosen.includes('whatsapp') ? (
                        <ContactField
                          id="phone"
                          label="Applicant phone"
                          placeholder="10-digit number or +91..."
                          problem={touched.phone ? phoneProblem : null}
                          value={phone}
                          onChangeText={(t) => {
                            setPhone(t);
                            setTouched((s) => ({ ...s, phone: true }));
                          }}
                          editable={!run.isPending}
                          keyboardType="phone-pad"
                          autoComplete="off"
                          returnKeyType="next"
                          onSubmitEditing={() => emailRef.current?.focus()}
                        />
                      ) : null}
                      {chosen.includes('email') ? (
                        <ContactField
                          id="email"
                          label="Applicant email"
                          placeholder="name@example.com"
                          problem={touched.email ? emailProblem : null}
                          value={email}
                          onChangeText={(t) => {
                            setEmail(t);
                            setTouched((s) => ({ ...s, email: true }));
                          }}
                          editable={!run.isPending}
                          inputRef={emailRef}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="off"
                          returnKeyType="done"
                        />
                      ) : null}
                      {chosen.length === 0 ? <Text className="text-sm text-gray-600">Choose a channel to enter the contact.</Text> : null}
                    </View>
                  ) : null}
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-gray-900">Channels</Text>
                  <View className="flex-row gap-2">
                    {CHANNELS.map((c) => (
                      <ChannelChip
                        key={c}
                        channel={c}
                        selected={channels.has(c)}
                        disabled={run.isPending}
                        onPress={() => toggle(channels, c, setChannels)}
                      />
                    ))}
                  </View>
                  {picked.length === 0 || chosen.length === 0 ? (
                    <Text testID="send-hint" className="text-xs text-gray-600">Choose at least one recipient and one channel.</Text>
                  ) : null}
                  {whatsapp.data === false && chosen.includes('whatsapp') ? (
                    <View testID="send-whatsapp-offline" accessibilityRole="alert" className="flex-row items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <TriangleAlert size={16} color="#b45309" />
                      <Text className="flex-1 text-sm text-amber-800">The WhatsApp gateway is disconnected, so WhatsApp messages may fail.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </>
        )}

        {integrity.blocked ? <Banner testID="send-integrity-block">{integrity.message}</Banner> : null}
        {error ? <Banner testID="send-sheet-error">{error}</Banner> : null}

        <View className="mt-4 gap-2">
          {results ? (
            <>
              {failed.length > 0 ? (
                <Button
                  testID="retry-failed"
                  disabled={run.isPending || integrity.blocked}
                  onPress={() => start(retryParts(results))}
                  className="h-12 rounded-xl bg-black">
                  {run.isPending ? <ActivityIndicator color="#ffffff" /> : <Text className="font-manrope text-base text-white">Retry failed ({failed.length})</Text>}
                </Button>
              ) : null}
              <Button
                testID="send-done"
                variant={failed.length > 0 ? 'outline' : 'default'}
                disabled={run.isPending}
                onPress={close}
                className={cn('h-12 rounded-xl', failed.length === 0 && 'bg-black')}>
                <Text className={cn('font-manrope text-base', failed.length === 0 && 'text-white')}>Done</Text>
              </Button>
            </>
          ) : (
            <>
              <Button
                testID="send-confirm"
                disabled={!ready || run.isPending || integrity.blocked}
                onPress={() => start([{ recipients: picked, channels: chosen }])}
                className="h-12 rounded-xl bg-black">
                {run.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send size={18} color="#ffffff" />
                    <Text className="font-manrope text-base text-white">Send</Text>
                  </>
                )}
              </Button>
              <Button variant="ghost" testID="send-cancel" disabled={run.isPending} onPress={close} className="h-11 rounded-xl">
                <Text className="text-gray-700">Cancel</Text>
              </Button>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Banner({ testID, children }: { testID: string; children: string | null }) {
  return (
    <View accessibilityRole="alert" testID={testID} className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
      <Text className="text-sm text-red-700">{children}</Text>
    </View>
  );
}

interface OptionRowProps {
  id: SendRecipient;
  label: string;
  note?: string;
  checked: boolean;
  disabled: boolean;
  onPress: () => void;
}

function OptionRow({ id, label, note, checked, disabled, onPress }: OptionRowProps) {
  return (
    <Pressable
      testID={`recipient-${id}`}
      accessibilityRole="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      accessibilityLabel={note ? `${label}. ${note}` : label}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'min-h-12 flex-row items-center gap-3 rounded-2xl border px-4 py-2.5',
        checked ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white',
        disabled && 'opacity-60'
      )}>
      <View pointerEvents="none" aria-hidden>
        <Checkbox checked={checked} onCheckedChange={() => undefined} disabled={disabled} aria-label={label} className="size-5" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-gray-900">{label}</Text>
        {note ? <Text testID={`recipient-${id}-note`} className="text-sm text-gray-600">{note}</Text> : null}
      </View>
    </Pressable>
  );
}

function ChannelChip({ channel, selected, disabled, onPress }: { channel: SendChannel; selected: boolean; disabled: boolean; onPress: () => void }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <Pressable
      testID={`channel-${channel}`}
      accessibilityRole="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      accessibilityLabel={CHANNEL_LABEL[channel]}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full border px-4',
        selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white',
        disabled && 'opacity-60'
      )}>
      <Icon size={18} color={selected ? '#7c3aed' : '#4b5563'} />
      <Text className={cn('text-base font-semibold', selected ? 'text-purple-700' : 'text-gray-700')}>{CHANNEL_LABEL[channel]}</Text>
    </Pressable>
  );
}

interface ContactFieldProps extends ComponentProps<typeof TextInput> {
  id: 'phone' | 'email';
  label: string;
  problem: string | null;
  inputRef?: Ref<TextInput>;
}

function ContactField({ id, label, problem, inputRef, ...input }: ContactFieldProps) {
  return (
    <View className="gap-1.5">
      <Label nativeID={`send-applicant-${id}-label`}>{label}</Label>
      <Input
        ref={inputRef}
        testID={`send-applicant-${id}`}
        aria-labelledby={`send-applicant-${id}-label`}
        aria-invalid={problem ? true : undefined}
        className={cn('h-11 rounded-xl bg-white', problem && 'border-red-300')}
        {...input}
      />
      {problem ? (
        <Text testID={`send-applicant-${id}-error`} accessibilityRole="alert" className="text-xs text-red-700">{problem}</Text>
      ) : null}
    </View>
  );
}

function ResultRow({ result }: { result: SendResult }) {
  const ok = result.status === 'sent';
  const Icon = ok ? CheckCircle2 : XCircle;
  const key = `${result.recipient}-${result.channel}`;
  return (
    <View
      testID={`result-${key}`}
      className={cn('flex-row items-start gap-3 rounded-2xl border px-4 py-3', ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')}>
      <Icon size={20} color={ok ? '#15803d' : '#b91c1c'} />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-gray-900">{`${RECIPIENT_LABEL[result.recipient]} by ${CHANNEL_LABEL[result.channel]}`}</Text>
        <Text testID={`result-status-${key}`} className={cn('text-sm', ok ? 'text-green-800' : 'text-red-700')}>
          {ok ? 'Delivered' : `Failed${result.reason ? `: ${result.reason}` : ''}`}
        </Text>
      </View>
    </View>
  );
}
