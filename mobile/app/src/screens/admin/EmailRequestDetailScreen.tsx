import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Copy, Play, RotateCcw, Trash2 } from 'lucide-react-native';
import { AttachmentChip } from '~/components/email/AttachmentPicker';
import { ConfirmDialog } from '~/components/email/ConfirmDialog';
import { requestWhen } from '~/components/email/EmailRequestRow';
import { Notice } from '~/components/email/Notice';
import { RecipientsPanel } from '~/components/email/RecipientsPanel';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { StatusPill } from '~/components/StatusPill';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  cancelEmailRequest,
  cloneEmailRequest,
  deleteEmailRequest,
  emailKeys,
  getEmailRequest,
  retryFailedEmails,
} from '~/api/emailAutomation';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { emailPill, isActiveRequest, requestActions, runInfo } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';

const POLL_MS = 15000;
const SUMMARY_PARAMS = { page: 1, limit: 1 };

type Props = NativeStackScreenProps<RootStackParamList, 'EmailRequestDetail'>;
type Pending = 'retry' | 'remove' | null;

export default function EmailRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [confirming, setConfirming] = useState<Pending>(null);
  const focused = useIsFocused();
  const qc = useQueryClient();

  // Recipient addresses and bank details are on this screen.
  usePreventScreenCapture();

  const summary = useQuery({
    queryKey: emailKeys.requestPage(requestId, SUMMARY_PARAMS),
    queryFn: () => getEmailRequest(requestId, SUMMARY_PARAMS),
    refetchInterval: (q) => (focused && q.state.data && isActiveRequest(q.state.data.request) ? POLL_MS : false),
  });

  const refreshAll = () => qc.invalidateQueries({ queryKey: emailKeys.all });

  const act = useMutation({
    networkMode: 'always',
    mutationFn: async (fn: () => Promise<void>) => {
      await fn();
      await refreshAll();
    },
  });
  const reuse = useMutation({
    networkMode: 'always',
    mutationFn: () => cloneEmailRequest(requestId),
    onSuccess: async (copy) => {
      await qc.invalidateQueries({ queryKey: emailKeys.requests });
      navigation.navigate('EmailSchedule', { requestId: copy._id });
    },
  });
  const remove = useMutation({
    networkMode: 'always',
    mutationFn: () => deleteEmailRequest(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: emailKeys.requests });
      navigation.goBack();
    },
  });
  const busy = act.isPending || reuse.isPending || remove.isPending;
  const failure = act.error ?? reuse.error ?? remove.error;

  const request = summary.data?.request;
  const actions = request ? requestActions(request) : null;
  const pill = request ? emailPill(request.status) : null;
  const pending = request ? request.stats.pending + request.stats.scheduled + request.stats.processing : 0;
  const when = request ? [requestWhen(request), runInfo(request)].filter(Boolean).join(' · ') : '';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title={request?.name ?? 'Request details'} onBack={() => navigation.goBack()} />
      {summary.isPending ? (
        <View testID="email-detail-loading" className="gap-3 px-5 pt-1">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </View>
      ) : !request ? (
        <ErrorState message={apiErrorMessage(summary.error, "Couldn't load this request. Try again.")} onRetry={() => void summary.refetch()} />
      ) : (
        <ScrollView
          testID="email-detail"
          contentContainerClassName="gap-4 px-5 pb-8 pt-1"
          refreshControl={<RefreshControl refreshing={summary.isRefetching} onRefresh={() => void refreshAll()} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          <View className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            {pill ? <StatusPill testID="email-detail-status" label={pill.label} tone={pill.tone} /> : null}
            {request.file_name ? <Text className="text-sm text-gray-600">{request.file_name}</Text> : null}
            {request.template?.name ? <Text testID="email-detail-template" className="text-sm text-gray-600">Template: {request.template.name}</Text> : null}
            {request.template?.subject ? <Text className="text-sm text-gray-600">Subject: {request.template.subject}</Text> : null}
            <Text testID="email-detail-counts" className="text-sm text-gray-900">
              {request.stats.total} total · {request.stats.sent} sent · {pending} pending · {request.stats.failed} failed
            </Text>
            {when ? <Text className="text-xs text-gray-500">{when}</Text> : null}
            {request.last_error ? <Text testID="email-detail-last-error" className="text-xs text-red-700">{request.last_error}</Text> : null}
          </View>

          {request.attachments?.length ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700">Attachments</Text>
              {request.attachments.map((a) => <AttachmentChip key={a._id} file={a} />)}
            </View>
          ) : null}

          {failure ? <Notice tone="error" testID="email-action-error">{apiErrorMessage(failure, "That didn't work. Try again.")}</Notice> : null}

          <View className="gap-2">
            {actions?.resume ? (
              <Button testID="email-continue" disabled={busy} onPress={() => navigation.navigate('EmailSchedule', { requestId })} className="h-12 rounded-xl">
                <Play size={18} color="#fff" />
                <Text>Continue: pick template and schedule</Text>
              </Button>
            ) : null}
            {actions?.reuse ? (
              <Button testID="email-reuse" disabled={busy} variant="outline" onPress={() => reuse.mutate()} className="h-12 rounded-xl">
                {reuse.isPending ? <ActivityIndicator color="#7c3aed" /> : <Copy size={18} color="#7c3aed" />}
                <Text className="text-gray-900">Reuse these recipients</Text>
              </Button>
            ) : null}
            {actions?.retry ? (
              <Button testID="email-retry" disabled={busy} variant="outline" onPress={() => setConfirming('retry')} className="h-12 rounded-xl">
                <RotateCcw size={18} color="#2563eb" />
                <Text className="text-gray-900">Retry failed emails</Text>
              </Button>
            ) : null}
            {actions?.cancel ? (
              <Button testID="email-cancel" disabled={busy} variant="outline" onPress={() => act.mutate(() => cancelEmailRequest(requestId))} className="h-12 rounded-xl">
                {act.isPending ? <ActivityIndicator color="#d97706" /> : <Ban size={18} color="#d97706" />}
                <Text className="text-gray-900">Cancel schedule</Text>
              </Button>
            ) : null}
            {actions?.remove ? (
              <Button testID="email-delete" disabled={busy} variant="outline" onPress={() => setConfirming('remove')} className="h-12 rounded-xl">
                <Trash2 size={18} color="#b91c1c" />
                <Text className="text-red-700">Delete request</Text>
              </Button>
            ) : null}
          </View>

          <RecipientsPanel requestId={requestId} />
        </ScrollView>
      )}

      <ConfirmDialog
        open={confirming === 'retry'}
        title="Retry the failed emails?"
        body={`Sending starts again for the ${request?.stats.failed ?? 0} that failed, within about 30 seconds.`}
        confirm="Retry"
        onConfirm={() => act.mutate(() => retryFailedEmails(requestId))}
        onClose={() => setConfirming(null)}
        testID="retry-dialog"
      />
      <ConfirmDialog
        open={confirming === 'remove'}
        title="Delete this request?"
        body="The request and its records will be removed."
        confirm="Delete"
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirming(null)}
        testID="delete-request-dialog"
      />
    </SafeAreaView>
  );
}
