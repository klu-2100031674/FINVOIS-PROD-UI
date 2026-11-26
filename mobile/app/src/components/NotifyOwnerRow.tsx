import { View } from 'react-native';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
  testID: string;
  label: string;
}

/** The web's "send email to user" checkbox on approve and reject. It starts on (OPEN_QUESTIONS Q8). */
export function NotifyOwnerRow({ checked, onChange, disabled, testID, label }: Props) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <Text className="flex-1 text-sm text-gray-700">{label}</Text>
      <Switch testID={testID} aria-label={label} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </View>
  );
}
