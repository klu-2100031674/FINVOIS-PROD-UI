import { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { agentKeys, getRequest } from '~/api/agentRequests';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { ACCESS_DENIED_MESSAGE, isAccessDenied } from '~/utils/agentRequest';
import { apiErrorMessage } from '~/utils/errors';
import { buildRequestForm } from '~/utils/requestForm';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestForm'>;

// Shared by the admin and the agent. The form holds Aadhaar and PAN numbers, so screenshots stay blocked here.
export default function RequestFormScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  usePreventScreenCapture();

  const query = useQuery({
    queryKey: agentKeys.request(requestId),
    queryFn: () => getRequest(requestId),
    networkMode: 'always',
  });
  const form = useMemo(() => (query.data ? buildRequestForm(query.data) : null), [query.data]);
  const denied = query.isError && isAccessDenied(query.error);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Application details" onBack={() => navigation.goBack()} />

      {denied ? (
        <View testID="access-denied" accessibilityRole="alert" className="items-center px-6 py-16">
          <Text className="text-center font-manrope text-lg text-gray-900">{ACCESS_DENIED_MESSAGE}</Text>
        </View>
      ) : query.isPending ? (
        <View testID="form-loading" className="gap-3 px-5 pt-1">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </View>
      ) : !form ? (
        <ErrorState message={apiErrorMessage(query.error, "Couldn't load the application. Try again.")} onRetry={() => void query.refetch()} />
      ) : (
        <ScrollView
          testID="request-form"
          contentContainerClassName="gap-4 px-5 pb-10 pt-1"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          {form.highlights.length ? (
            <View testID="form-highlights" className="gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              {form.highlights.map((row) => (
                <View key={row.id} className="gap-0.5">
                  <Text className="text-xs font-medium text-purple-700">{row.label}</Text>
                  <Text testID={`form-value-${row.id}`} className="text-base font-semibold text-gray-900">{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {form.rows.length ? (
            <View className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
              {form.rows.map((row, i) => (
                <View key={row.id} className={i === 0 ? 'gap-0.5 py-3' : 'gap-0.5 border-t border-gray-100 py-3'}>
                  <Text className="text-xs text-gray-500">{row.label}</Text>
                  <Text testID={`form-value-${row.id}`} className="text-base text-gray-900">{row.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text testID="form-empty" className="px-1 text-sm text-gray-500">This request has no submitted form fields.</Text>
          )}

          {form.assets ? (
            <View testID="form-assets" className="gap-2">
              <Text className="font-manrope text-base text-gray-900">DPR assets</Text>
              {form.assets.length === 0 ? <Text className="text-sm text-gray-500">No assets listed.</Text> : null}
              {form.assets.map((a, i) => (
                <View key={`asset-${i}`} className="gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <Text className="text-sm text-gray-900">Model: {a.model}</Text>
                  <Text className="text-sm text-gray-900">Category: {a.category}</Text>
                  <Text className="text-sm text-gray-900">Amount: {a.amount}</Text>
                  <Text className="text-sm text-gray-900">Loan share: {a.loanPercentage}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
