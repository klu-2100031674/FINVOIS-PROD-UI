import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { TONE_CLASSES, type Tone } from '~/utils/status';
import { cn } from '~/lib/utils';

export function StatusPill({ label, tone, testID }: { label: string; tone: Tone; testID?: string }) {
  const c = TONE_CLASSES[tone];
  return (
    <View testID={testID} className={cn('self-start rounded-full px-2.5 py-1', c.box)}>
      <Text className={cn('text-xs font-medium', c.text)}>{label}</Text>
    </View>
  );
}
