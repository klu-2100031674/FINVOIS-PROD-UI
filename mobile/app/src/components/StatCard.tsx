import { Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  value?: string;
  loading?: boolean;
  onPress?: () => void;
  wide?: boolean;
  testID?: string;
}

export function StatCard({ label, value, loading, onPress, wide, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? ''}`}
      onPress={onPress}
      className={cn('rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50', wide ? 'w-full' : 'flex-1')}>
      <View className="gap-1">
        <Text className="text-sm text-gray-500">{label}</Text>
        {loading ? (
          <Skeleton className="h-8 w-16 rounded-md" />
        ) : (
          <Text testID={testID ? `${testID}-value` : undefined} className="font-manrope text-3xl text-gray-900">{value}</Text>
        )}
      </View>
    </Pressable>
  );
}
