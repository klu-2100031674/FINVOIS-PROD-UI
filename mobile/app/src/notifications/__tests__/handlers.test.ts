jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  clearLastNotificationResponseAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('~/auth/sessionStore', () => ({ sessionStore: { getState: jest.fn() } }));
jest.mock('~/navigation/navigationRef', () => ({ navigationRef: { isReady: jest.fn(), navigate: jest.fn() } }));
jest.mock('~/api/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn() } }));

const ID = '64b7f0c2a1d3e4f5a6b7c8d9';
const AGENT = { status: 'signedIn', user: { id: 'u1', name: 'A', email: 'a@e2e.test', role: 'customer_service' } };
const ADMIN = { status: 'signedIn', user: { id: 'u2', name: 'C', email: 'c@e2e.test', role: 'admin' } };
const LOADING = { status: 'loading' };
const SIGNED_OUT = { status: 'signedOut' };

type Listener = (arg: unknown) => void;

// Module state (the queued tap, the dedupe id) must start clean in every test, so each test loads a fresh copy.
function load() {
  jest.resetModules();
  const Notifications = require('expo-notifications');
  const { sessionStore } = require('~/auth/sessionStore');
  const { navigationRef } = require('~/navigation/navigationRef');
  const { queryClient } = require('~/api/queryClient');
  const handlers = require('../handlers') as typeof import('../handlers');
  navigationRef.isReady.mockReturnValue(true);
  const listener = (fn: jest.Mock): Listener => fn.mock.calls[0][0];
  return { Notifications, sessionStore, navigationRef, queryClient, handlers, listener };
}

const response = (data: unknown, identifier = 'n-1', actionIdentifier = 'expo.modules.notifications.actions.DEFAULT') => ({
  actionIdentifier,
  notification: { request: { identifier, content: { data } } },
});

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('routing a tap', () => {
  it('opens the request for each agent type', () => {
    for (const type of ['dpr_assigned', 'report_approved', 'claim_expiring']) {
      const { sessionStore, navigationRef, handlers } = load();
      sessionStore.getState.mockReturnValue(AGENT);
      handlers.queuePushTap({ type, id: ID });
      expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
      expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
    }
  });

  it('sends an admin to the pending requests', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.queuePushTap({ type: 'dpr_submitted', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('Admin', { screen: 'Requests', params: { filter: 'pending' } });
  });

  it('ignores a type for the other role, and never routes it later either', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.queuePushTap({ type: 'dpr_assigned', id: ID });
    handlers.flushPushTap();
    jest.advanceTimersByTime(20000);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it('drops a tap queued for one role when a different role signs in', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(SIGNED_OUT);
    handlers.queuePushTap({ type: 'dpr_assigned', id: ID });
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.flushPushTap();
    expect(navigationRef.navigate).not.toHaveBeenCalled();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.flushPushTap();
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['unknown type', { type: 'wipe', id: ID }],
    ['bad id', { type: 'dpr_assigned', id: 'abc' }],
    ['no id', { type: 'dpr_assigned' }],
    ['not an object', 'dpr_assigned'],
    ['null', null],
    ['an id that tries to be a path', { type: 'dpr_assigned', id: '../../admin/users/000000' }],
  ])('ignores a malformed payload: %s', (_label, data) => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.queuePushTap(data);
    handlers.flushPushTap();
    jest.advanceTimersByTime(20000);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });
});

describe('cold start', () => {
  it('waits for the session to be restored, then routes', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(LOADING);
    handlers.queuePushTap({ type: 'dpr_assigned', id: ID });
    jest.advanceTimersByTime(5000);
    expect(navigationRef.navigate).not.toHaveBeenCalled();

    sessionStore.getState.mockReturnValue(AGENT);
    handlers.flushPushTap(); // what the bootstrap does when the session status changes
    expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
  });

  it('with no valid session, routes only after the user signs in', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(SIGNED_OUT);
    handlers.queuePushTap({ type: 'report_approved', id: ID });
    handlers.flushPushTap();
    expect(navigationRef.navigate).not.toHaveBeenCalled();

    sessionStore.getState.mockReturnValue(AGENT);
    handlers.flushPushTap();
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
    handlers.flushPushTap();
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1); // consumed, not repeated
  });

  it('keeps trying while the navigator is still mounting', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    navigationRef.isReady.mockReturnValue(false);
    handlers.queuePushTap({ type: 'claim_expiring', id: ID });
    jest.advanceTimersByTime(1000);
    expect(navigationRef.navigate).not.toHaveBeenCalled();

    navigationRef.isReady.mockReturnValue(true);
    jest.advanceTimersByTime(250);
    expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
  });

  it('picks up the tap that launched the app via getLastNotificationResponseAsync', async () => {
    const { Notifications, sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(LOADING);
    Notifications.getLastNotificationResponseAsync.mockResolvedValue(response({ type: 'dpr_assigned', id: ID }));
    handlers.startPushHandlers(jest.fn());
    await Promise.resolve();
    await Promise.resolve();
    expect(navigationRef.navigate).not.toHaveBeenCalled();
    expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled();

    sessionStore.getState.mockReturnValue(AGENT);
    handlers.flushPushTap();
    expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
  });
});

describe('response listener', () => {
  it('routes a tap on the notification body', () => {
    const { Notifications, sessionStore, navigationRef, handlers, listener } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.startPushHandlers(jest.fn());
    listener(Notifications.addNotificationResponseReceivedListener)(response({ type: 'dpr_assigned', id: ID }));
    expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
  });

  it('ignores other actions, such as a dismissal', () => {
    const { Notifications, sessionStore, navigationRef, handlers, listener } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.startPushHandlers(jest.fn());
    listener(Notifications.addNotificationResponseReceivedListener)(
      response({ type: 'dpr_assigned', id: ID }, 'n-1', 'expo.modules.notifications.actions.DISMISS')
    );
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it('handles the same notification once when it arrives twice', async () => {
    const { Notifications, sessionStore, navigationRef, handlers, listener } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    Notifications.getLastNotificationResponseAsync.mockResolvedValue(response({ type: 'dpr_assigned', id: ID }, 'same'));
    handlers.startPushHandlers(jest.fn());
    listener(Notifications.addNotificationResponseReceivedListener)(response({ type: 'dpr_assigned', id: ID }, 'same'));
    await Promise.resolve();
    await Promise.resolve();
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
  });

  it('removes both listeners on cleanup', () => {
    const { Notifications, handlers } = load();
    const stop = handlers.startPushHandlers(jest.fn());
    stop();
    for (const fn of [Notifications.addNotificationReceivedListener, Notifications.addNotificationResponseReceivedListener]) {
      expect(fn.mock.results[0].value.remove).toHaveBeenCalled();
    }
  });
});

describe('foreground', () => {
  it('shows nothing from the system, so the in-app banner is the only alert', async () => {
    const { Notifications, handlers } = load();
    handlers.startPushHandlers(jest.fn());
    const { handleNotification } = Notifications.setNotificationHandler.mock.calls[0][0];
    await expect(handleNotification()).resolves.toEqual({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  it('shows the banner and refetches on a valid notification', () => {
    const { Notifications, sessionStore, queryClient, handlers, listener } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    const banner = jest.fn();
    handlers.startPushHandlers(banner);
    listener(Notifications.addNotificationReceivedListener)({ request: { content: { data: { type: 'report_approved', id: ID } } } });
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(banner).toHaveBeenCalledWith({ type: 'report_approved', id: ID });
  });

  it.each([
    ['malformed', AGENT, { type: 'nope', id: ID }],
    ['bad id', AGENT, { type: 'dpr_assigned', id: 'x' }],
    ['for the other role', ADMIN, { type: 'dpr_assigned', id: ID }],
    ['while signed out', SIGNED_OUT, { type: 'dpr_assigned', id: ID }],
    ['while the session is loading', LOADING, { type: 'dpr_assigned', id: ID }],
  ])('does nothing for a notification that is %s', (_label, session, data) => {
    const { Notifications, sessionStore, queryClient, handlers, listener } = load();
    sessionStore.getState.mockReturnValue(session);
    const banner = jest.fn();
    handlers.startPushHandlers(banner);
    listener(Notifications.addNotificationReceivedListener)({ request: { content: { data } } });
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(banner).not.toHaveBeenCalled();
  });

  it('opens the target when the banner is tapped', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.openPushTarget({ type: 'dpr_submitted', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('Admin', { screen: 'Requests', params: { filter: 'pending' } });
  });

  it('opens the report for an admin when one waits for approval', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.openPushTarget({ type: 'report_submitted', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('ReportDetail', { reportId: ID });
  });

  it('opens the request for an agent whose report was rejected', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.openPushTarget({ type: 'report_rejected', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('AgentRequestDetail', { requestId: ID });
  });

  it('opens Home for an admin and My work for an agent on the pending summary', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(ADMIN);
    handlers.openPushTarget({ type: 'pending_digest', id: ID });
    expect(navigationRef.navigate).toHaveBeenLastCalledWith('Admin', { screen: 'Dashboard' });
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.openPushTarget({ type: 'pending_digest', id: ID });
    expect(navigationRef.navigate).toHaveBeenLastCalledWith('Agent', { screen: 'My work', params: { tab: 'mine' } });
  });

  it('sends an agent to the open queue for a new DPR', () => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(AGENT);
    handlers.openPushTarget({ type: 'dpr_submitted', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('Agent', { screen: 'My work', params: { tab: 'open' } });
  });

  it.each([['admin'], ['agent']])('opens the enquiry for an %s', (who) => {
    const { sessionStore, navigationRef, handlers } = load();
    sessionStore.getState.mockReturnValue(who === 'admin' ? ADMIN : AGENT);
    handlers.openPushTarget({ type: 'enquiry_submitted', id: ID });
    expect(navigationRef.navigate).toHaveBeenCalledWith('EnquiryDetail', { enquiryId: ID });
  });
});

describe('web', () => {
  it('is a no-op', () => {
    const { Notifications, handlers } = load();
    const spy = jest.replaceProperty(require('react-native').Platform, 'OS', 'web'); // the copy handlers.ts loaded
    try {
      const stop = handlers.startPushHandlers(jest.fn());
      expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
      expect(Notifications.getLastNotificationResponseAsync).not.toHaveBeenCalled();
      expect(() => stop()).not.toThrow();
    } finally {
      spy.restore();
    }
  });
});
