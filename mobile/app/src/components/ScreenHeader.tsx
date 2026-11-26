import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '~/components/ui/text';

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-3 pt-4">
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" testID="back-button" onPress={onBack} hitSlop={12}>
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
      ) : null}
      <Text className="flex-1 font-manrope text-2xl text-gray-900" numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}
