import { expect, test, type Page } from '@playwright/test';
import { apiBase, loginAs, resetDb, screenshot, type E2eState } from './real';

// Real API on an in-memory database. The web export must be built with EXPO_PUBLIC_LOCK_TIMEOUT_MS=2000:
//   EXPO_PUBLIC_LOCK_TIMEOUT_MS=2000 node scripts/e2e-run.js <slot> e2e/security.spec.ts
const TIMEOUT_MS = 2000;

test.beforeAll(() => {
  if (process.env.EXPO_PUBLIC_LOCK_TIMEOUT_MS !== String(TIMEOUT_MS)) {
    throw new Error(`Build and run with EXPO_PUBLIC_LOCK_TIMEOUT_MS=${TIMEOUT_MS}; the default timeout is 10 minutes.`);
  }
});

const setVisibility = (page: Page, state: 'hidden' | 'visible') =>
  page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);

/** Hides the page, waits, shows it again: what backgrounding the app does. */
async function backgroundFor(page: Page, ms: number) {
  await setVisibility(page, 'hidden');
  await page.waitForTimeout(ms);
  await setVisibility(page, 'visible');
}
const longAbsence = (page: Page) => backgroundFor(page, TIMEOUT_MS + 600);

const lock = (page: Page) => page.getByTestId('lock-screen');
const home = (page: Page, email: string, state: E2eState) =>
  state.accounts.admin === email ? page.getByRole('tab', { name: 'Dashboard' }) : page.getByRole('tab', { name: 'My work' });

let state: E2eState;
test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
});

for (const role of ['admin', 'agent'] as const) {
  test.describe(`inactivity lock, ${role}`, () => {
    const email = () => (role === 'admin' ? state.accounts.admin : state.accounts.agents[0]);

    test('a short absence does not lock', async ({ page }) => {
      await loginAs(page, state, email());
      await expect(home(page, email(), state)).toBeVisible();
      await backgroundFor(page, 300);
      await expect(lock(page)).toHaveCount(0);
      await expect(home(page, email(), state)).toBeVisible();
    });

    test('a long absence locks, hides the content, and the right password unlocks without losing the session', async ({ page }) => {
      await loginAs(page, state, email());
      await expect(home(page, email(), state)).toBeVisible();
      await page.getByRole('tab', { name: 'Profile' }).click();
      await expect(page.getByTestId('profile-email')).toHaveText(email());
      const tokenBefore = await page.evaluate(() => sessionStorage.getItem('finovis.refreshToken'));

      // While hidden, the privacy cover replaces the content (what the app switcher would capture).
      await setVisibility(page, 'hidden');
      await expect(page.getByTestId('privacy-cover')).toBeVisible();
      await screenshot(page, `security-${role}-01-cover`);
      await page.waitForTimeout(TIMEOUT_MS + 600);
      await setVisibility(page, 'visible');

      await expect(lock(page)).toBeVisible();
      await expect(page.getByTestId('privacy-cover')).toHaveCount(0);
      await screenshot(page, `security-${role}-02-locked`);
      // Whatever sits under the old tab bar position is the lock, not the app.
      const covered = await page.evaluate(() => {
        const tab = [...document.querySelectorAll('[role="tab"]')].find((t) => t.textContent?.includes('Profile'));
        if (!tab) return 'tab-not-in-dom';
        const r = tab.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return top?.closest('[data-testid="lock-screen"]') ? 'covered' : 'exposed';
      });
      expect(covered).not.toBe('exposed');

      await page.getByTestId('lock-password').fill('definitely-wrong');
      await page.getByTestId('lock-unlock').click();
      await expect(page.getByTestId('lock-error')).toHaveText('Incorrect password. 2 attempts left.');
      await expect(lock(page)).toBeVisible();
      await screenshot(page, `security-${role}-03-wrong-password`);
      // A wrong password must not touch the stored session.
      expect(await page.evaluate(() => sessionStorage.getItem('finovis.refreshToken'))).toBe(tokenBefore);

      await page.getByTestId('lock-password').fill(state.password);
      await page.getByTestId('lock-unlock').click();
      await expect(lock(page)).toHaveCount(0);
      // Same screen, same user: nothing was reset.
      await expect(page.getByTestId('profile-email')).toHaveText(email());
      const tokenAfter = await page.evaluate(() => sessionStorage.getItem('finovis.refreshToken'));
      expect(tokenAfter).toBeTruthy();
      expect(tokenAfter).not.toBe(tokenBefore); // a fresh session replaced it only after the password was right

      // The stored session is valid on the server: a reload restores it.
      await page.reload();
      await expect(home(page, email(), state)).toBeVisible();
    });

    test('three wrong passwords sign out and end the session on the server', async ({ page, request }, info) => {
      await loginAs(page, state, email());
      await expect(home(page, email(), state)).toBeVisible();
      const stored = await page.evaluate(() => ({
        refresh: sessionStorage.getItem('finovis.refreshToken'),
        device: sessionStorage.getItem('finovis.deviceId'),
      }));

      await longAbsence(page);
      await expect(lock(page)).toBeVisible();
      for (const left of ['2 attempts', '1 attempt']) {
        await page.getByTestId('lock-password').fill('wrong-password');
        await page.getByTestId('lock-unlock').click();
        await expect(page.getByTestId('lock-error')).toHaveText(`Incorrect password. ${left} left.`);
      }
      await page.getByTestId('lock-password').fill('wrong-password');
      await page.getByTestId('lock-unlock').click();

      await expect(page.getByTestId('login-button')).toBeVisible();
      await expect(lock(page)).toHaveCount(0);
      await screenshot(page, `security-${role}-04-signed-out`);
      expect(await page.evaluate(() => sessionStorage.getItem('finovis.refreshToken'))).toBeNull();
      await page.reload();
      await expect(page.getByTestId('login-button')).toBeVisible();

      // The old refresh token no longer works on the server (logout revoked its family).
      const res = await request.post(`${apiBase(info)}/api/mobile/auth/refresh`, {
        data: { refreshToken: stored.refresh, deviceId: stored.device },
      });
      expect(res.status()).toBe(401);
    });
  });
}

test.describe('inactivity lock, edge cases', () => {
  test('the lock screen can sign out', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await longAbsence(page);
    await page.getByTestId('lock-signout').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('a cold start after a long absence still locks, and keeps locking until the password is right', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await setVisibility(page, 'hidden');
    await page.waitForTimeout(TIMEOUT_MS + 600);
    // The OS killed the app while it was away: a new process, the stored session is restored from storage.
    await page.reload();
    await expect(lock(page)).toBeVisible();
    await screenshot(page, 'security-admin-07-cold-start-locked');
    await page.reload(); // killed again while locked: the original away time still counts
    await expect(lock(page)).toBeVisible();

    await page.getByTestId('lock-password').fill(state.password);
    await page.getByTestId('lock-unlock').click();
    await expect(lock(page)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await page.reload(); // unlocked: a later restart is not locked
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await expect(lock(page)).toHaveCount(0);
  });

  test('an unreadable stored away time locks instead of being skipped', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    // Seeded before the next page loads: the unloading page would otherwise overwrite it with a real time.
    await page.addInitScript(() => sessionStorage.setItem('finovis.leftAt', 'not-a-time'));
    await page.reload();
    await expect(lock(page)).toBeVisible();
  });

  test('a stale away time without a session does not lock the next sign-in', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('finovis.leftAt', '1'));
    await page.goto('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
    await page.getByTestId('email-input').fill(state.accounts.admin);
    await page.getByTestId('password-input').fill(state.password);
    await page.getByTestId('login-button').click();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await expect(lock(page)).toHaveCount(0);
  });

  test('signing out forgets the away time so the next sign-in is not locked', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await longAbsence(page);
    await expect(lock(page)).toBeVisible();
    await page.getByTestId('lock-signout').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('finovis.leftAt'))).toBeNull();
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(lock(page)).toHaveCount(0);
  });

  test('being offline is not a wrong password', async ({ page, context }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await longAbsence(page);
    await context.setOffline(true);
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('lock-password').fill(state.password);
      await page.getByTestId('lock-unlock').click();
      await expect(page.getByTestId('lock-error')).toHaveText("You're offline. Check your connection.");
    }
    await expect(lock(page)).toBeVisible(); // four failed requests, still locked, not signed out
    await screenshot(page, 'security-admin-05-offline');
    await context.setOffline(false);
    await page.getByTestId('lock-password').fill(state.password);
    await page.getByTestId('lock-unlock').click();
    await expect(lock(page)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
  });

  test('the unlock button stays disabled until a password is typed', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await longAbsence(page);
    await expect(page.getByTestId('lock-unlock')).toBeDisabled();
    await page.getByTestId('lock-password').fill('x');
    await expect(page.getByTestId('lock-unlock')).toBeEnabled();
  });

  test('signed-out screens are never locked', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
    await longAbsence(page);
    await expect(lock(page)).toHaveCount(0);
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('no biometric row on web (native only)', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByTestId('profile-email')).toBeVisible();
    await expect(page.getByTestId('biometric-row')).toHaveCount(0);
  });
});

test.describe('device integrity banner', () => {
  test('a clean device shows no banner', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('integrity-banner')).toHaveCount(0);
  });

  test('a suspect device shows a dismissible warning', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __FINVOIS_SUSPECT__: boolean }).__FINVOIS_SUSPECT__ = true;
    });
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    const banner = page.getByTestId('integrity-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('sending reports is turned off here');
    await screenshot(page, 'security-agent-06-integrity-banner');
    await page.getByTestId('integrity-dismiss').click();
    await expect(banner).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
  });
});
