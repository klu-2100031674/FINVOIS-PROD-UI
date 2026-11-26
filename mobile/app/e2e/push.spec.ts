import { expect, test, type Page } from '@playwright/test';
import { allowedForRole, parsePushData } from '../src/notifications/payload';
import { apiCall, apiLogin, loginAs, pushes, resetDb, screenshot, type E2eState } from './real';

// A11: push client. Push does not exist in a browser, so on the web build every notification path must be a
// silent no-op and the app must behave exactly as before. The native behaviour (permission prompt, token,
// tap routing from a killed app) cannot run here; it is covered by jest and by the device matrix in docs/09.
// The last describe checks the real API against the shapes the client sends and expects back.
test.describe('push on the web build', () => {
  let state: E2eState;
  let pushCalls: string[];
  let pageErrors: string[];

  test.beforeEach(async ({ page, request }, info) => {
    state = await resetDb(request, info);
    pushCalls = [];
    pageErrors = [];
    page.on('request', (r) => r.url().includes('/mobile/push') && pushCalls.push(`${r.method()} ${r.url()}`));
    page.on('pageerror', (e) => pageErrors.push(e.message));
  });

  const openProfile = async (page: Page) => {
    await page.getByRole('tab', { name: 'Profile', exact: true }).click();
    await expect(page.getByTestId('notification-status')).toBeVisible();
  };

  test('admin signs in and nothing asks for notification permission or touches the push API', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard', exact: true })).toBeVisible();
    await openProfile(page);
    await expect(page.getByTestId('push-rationale')).toHaveCount(0);
    await expect(page.getByTestId('push-banner')).toHaveCount(0);
    expect(pushCalls).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('admin profile row explains that alerts are a mobile feature, with no settings button', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await openProfile(page);
    await expect(page.getByTestId('notification-status-detail')).toHaveText('Notifications are available in the mobile app.');
    // "on" or "off" would be a claim about a permission that does not exist in a browser
    await expect(page.getByTestId('notification-status-title')).toHaveCount(0);
    await expect(page.getByTestId('notification-open-settings')).toHaveCount(0);
    await expect(page.getByTestId('notification-enable')).toHaveCount(0);
    await screenshot(page, 'a11-01-admin-profile-web');
  });

  test('agent sees the same row and the app works as usual', async ({ page }) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work', exact: true })).toBeVisible();
    await openProfile(page);
    await expect(page.getByTestId('profile-role')).toHaveText('Customer service agent');
    await expect(page.getByTestId('notification-status-detail')).toContainText('mobile app');
    await expect(page.getByTestId('sign-out')).toBeVisible();
    await screenshot(page, 'a11-02-agent-profile-web');
    expect(pushCalls).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('signing out on the web makes no push call and returns to the login screen', async ({ page }) => {
    await loginAs(page, state, state.accounts.agents[1]);
    await openProfile(page);
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('sign-out').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
    expect(pushCalls).toEqual([]);
  });

  test('a web address shaped like a deep link opens nothing', async ({ page }) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work', exact: true })).toBeVisible();
    await page.goto(`/request/${state.ids.requests.open1}`);
    await expect(page.getByRole('tab', { name: 'My work', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Profile', exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

// The server half of the contract, driven with the exact bodies src/api/push.ts sends.
test.describe('push contract with the real API', () => {
  let state: E2eState;
  const device = 'a11-agent-device';
  const token = 'ExponentPushToken[a11-agent-device]';

  test.beforeEach(async ({ request }, info) => {
    state = await resetDb(request, info);
  });

  test('a registered agent device receives a payload the client accepts, and stops after unregister', async ({ request }, info) => {
    const suresh = await apiLogin(request, info, 'suresh@e2e.test', state.password);
    const admin = await apiLogin(request, info, state.accounts.admin, state.password);

    const reg = await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/register', {
      expoPushToken: token,
      deviceId: device,
      platform: 'android',
    });
    expect(reg.status).toBe(200);
    // registering again from the same device is an update, not a second record or an error
    expect((await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/register', { expoPushToken: token, deviceId: device, platform: 'android' })).status).toBe(200);

    const assign = (requestId: string) =>
      apiCall(request, info, admin.accessToken, 'post', `/govt-forms/requests/${requestId}/assign`, { csUserId: state.ids.suresh });
    expect((await assign(state.ids.requests.open1)).status).toBe(200);

    await expect.poll(async () => (await pushes(request, info)).length, { timeout: 10000 }).toBe(1);
    const [push] = await pushes(request, info);
    expect(push.to).toBe(token);
    const target = parsePushData(push.data);
    expect(target).toEqual({ type: 'dpr_assigned', id: state.ids.requests.open1 });
    expect(allowedForRole(target!.type, 'customer_service')).toBe(true);
    expect(allowedForRole(target!.type, 'admin')).toBe(false);
    expect(`${push.title} ${push.body}`).not.toContain('@'); // generic copy, no personal details

    const off = await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/unregister', { deviceId: device });
    expect(off.status).toBe(200);
    expect((await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/unregister', { deviceId: device })).status).toBe(200); // idempotent

    expect((await assign(state.ids.requests.open2)).status).toBe(200);
    await new Promise((r) => setTimeout(r, 1500)); // pushes are fire-and-forget; give a wrongly kept token time to show up
    expect(await pushes(request, info)).toHaveLength(1);
  });

  test('registration needs a signed-in user and rejects a body the client would never send', async ({ request }, info) => {
    const anon = await request.post(`${info.config.metadata.apiBase}/api/mobile/push/register`, {
      data: { expoPushToken: token, deviceId: device, platform: 'android' },
    });
    expect(anon.status()).toBe(401);

    const suresh = await apiLogin(request, info, 'suresh@e2e.test', state.password);
    const bad = await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/register', {
      expoPushToken: 'not-an-expo-token',
      deviceId: device,
      platform: 'android',
    });
    expect(bad.status).toBe(400);
  });
});
