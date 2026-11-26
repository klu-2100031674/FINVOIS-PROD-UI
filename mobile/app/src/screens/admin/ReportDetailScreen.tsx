import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, Send } from 'lucide-react-native';
import { ApproveReportSheet } from '~/components/ApproveReportSheet';
import { ExcelDownloadButton } from '~/components/ExcelDownloadButton';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { ErrorState } from '~/components/ErrorState';
import { RejectReportSheet } from '~/components/RejectReportSheet';
import { ScreenHeader } from '~/components/ScreenHeader';
import { SendReportSheet } from '~/components/SendReportSheet';
import { StatusPill } from '~/components/StatusPill';
import { isTheoryReport, reportActionsFor, reportCompanyName, type AdminReport, type ApproveInput, type RejectInput } from '~/api/adminReports';
import { REPORT_KEY, useReport, useReportActions, useReportContext } from '~/hooks/useAdminReportsDetail';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate } from '~/utils/format';
import { WORKFLOW_STATUS, reportPill } from '~/utils/status';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportDetail'>;
type Notice = { kind: 'ok' | 'error'; text: string };

const PAYMENT_LABEL: Record<string, string> = { completed: 'Paid', pending: 'Pending' };

// `half` is for fields inside a Pair (a row). flex-1 in a column would collapse to zero height on native.
function Field({ label, value, testID, half }: { label: string; value?: string | null; testID?: string; half?: boolean }) {
  if (!value) return null;
  return (
    <View className={half ? 'min-w-0 flex-1 gap-0.5' : 'gap-0.5'}>
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text testID={testID} className="text-base text-gray-900">{value}</Text>
    </View>
  );
}

// Two short fields side by side keep the card compact, so the review buttons stay within reach of the first screen.
const Pair = ({ children }: { children: ReactNode }) => <View className="flex-row gap-4">{children}</View>;

function Card({ title, children, testID }: { title: string; children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="font-manrope text-base text-gray-900">{title}</Text>
      {children}
    </View>
  );
}

export default function ReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  // Applicant contact details and the review state are on screen (doc 06 section 6).
  usePreventScreenCapture();
  const qc = useQueryClient();
  const report = useReport(reportId);
  const context = useReportContext(reportId);
  const actions = useReportActions(reportId);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Admin', { screen: 'Reports' });

  const fail = (err: unknown) => setNotice({ kind: 'error', text: apiErrorMessage(err) });

  const markUnderReview = () => {
    // A report already sent back once goes through the re-review route, as on the web.
    if (report.data?.is_re_review) return reReview();
    setNotice(null);
    actions.review.mutate(undefined, {
      onSuccess: () => setNotice({ kind: 'ok', text: 'Report marked as under review.' }),
      onError: fail,
    });
  };

  const reReview = () => {
    setNotice(null);
    actions.reReview.mutate(undefined, {
      onSuccess: () => setNotice({ kind: 'ok', text: 'Report moved to under review for re-review.' }),
      onError: fail,
    });
  };

  const approve = (input: ApproveInput) => {
    setApproveError(null);
    setNotice(null);
    actions.approve.mutate(input, {
      onSuccess: () => {
        setApproveOpen(false);
        setNotice({ kind: 'ok', text: 'Report approved.' });
      },
      onError: (err) => setApproveError(apiErrorMessage(err)),
    });
  };

  const reject = (input: RejectInput) => {
    setRejectError(null);
    actions.reject.mutate(input, {
      onSuccess: () => {
        setRejectOpen(false);
        setNotice({ kind: 'ok', text: 'Report rejected.' });
      },
      onError: (err) => setRejectError(apiErrorMessage(err)),
    });
  };

  if (report.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <ScreenHeader title="Report" onBack={goBack} />
        <View testID="report-loading" className="gap-4 px-5">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (report.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <ScreenHeader title="Report" onBack={goBack} />
        <ErrorState message={apiErrorMessage(report.error, "Couldn't load this report. Check your connection and try again.")} onRetry={() => void report.refetch()} />
      </SafeAreaView>
    );
  }

  const r: AdminReport = report.data;
  const status = reportPill(r.validation_status, r.is_re_review);
  const can = reportActionsFor(r.validation_status);
  const paid = r.payment?.status === 'completed';
  const amount = typeof r.payment?.amount === 'number' ? `₹${r.payment.amount.toLocaleString('en-IN')}` : undefined;
  const ctx = context.data;
  const handler = ctx?.assignedTo ?? ctx?.claimedBy;
  const workflow = ctx?.workflow ? WORKFLOW_STATUS[ctx.workflow.key] : undefined;
  const reviewedBy = [r.validated_by?.name, formatDate(r.validated_at)].filter(Boolean).join(' on ');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader
        title={r.client_name || r.title || 'Report'}
        onBack={goBack}
        right={<StatusPill testID="report-status" label={status.label} tone={status.tone} />}
      />
      <ScrollView testID="report-detail" contentContainerClassName="gap-4 px-5 pb-10 pt-1">
        {notice ? (
          <View
            accessibilityRole="alert"
            testID={notice.kind === 'ok' ? 'action-success' : 'action-error'}
            className={notice.kind === 'ok' ? 'flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3' : 'rounded-xl border border-red-200 bg-red-50 p-3'}>
            {notice.kind === 'ok' ? <CheckCircle2 size={18} color="#15803d" /> : null}
            <Text className={notice.kind === 'ok' ? 'flex-1 text-sm text-green-800' : 'text-sm text-red-700'}>{notice.text}</Text>
          </View>
        ) : null}

        <Card title="Report" testID="report-card">
          <Field label="Title" value={r.title} testID="report-title" />
          <Field label="Client" value={r.client_name} />
          <Pair>
            <Field half label="Report type" value={r.templateId || r.report_type} testID="report-type" />
            <Field half label="Created" value={formatDate(r.createdAt)} />
          </Pair>
          <Pair>
            <Field half label="Applicant" value={r.user_id?.name} testID="report-applicant" />
            <Field half label="Phone" value={r.user_id?.phone} />
          </Pair>
          <Field label="Email" value={r.user_id?.email} />
          <Field label="Company" value={reportCompanyName(r)} testID="report-company" />
          <Field label="Nature of business" value={r.nature_of_business} testID="report-nature" />
          <Pair>
            <Field half label="Project cost" value={r.project_cost !== undefined ? String(r.project_cost) : undefined} />
            <Field half label="Term period" value={r.term_period !== undefined ? String(r.term_period) : undefined} />
          </Pair>
          <Pair>
            <Field half label="Payment" value={r.payment?.status ? (PAYMENT_LABEL[r.payment.status] ?? r.payment.status) : undefined} testID="report-payment" />
            <Field half label="Amount" value={amount} testID="report-amount" />
          </Pair>
          <Field label="Reviewed" value={reviewedBy} />
          <Field label="Rejection reason" value={r.rejection_reason} testID="report-rejection-reason" />
          <Field label="Review notes" value={r.validation_notes} testID="report-notes" />
          <Field label="User comment" value={r.user_comment} testID="report-user-comment" />
        </Card>

        <Card title="Handler" testID="handler-card">
          {context.isPending ? (
            <Skeleton testID="handler-loading" className="h-10 rounded-xl" />
          ) : context.isError ? (
            <View className="gap-2">
              <Text testID="handler-error" className="text-sm text-gray-600">Handler details are not available right now.</Text>
              <Button size="sm" variant="outline" className="self-start rounded-xl" onPress={() => void context.refetch()}>
                <Text>Retry</Text>
              </Button>
            </View>
          ) : ctx?.requestId ? (
            <View className="gap-3">
              {workflow ? <StatusPill testID="handler-workflow" label={workflow.label} tone={workflow.tone} /> : null}
              <Field label="Handled by" value={handler?.name ?? 'Not assigned'} testID="handler-name" />
              <Button
                testID="open-request"
                variant="outline"
                className="h-11 rounded-xl"
                onPress={() => navigation.navigate('AdminRequestDetail', { requestId: ctx.requestId as string })}>
                <Text>Open request</Text>
              </Button>
            </View>
          ) : (
            <Text testID="handler-none" className="text-sm text-gray-600">No request is linked to this report.</Text>
          )}
        </Card>

        <View className="gap-3">
          <Button
            testID="view-pdf"
            variant="outline"
            className="h-12 rounded-xl"
            onPress={() => navigation.navigate('PdfViewer', { source: 'admin-report', id: reportId })}>
            <FileText size={18} color="#111827" />
            <Text>View report PDF</Text>
          </Button>

          {!isTheoryReport(r) ? <ExcelDownloadButton source="admin-report" id={reportId} title={r.title || r.client_name} /> : null}

          {can.approve || can.reject ? (
            <View className="flex-row gap-3">
              {can.approve ? (
                <Button
                  testID="approve"
                  className="h-12 flex-1 rounded-xl"
                  disabled={actions.busy}
                  onPress={() => {
                    setApproveError(null);
                    setApproveOpen(true);
                  }}>
                  <Text className="font-manrope">{actions.approve.isPending ? 'Approving' : 'Approve'}</Text>
                </Button>
              ) : null}
              {can.reject ? (
                <Button
                  testID="reject"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-red-200"
                  disabled={actions.busy}
                  onPress={() => {
                    setRejectError(null);
                    setRejectOpen(true);
                  }}>
                  <Text className="font-manrope text-red-700">Reject</Text>
                </Button>
              ) : null}
            </View>
          ) : null}

          {can.review ? (
            <Button testID="mark-review" variant="outline" className="h-12 rounded-xl" disabled={actions.busy} onPress={markUnderReview}>
              <Text>{actions.review.isPending ? 'Marking under review' : 'Mark under review'}</Text>
            </Button>
          ) : null}

          {can.reReview ? (
            <Button testID="start-re-review" variant="outline" className="h-12 rounded-xl" disabled={actions.busy} onPress={reReview}>
              <Text>{actions.reReview.isPending ? 'Starting re-review' : 'Start re-review'}</Text>
            </Button>
          ) : null}

          {can.send ? (
            <View className="gap-2">
              <Button testID="send-report" className="h-12 rounded-xl" disabled={!paid} onPress={() => setSendOpen(true)}>
                <Send size={18} color="#ffffff" />
                <Text className="font-manrope">Send report</Text>
              </Button>
              {!paid ? (
                <Text testID="send-blocked" className="text-center text-sm text-gray-600">
                  Payment is not complete yet. The report can be sent once it is.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ApproveReportSheet
        visible={approveOpen}
        onClose={() => setApproveOpen(false)}
        report={r}
        onSubmit={approve}
        pending={actions.approve.isPending}
        error={approveError}
      />

      <RejectReportSheet
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={reject}
        pending={actions.reject.isPending}
        error={rejectError}
      />

      <SendReportSheet
        visible={sendOpen}
        onClose={() => setSendOpen(false)}
        reportId={reportId}
        role="admin"
        hasStaff={Boolean(ctx?.assignedTo || ctx?.claimedBy)}
        applicant={{ name: r.user_id?.name, phone: r.user_id?.phone, email: r.user_id?.email }}
        onSent={() => void qc.invalidateQueries({ queryKey: REPORT_KEY })}
      />
    </SafeAreaView>
  );
}
