import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Folder, Pencil, Plus, Send } from 'lucide-react-native';
import { AttachmentPicker } from '~/components/email/AttachmentPicker';
import { ConfirmDialog } from '~/components/email/ConfirmDialog';
import { Notice } from '~/components/email/Notice';
import { PickerField } from '~/components/email/PickerField';
import { RecipientsPanel } from '~/components/email/RecipientsPanel';
import { SchedulePicker } from '~/components/email/SchedulePicker';
import { SelectedEmails } from '~/components/email/SelectedEmails';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  deleteEmailRequest,
  emailKeys,
  getEmailRequest,
  listEmailFolders,
  listEmailTemplates,
  listSelectedEmails,
  scheduleEmailRequest,
  scheduleFolders,
  type EmailAttachment,
  type SendPlan,
} from '~/api/emailAutomation';
import { useSession } from '~/auth/useSession';
import { cn } from '~/lib/utils';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { bodyToText, foldersColumns } from '~/utils/emailAutomation';
import { DEFAULT_SEND_TIME, timeLabel, toSendTime } from '~/utils/emailSchedule';
import { apiErrorMessage } from '~/utils/errors';

const SUMMARY_PARAMS = { page: 1, limit: 1 };
const COUNT_PARAMS = { page: 1, limit: 1 };

type Props = NativeStackScreenProps<RootStackParamList, 'EmailSchedule'>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="font-semibold text-gray-900">{title}</Text>
      {children}
    </View>
  );
}

export default function EmailScheduleScreen({ navigation, route }: Props) {
  // With a request id this continues a draft or a reused request. Without one it sends to folders.
  const requestId = route.params?.requestId;
  const [selected, setSelected] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [extraFiles, setExtraFiles] = useState<EmailAttachment[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [time, setTime] = useState(DEFAULT_SEND_TIME);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const qc = useQueryClient();
  const session = useSession();

  usePreventScreenCapture();

  // The Email tab sits in a different tab bar for each role.
  const backToEmail = (notice?: string) => {
    const params = { tab: 'schedule' as const, notice };
    if (session.status === 'signedIn' && session.user.role === 'admin') navigation.popTo('Admin', { screen: 'Email', params });
    else navigation.popTo('Agent', { screen: 'Email', params });
  };

  // A template just created or edited comes back from the form as a param.
  const picked = route.params?.pickedTemplateId;
  const [lastPicked, setLastPicked] = useState(picked);
  if (picked !== lastPicked) {
    setLastPicked(picked);
    if (picked) setTemplateId(picked);
  }

  const onDates = useCallback((update: (d: string[]) => string[]) => setDates(update), []);

  const templates = useQuery({ queryKey: emailKeys.templates, queryFn: listEmailTemplates });
  const folders = useQuery({ queryKey: emailKeys.folders, queryFn: listEmailFolders, enabled: !requestId });
  const draft = useQuery({
    queryKey: emailKeys.requestPage(requestId ?? '', SUMMARY_PARAMS),
    queryFn: () => getEmailRequest(requestId ?? '', SUMMARY_PARAMS),
    enabled: Boolean(requestId),
  });
  const request = draft.data?.request;

  const chosen = useMemo(() => (folders.data ?? []).filter((f) => selected.includes(f._id)), [folders.data, selected]);
  const unique = useQuery({
    queryKey: emailKeys.selected(selected, COUNT_PARAMS),
    queryFn: () => listSelectedEmails(selected, COUNT_PARAMS),
    enabled: selected.length > 0,
  });
  // The folder sum is only a stand-in until the unique count arrives: an email in two folders is sent once.
  const folderTotal = chosen.length ? unique.data?.pagination.total ?? chosen.reduce((n, f) => n + f.count, 0) : 0;
  const total = requestId ? request?.counts.valid ?? 0 : folderTotal;
  const columns = useMemo(() => (requestId ? request?.columns ?? [] : foldersColumns(chosen)), [requestId, request, chosen]);
  const template = templates.data?.find((t) => t._id === templateId);
  const canSend = total > 0 && Boolean(templateId);
  const blocked = request ? request.counts.total - request.counts.valid : 0;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const send = useMutation({
    networkMode: 'always',
    mutationFn: async (now: boolean) => {
      const plan: SendPlan = {
        templateId,
        attachmentIds: extraFiles.map((f) => f._id),
        ...(now ? { scheduledAt: new Date().toISOString() } : { scheduledDates: dates.map((d) => toSendTime(d, time)) }),
      };
      if (requestId) await scheduleEmailRequest(requestId, plan);
      else await scheduleFolders(selected, plan);
      await qc.invalidateQueries({ queryKey: emailKeys.all });
    },
    onSuccess: (_data, now) => {
      const notice = now
        ? 'Sending starts within about 30 seconds.'
        : `Scheduled for ${dates.length} date${dates.length === 1 ? '' : 's'} at ${timeLabel(time)} IST.`;
      backToEmail(notice);
    },
  });
  const discard = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      await deleteEmailRequest(requestId ?? '');
      await qc.invalidateQueries({ queryKey: emailKeys.requests });
    },
    onSuccess: () => backToEmail(),
  });
  const openTemplate = (id?: string) =>
    navigation.navigate('EmailTemplateForm', { templateId: id, columns, returnToSchedule: true });

  const loading = requestId ? draft.isPending : folders.isPending;
  const failed = requestId ? draft.isError && !request : folders.isError && !folders.data;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title={requestId ? request?.name ?? 'Schedule' : 'Schedule new emails'} onBack={() => navigation.goBack()} />
      {loading ? (
        <View testID="schedule-loading" className="gap-3 px-5 pt-1">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </View>
      ) : failed ? (
        <ErrorState
          message={apiErrorMessage(requestId ? draft.error : folders.error, "Couldn't load this. Try again.")}
          onRetry={() => void (requestId ? draft.refetch() : folders.refetch())}
        />
      ) : (
        <ScrollView testID="schedule-form" contentContainerClassName="gap-4 px-5 pb-8 pt-1" keyboardShouldPersistTaps="handled">
          {requestId ? (
            <Section title="1. Review">
              {request?.cloned_from ? <Notice tone="info" testID="reuse-note">Reusing recipients from a sent request. Pick a template and new dates.</Notice> : null}
              {blocked > 0 ? (
                <Notice tone="warning" testID="blocked-note">
                  {`${blocked} records are invalid, duplicate or incomplete and won't be sent. Only ${request?.counts.valid ?? 0} valid records will be emailed.`}
                </Notice>
              ) : null}
              <RecipientsPanel requestId={requestId} />
              <Button testID="discard-request" variant="outline" disabled={discard.isPending} onPress={() => setConfirmDiscard(true)} className="h-11 rounded-xl">
                <Text className="text-red-700">Discard this request</Text>
              </Button>
              {discard.isError ? <Notice tone="error" testID="discard-error">{apiErrorMessage(discard.error, "Couldn't discard it. Try again.")}</Notice> : null}
            </Section>
          ) : (
            <Section title="1. Email folders">
              {(folders.data ?? []).length === 0 ? (
                <Text testID="no-folders" className="text-sm text-gray-500">No folders yet. Create one in the Data tab and add an Excel file to it.</Text>
              ) : null}
              {(folders.data ?? []).map((f) => {
                const on = selected.includes(f._id);
                return (
                  <Pressable
                    key={f._id}
                    testID={`pick-folder-${f._id}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: !f.count }}
                    disabled={!f.count}
                    onPress={() => toggle(f._id)}
                    className={cn('min-h-12 flex-row items-center gap-3 rounded-xl border px-3 py-2', on ? 'border-purple-500 bg-purple-50' : 'border-gray-200', !f.count && 'opacity-50')}>
                    <View pointerEvents="none">
                      <Checkbox checked={on} onCheckedChange={() => undefined} />
                    </View>
                    <Folder size={18} color="#7c3aed" />
                    <Text className="flex-1 text-base text-gray-900" numberOfLines={1}>{f.name}</Text>
                    <Text className="text-xs text-gray-500">{f.count} email{f.count === 1 ? '' : 's'}</Text>
                  </Pressable>
                );
              })}
              {chosen.length > 0 ? (
                <>
                  <Text testID="selected-summary" className="text-xs text-gray-500">
                    {chosen.length} folder{chosen.length === 1 ? '' : 's'}, {total} unique email{total === 1 ? '' : 's'}.
                    {chosen.length > 1 ? ' An email in more than one folder is sent once.' : ''} Each send date uses the folders as they are on that day, so emails added later are included.
                  </Text>
                  <SelectedEmails folderIds={selected} folders={folders.data ?? []} columns={columns} />
                </>
              ) : null}
            </Section>
          )}

          <Section title="2. Template">
            {templates.isError && !templates.data ? (
              <Notice tone="error" testID="templates-error">{apiErrorMessage(templates.error, "Couldn't load the templates. Try again.")}</Notice>
            ) : null}
            <PickerField
              label="Template"
              placeholder="Select a template"
              value={templateId}
              options={(templates.data ?? []).map((t) => ({ value: t._id, label: t.name }))}
              onChange={setTemplateId}
              testID="pick-template"
            />
            <Button testID="schedule-new-template" variant="outline" onPress={() => openTemplate()} className="h-11 rounded-xl">
              <Plus size={16} color="#7c3aed" />
              <Text className="text-gray-900">New template</Text>
            </Button>
            {template ? (
              <View testID="template-preview" className="gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs font-semibold text-gray-500">Selected template</Text>
                  <Pressable testID="edit-template" accessibilityRole="button" onPress={() => openTemplate(template._id)} className="min-h-9 flex-row items-center gap-1">
                    <Pencil size={14} color="#7c3aed" />
                    <Text className="text-xs font-medium text-purple-700">Edit template</Text>
                  </Pressable>
                </View>
                <Text testID="template-preview-subject" className="text-sm font-medium text-gray-900">Subject: {template.subject}</Text>
                <Text testID="template-preview-body" className="border-t border-gray-100 pt-2 text-sm text-gray-700">{bodyToText(template.body)}</Text>
                <Text className="text-xs text-gray-500">{'Placeholders like {{bank}} are filled in per recipient when sent. Formatting from the web shows in the email, not here.'}</Text>
              </View>
            ) : null}
            <AttachmentPicker
              label="Attachments for this send (template files and extra files)"
              files={extraFiles}
              onChange={setExtraFiles}
              locked={template?.attachments ?? []}
            />
          </Section>

          <Section title="3. Schedule">
            {requestId ? <Text className="text-sm text-gray-500">The same recipients get the email on every selected date.</Text> : null}
            <SchedulePicker dates={dates} onDates={onDates} time={time} onTime={setTime} />
            {send.isError ? <Notice tone="error" testID="schedule-error">{apiErrorMessage(send.error, "Couldn't schedule the emails. Try again.")}</Notice> : null}
            <Button testID="schedule-submit" disabled={!canSend || !dates.length || send.isPending} onPress={() => send.mutate(false)} className="h-12 rounded-xl">
              {send.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Clock size={18} color="#fff" />
                  <Text>Schedule</Text>
                </>
              )}
            </Button>
            <Button testID="send-now" variant="outline" disabled={!canSend || send.isPending} onPress={() => setConfirmSend(true)} className="h-12 rounded-xl">
              <Send size={18} color="#7c3aed" />
              <Text className="text-gray-900">Send now</Text>
            </Button>
            {!canSend || !dates.length ? (
              <Text testID="schedule-needs" className="text-xs text-gray-500">
                {requestId ? 'Needs at least one valid record, a template and a date.' : 'Needs at least one folder with emails, a template and a date.'}
              </Text>
            ) : null}
          </Section>
        </ScrollView>
      )}

      <ConfirmDialog
        open={confirmSend}
        title={`Send to ${total} email${total === 1 ? '' : 's'} now?`}
        body="Sending starts within about 30 seconds and can't be recalled once it goes out."
        confirm="Send now"
        onConfirm={() => send.mutate(true)}
        onClose={() => setConfirmSend(false)}
        testID="send-now-dialog"
      />
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this request?"
        body="The request and its records will be removed."
        confirm="Discard"
        onConfirm={() => discard.mutate()}
        onClose={() => setConfirmDiscard(false)}
        testID="discard-dialog"
      />
    </SafeAreaView>
  );
}
