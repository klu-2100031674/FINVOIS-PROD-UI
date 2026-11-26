import { expect, test, type Page } from '@playwright/test';
import { ADMIN, fillLogin, mockAuth } from './helpers';

// Mocked API: these are failure states a real server cannot be told to produce on demand.
const storedKeys = (page: Page) =>
  page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith('finovis.')).sort());

test.describe('update required (A02)', () => {
  test('a 426 on sign-in replaces the app with a blocking update screen', async ({ page }) => {
    await mockAuth(page, {
      loginStatus: 426,
      loginBody: { success: false, error: 'Update required', code: 'UPDATE_REQUIRED' },
    });
    await page.goto('/');
    await fillLogin(page);

    await expect(page.getByTestId('update-required')).toBeVisible();
    await expect(page.getByText('Update the app to keep using it')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Finvois logo' })).toBeVisible();
    // The login form is gone, not just covered.
    await expect(page.getByTestId('login-button')).toHaveCount(0);
    await expect(page.getByTestId('email-input')).toHaveCount(0);
    await page.screenshot({ path: 'e2e/screenshots/a02-update-required.png' });
  });

  test('a 426 while restoring a session blocks the app and keeps the stored session for after the update', async ({ page }) => {
    await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.unroute('**/mobile/auth/**');
    await mockAuth(page, { refreshStatus: 426 });
    await page.reload();

    await expect(page.getByTestId('update-required')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveCount(0);
    // Not a rejection of the session: the user can come back after updating.
    expect(await storedKeys(page)).toContain('finovis.refreshToken');
  });
});

test.describe('launch without a connection (A02)', () => {
  test('keeps the stored session, shows sign-in with an offline notice, and restores once back online', async ({ page }) => {
    await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.unroute('**/mobile/auth/**');
    await page.route('**/mobile/auth/refresh', (route) => route.abort('internetdisconnected'));
    await page.reload();

    await expect(page.getByTestId('login-error')).toContainText("You're offline. Check your connection.");
    await expect(page.getByTestId('login-button')).toBeVisible();
    expect(await storedKeys(page)).toEqual(expect.arrayContaining(['finovis.refreshToken', 'finovis.user']));
    await page.screenshot({ path: 'e2e/screenshots/a02-offline-launch.png' });

    await page.unroute('**/mobile/auth/refresh');
    await mockAuth(page, { user: ADMIN });
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
  });

  test('a rejected refresh clears everything stored, unlike a network failure', async ({ page }) => {
    await mockAuth(page, { user: ADMIN });
    await page.goto('/');
    await fillLogin(page);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.unroute('**/mobile/auth/**');
    await mockAuth(page, { refreshStatus: 401 });
    await page.reload();

    await expect(page.getByTestId('login-error')).toContainText('Your session ended. Sign in again.');
    expect(await storedKeys(page)).not.toContain('finovis.refreshToken');
    expect(await storedKeys(page)).not.toContain('finovis.user');
  });
});
