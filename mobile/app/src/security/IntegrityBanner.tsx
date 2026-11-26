import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldAlert, X } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { useIsSuspect } from './deviceIntegrity';

/** Dismissible warning shown while the device looks rooted or jailbroken. Mounted once by InactivityLock. */
export function IntegrityBanner() {
  const suspect = useIsSuspect();
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();
  if (!suspect || dismissed) return null;

  return (
    <View
      accessibilityRole="alert"
      testID="integrity-banner"
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 pb-3">
      <ShieldAlert size={20} color="#b45309" />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-amber-900">This device looks compromised</Text>
        <Text className="text-sm text-amber-800">
          It looks rooted or jailbroken. You can keep working, but sending reports is turned off here.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss warning"
        testID="integrity-dismiss"
        hitSlop={8}
        onPress={() => setDismissed(true)}>
        <X size={18} color="#92400e" />
      </Pressable>
    </View>
  );
}
