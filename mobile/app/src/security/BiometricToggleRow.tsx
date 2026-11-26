import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { biometricsAvailable, biometricUnlockEnabled, promptBiometric, setBiometricUnlock } from './biometrics';

/** Profile row: unlock after the background timeout with biometrics instead of the password. Hidden when unsupported. */
export function BiometricToggleRow() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([biometricsAvailable(), biometricUnlockEnabled()]).then(([a, e]) => {
      setAvailable(a);
      setEnabled(e);
    });
  }, []);

  if (!available) return null;

  const toggle = async (on: boolean) => {
    if (busy) return;
    setBusy(true);
    // Turning it on needs one successful biometric so the user knows it works before relying on it.
    if (!on || (await promptBiometric('Confirm to turn on biometric unlock'))) {
      await setBiometricUnlock(on);
      setEnabled(on);
    }
    setBusy(false);
  };

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4" testID="biometric-row">
      <Fingerprint size={22} color="#7c3aed" />
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">Biometric unlock</Text>
        <Text className="text-sm text-gray-500">Unlock with Face ID or your fingerprint instead of your password.</Text>
      </View>
      <Switch
        testID="biometric-switch"
        accessibilityLabel="Biometric unlock"
        checked={enabled}
        onCheckedChange={toggle}
        disabled={busy}
      />
    </View>
  );
}
