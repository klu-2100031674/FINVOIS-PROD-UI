import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { sessionStore } from '~/auth/sessionStore';
import { useSession } from '~/auth/useSession';
import { flushPushTap, openPushTarget, startPushHandlers } from './handlers';
import { PUSH_COPY, type PushTarget } from './payload';
import { RationaleModal } from './RationaleModal';
import { cleanupPushOnSignOut, enablePush, getPushPermission, markRationaleSeen, rationaleSeen, syncPushToken } from './register';

const BANNER_MS = 5000;

function Banner({ target, onClose }: { target: PushTarget; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const copy = PUSH_COPY[target.type];
  useEffect(() => {
    const t = setTimeout(onClose, BANNER_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <Pressable
      testID="push-banner"
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.body}`}
      onPress={() => {
        onClose();
        openPushTarget(target);
      }}
      style={{ top: insets.top + 8, elevation: 8 }}
      className="absolute left-4 right-4 z-50 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-black/10">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
        <Bell size={20} color="#7c3aed" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{copy.title}</Text>
        <Text className="text-sm text-gray-600">{copy.body}</Text>
      </View>
    </Pressable>
  );
}

function NativeBootstrap() {
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const [rationale, setRationale] = useState(false);
  const [banner, setBanner] = useState<{ target: PushTarget; n: number } | null>(null);

  useEffect(() => {
    const stop = startPushHandlers((target) => setBanner((b) => ({ target, n: (b?.n ?? 0) + 1 })));
    const off = sessionStore.onSignOut(cleanupPushOnSignOut);
    return () => {
      stop();
      off();
    };
  }, []);

  // A tap that arrived before the session was restored (or while signed out) is routed once it is signed in.
  useEffect(() => {
    flushPushTap();
  }, [session.status]);

  // Signing out drops anything shown for the previous user.
  const [lastUserId, setLastUserId] = useState(userId);
  if (userId !== lastUserId) {
    setLastUserId(userId);
    if (!userId) {
      setRationale(false);
      setBanner(null);
    }
  }

  // After sign-in or a restored session: register if allowed, otherwise explain once before asking.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const permission = await getPushPermission();
      if (cancelled) return;
      if (permission === 'granted') void syncPushToken(userId);
      else if (permission === 'undetermined' && !(await rationaleSeen()) && !cancelled) setRationale(true);
    })().catch(() => undefined); // a failure here must never affect the app: alerts are optional
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const closeBanner = useCallback(() => setBanner(null), []);

  const answer = (allow: boolean) => {
    setRationale(false);
    void (async () => {
      await markRationaleSeen().catch(() => undefined);
      if (allow && userId) await enablePush(userId);
    })().catch(() => undefined);
  };

  return (
    <>
      {banner ? <Banner key={banner.n} target={banner.target} onClose={closeBanner} /> : null}
      <RationaleModal visible={rationale} onAllow={() => answer(true)} onNotNow={() => answer(false)} />
    </>
  );
}

// Push does not exist on the web build (a test harness only), so everything here is skipped there.
export function NotificationBootstrap() {
  return Platform.OS === 'web' ? null : <NativeBootstrap />;
}
