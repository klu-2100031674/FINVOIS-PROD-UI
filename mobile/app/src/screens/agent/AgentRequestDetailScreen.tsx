import { useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, ClipboardList, Clock, FileText, Lock, Mail, MessageCircle, MessageSquare, Phone, Send, UserRound, X } from 'lucide-react-native';
import { ErrorState } from '~/components/ErrorState';
import { ExcelDownloadButton } from '~/components/ExcelDownloadButton';
import { LinkRow } from '~/components/LinkRow';
import { ScreenHeader } from '~/components/ScreenHeader';
import { SendReportSheet } from '~/components/SendReportSheet';
import { StatusPill } from '~/components/StatusPill';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  agentKeys,
  claimRequest,
  getRequest,
  invalidateAgentWork,
  listDocuments,
  releaseRequest,
} from '~/api/agentRequests';
import { useSession } from '~/auth/useSession';
import { useClaimClock } from '~/hooks/useClaimClock';
import type { RootStackParamList } from '~/navigation/types';
import { cn } from '~/lib/utils';
import {
  ACCESS_DENIED_MESSAGE,
  applicantOf,
  canClaim,
  canRelease,
  canSendToApplicant,
  departmentName,
  hasApprovedReport,
  isAccessDenied,
  isAssignedByCa,
  isReportPaid,
  isReportStatusChanging,
  reportOf,
  reportStatusNote,
  schemeLine,
  sendBlockedReason,
  telUrl,
  whatsappUrl,
  workflowKeyOf,
  workflowTimeline,
  type StepState,
} from '~/utils/agentRequest';
import { claimErrorMessage, claimMsLeft, formatClaimLeft, isClaimConflict, releaseErrorMessage } from '~/utils/claim';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate, formatTime } from '~/utils/format';
import { REPORT_STATUS, WORKFLOW_STATUS } from '~/utils/status';

type Props = NativeStackScreenProps<RootStackParamList, 'AgentRequestDetail'>;

const STATUS_POLL_MS = 15000; // same as the web request screen

const STEP_STYLE: Record<StepState, { circle: string; text: string }> = {
  done: { circle: 'bg-green-600', text: 'text-gray-900' },
  current: { circle: 'border-2 border-purple-600 bg-white', text: 'font-semibold text-purple-700' },
  todo: { circle: 'border border-gray-300 bg-white', text: 'text-gray-400' },
  rejected: { circle: 'bg-red-600', text: 'font-semibold text-red-700' },
};

function Timeline({ workflowKey }: { workflowKey: string }) {
  return (
    <View testID="workflow-timeline" className="gap-1">
      {workflowTimeline(workflowKey).map((step) => (
        <View
          key={step.key}
          testID={`step-${step.key}`}
          accessibilityLabel={`${step.label}: ${step.state}`}
          className="flex-row items-center gap-3 py-1.5">
          <View className={cn('h-6 w-6 items-center justify-center rounded-full', STEP_STYLE[step.state].circle)}>
            {step.state === 'done' ? <Check size={14} color="#ffffff" /> : null}
            {step.state === 'rejected' ? <X size={14} color="#ffffff" /> : null}
            {step.state === 'current' ? <View className="h-2 w-2 rounded-full bg-purple-600" /> : null}
          </View>
          <Text className={cn('text-sm', STEP_STYLE[step.state].text)}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SentChip({ testID, label }: { testID: string; label: string }) {
  return (
    <View testID={testID} className="flex-row items-center gap-1">
      <CheckCircle2 size={14} color="#15803d" />
      <Text className="text-xs font-medium text-green-800">{label}</Text>
    </View>
  );
}

const Banner = ({ testID, children }: { testID: string; children: string }) => (
  <View accessibilityRole="alert" testID={testID} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
    <Text className="text-sm text-red-700">{children}</Text>
  </View>
);

export default function AgentRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : '';
  const qc = useQueryClient();
  const focused = useIsFocused();
  const [sendOpen, setSendOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [pulling, setPulling] = useState(false);

  const query = useQuery({
    queryKey: agentKeys.request(requestId),
    queryFn: () => getRequest(requestId),
    staleTime: 0,
    networkMode: 'always',
    // CA review and payment happen elsewhere, so keep checking while the report is waiting on either.
    refetchInterval: (q) => {
      const data = q.state.data;
      const waiting = data && isReportStatusChanging(reportOf(data)?.validation_status);
      return focused && waiting ? STATUS_POLL_MS : false;
    },
  });
  const request = query.data;
  // Another agent's request, a missing one, or a bad id: nothing from an earlier load may stay on screen.
  const denied = query.isError && isAccessDenied(query.error);

  const documents = useQuery({
    queryKey: agentKeys.documents(requestId),
    queryFn: () => listDocuments(requestId),
    enabled: Boolean(request) && !denied,
    networkMode: 'always',
  });

  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Agent', { screen: 'My work', params: { tab: 'open' } });

  // Stay pending until the refetch lands, so Claim cannot be tapped again while the old state is still on screen.
  const claim = useMutation({
    mutationFn: () => claimRequest(requestId),
    onSuccess: () => invalidateAgentWork(qc, requestId),
    // Someone else may have got there first. Resync the lists but keep this screen's explanation: reloading the
    // request now would swap it for the access message.
    onError: (err) => void invalidateAgentWork(qc, isClaimConflict(err) ? undefined : requestId),
  });
  const release = useMutation({
    mutationFn: () => releaseRequest(requestId),
    onSuccess: async () => {
      await invalidateAgentWork(qc, requestId);
      goBack();
    },
    onError: () => void invalidateAgentWork(qc, requestId),
  });

  const now = useClaimClock(request ? [request] : [], () => void invalidateAgentWork(qc, requestId), focused && !denied);

  const open = async (url: string | null) => {
    if (!url) return;
    setLinkError(false);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(true);
    }
  };

  const onRefresh = async () => {
    setPulling(true);
    await invalidateAgentWork(qc, requestId);
    setPulling(false);
  };

  const applicant = request ? applicantOf(request) : null;
  const key = request ? workflowKeyOf(request) : 'pending';
  const pill = WORKFLOW_STATUS[key] ?? WORKFLOW_STATUS.pending;
  const report = request ? reportOf(request) : null;
  const reportPill = report ? (REPORT_STATUS[report.validation_status ?? ''] ?? { label: 'In progress', tone: 'gray' as const }) : null;
  const paid = isReportPaid(report);
  const amountDue = report && !paid && report.payment?.amount ? report.payment.amount : null;
  const blocked = request ? sendBlockedReason(request) : null;
  const department = request ? departmentName(request) : '';
  const staffOwner = request?.assignedTo?.name || request?.claimedBy?.name || '';
  const left = request ? claimMsLeft(request, now) : null;
  const tel = telUrl(applicant?.phone);
  const wa = whatsappUrl(applicant?.phone);
  const lostRace = claim.isError && isClaimConflict(claim.error);
  // Claim is the main action while the request is open, so Call steps back to an outline button.
  const claimFirst = request ? canClaim(request) && !lostRace : false;

  let releaseHint: string | null = null;
  if (request && !canClaim(request)) {
    if (isAssignedByCa(request, userId)) releaseHint = 'The CA assigned this request to you. Ask the CA to unassign it if you cannot take it.';
    else if (request.status === 'claimed' && !canRelease(request, userId)) releaseHint = 'Release is not available once report generation has started.';
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title={!denied && applicant ? applicant.name : 'Request'} onBack={goBack} />

      {denied ? (
        <View testID="access-denied" accessibilityRole="alert" className="items-center gap-3 px-6 py-16">
          <Lock size={36} color="#9ca3af" />
          <Text testID="access-denied-message" className="text-center font-manrope text-lg text-gray-900">{ACCESS_DENIED_MESSAGE}</Text>
          <Text className="text-center text-gray-500">It may belong to another agent, or it may no longer exist.</Text>
          <Button testID="access-denied-back" variant="outline" className="rounded-xl" onPress={goBack}>
            <Text>Back to My work</Text>
          </Button>
        </View>
      ) : query.isPending ? (
        <View testID="request-detail-loading" className="gap-3 px-5 pt-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </View>
      ) : !request || !applicant ? (
        <ErrorState message={apiErrorMessage(query.error, "Couldn't load this request. Try again.")} onRetry={() => void query.refetch()} />
      ) : (
        <ScrollView
          testID="request-detail"
          contentContainerClassName="gap-4 px-5 pb-10 pt-1"
          refreshControl={<RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          <View className="gap-1 rounded-2xl border border-gray-200 bg-white p-4">
            <Text testID="applicant-name" className="font-manrope text-xl text-gray-900">{applicant.name}</Text>
            <Text testID="request-scheme" className="text-sm text-gray-600">{schemeLine(request)}</Text>
            {department ? <Text testID="request-department" className="text-sm text-gray-600">Department: {department}</Text> : null}
            <View className="mb-1 mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill testID="request-workflow" label={pill.label} tone={pill.tone} />
              {left !== null ? (
                <View className="flex-row items-center gap-1">
                  <Clock size={14} color={left <= 5 * 60000 ? '#b45309' : '#6b7280'} />
                  <Text testID="claim-countdown" className={cn('text-sm', left <= 5 * 60000 ? 'font-medium text-amber-700' : 'text-gray-600')}>
                    {formatClaimLeft(left)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center gap-2 py-1">
              <Phone size={16} color="#6b7280" />
              <Text testID="applicant-phone" className="text-sm text-gray-700">{applicant.phone || 'No phone number'}</Text>
            </View>
            {applicant.email ? (
              <View className="flex-row items-center gap-2 py-1">
                <Mail size={16} color="#6b7280" />
                <Text testID="applicant-email" className="text-sm text-gray-700">{applicant.email}</Text>
              </View>
            ) : null}
            {staffOwner ? (
              <View className="flex-row items-center gap-2 py-1">
                <UserRound size={16} color="#6b7280" />
                <Text testID="request-staff-owner" className="text-sm text-gray-700">Handled by {staffOwner}</Text>
              </View>
            ) : null}
            <Text className="pt-1 text-xs text-gray-400">Submitted {formatDate(request.createdAt)}</Text>
          </View>

          {claimFirst ? (
            <Button testID="claim-button" disabled={claim.isPending} onPress={() => claim.mutate()} className="h-12 rounded-xl bg-black">
              {claim.isPending ? <ActivityIndicator color="#ffffff" /> : <Text className="font-manrope text-base text-white">Claim this request</Text>}
            </Button>
          ) : null}
          {claim.isError ? <Banner testID="claim-error">{claimErrorMessage(claim.error)}</Banner> : null}

          <View className="gap-2">
            <View className="flex-row gap-3">
              <Button
                testID="call-button"
                variant={claimFirst ? 'outline' : 'default'}
                disabled={!tel}
                onPress={() => void open(tel)}
                className={cn('h-12 flex-1 rounded-xl', !claimFirst && 'bg-black')}>
                <Phone size={18} color={claimFirst ? '#111827' : '#ffffff'} />
                <Text className={cn('font-manrope text-base', claimFirst ? 'text-gray-900' : 'text-white')}>Call</Text>
              </Button>
              <Button testID="whatsapp-button" variant="outline" disabled={!wa} onPress={() => void open(wa)} className="h-12 flex-1 rounded-xl">
                <MessageCircle size={18} color="#16a34a" />
                <Text className="font-manrope text-base text-gray-900">WhatsApp</Text>
              </Button>
            </View>
            {!tel ? <Text testID="no-phone" className="text-sm text-gray-500">No usable phone number on this request.</Text> : null}
            {linkError ? <Banner testID="link-error">{"This device couldn't open that link. Try again from another app."}</Banner> : null}
          </View>

          <LinkRow
            testID="open-form"
            icon={<ClipboardList size={20} color="#7c3aed" />}
            label="Application details"
            onPress={() => navigation.navigate('RequestForm', { requestId })}
          />
          <LinkRow
            testID="open-documents"
            icon={<FileText size={20} color="#7c3aed" />}
            label="Documents"
            detail={documents.data ? String(documents.data.documents.length) : undefined}
            onPress={() => navigation.navigate('AgentDocuments', { requestId })}
          />
          <LinkRow
            testID="open-messages"
            icon={<MessageSquare size={20} color="#7c3aed" />}
            label="Messages"
            onPress={() => navigation.navigate('AgentMessages', { requestId })}
          />

          <View className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="font-manrope text-base text-gray-900">Progress</Text>
            <Timeline workflowKey={key} />
            <Text testID="web-note" className="pt-1 text-sm text-gray-500">Reports are created on the web.</Text>
          </View>

          {report && reportPill ? (
            <View testID="report-card" className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-manrope text-base text-gray-900">Report</Text>
                <StatusPill testID="report-status" label={reportPill.label} tone={reportPill.tone} />
              </View>
              {report.title ? <Text testID="report-title" className="text-sm font-medium text-gray-900" numberOfLines={2}>{report.title}</Text> : null}
              {report.templateId ? <Text className="text-xs text-gray-500">{report.templateId}</Text> : null}
              <Text testID="report-note" className="text-sm text-gray-600">{reportStatusNote(report.validation_status)}</Text>
              {amountDue ? <Text testID="report-amount-due" className="text-sm font-medium text-amber-800">Amount due: ₹{amountDue.toLocaleString('en-IN')}</Text> : null}
              {request.emailSent || request.whatsAppSent ? (
                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  {request.emailSent ? <SentChip testID="sent-email" label="Sent by email" /> : null}
                  {request.whatsAppSent ? <SentChip testID="sent-whatsapp" label="Sent by WhatsApp" /> : null}
                </View>
              ) : null}
              {report.updatedAt ? (
                <Text className="text-xs text-gray-400">Last updated {formatDate(report.updatedAt)} {formatTime(report.updatedAt)}</Text>
              ) : null}
            </View>
          ) : null}

          {hasApprovedReport(request) ? (
            <Button
              variant="outline"
              testID="view-report-pdf"
              onPress={() => navigation.navigate('PdfViewer', { source: 'request-report', id: request._id, title: applicant.name })}
              className="h-12 rounded-xl">
              <FileText size={18} color="#111827" />
              <Text className="text-gray-900">View report PDF</Text>
            </Button>
          ) : null}

          {hasApprovedReport(request) && paid ? (
            <ExcelDownloadButton source="request-report" id={request._id} title={report?.title || applicant.name} />
          ) : null}

          {/* Convenience only: the server still requires an approved, paid report and ownership of this request. */}
          {canSendToApplicant(request) ? (
            <Button testID="send-to-applicant" disabled={Boolean(blocked)} onPress={() => setSendOpen(true)} className="h-12 rounded-xl bg-black">
              <Send size={18} color="#ffffff" />
              <Text className="font-manrope text-base text-white">Send to applicant</Text>
            </Button>
          ) : null}
          {blocked ? <Text testID="send-blocked" className="text-sm text-gray-500">{blocked}</Text> : null}

          {canRelease(request, userId) ? (
            <Button
              variant="outline"
              testID="release-button"
              disabled={release.isPending}
              onPress={() => setReleaseOpen(true)}
              className="h-12 rounded-xl border-red-200">
              {release.isPending ? <ActivityIndicator color="#b91c1c" /> : <Text className="text-red-700">Release request</Text>}
            </Button>
          ) : null}
          {releaseHint ? <Text testID="release-hint" className="text-sm text-gray-500">{releaseHint}</Text> : null}
          {release.isError ? <Banner testID="release-error">{releaseErrorMessage(release.error)}</Banner> : null}
        </ScrollView>
      )}

      {report ? (
        <SendReportSheet
          visible={sendOpen}
          onClose={() => setSendOpen(false)}
          reportId={report._id}
          role="customer_service"
          hasStaff
          applicant={applicant ?? undefined}
          onSent={() => void invalidateAgentWork(qc, requestId)}
        />
      ) : null}

      <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <AlertDialogContent testID="release-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Release this request?</AlertDialogTitle>
            <AlertDialogDescription>It goes back to Open and any agent can claim it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel testID="release-cancel"><Text>Keep it</Text></AlertDialogCancel>
            <AlertDialogAction testID="release-confirm" onPress={() => release.mutate()}>
              <Text>Release</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}
