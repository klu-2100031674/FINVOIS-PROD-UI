import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, FileText, Lock, Mail, MessageCircle, MessageSquare, Phone } from 'lucide-react-native';
import { AssignSheet } from '~/components/AssignSheet';
import { ErrorState } from '~/components/ErrorState';
import { LinkRow } from '~/components/LinkRow';
import { ScreenHeader } from '~/components/ScreenHeader';
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
  applicantOf,
  getRequest,
  invalidateAfterRequestChange,
  releaseRequest,
  requestKeys,
} from '~/api/adminRequests';
import type { RootStackParamList } from '~/navigation/types';
import { telUrl, whatsappUrl } from '~/utils/agentRequest';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate } from '~/utils/format';
import { REPORT_STATUS, WORKFLOW_STATUS } from '~/utils/status';
import { canAdminAssign, canAdminUnassign, staffHandlerName, workflowKey } from '~/utils/workflow';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminRequestDetail'>;

function Field({ label, children, testID }: { label: string; children: ReactNode; testID?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-2.5">
      <Text className="text-sm text-gray-500">{label}</Text>
      <View testID={testID} className="flex-1 items-end">{children}</View>
    </View>
  );
}

const value = (text: string, testID?: string) => (
  <Text testID={testID} className="text-right text-sm font-medium text-gray-900">{text}</Text>
);

const LOCKED_COPY = {
  ca_validation: {
    title: 'Locked: with CA',
    body: "The report is with the CA for validation, so the assigned staff can't be changed on this request.",
  },
  generated: {
    title: 'Report generated',
    body: "The report has been generated, so the assigned staff can't be changed on this request.",
  },
} as const;

export default function AdminRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const qc = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [linkError, setLinkError] = useState(false);

  const query = useQuery({ queryKey: requestKeys.detail(requestId), queryFn: () => getRequest(requestId) });
  const request = query.data;

  // Stays pending until the refetch lands, so the old Unassign button cannot be tapped a second time.
  const unassign = useMutation({
    mutationFn: () => releaseRequest(requestId),
    onSuccess: () => invalidateAfterRequestChange(qc),
    onError: () => void invalidateAfterRequestChange(qc),
  });

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Admin', { screen: 'Requests' }));

  const applicant = request ? applicantOf(request) : null;
  const key = request ? workflowKey(request) : null;
  const pill = key ? (WORKFLOW_STATUS[key] ?? WORKFLOW_STATUS.pending) : null;
  const handler = request ? staffHandlerName(request) : '';
  const report = request && typeof request.reportId === 'object' ? request.reportId : null;
  const reportPill = report?.validation_status ? REPORT_STATUS[report.validation_status] : null;
  const locked = key === 'ca_validation' || key === 'generated' ? LOCKED_COPY[key] : null;
  const department = request && typeof request.departmentId === 'object' ? request.departmentId?.name : undefined;
  const tel = telUrl(applicant?.phone);
  const wa = whatsappUrl(applicant?.phone);

  const openLink = async (url: string | null) => {
    if (!url) return;
    setLinkError(false);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title={applicant?.name ?? 'Request'} onBack={goBack} />

      {query.isLoading ? (
        <View testID="request-detail-loading" className="gap-3 px-5 pt-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
        </View>
      ) : !request || !applicant || !pill ? (
        <ErrorState message={apiErrorMessage(query.error, "Couldn't load this request. Try again.")} onRetry={() => void query.refetch()} />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-5 pb-10 pt-1"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
          <View className="gap-1 rounded-2xl border border-gray-200 bg-white p-4">
            <Text testID="applicant-name" className="font-manrope text-xl text-gray-900">{applicant.name}</Text>
            <View className="mb-1 mt-1 flex-row">
              <StatusPill testID="request-workflow" label={pill.label} tone={pill.tone} />
            </View>
            {applicant.phone ? (
              <View className="flex-row items-center gap-2 py-1">
                <Phone size={16} color="#6b7280" />
                <Text testID="applicant-phone" className="text-sm text-gray-700">{applicant.phone}</Text>
              </View>
            ) : null}
            {applicant.email ? (
              <View className="flex-row items-center gap-2 py-1">
                <Mail size={16} color="#6b7280" />
                <Text testID="applicant-email" className="text-sm text-gray-700">{applicant.email}</Text>
              </View>
            ) : null}
          </View>

          <View className="rounded-2xl border border-gray-200 bg-white px-4 py-2">
            {applicant.scheme ? <Field label="Scheme">{value(applicant.scheme, 'request-scheme')}</Field> : null}
            {department ? <Field label="Department">{value(department, 'request-department')}</Field> : null}
            <Field label="Submitted">{value(formatDate(request.createdAt) || 'Unknown')}</Field>
            <Field label="Handler">{value(handler || 'None', 'request-handler')}</Field>
            <Field label="Linked report" testID="linked-report">
              {report && reportPill ? (
                // StatusPill is self-start, so give it its own row to sit at the right edge like the other values.
                <View className="flex-row">
                  <StatusPill testID="report-status" label={reportPill.label} tone={reportPill.tone} />
                </View>
              ) : (
                value('No report yet', 'report-status')
              )}
            </Field>
          </View>

          {tel || wa ? (
            <View className="flex-row gap-3">
              <Button testID="call-button" variant="outline" disabled={!tel} onPress={() => void openLink(tel)} className="h-12 flex-1 rounded-xl">
                <Phone size={18} color="#111827" />
                <Text className="text-gray-900">Call</Text>
              </Button>
              <Button testID="whatsapp-button" variant="outline" disabled={!wa} onPress={() => void openLink(wa)} className="h-12 flex-1 rounded-xl">
                <MessageCircle size={18} color="#16a34a" />
                <Text className="text-gray-900">WhatsApp</Text>
              </Button>
            </View>
          ) : null}
          {linkError ? (
            <View accessibilityRole="alert" testID="link-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{"This device couldn't open that link. Try again from another app."}</Text>
            </View>
          ) : null}

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
            onPress={() => navigation.navigate('AgentDocuments', { requestId })}
          />
          <LinkRow
            testID="open-messages"
            icon={<MessageSquare size={20} color="#7c3aed" />}
            label="Messages"
            onPress={() => navigation.navigate('AgentMessages', { requestId })}
          />

          {report?.validation_status === 'approved' ? (
            <Button
              variant="outline"
              testID="view-report-pdf"
              onPress={() => navigation.navigate('PdfViewer', { source: 'request-report', id: request._id, title: applicant.name })}
              className="h-12 rounded-xl">
              <FileText size={18} color="#111827" />
              <Text className="text-gray-900">View report PDF</Text>
            </Button>
          ) : null}

          {canAdminAssign(request) ? (
            <Button testID="assign-button" onPress={() => setAssignOpen(true)} className="h-12 rounded-xl bg-black">
              <Text className="font-manrope text-base text-white">Assign to staff</Text>
            </Button>
          ) : null}

          {canAdminUnassign(request) ? (
            <Button
              variant="outline"
              testID="unassign-button"
              disabled={unassign.isPending}
              onPress={() => setConfirmOpen(true)}
              className="h-12 rounded-xl border-red-200">
              {unassign.isPending ? <ActivityIndicator color="#b91c1c" /> : <Text className="text-red-700">Unassign</Text>}
            </Button>
          ) : null}

          {locked ? (
            <View testID="locked-notice" className="flex-row gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <Lock size={20} color="#7c3aed" />
              <View className="flex-1 gap-1">
                <Text testID="locked-title" className="font-semibold text-gray-900">{locked.title}</Text>
                <Text className="text-sm text-gray-600">{locked.body}</Text>
              </View>
            </View>
          ) : null}

          {unassign.isError ? (
            <View accessibilityRole="alert" testID="action-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{apiErrorMessage(unassign.error, "Couldn't unassign this request. Try again.")}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      <AssignSheet visible={assignOpen} onClose={() => setAssignOpen(false)} requestId={requestId} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent testID="unassign-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {handler || 'The assigned staff member'} will no longer handle it, and it goes back to Pending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel testID="unassign-cancel"><Text>Keep assigned</Text></AlertDialogCancel>
            <AlertDialogAction testID="unassign-confirm" onPress={() => unassign.mutate()}>
              <Text>Unassign</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}
