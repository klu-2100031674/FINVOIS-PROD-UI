import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useSession } from '~/auth/useSession';
import { enablePush, getPushPermission, syncPushToken, type PushPermission } from './register';

const DETAIL: Record<PushPermission, string> = {
  granted: 'You get alerts when work is assigned or a report is approved.',
  undetermined: 'Turn on to get alerts when work is assigned or a report is approved.',
  denied: 'Allow notifications for Finvois in your phone settings to get work alerts.',
  unsupported: 'Notifications are available in the mobile app.',
};

export function NotificationStatusRow() {
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const [state, setState] = useState<PushPermission | null>(null);
  const [busy, setBusy] = useState(false);
  const previous = useRef<PushPermission | null>(null);

  // The state is only set once the OS answers, never synchronously.
  const refresh = useCallback(
    () =>
      getPushPermission()
        .catch(() => 'unsupported' as const)
        .then((next) => {
          // Allowed from the phone settings while the app was in the background: register this device now.
          if (userId && next === 'granted' && previous.current && previous.current !== 'granted') void syncPushToken(userId);
          previous.current = next;
          setState(next);
        }),
    [userId]
  );

  useEffect(() => {
    void refresh();
    // The user may come back from the OS settings screen with a different answer.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void refresh());
    return () => sub.remove();
  }, [refresh]);

  if (!state) return null;
  const on = state === 'granted';

  const turnOn = async () => {
    if (!userId) return;
    setBusy(true);
    await enablePush(userId).catch(() => undefined);
    await refresh();
    setBusy(false);
  };

  return (
    <View className="gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4" testID="notification-status">
      <View className="flex-row items-center gap-3">
        <View className={`h-10 w-10 items-center justify-center rounded-xl ${on ? 'bg-purple-100' : 'bg-gray-100'}`}>
          {on ? <Bell size={20} color="#7c3aed" /> : <BellOff size={20} color="#6b7280" />}
        </View>
        <View className="flex-1">
          {state !== 'unsupported' ? (
            <Text className="font-semibold text-gray-900" testID="notification-status-title">
              {on ? 'Notifications are on' : 'Notifications are off'}
            </Text>
          ) : null}
          <Text className="text-sm text-gray-600" testID="notification-status-detail">{DETAIL[state]}</Text>
        </View>
      </View>
      {state === 'denied' ? (
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          testID="notification-open-settings"
          onPress={() => void Linking.openSettings().catch(() => undefined)}>
          <Text className="text-gray-900">Open settings</Text>
        </Button>
      ) : null}
      {state === 'undetermined' ? (
        <Button variant="outline" className="h-11 rounded-xl" testID="notification-enable" disabled={busy} onPress={turnOn}>
          <Text className="text-gray-900">Turn on</Text>
        </Button>
      ) : null}
    </View>
  );
}
