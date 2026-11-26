import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { BarChart, DonutChart, LineChart } from '~/components/Charts';
import { StatCard } from '~/components/StatCard';
import { Button } from '~/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Text } from '~/components/ui/text';
import { useSession } from '~/auth/useSession';
import type { ReportTypeOption } from '~/api/reportTypes';
import { formatUpdatedAt, useAdminStats, useAdminTrends, useReportTypes } from '~/hooks/useAdminStats';
import type { AdminTabParamList, ReportStatusFilter } from '~/navigation/types';
import { apiErrorMessage } from '~/utils/errors';
import { formatCount } from '~/utils/format';

const ALL_TYPES = '__all__';

const CARDS: { key: 'pending' | 'under_review' | 'approved' | 'rejected'; label: string; status: ReportStatusFilter }[] = [
  { key: 'pending', label: 'Pending', status: 'pending_validation' },
  { key: 'under_review', label: 'Under review', status: 'under_review' },
  { key: 'approved', label: 'Approved', status: 'approved' },
  { key: 'rejected', label: 'Rejected', status: 'rejected' },
];

function greeting(name: string) {
  const h = new Date().getHours();
  return `Good ${h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'}, ${name}`;
}

export default function DashboardScreen({ navigation }: BottomTabScreenProps<AdminTabParamList, 'Dashboard'>) {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [reportType, setReportType] = useState<string | undefined>();
  const [pulling, setPulling] = useState(false);
  const stats = useAdminStats(reportType, focused);
  const trends = useAdminTrends(reportType, focused);
  const types = useReportTypes();

  const options: ReportTypeOption[] = [{ value: ALL_TYPES, label: 'All types' }, ...(types.data ?? [])];
  const selected = options.find((o) => o.value === (reportType ?? ALL_TYPES)) ?? { value: reportType ?? ALL_TYPES, label: reportType ?? 'All types' };

  const data = stats.data;
  const updated = formatUpdatedAt(stats.dataUpdatedAt);
  const show = (n: number | undefined) => (data ? formatCount(n) : stats.isError ? '–' : undefined);
  const open = (status?: ReportStatusFilter) => navigation.navigate('Reports', { status, reportType });

  const onRefresh = async () => {
    setPulling(true);
    await Promise.all([stats.refetch(), trends.refetch()]);
    setPulling(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        contentContainerClassName="gap-4 px-5 pb-8"
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
        <View className="gap-1 pt-4">
          {session.status === 'signedIn' ? (
            <Text testID="dashboard-greeting" numberOfLines={1} className="text-sm text-gray-500">
              {greeting(session.user.name)}
            </Text>
          ) : null}
          <Text className="font-manrope text-2xl text-gray-900">DPR dashboard</Text>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-medium text-gray-500">Report type</Text>
          <Select
            value={selected}
            onValueChange={(o) => setReportType(!o || o.value === ALL_TYPES ? undefined : o.value)}>
            <SelectTrigger testID="report-type-select" aria-label="Report type" className="h-12 w-full rounded-xl bg-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent insets={{ top: insets.top, bottom: insets.bottom, left: 20, right: 20 }} className="w-full rounded-xl">
              <SelectGroup>
                {options.map((o) => (
                  <SelectItem key={o.value} testID={`report-type-${o.value}`} value={o.value} label={o.label} />
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </View>

        {stats.isError ? (
          <View testID="dashboard-error" accessibilityRole="alert" className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <View className="flex-row items-start gap-3">
              <AlertCircle size={20} color="#b91c1c" />
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-red-700">{apiErrorMessage(stats.error, "Couldn't load the numbers. Try again.")}</Text>
                {data ? <Text className="text-sm text-red-700">Showing the numbers from {updated}.</Text> : null}
              </View>
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={() => void stats.refetch()}
              disabled={stats.isFetching}
              testID="dashboard-retry"
              className="self-start rounded-xl bg-white">
              <Text>Retry</Text>
            </Button>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          {CARDS.slice(0, 2).map((c) => (
            <StatCard key={c.key} testID={`stat-${c.key}`} label={c.label} value={show(data?.[c.key])} loading={stats.isPending} onPress={() => open(c.status)} />
          ))}
        </View>
        <View className="flex-row gap-3">
          {CARDS.slice(2).map((c) => (
            <StatCard key={c.key} testID={`stat-${c.key}`} label={c.label} value={show(data?.[c.key])} loading={stats.isPending} onPress={() => open(c.status)} />
          ))}
        </View>
        <StatCard wide testID="stat-total" label="Total" value={show(data?.total)} loading={stats.isPending} onPress={() => open()} />

        {data ? (
          <DonutChart
            testID="chart-status"
            title="Reports by status"
            subtitle={reportType ? selected.label : 'All report types'}
            items={CARDS.map((c) => ({ label: c.label, value: data[c.key] }))}
          />
        ) : null}
        {trends.data ? (
          <>
            <BarChart
              testID="chart-requests"
              title="New DPR requests"
              subtitle="Per day, last 7 days"
              days={trends.data.days.slice(-7)}
              values={trends.data.requests.slice(-7)}
              unit="requests"
            />
            <LineChart
              testID="chart-reports"
              title="Reports submitted"
              subtitle="Per day, last 14 days"
              days={trends.data.days}
              values={trends.data.reports}
              unit="reports"
            />
            <BarChart
              testID="chart-enquiries"
              title="MSME enquiries"
              subtitle="Per day, last 7 days"
              days={trends.data.days.slice(-7)}
              values={trends.data.enquiries.slice(-7)}
              unit="enquiries"
            />
          </>
        ) : trends.isError ? (
          <Text testID="trends-error" className="text-sm text-gray-500">
            {apiErrorMessage(trends.error, "Couldn't load the charts.")} Pull down to try again.
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Text testID="dashboard-updated" className="text-xs text-gray-500">
            {updated ? `Updated ${updated}` : ''}
          </Text>
          <Pressable
            testID="dashboard-refresh"
            accessibilityRole="button"
            accessibilityLabel="Refresh numbers"
            disabled={stats.isFetching}
            onPress={() => void stats.refetch()}
            hitSlop={12}
            className="h-8 w-8 items-center justify-center">
            <RefreshCw size={16} color={stats.isFetching ? '#d1d5db' : '#7c3aed'} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
