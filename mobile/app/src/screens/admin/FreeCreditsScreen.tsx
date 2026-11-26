import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { creditKeys, listCreditUsers, roleLabel, setFreeCredits, type CreditUser } from '~/api/freeCredits';
import type { RootStackParamList } from '~/navigation/types';
import { apiErrorMessage } from '~/utils/errors';
import { cn } from '~/lib/utils';

type Props = NativeStackScreenProps<RootStackParamList, 'FreeCredits'>;

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'agent', label: 'Channel partners' },
  { value: 'customer', label: 'Users' },
] as const;

function notify(title: string, body: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${body}`);
  else Alert.alert(title, body);
}

function CreditRow({ user }: { user: CreditUser }) {
  const current = user.free_reports_count ?? 0;
  const [value, setValue] = useState(String(current));
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (count: number) => setFreeCredits(user._id, count),
    onSuccess: () => void client.invalidateQueries({ queryKey: creditKeys.users }),
    onError: (err) => notify('Not saved', apiErrorMessage(err, "Couldn't update credits. Try again.")),
  });
  const parsed = Number(value);
  const valid = /^\d{1,4}$/.test(value.trim());
  const changed = valid && parsed !== current;

  return (
    <View testID={`credit-row-${user._id}`} className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="gap-0.5">
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{user.name || user.email}</Text>
        <Text className="text-sm text-gray-600" numberOfLines={1}>{user.email}</Text>
        <Text className="text-xs text-purple-600">{roleLabel(user.role)} · {current} free reports</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Input
          testID={`credit-input-${user._id}`}
          accessibilityLabel={`Free reports for ${user.name || user.email}`}
          keyboardType="number-pad"
          value={value}
          onChangeText={setValue}
          className={cn('h-11 flex-1 rounded-xl', !valid && 'border-red-400')}
        />
        <Button
          testID={`credit-save-${user._id}`}
          disabled={!changed || save.isPending}
          onPress={() => save.mutate(parsed)}
          className="h-11 rounded-xl px-5">
          <Text>{save.isPending ? 'Saving…' : 'Save'}</Text>
        </Button>
      </View>
    </View>
  );
}

/** Admin grants free report credits to channel partners and users (same API as the web page). */
export default function FreeCreditsScreen({ navigation }: Props) {
  const users = useQuery({ queryKey: creditKeys.users, queryFn: listCreditUsers });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (users.data ?? []).filter(
      (u) => (!role || u.role === role) && (!s || `${u.name} ${u.email}`.toLowerCase().includes(s))
    );
  }, [users.data, search, role]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Free credits" onBack={() => navigation.goBack()} />
      <View className="gap-3 px-5 pb-3">
        <Input testID="credit-search" placeholder="Search name or email" value={search} onChangeText={setSearch} className="h-12 rounded-xl" />
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value || 'all'}
              testID={`credit-filter-${f.value || 'all'}`}
              variant={role === f.value ? 'default' : 'outline'}
              onPress={() => setRole(f.value)}
              className="h-9 rounded-full px-4">
              <Text className="text-sm">{f.label}</Text>
            </Button>
          ))}
        </View>
      </View>
      {users.isLoading ? (
        <View className="gap-3 px-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </View>
      ) : users.isError && !users.data ? (
        <ErrorState message={apiErrorMessage(users.error, "Couldn't load users. Try again.")} onRetry={() => void users.refetch()} />
      ) : (
        <FlatList
          testID="credit-list"
          data={rows}
          keyExtractor={(u) => u._id}
          renderItem={({ item }) => <CreditRow key={`${item._id}-${item.free_reports_count ?? 0}`} user={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 grow"
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          refreshControl={<RefreshControl refreshing={users.isRefetching} onRefresh={() => void users.refetch()} />}
          ListEmptyComponent={<EmptyState title="No users found" />}
        />
      )}
    </SafeAreaView>
  );
}
