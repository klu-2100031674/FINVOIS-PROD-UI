import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import type { Pagination } from '~/api/emailAutomation';

interface Props {
  pagination: Pagination;
  /** What is being counted, for example "email" or "record". */
  noun: string;
  onPage: (page: number) => void;
  testID: string;
}

export function PageControls({ pagination, noun, onPage, testID }: Props) {
  const { page, limit, total } = pagination;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text testID={`${testID}-total`} className="text-sm text-gray-500">{total} {noun}{total === 1 ? '' : 's'}</Text>
      {pages > 1 ? (
        <View className="flex-row items-center gap-2">
          <Button testID={`${testID}-prev`} variant="outline" disabled={page <= 1} onPress={() => onPage(page - 1)} className="h-10 rounded-lg px-3">
            <Text className="text-gray-900">Prev</Text>
          </Button>
          <Text testID={`${testID}-page`} className="text-sm text-gray-500">{page} / {pages}</Text>
          <Button testID={`${testID}-next`} variant="outline" disabled={page >= pages} onPress={() => onPage(page + 1)} className="h-10 rounded-lg px-3">
            <Text className="text-gray-900">Next</Text>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
