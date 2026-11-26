import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UserRound } from 'lucide-react-native';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { RequestFilters } from '~/components/RequestFilters';
import { ScreenHeader } from '~/components/ScreenHeader';
import { StatusPill } from '~/components/StatusPill';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { applicantOf, listRequests, requestKeys, type AdminRequest } from '~/api/adminRequests';
import type { AdminTabParamList, RootStackParamList } from '~/navigation/types';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate } from '~/utils/format';
import { EMPTY_FILTERS, departmentOf, matchesSearch, uniqueDepartments, type QueueFilters } from '~/utils/queueFilters';
import { WORKFLOW_STATUS } from '~/utils/status';
import { isStaffed, staffHandlerName, workflowKey } from '~/utils/workflow';
import { cn } from '~/lib/utils';

type Segment = 'pending' | 'assigned' | 'all';

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'all', label: 'All' },
];

// Pending = nothing started and nobody owns it. Assigned = a staff member owns it, whatever stage it reached.
const inSegment = (r: AdminRequest, s: Segment) =>
  s === 'all' || (s === 'pending' ? workflowKey(r) === 'pending' : isStaffed(r));

function RequestRow({ request, onPress }: { request: AdminRequest; onPress: () => void }) {
  const key = workflowKey(request);
  const pill = WORKFLOW_STATUS[key] ?? WORKFLOW_STATUS.pending;
  const { name, scheme } = applicantOf(request);
  const handler = staffHandlerName(request);
  const meta = [scheme, formatDate(request.createdAt)].filter(Boolean).join(' · ');

  return (
    <Pressable
      testID={`request-row-${request._id}`}
      accessibilityRole="button"
      onPress={onPress}
      className="gap-2 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>{name}</Text>
        <ChevronRight size={18} color="#9ca3af" />
      </View>
      {meta ? <Text className="text-sm text-gray-600" numberOfLines={1}>{meta}</Text> : null}
      <View className="flex-row flex-wrap items-center gap-2">
        <StatusPill testID={`request-pill-${request._id}`} label={pill.label} tone={pill.tone} />
        {handler ? (
          <View className="flex-row items-center gap-1">
            <UserRound size={14} color="#6b7280" />
            <Text testID={`request-handler-${request._id}`} className="text-sm text-gray-600" numberOfLines={1}>{handler}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Requests'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function RequestListScreen({ navigation, route }: Props) {
  const [segment, setSegment] = useState<Segment>(route.params?.filter ?? 'pending');
  const [filters, setFilters] = useState<QueueFilters>(EMPTY_FILTERS);
  const requests = useQuery({ queryKey: requestKeys.list, queryFn: listRequests });

  // A push or dashboard link can ask for a specific segment while this tab is already mounted.
  const requested = route.params?.filter;
  const [lastRequested, setLastRequested] = useState(requested);
  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (requested) setSegment(requested);
  }

  const all = requests.data;
  const counts = useMemo(
    () => Object.fromEntries(SEGMENTS.map(({ value }) => [value, all?.filter((r) => inSegment(r, value)).length ?? 0])),
    [all]
  );
  const departments = useMemo(() => uniqueDepartments(all ?? []), [all]);
  const inView = useMemo(() => (all ?? []).filter((r) => inSegment(r, segment)), [all, segment]);
  const rows = useMemo(
    () =>
      inView.filter((r) => {
        if (filters.department && departmentOf(r)?.id !== filters.department) return false;
        return matchesSearch(applicantOf(r), filters.search);
      }),
    [inView, filters]
  );
  const narrowed = Boolean(filters.search.trim() || filters.department);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Requests" />
      <View className="gap-3 px-5 pb-3">
        <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
          <TabsList className="h-12 w-full rounded-xl p-1">
            {SEGMENTS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} testID={`segment-${value}`} className="h-full flex-1 rounded-lg">
                <Text className={cn('text-sm', segment === value && 'font-semibold text-purple-700')}>
                  {label}
                  {all ? ` ${counts[value]}` : ''}
                </Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <RequestFilters filters={filters} onChange={setFilters} departments={departments} shown={rows.length} total={inView.length} />
      </View>

      {requests.isLoading ? (
        <View testID="request-list-loading" className="gap-3 px-5 pt-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </View>
      ) : requests.isError && !all ? (
        <ErrorState message={apiErrorMessage(requests.error, "Couldn't load requests. Try again.")} onRetry={() => void requests.refetch()} />
      ) : (
        <FlatList
          testID="request-list"
          data={rows}
          keyExtractor={(r) => r._id}
          renderItem={({ item }) => (
            <RequestRow request={item} onPress={() => navigation.navigate('AdminRequestDetail', { requestId: item._id })} />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 pt-1 grow"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={requests.isRefetching} onRefresh={() => void requests.refetch()} />}
          ListHeaderComponent={
            requests.isError ? (
              <Text testID="refresh-error" accessibilityRole="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {apiErrorMessage(requests.error, "Couldn't refresh requests.")} Pull down to try again.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            narrowed ? (
              <EmptyState title="No matching requests" body="Check the search or filters, or switch to All." />
            ) : (
              <EmptyState
                title={segment === 'pending' ? 'No pending requests' : segment === 'assigned' ? 'No assigned requests' : 'No requests yet'}
                body="New department requests show up here."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
