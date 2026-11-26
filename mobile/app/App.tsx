import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
// Deep imports: the package root pulls in every weight of the family and bundles all of them.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { PortalHost } from '@rn-primitives/portal';
import { RootNavigator } from '~/navigation/RootNavigator';
import { sessionStore } from '~/auth/sessionStore';
import { PasswordChangeGate } from '~/auth/PasswordChangeGate';
import { UpdateRequiredGate } from '~/auth/UpdateRequiredGate';
import { queryClient } from '~/api/queryClient';
import { InactivityLock } from '~/security/InactivityLock';
import { NotificationBootstrap } from '~/notifications/NotificationBootstrap';
import * as SplashScreen from 'expo-splash-screen';

// Keep the Finvois launch screen up until the fonts are ready, instead of flashing a blank screen.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });

  useEffect(() => {
    // A font that fails to load must not leave the launch screen up forever.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Signing out (or a rejected refresh) must drop every cached server response.
    const off = sessionStore.onSignOut(() => queryClient.clear());
    void sessionStore.restore();
    return off;
  }, []);

  if (!fontsLoaded && !fontError) return null; // on a font error, carry on with the system font

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <UpdateRequiredGate>
          <InactivityLock>
            {/* Inside the gate: the notification prompt must not cover the Set your password screen. */}
            <PasswordChangeGate>
              <RootNavigator />
              <NotificationBootstrap />
            </PasswordChangeGate>
          </InactivityLock>
        </UpdateRequiredGate>
        <PortalHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
