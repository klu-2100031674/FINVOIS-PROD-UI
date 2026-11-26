import { useSyncExternalStore, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleArrowUp } from 'lucide-react-native';
import { AuthBackdrop } from '~/components/AuthBackdrop';
import { Text } from '~/components/ui/text';
import { APP_VERSION } from '~/config';
import { sessionStore } from './sessionStore';

const logo = require('../../assets/finvois-logo.png');

/**
 * Replaces the whole app once the API answers 426 UPDATE_REQUIRED, so nothing underneath can be used.
 * There is no way past it except installing a newer build.
 */
export function UpdateRequiredGate({ children }: { children: ReactNode }) {
  const blocked = useSyncExternalStore(sessionStore.subscribe, sessionStore.isUpdateRequired);
  if (!blocked) return <>{children}</>;

  return (
    <AuthBackdrop>
      {/* Padding sits on an inner View: SafeAreaView applies its own inset padding over a className. */}
      <SafeAreaView className="flex-1" testID="update-required">
        <View className="flex-1 justify-center px-4">
          <View
            accessibilityRole="alert"
            className="w-full max-w-md items-center gap-4 self-center rounded-3xl bg-white/95 p-7 shadow-2xl">
            <Image
              source={logo}
              accessibilityLabel="Finvois logo"
              style={{ width: 160, height: 48 }}
              resizeMode="contain"
            />
            <View className="h-14 w-14 items-center justify-center rounded-full bg-purple-100">
              <CircleArrowUp size={28} color="#7c3aed" />
            </View>
            {/* Non-breaking space keeps "it" from wrapping onto a line of its own. */}
            <Text className="text-center font-manrope text-2xl text-gray-900">
              Update the app to keep using{' '}it
            </Text>
            <Text className="text-center text-gray-600">
              This version of Finvois is out of date and can no longer connect. Install the latest version from the
              Play Store or App Store, then open the app again.
            </Text>
            <Text className="text-xs text-gray-400">Installed version {APP_VERSION}</Text>
          </View>
        </View>
      </SafeAreaView>
    </AuthBackdrop>
  );
}
