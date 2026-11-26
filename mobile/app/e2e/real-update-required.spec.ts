import { expect, test } from '@playwright/test';
import { loginAs, resetDb, screenshot, type E2eState } from './real';

// The real API refuses builds below MOBILE_MIN_APP_VERSION with 426. The e2e server reads that variable
// when it starts, so this spec only runs when it is set for the whole run:
//   MOBILE_MIN_APP_VERSION=9.0.0 node scripts/e2e-run.js <slot> e2e/real-update-required.spec.ts
// This app reports version 1.0.0, so every mobile call is refused.
test.describe('update required against the real backend', () => {
  test.skip(!process.env.MOBILE_MIN_APP_VERSION, 'needs MOBILE_MIN_APP_VERSION set for the e2e server');

  let state: E2eState;
  test.beforeEach(async ({ request }, info) => {
    state = await resetDb(request, info);
  });

  test('the server gate turns into the blocking update screen', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByTestId('update-required')).toBeVisible();
    await expect(page.getByText('Update the app to keep using it')).toBeVisible();
    await expect(page.getByTestId('login-button')).toHaveCount(0);
    await screenshot(page, 'a02-real-update-required');
  });
});
