import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockSession = { current: { status: 'signedIn', user: { id: 'u1', role: 'customer_service' } } as unknown };
const mockOnSignOut = jest.fn((_hook: () => void) => jest.fn());

jest.mock('~/auth/sessionStore', () => ({ sessionStore: { onSignOut: (h: () => void) => mockOnSignOut(h) } }));
jest.mock('~/auth/useSession', () => ({ useSession: () => mockSession.current }));
jest.mock('lucide-react-native', () => ({ Bell: () => null })); // the package ships untransformed ESM
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../handlers', () => ({ startPushHandlers: jest.fn(() => jest.fn()), flushPushTap: jest.fn(), openPushTarget: jest.fn() }));
jest.mock('../register', () => ({
  getPushPermission: jest.fn(),
  enablePush: jest.fn(async () => 'granted'),
  syncPushToken: jest.fn(async () => 'registered'),
  rationaleSeen: jest.fn(),
  markRationaleSeen: jest.fn(async () => undefined),
  cleanupPushOnSignOut: jest.fn(),
}));
// The real dialog needs native portals and reanimated; a flat stand-in keeps this test about the bootstrap's decisions.
jest.mock('../RationaleModal', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    RationaleModal: ({ visible, onAllow, onNotNow }: { visible: boolean; onAllow: () => void; onNotNow: () => void }) =>
      visible ? (
        <View testID="push-rationale">
          <Pressable testID="push-allow" onPress={onAllow}><Text>Allow</Text></Pressable>
          <Pressable testID="push-not-now" onPress={onNotNow}><Text>Not now</Text></Pressable>
        </View>
      ) : null,
  };
});

import { NotificationBootstrap } from '../NotificationBootstrap';
import { flushPushTap, openPushTarget, startPushHandlers } from '../handlers';
import { cleanupPushOnSignOut, enablePush, getPushPermission, markRationaleSeen, rationaleSeen, syncPushToken } from '../register';

const permission = getPushPermission as jest.Mock;
const seen = rationaleSeen as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.current = { status: 'signedIn', user: { id: 'u1', role: 'customer_service' } };
  seen.mockResolvedValue(false);
});

async function mount() {
  await render(<NotificationBootstrap />);
  await act(async () => {});
}

describe('after sign-in', () => {
  it('explains once, before asking, when permission has not been decided', async () => {
    permission.mockResolvedValue('undetermined');
    await mount();
    await waitFor(() => expect(screen.getByTestId('push-rationale')).toBeTruthy());
    expect(enablePush).not.toHaveBeenCalled();
  });

  it('Allow asks for permission and registers the device, and remembers it was shown', async () => {
    permission.mockResolvedValue('undetermined');
    await mount();
    await fireEvent.press(await screen.findByTestId('push-allow'));
    await waitFor(() => expect(enablePush).toHaveBeenCalledWith('u1'));
    expect(markRationaleSeen).toHaveBeenCalled();
    expect(screen.queryByTestId('push-rationale')).toBeNull();
  });

  it('Not now leaves the app working: no permission prompt, no token, and the sheet does not come back', async () => {
    permission.mockResolvedValue('undetermined');
    await mount();
    await fireEvent.press(await screen.findByTestId('push-not-now'));
    await waitFor(() => expect(markRationaleSeen).toHaveBeenCalled());
    expect(enablePush).not.toHaveBeenCalled();
    expect(syncPushToken).not.toHaveBeenCalled();
    expect(screen.queryByTestId('push-rationale')).toBeNull();
  });

  it('does not show the sheet again once it has been seen', async () => {
    permission.mockResolvedValue('undetermined');
    seen.mockResolvedValue(true);
    await mount();
    expect(screen.queryByTestId('push-rationale')).toBeNull();
  });

  it('does not show the sheet when notifications are denied in the phone settings', async () => {
    permission.mockResolvedValue('denied');
    await mount();
    expect(screen.queryByTestId('push-rationale')).toBeNull();
    expect(syncPushToken).not.toHaveBeenCalled();
  });

  it('checks the token on launch, without asking, when already allowed', async () => {
    permission.mockResolvedValue('granted');
    await mount();
    expect(syncPushToken).toHaveBeenCalledWith('u1');
    expect(screen.queryByTestId('push-rationale')).toBeNull();
  });

  it('survives the permission check failing', async () => {
    permission.mockRejectedValue(new Error('native module missing'));
    await expect(mount()).resolves.toBeUndefined();
    expect(screen.queryByTestId('push-rationale')).toBeNull();
  });

  it('does nothing while signed out or loading', async () => {
    for (const session of [{ status: 'signedOut' }, { status: 'loading' }]) {
      mockSession.current = session;
      await mount();
    }
    expect(permission).not.toHaveBeenCalled();
  });
});

describe('wiring', () => {
  it('starts the tap handlers and the sign-out cleanup, and routes a tap that is already queued', async () => {
    permission.mockResolvedValue('denied');
    await mount();
    expect(startPushHandlers).toHaveBeenCalledTimes(1);
    expect(mockOnSignOut).toHaveBeenCalledWith(cleanupPushOnSignOut);
    expect(flushPushTap).toHaveBeenCalled();
  });

  it('shows the in-app banner for a foreground notification and opens it on tap', async () => {
    permission.mockResolvedValue('denied');
    await mount();
    const onForeground = (startPushHandlers as jest.Mock).mock.calls[0][0];
    await act(async () => onForeground({ type: 'dpr_assigned', id: '64b7f0c2a1d3e4f5a6b7c8d9' }));
    expect(screen.getByText('New DPR assigned')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('push-banner'));
    expect(openPushTarget).toHaveBeenCalledWith({ type: 'dpr_assigned', id: '64b7f0c2a1d3e4f5a6b7c8d9' });
    expect(screen.queryByTestId('push-banner')).toBeNull();
  });
});
