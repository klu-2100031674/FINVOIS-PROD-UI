import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { deleteSecure, getSecure, setSecure } from '~/auth/storage';

// Only a flag is stored. The biometric never replaces the server session: an unlock just hides the
// lock screen, and the next API call (or the refresh in InactivityLock) still needs a live session.
const FLAG_KEY = 'finovis.biometricUnlock';

/** True when the device has biometric hardware and at least one enrolled face or fingerprint. */
export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** The flag only counts while biometrics are still enrolled, so removing them falls back to the password. */
export async function biometricUnlockEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return (await getSecure(FLAG_KEY)) === '1' && (await biometricsAvailable());
}

export const setBiometricUnlock = (on: boolean) => (on ? setSecure(FLAG_KEY, '1') : deleteSecure(FLAG_KEY));

/** Prompts the OS. Device passcode fallback is off: someone who knows the phone PIN must not get into the app. */
export async function promptBiometric(promptMessage: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use password',
      disableDeviceFallback: true,
    });
    return res.success;
  } catch {
    return false;
  }
}
