import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Native: Keychain / Android Keystore. Web exists only so Playwright can drive the app in tests;
// it is not a shipped target, and uses sessionStorage (cleared with the tab).
const webStore = () => (typeof sessionStorage !== 'undefined' ? sessionStorage : null);

export async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStore()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStore()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
