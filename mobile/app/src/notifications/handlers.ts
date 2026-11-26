import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { queryClient } from '~/api/queryClient';
import { sessionStore } from '~/auth/sessionStore';
import { navigationRef } from '~/navigation/navigationRef';
import { allowedForRole, parsePushData, type PushRole, type PushTarget } from './payload';

// One tap waiting for a session and a mounted navigator. A newer tap replaces it.
let pending: PushTarget | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastHandledId: string | undefined;

function openTarget(target: PushTarget, role: PushRole): boolean {
  if (!navigationRef.isReady()) return false;
  if (target.type === 'report_submitted') {
    navigationRef.navigate('ReportDetail', { reportId: target.id });
  } else if (target.type === 'enquiry_submitted') {
    navigationRef.navigate('EnquiryDetail', { enquiryId: target.id });
  } else if (target.type === 'pending_digest') {
    if (role === 'admin') navigationRef.navigate('Admin', { screen: 'Dashboard' });
    else navigationRef.navigate('Agent', { screen: 'My work', params: { tab: 'mine' } });
  } else if (target.type === 'dpr_submitted') {
    if (role === 'admin') navigationRef.navigate('Admin', { screen: 'Requests', params: { filter: 'pending' } });
    else navigationRef.navigate('Agent', { screen: 'My work', params: { tab: 'open' } });
  } else {
    navigationRef.navigate('AgentRequestDetail', { requestId: target.id });
  }
  return true;
}

/** Navigates to the queued tap once the session is restored and signed in. Safe to call any time. */
export function flushPushTap(tries = 0) {
  clearTimeout(timer);
  if (!pending) return;
  const session = sessionStore.getState();
  // Loading: wait for the restore. Signed out: sign in first; the bootstrap flushes again when that happens.
  if (session.status !== 'signedIn') return;
  if (!allowedForRole(pending.type, session.user.role)) {
    pending = null;
    return;
  }
  if (openTarget(pending, session.user.role)) {
    pending = null;
    return;
  }
  if (tries < 40) timer = setTimeout(() => flushPushTap(tries + 1), 250); // navigator still mounting
}

export function openPushTarget(target: PushTarget) {
  pending = target;
  flushPushTap();
}

/** Takes a raw notification payload. Malformed or off-list data is ignored. */
export function queuePushTap(data: unknown) {
  const target = parsePushData(data);
  if (target) openPushTarget(target);
}

function onResponse(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  // A cold-start tap can come through both the listener and getLastNotificationResponseAsync.
  const id = response.notification.request.identifier;
  if (id === lastHandledId) return;
  lastHandledId = id;
  queuePushTap(response.notification.request.content.data);
  void Promise.resolve(Notifications.clearLastNotificationResponseAsync()).catch(() => undefined);
}

/** Wires foreground display and tap handling. `onForeground` shows the in-app banner. Returns the cleanup. */
export function startPushHandlers(onForeground: (target: PushTarget) => void): () => void {
  if (Platform.OS === 'web') return () => undefined;

  // The in-app banner replaces the system alert, so the system shows nothing while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const received = Notifications.addNotificationReceivedListener((notification) => {
    const target = parsePushData(notification.request.content.data);
    const session = sessionStore.getState();
    if (!target || session.status !== 'signedIn' || !allowedForRole(target.type, session.user.role)) return;
    // No query-key coupling: this refetches whatever is on screen and marks the rest stale.
    void queryClient.invalidateQueries();
    onForeground(target);
  });
  const tapped = Notifications.addNotificationResponseReceivedListener(onResponse);
  void Promise.resolve(Notifications.getLastNotificationResponseAsync()).then(onResponse).catch(() => undefined);

  return () => {
    received.remove();
    tapped.remove();
  };
}
