import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '~/components/ui/text';

interface Props {
  title: string;
  subtitle?: string;
  meta?: string;
  right?: ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function ListRow({ title, subtitle, meta, right, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text className="text-sm text-gray-600" numberOfLines={1}>{subtitle}</Text> : null}
        {meta ? <Text className="text-xs text-gray-400">{meta}</Text> : null}
      </View>
      {right}
      <ChevronRight size={18} color="#9ca3af" />
    </Pressable>
  );
}
