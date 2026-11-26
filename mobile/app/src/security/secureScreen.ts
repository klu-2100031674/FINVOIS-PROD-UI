import { useEffect, useId } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * Blocks screenshots and screen recording while the calling screen is mounted (Android FLAG_SECURE,
 * iOS capture block). No-op on web. Each caller gets its own key, so one screen unmounting never
 * re-enables capture for another that is still on the navigation stack.
 *
 * Screens that must call it (doc 06 section 6): PdfViewerScreen, AgentDocumentsScreen, ReportDetailScreen.
 */
export function usePreventScreenCapture(enabled = true) {
  const key = useId();
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined);
    return () => {
      ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [enabled, key]);
}

/**
 * Keeps the app switcher thumbnail free of content. iOS: native blur over the app while it is not active.
 * Android: FLAG_SECURE is the only reliable way to blank the recents thumbnail, so it also blocks screenshots
 * everywhere while enabled. If that is too strict, enable it only on the screens above instead.
 */
export function useAppSwitcherProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') return;
    ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() => undefined);
    return () => {
      ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, [enabled]);
  usePreventScreenCapture(enabled && Platform.OS === 'android');
}
