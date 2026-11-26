import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '~/components/ui/text';

interface Props {
  icon: ReactNode;
  label: string;
  detail?: string;
  onPress: () => void;
  testID: string;
}

export function LinkRow({ icon, label, detail, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      {icon}
      <Text className="flex-1 text-base font-medium text-gray-900">{label}</Text>
      {detail ? <Text testID={`${testID}-detail`} className="text-sm text-gray-500">{detail}</Text> : null}
      <ChevronRight size={18} color="#9ca3af" />
    </Pressable>
  );
}
