import { expect, test } from '@playwright/test';
import { loginAs, resetDb, screenshot, type E2eState } from './real';

// Real API, real database (in memory), real sign-in flow. No mocks.
test.describe('login against the real backend', () => {
  let state: E2eState;
  test.beforeEach(async ({ request }, info) => {
    state = await resetDb(request, info);
  });

  test('admin signs in and lands on the admin tabs', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
    await screenshot(page, 'real-01-admin-home');
  });

  test('agent signs in and lands on My work only', async ({ page }) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Reports' })).toHaveCount(0);
  });

  test('a channel partner account is rejected', async ({ page }) => {
    await loginAs(page, state, state.accounts.partner);
    await expect(page.getByTestId('login-error')).toContainText('This app is for admin and support staff.');
  });

  test('an inactive agent cannot sign in', async ({ page }) => {
    await loginAs(page, state, state.accounts.inactive);
    await expect(page.getByTestId('login-error')).toContainText(/inactive/i);
  });

  test('a wrong password shows the generic message', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('email-input').fill(state.accounts.admin);
    await page.getByTestId('password-input').fill('definitely-wrong');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('login-error')).toContainText('Email or password is incorrect.');
  });

  test('reload keeps the session, sign out ends it', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();

    await page.getByRole('tab', { name: 'Profile' }).click();
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('sign-out').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
