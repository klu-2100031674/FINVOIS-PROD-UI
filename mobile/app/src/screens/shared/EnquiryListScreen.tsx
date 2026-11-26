import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MessageCircleQuestion } from 'lucide-react-native';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ListRow } from '~/components/ListRow';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { enquiryKeys, listEnquiries } from '~/api/enquiries';
import type { RootStackParamList } from '~/navigation/types';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate } from '~/utils/format';

/** MSME "challenge or doubt" enquiries, for admins and customer service. */
export default function EnquiryListScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const query = useInfiniteQuery({
    queryKey: enquiryKeys.list(q),
    queryFn: ({ pageParam }) => listEnquiries({ page: pageParam, q }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
  const rows = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.total;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="MSME enquiries" />
      <View className="gap-2 px-5 pb-3">
        <Input
          testID="enquiry-search"
          placeholder="Search name or phone"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => setQ(draft.trim())}
          returnKeyType="search"
          className="h-12 rounded-xl"
        />
        {total !== undefined ? <Text className="text-sm text-gray-500">{total} enquiries</Text> : null}
      </View>
      {query.isLoading ? (
        <View testID="enquiry-list-loading" className="gap-3 px-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </View>
      ) : query.isError && !query.data ? (
        <ErrorState message={apiErrorMessage(query.error, "Couldn't load enquiries. Try again.")} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          testID="enquiry-list"
          data={rows}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <ListRow
              testID={`enquiry-row-${item.id}`}
              title={item.fullName}
              subtitle={item.otherText || item.topics.join(', ') || item.natureOfBusiness || 'No details'}
              meta={[item.establishmentStage, formatDate(item.submittedAt)].filter(Boolean).join(' · ')}
              onPress={() => navigation.navigate('EnquiryDetail', { enquiryId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 grow"
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          ListEmptyComponent={<EmptyState icon={MessageCircleQuestion} title="No enquiries" body={q ? 'Nothing matches that search.' : 'New MSME enquiries show up here.'} />}
        />
      )}
    </SafeAreaView>
  );
}
