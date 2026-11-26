import { expect, test } from '@playwright/test';
import { ADMIN, AGENT, fillLogin, mockAuth } from './helpers';

test.describe('login and session (A02, A03)', () => {
  test('login screen matches the web theme', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    await expect(page.getByText('DPR management')).toBeVisible();
    await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Admin and support staff only')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Finvois logo' })).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();

    // black primary button, white rounded card, as on the web login
    const bg = await page.getByTestId('login-button').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(0, 0, 0)');

    // no sign-up, Google, or customer portal entry points in this app
    await expect(page.getByText(/sign up|google|customer otp/i)).toHaveCount(0);
    await page.screenshot({ path: 'e2e/screenshots/01-login.png', fullPage: true });
  });

  test('empty form shows a validation message and sends nothing', async ({ page }) => {
    const calls = await mockAuth(page);
    await page.goto('/');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('login-error')).toContainText('Enter your email and password.');
    expect(calls).toHaveLength(0);
  });

  test('password can be shown and hidden', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    const input = page.getByTestId('password-input');
    await expect(input).toHaveAttribute('type', 'password');
    await page.getByTestId('toggle-password').click();
    await expect(input).not.toHaveAttribute('type', 'password');
  });

  test('wrong credentials show one generic message', async ({ page }) => {
    await mockAuth(page, { loginStatus: 401 });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByTestId('login-error')).toContainText('Email or password is incorrect.');
    await page.screenshot({ path: 'e2e/screenshots/02-login-error.png' });
  });

  test('other roles are rejected and no session is kept', async ({ page }) => {
    await mockAuth(page, {
      loginStatus: 403,
      loginBody: { success: false, error: 'This app is for admin and support staff.', code: 'ROLE_NOT_ALLOWED' },
    });
    await page.goto('/');
    await fillLogin(page, 'partner@test.com');
    await expect(page.getByTestId('login-error')).toContainText('This app is for admin and support staff.');
    const stored = await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith('finovis.refresh')));
    expect(stored).toHaveLength(0);
  });

  test('rate limit shows a wait message', async ({ page }) => {
    await mockAuth(page, { loginStatus: 429, loginBody: { success: false, error: 'Too many attempts. Try again later.' } });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByTestId('login-error')).toContainText('Too many attempts');
  });

  test('admin login opens the admin tabs, sends device details, and signs out', async ({ page }) => {
    const calls = await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);

    for (const tab of ['Dashboard', 'Reports', 'Requests', 'Profile']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
    await page.screenshot({ path: 'e2e/screenshots/03-admin-tabs.png' });

    const login = calls.find((c) => c.path === 'login')!;
    expect(login.body).toMatchObject({ email: 'ca@test.com', platform: 'android', appVersion: '1.0.0' });
    expect(String(login.body.deviceId).length).toBeGreaterThan(10);

    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByTestId('profile-email')).toHaveText(ADMIN.email);
    await expect(page.getByTestId('profile-role')).toHaveText('CA / Super admin');
    await page.screenshot({ path: 'e2e/screenshots/04-profile.png' });

    page.once('dialog', (d) => d.accept());
    await page.getByTestId('sign-out').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
    expect(calls.some((c) => c.path === 'logout')).toBe(true);
    const left = await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith('finovis.refresh')));
    expect(left).toHaveLength(0);
  });

  test('agent login opens only the agent tabs', async ({ page }) => {
    await mockAuth(page, { user: AGENT });
    await page.goto('/');
    await fillLogin(page, 'agent@test.com');
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Reports' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Requests' })).toHaveCount(0);
    await page.screenshot({ path: 'e2e/screenshots/05-agent-tabs.png' });
  });

  test('reload restores the session through a refresh', async ({ page }) => {
    const calls = await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    const refresh = calls.find((c) => c.path === 'refresh')!;
    expect(refresh.body.refreshToken).toBe('refresh-1');
  });

  test('a rejected refresh returns to login with a notice', async ({ page }) => {
    await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.unroute('**/mobile/auth/**');
    await mockAuth(page, { refreshStatus: 401 });
    await page.reload();
    await expect(page.getByTestId('login-error')).toContainText('Your session ended. Sign in again.');
  });
});
