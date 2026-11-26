import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react-native';
import { ErrorState } from '~/components/ErrorState';
import { StatusPill } from '~/components/StatusPill';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  deleteEmailRecipient,
  emailKeys,
  getEmailRequest,
  type EmailColumn,
  type EmailRecipient,
  type ListParams,
} from '~/api/emailAutomation';
import { cn } from '~/lib/utils';
import { canEditRecipients, canRemoveRecipient, emailPill, isActiveRequest } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate, formatTime } from '~/utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import { Notice } from './Notice';
import { PageControls } from './PageControls';

const POLL_MS = 15000;
const PAGE_SIZE = 25;
const FILTERS = ['', 'valid', 'invalid', 'duplicate', 'incomplete'] as const;

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Text className="text-sm text-gray-600" numberOfLines={2}>
      <Text className="text-sm text-gray-500">{label}: </Text>
      {value}
    </Text>
  );
}

function RecipientCard({ r, columns, onRemove, busy }: { r: EmailRecipient; columns: EmailColumn[] | null; onRemove?: () => void; busy: boolean }) {
  const validation = emailPill(r.validation);
  const status = emailPill(r.status);
  return (
    <View testID={`recipient-${r._id}`} className="gap-1.5 rounded-2xl border border-gray-200 bg-white p-3">
      <View className="flex-row items-start gap-2">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text testID={`recipient-email-${r._id}`} className="text-base font-medium text-gray-900" numberOfLines={1}>{r.email || 'No email'}</Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>{[`Row ${r.row_number ?? ''}`, r.source].filter(Boolean).join(' · ')}</Text>
        </View>
        {onRemove ? (
          <Pressable
            testID={`recipient-remove-${r._id}`}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${r.email || 'this record'}`}
            disabled={busy}
            onPress={onRemove}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-red-50">
            <Trash2 size={18} color={busy ? '#d1d5db' : '#b91c1c'} />
          </Pressable>
        ) : null}
      </View>
      <Field label="Bank" value={r.bank} />
      {columns ? (
        // The bank's own column would only repeat the line above.
        columns.map((c) => (r.data?.[c.key] === r.bank ? null : <Field key={c.key} label={c.label} value={r.data?.[c.key]} />))
      ) : (
        <>
          <Field label="Bank address" value={r.bank_address} />
          <Field label="Office" value={r.office || r.region} />
        </>
      )}
      <View className="flex-row flex-wrap items-center gap-2 pt-0.5">
        <StatusPill testID={`recipient-validation-${r._id}`} label={validation.label} tone={validation.tone} />
        <StatusPill testID={`recipient-status-${r._id}`} label={status.label} tone={status.tone} />
        {r.sent_at ? <Text className="text-xs text-gray-500">{formatDate(r.sent_at)}, {formatTime(r.sent_at)}</Text> : null}
      </View>
      {r.validation_errors?.length ? <Text className="text-xs text-red-700">{r.validation_errors.join(', ')}</Text> : null}
      {r.error ? <Text testID={`recipient-error-${r._id}`} className="text-xs text-red-700">{r.error}</Text> : null}
    </View>
  );
}

export function RecipientsPanel({ requestId }: { requestId: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('');
  const [page, setPage] = useState(1);
  const [toRemove, setToRemove] = useState<EmailRecipient | null>(null);
  const focused = useIsFocused();
  const qc = useQueryClient();

  const params: ListParams = { page, limit: PAGE_SIZE, validation: filter };
  const query = useQuery({
    queryKey: emailKeys.requestPage(requestId, params),
    queryFn: () => getEmailRequest(requestId, params),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (focused && q.state.data && isActiveRequest(q.state.data.request) ? POLL_MS : false),
  });

  const remove = useMutation({
    networkMode: 'always',
    mutationFn: async (r: EmailRecipient) => {
      await deleteEmailRecipient(requestId, r._id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: emailKeys.request(requestId) }),
        qc.invalidateQueries({ queryKey: emailKeys.requests }),
      ]);
    },
  });

  if (query.isPending) {
    return (
      <View testID="recipients-loading" className="gap-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </View>
    );
  }
  if (!query.data) {
    return <ErrorState message={apiErrorMessage(query.error, "Couldn't load the records. Try again.")} onRetry={() => void query.refetch()} />;
  }

  const { request, recipients, pagination } = query.data;
  const c = request.counts;
  const counts: Record<(typeof FILTERS)[number], number> = { '': c.total, valid: c.valid, invalid: c.invalid, duplicate: c.duplicate, incomplete: c.incomplete };
  const editable = canEditRecipients(request.status);
  // Requests uploaded before columns were set up have none, and show the fixed fields instead.
  const columns = request.columns?.length ? request.columns.filter((col) => col.key !== 'email') : null;

  return (
    <View testID="recipients-panel" className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Pressable
            key={f || 'all'}
            testID={`recipient-filter-${f || 'all'}`}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            onPress={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn('min-h-9 justify-center rounded-full border px-3', filter === f ? 'border-purple-600 bg-purple-600' : 'border-gray-200 bg-white')}>
            <Text className={cn('text-sm', filter === f ? 'font-medium text-white' : 'text-gray-700')}>
              {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} {counts[f]}
            </Text>
          </Pressable>
        ))}
      </View>
      {query.isFetching && query.isPlaceholderData ? <ActivityIndicator color="#7c3aed" /> : null}
      {query.isError ? <Notice tone="error" testID="recipients-refresh-error">{apiErrorMessage(query.error, "Couldn't refresh the records.")} Try again in a moment.</Notice> : null}
      {remove.isError ? <Notice tone="error" testID="recipient-remove-error">{apiErrorMessage(remove.error, "Couldn't remove the record. Try again.")}</Notice> : null}
      {recipients.length === 0 ? <Text testID="recipients-empty" className="py-6 text-center text-gray-500">No records</Text> : null}
      {recipients.map((r) => (
        <RecipientCard
          key={r._id}
          r={r}
          columns={columns}
          busy={remove.isPending}
          onRemove={editable && canRemoveRecipient(r.status) ? () => setToRemove(r) : undefined}
        />
      ))}
      <PageControls pagination={pagination} noun="record" onPage={setPage} testID="recipients" />
      <ConfirmDialog
        open={toRemove !== null}
        title="Remove this record?"
        body={`${toRemove?.email || `Row ${toRemove?.row_number ?? ''}`} won't get this email.`}
        confirm="Remove"
        onConfirm={() => toRemove && remove.mutate(toRemove)}
        onClose={() => setToRemove(null)}
        testID="remove-recipient-dialog"
      />
    </View>
  );
}
