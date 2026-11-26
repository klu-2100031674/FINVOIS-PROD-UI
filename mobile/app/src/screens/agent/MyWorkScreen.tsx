import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useIsFocused, type CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Clock } from 'lucide-react-native';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { RequestFilters } from '~/components/RequestFilters';
import { ScreenHeader } from '~/components/ScreenHeader';
import { StatusPill } from '~/components/StatusPill';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { agentKeys, getCounts, invalidateAgentWork, listQueue, type AgentRequest } from '~/api/agentRequests';
import { useSession } from '~/auth/useSession';
import { useClaimClock } from '~/hooks/useClaimClock';
import type { AgentTabParamList, RootStackParamList } from '~/navigation/types';
import { cn } from '~/lib/utils';
import { AGENT_TABS, TAB_QUEUE, applicantOf, departmentName, isAssignedByCa, schemeLine, workflowKeyOf, type AgentTab } from '~/utils/agentRequest';
import { claimMsLeft, formatClaimLeft } from '~/utils/claim';
import { apiErrorMessage } from '~/utils/errors';
import { formatCount, formatDate } from '~/utils/format';
import {
  EMPTY_FILTERS,
  IN_PROGRESS_KINDS,
  activeFilterCount,
  filterRequests,
  inProgressKind,
  paymentState,
  uniqueDepartments,
  type InProgressKind,
} from '~/utils/queueFilters';
import { WORKFLOW_STATUS } from '~/utils/status';

const AUTO_REFRESH_MS = 3 * 60 * 1000; // same as the web's Open Requests page

function WorkRow({ request, userId, now, onPress }: { request: AgentRequest; userId: string; now: number; onPress: () => void }) {
  const pill = WORKFLOW_STATUS[workflowKeyOf(request)] ?? WORKFLOW_STATUS.pending;
  const { name, phone } = applicantOf(request);
  const left = claimMsLeft(request, now);
  const payment = paymentState(request);
  const department = departmentName(request);
  const meta = [schemeLine(request), formatDate(request.createdAt), isAssignedByCa(request, userId) ? 'Assigned by CA' : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      testID={`work-row-${request._id}`}
      accessibilityRole="button"
      onPress={onPress}
      className="gap-2 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      <View className="flex-row items-center gap-3">
        <Text testID={`work-name-${request._id}`} className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        <ChevronRight size={18} color="#9ca3af" />
      </View>
      <Text className="text-sm text-gray-600" numberOfLines={1}>{meta}</Text>
      {department || phone ? (
        <Text testID={`work-contact-${request._id}`} className="text-xs text-gray-500" numberOfLines={1}>
          {[department, phone].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
        <StatusPill testID={`work-pill-${request._id}`} label={pill.label} tone={pill.tone} />
        {payment !== 'none' ? (
          <StatusPill testID={`work-payment-${request._id}`} label={payment === 'paid' ? 'Paid' : 'Unpaid'} tone={payment === 'paid' ? 'green' : 'amber'} />
        ) : null}
        {left !== null ? (
          <View className="flex-row items-center gap-1">
            <Clock size={14} color={left <= 5 * 60000 ? '#b45309' : '#6b7280'} />
            <Text
              testID={`claim-countdown-${request._id}`}
              className={cn('text-sm', left <= 5 * 60000 ? 'font-medium text-amber-700' : 'text-gray-600')}>
              {formatClaimLeft(left)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<AgentTabParamList, 'My work'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function MyWorkScreen({ navigation, route }: Props) {
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : '';
  const qc = useQueryClient();
  const focused = useIsFocused();
  const [tab, setTab] = useState<AgentTab>(route.params?.tab ?? 'open');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [kind, setKind] = useState<InProgressKind | ''>('');

  // A push or deep link can ask for a specific tab while this one is already mounted.
  const [askedTab, setAskedTab] = useState(route.params?.tab);
  if (route.params?.tab !== askedTab) {
    setAskedTab(route.params?.tab);
    if (route.params?.tab) setTab(route.params.tab);
  }

  const queue = TAB_QUEUE[tab];
  const list = useQuery({
    queryKey: agentKeys.queue(queue),
    queryFn: () => listQueue(queue),
    staleTime: 0,
    networkMode: 'always',
    refetchInterval: focused ? AUTO_REFRESH_MS : false,
  });
  const counts = useQuery({
    queryKey: agentKeys.counts,
    queryFn: getCounts,
    staleTime: 0,
    networkMode: 'always',
    refetchInterval: focused ? AUTO_REFRESH_MS : false,
  });

  // Back from a detail screen or another tab, claims and releases have changed what every list holds.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void invalidateAgentWork(qc);
    }, [qc])
  );

  const all = useMemo(() => list.data ?? [], [list.data]);
  const departments = useMemo(() => uniqueDepartments(all), [all]);
  // The web offers payment and CA filters on Open only, so a value left over from Open must not hide rows elsewhere.
  const tabFilters = useMemo(() => (tab === 'open' ? filters : { ...filters, payment: '' as const, ca: '' as const }), [filters, tab]);
  const filtered = useMemo(() => filterRequests(all, tabFilters), [all, tabFilters]);
  const kindCounts = useMemo(() => {
    const out: Partial<Record<InProgressKind, number>> = {};
    for (const r of filtered) {
      const k = inProgressKind(r);
      if (k) out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [filtered]);
  const rows = useMemo(
    () => (tab === 'active' && kind ? filtered.filter((r) => inProgressKind(r) === kind) : filtered),
    [filtered, kind, tab]
  );
  const narrowed = Boolean(filters.search.trim()) || activeFilterCount(tabFilters) > 0 || (tab === 'active' && Boolean(kind));
  const refetchAll = useCallback(() => invalidateAgentWork(qc), [qc]);
  // At zero the server has returned the claim to Open, so every list and both counts are stale.
  const now = useClaimClock(all, () => void refetchAll(), focused);
  const [pulling, setPulling] = useState(false);
  const onRefresh = async () => {
    setPulling(true);
    await refetchAll();
    setPulling(false);
  };

  const badge: Record<AgentTab, number | undefined> = {
    open: counts.data?.open,
    mine: counts.data?.assigned,
    active: counts.data?.awaiting,
    done: counts.data?.ready,
  };

  const emptyCopy: Record<AgentTab, { title: string; body: string }> = {
    open: { title: 'No open requests', body: 'New requests show up here when customers submit them.' },
    mine: { title: 'Nothing claimed yet', body: 'Claim a request from the Open tab to start working on it.' },
    active: { title: 'Nothing in progress', body: 'Requests move here once report work starts on the web.' },
    done: { title: 'No completed requests', body: 'CA-approved, paid reports ready to send show up here.' },
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="My work" />
      <View className="gap-3 px-5 pb-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as AgentTab)}>
          <TabsList className="h-12 w-full rounded-xl p-1">
            {AGENT_TABS.map(({ key, label }) => (
              // Sized to their content: four equal tabs leave no room for "In progress" and its count on a 360 dp phone.
              <TabsTrigger key={key} value={key} testID={`tab-${key}`} className="h-full grow gap-1 rounded-lg px-1.5">
                <Text numberOfLines={1} className={cn('text-xs', tab === key && 'font-semibold text-purple-700')}>{label}</Text>
                {badge[key] !== undefined ? (
                  <View
                    testID={`tab-${key}-count`}
                    className={cn('min-w-5 items-center rounded-full px-1 py-0.5', tab === key ? 'bg-purple-100' : 'bg-gray-200')}>
                    <Text className={cn('text-xs font-medium', tab === key ? 'text-purple-700' : 'text-gray-700')}>
                      {formatCount(badge[key])}
                    </Text>
                  </View>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <RequestFilters
          filters={filters}
          onChange={setFilters}
          departments={departments}
          showReportFilters={tab === 'open'}
          shown={rows.length}
          total={all.length}
        />
        {tab === 'active' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2">
            {IN_PROGRESS_KINDS.map((k) => {
              const selected = kind === k.key;
              const n = k.key ? (kindCounts[k.key] ?? 0) : filtered.length;
              return (
                <Button
                  key={k.key || 'all'}
                  testID={`kind-${k.key || 'all'}`}
                  aria-selected={selected}
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  className="h-9 rounded-full px-3"
                  onPress={() => setKind(k.key)}>
                  <Text className="text-sm">{k.label} {n}</Text>
                </Button>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {list.isPending ? (
        <View testID="work-loading" className="gap-3 px-5 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </View>
      ) : list.isError && !list.data ? (
        <ErrorState message={apiErrorMessage(list.error, "Couldn't load your work. Try again.")} onRetry={() => void list.refetch()} />
      ) : (
        <FlatList
          testID={`work-list-${tab}`}
          data={rows}
          keyExtractor={(r) => r._id}
          renderItem={({ item }) => (
            <WorkRow
              request={item}
              userId={userId}
              now={now}
              onPress={() => navigation.navigate('AgentRequestDetail', { requestId: item._id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 pt-1 grow"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />
          }
          ListHeaderComponent={
            list.isError ? (
              <Text testID="refresh-error" accessibilityRole="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {apiErrorMessage(list.error, "Couldn't refresh your work.")} Pull down to try again.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            narrowed && all.length > 0 ? (
              <EmptyState title="No matching requests" body="Check the search or change the filters." />
            ) : (
              <EmptyState title={emptyCopy[tab].title} body={emptyCopy[tab].body} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
