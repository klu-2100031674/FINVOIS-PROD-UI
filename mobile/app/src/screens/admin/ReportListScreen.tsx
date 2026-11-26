import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { FilterSelect } from '~/components/FilterSelect';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ListRow } from '~/components/ListRow';
import { ScreenHeader } from '~/components/ScreenHeader';
import { StatusPill } from '~/components/StatusPill';
import { listCompanies, reportCompanyName, type AdminReport } from '~/api/adminReports';
import { useReportTypes } from '~/hooks/useAdminStats';
import { useDebounced, useReportList } from '~/hooks/useAdminReports';
import type { AdminTabParamList, ReportStatusFilter, RootStackParamList } from '~/navigation/types';
import { apiErrorMessage } from '~/utils/errors';
import { formatCount, formatDate } from '~/utils/format';
import { REPORT_STATUS, reportPill } from '~/utils/status';

// The web has two date boxes. On a phone the same filter is a short list of the ranges people actually use.
const DATE_OPTIONS = [
  { value: '0', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function rangeStart(days: string): string {
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Reports'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ALL_TYPES = 'all'; // Radix Select rejects an empty item value
const CHIPS: { key: ReportStatusFilter | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'pending_validation', label: REPORT_STATUS.pending_validation.label },
  { key: 'under_review', label: REPORT_STATUS.under_review.label },
  { key: 'approved', label: REPORT_STATUS.approved.label },
  { key: 'rejected', label: REPORT_STATUS.rejected.label },
];

export default function ReportListScreen({ route, navigation }: Props) {
  const [status, setStatus] = useState<ReportStatusFilter | undefined>(route.params?.status);
  const [reportType, setReportType] = useState<string | undefined>(route.params?.reportType);
  const [searchText, setSearchText] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [companyId, setCompanyId] = useState('');
  const search = useDebounced(searchText);

  // The dashboard can open this tab again with another status while it is already mounted. Adjusting state while
  // rendering (instead of in an effect) avoids one frame of the old filters.
  const params = route.params;
  const [seenParams, setSeenParams] = useState(params);
  if (params !== seenParams) {
    setSeenParams(params);
    if (params) {
      setStatus(params.status);
      setReportType(params.reportType);
    }
  }

  const list = useReportList({ status, reportType, search, startDate, companyId: companyId || undefined });
  const types = useReportTypes();
  // A failure only hides this one filter; the reports still work without it.
  const companies = useQuery({ queryKey: ['admin', 'companies'], queryFn: listCompanies, staleTime: 5 * 60 * 1000 });
  const companyOptions = useMemo(
    () => (companies.data ?? []).filter((c) => c.companyName).map((c) => ({ value: c._id, label: c.companyName as string })),
    [companies.data]
  );
  const moreCount = (dateRange ? 1 : 0) + (companyId ? 1 : 0);
  const typeLabel = (r: AdminReport) => {
    const raw = r.templateId || r.report_type || '';
    return types.data?.find((o) => o.value.toLowerCase() === raw.toLowerCase())?.label ?? raw;
  };

  const selectedType: Option = useMemo(() => {
    if (!reportType) return { value: ALL_TYPES, label: 'All report types' };
    return { value: reportType, label: types.data?.find((o) => o.value === reportType)?.label ?? reportType };
  }, [reportType, types.data]);

  const filtered = Boolean(status || reportType || searchText.trim() || moreCount);
  const clearFilters = () => {
    setStatus(undefined);
    setReportType(undefined);
    setSearchText('');
    setDateRange('');
    setStartDate(undefined);
    setCompanyId('');
  };

  const statusLabel = status ? REPORT_STATUS[status].label : 'All reports';
  const refreshing = list.isRefetching && !list.isFetchingNextPage;

  const body = list.isPending ? (
    <View testID="reports-loading" className="gap-3 px-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </View>
  ) : list.isError && list.reports.length === 0 ? (
    <ErrorState message={apiErrorMessage(list.error, "Couldn't load reports. Check your connection and try again.")} onRetry={() => void list.refetch()} />
  ) : (
    <FlatList
      testID="report-list"
      data={list.reports}
      keyExtractor={(r) => r._id}
      contentContainerClassName="gap-3 px-5 pb-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void list.refetch()} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (list.hasNextPage && !list.isFetchingNextPage && !list.isFetchNextPageError) void list.fetchNextPage();
      }}
      ListHeaderComponent={
        list.isError && !list.isFetchNextPageError ? (
          <View accessibilityRole="alert" testID="refresh-error" className="flex-row items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-3">
            <Text className="flex-1 text-sm text-red-700">{apiErrorMessage(list.error, "Couldn't refresh the list.")}</Text>
            <Button size="sm" variant="outline" className="rounded-xl" onPress={() => void list.refetch()}>
              <Text>Retry</Text>
            </Button>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          title="No reports found"
          body={filtered ? 'Try a different search or filter.' : 'Reports appear here once customers submit them.'}
          action={
            filtered ? (
              <Button variant="outline" testID="clear-filters" className="mt-2 rounded-xl" onPress={clearFilters}>
                <Text>Clear filters</Text>
              </Button>
            ) : undefined
          }
        />
      }
      ListFooterComponent={
        list.isFetchingNextPage ? (
          <ActivityIndicator testID="loading-more" color="#7c3aed" className="py-4" />
        ) : list.isFetchNextPageError ? (
          <View testID="load-more-error" className="items-center gap-2 py-4">
            <Text className="text-sm text-red-700">{apiErrorMessage(list.error, "Couldn't load more reports.")}</Text>
            <Button size="sm" variant="outline" className="rounded-xl" onPress={() => void list.fetchNextPage()}>
              <Text>Try again</Text>
            </Button>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <ListRow
          testID={`report-row-${item._id}`}
          title={item.client_name || item.title || 'Untitled report'}
          subtitle={[typeLabel(item), formatDate(item.createdAt)].filter(Boolean).join(' · ')}
          meta={reportCompanyName(item) || undefined}
          right={
            <StatusPill
              testID={`report-status-${item._id}`}
              label={reportPill(item.validation_status, item.is_re_review).label}
              tone={reportPill(item.validation_status, item.is_re_review).tone}
            />
          }
          onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
        />
      )}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Reports" />
      <View className="gap-3 pb-3">
        <View className="flex-row items-center justify-between gap-3 px-5">
          <Text testID="report-count" className="flex-1 text-sm text-gray-500">
            {statusLabel}
            {list.totalCount !== undefined ? ` · ${formatCount(list.totalCount)}` : ''}
          </Text>
          <Pressable
            testID="more-filters-toggle"
            accessibilityRole="button"
            aria-expanded={moreOpen}
            hitSlop={8}
            onPress={() => setMoreOpen((v) => !v)}
            className="flex-row items-center gap-1.5">
            <SlidersHorizontal size={14} color="#7c3aed" />
            <Text className="text-sm font-medium text-purple-700">{moreCount ? `More filters (${moreCount})` : 'More filters'}</Text>
          </Pressable>
        </View>
        <View className="justify-center px-5">
          <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 32 }} />
          <Input
            testID="report-search"
            aria-label="Search reports"
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search name, client or type"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="h-12 rounded-xl pl-11 pr-11"
          />
          {searchText ? (
            <Pressable
              testID="clear-search"
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
              onPress={() => setSearchText('')}
              style={{ position: 'absolute', right: 32 }}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
          {CHIPS.map((chip) => {
            const active = chip.key === status;
            return (
              <Button
                key={chip.label}
                testID={`chip-${chip.key ?? 'all'}`}
                aria-selected={active}
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="h-9 rounded-full px-4"
                onPress={() => setStatus(chip.key)}>
                <Text className="text-sm">{chip.label}</Text>
              </Button>
            );
          })}
        </ScrollView>
        <View className="px-5">
          <Select
            value={selectedType}
            onValueChange={(o) => setReportType(!o || o.value === ALL_TYPES ? undefined : o.value)}>
            <SelectTrigger testID="type-select" aria-label="Report type" className="h-11 w-full rounded-xl bg-white">
              <SelectValue placeholder="All report types" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_TYPES} label="All report types" />
                {(types.data ?? []).map((o) => (
                  <SelectItem key={o.value} value={o.value} label={o.label} />
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </View>
        {moreOpen ? (
          <View testID="more-filters" className="flex-row gap-2 px-5">
            <FilterSelect
              testID="filter-date"
              label="Created"
              allLabel="Any time"
              value={dateRange}
              options={DATE_OPTIONS}
              onChange={(v) => {
                setDateRange(v);
                setStartDate(v ? rangeStart(v) : undefined);
              }}
            />
            {companyOptions.length ? (
              <FilterSelect
                testID="filter-company"
                label="Company"
                allLabel="All companies"
                value={companyId}
                options={companyOptions}
                onChange={setCompanyId}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      {body}
    </SafeAreaView>
  );
}
