import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { apiCall, apiLogin, dbUpdate, loginAs, resetDb, screenshot, type E2eState } from './real';

// A04 admin dashboard against the real API on an in-memory database. Expected numbers always come from the
// API (and a second route that counts the same rows), never from assumptions about the seed.
interface Stats {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  total: number;
}
const KEYS = ['pending', 'under_review', 'approved', 'rejected', 'total'] as const;
const fmt = (n: number) => n.toLocaleString('en-IN');
const STATUS = { pending: 'pending_validation', under_review: 'under_review', approved: 'approved', rejected: 'rejected' } as const;

let state: E2eState;
let token: string;

test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
  token = (await apiLogin(request, info, state.accounts.admin, state.password)).accessToken;
});

async function apiStats(request: APIRequestContext, info: TestInfo, reportType?: string): Promise<Stats> {
  const q = reportType ? `?report_type=${encodeURIComponent(reportType)}` : '';
  const res = await apiCall(request, info, token, 'get', `/mobile/admin/stats${q}`);
  expect(res.status).toBe(200);
  return res.body.data as Stats;
}

/** Counts the same reports through the web list route (admin-reports), as an independent check. */
async function listCount(request: APIRequestContext, info: TestInfo, status?: string, reportType?: string) {
  const qs = new URLSearchParams({ limit: '1' });
  if (status) qs.set('status', status);
  if (reportType) qs.set('report_type', reportType);
  const res = await apiCall(request, info, token, 'get', `/admin-reports?${qs}`);
  expect(res.status).toBe(200);
  return res.body.data.pagination.total_count as number;
}

async function expectCards(page: Page, s: Stats) {
  for (const k of KEYS) await expect(page.getByTestId(`stat-${k}-value`)).toHaveText(fmt(s[k]));
}

async function openDashboard(page: Page) {
  await loginAs(page, state, state.accounts.admin);
  await expect(page.getByTestId('stat-total-value')).toBeVisible();
}

const ALL_TYPES = 'All types';

// The select renders its options in a portal; on web they are role=option elements named by their label.
const typeOption = (page: Page, label: string) => page.getByRole('option', { name: label, exact: true });

async function pickType(page: Page, label: string) {
  await page.getByTestId('report-type-select').click();
  await typeOption(page, label).click();
}

const awayAndBack = async (page: Page) => {
  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByTestId('profile-name')).toBeVisible();
  await page.getByRole('tab', { name: 'Dashboard' }).click();
};

test.describe('numbers', () => {
  test('cards show the raw API counts and match the database', async ({ page, request }, info) => {
    await openDashboard(page);
    const api = await apiStats(request, info);
    await expectCards(page, api);

    // Same numbers through the web list route, which counts the rows directly.
    for (const [key, status] of Object.entries(STATUS)) {
      expect(await listCount(request, info, status)).toBe(api[key as keyof typeof STATUS]);
    }
    expect(await listCount(request, info)).toBe(api.total);

    // D3: no offset on Approved, the card is the API value as returned.
    await expect(page.getByTestId('stat-approved-value')).toHaveText(fmt(api.approved));
    expect(api.approved).toBeLessThan(4492);

    await expect(page.getByTestId('dashboard-greeting')).toContainText('Test CA');
    await expect(page.getByTestId('dashboard-updated')).toHaveText(/^Updated \d{2}:\d{2}$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await screenshot(page, 'dashboard-01-home');
  });

  test('zero counts show as 0, not blank', async ({ page, request }, info) => {
    // Every report becomes a draft: drafts are excluded from every card.
    await dbUpdate(request, info, 'Report', {}, { $set: { validation_status: 'draft' } });
    await openDashboard(page);
    const api = await apiStats(request, info);
    expect(api).toMatchObject({ pending: 0, under_review: 0, approved: 0, rejected: 0, total: 0 });
    await expectCards(page, api);
    await screenshot(page, 'dashboard-02-zero');
  });

  test('skeletons show while the first load is in flight', async ({ page, request }, info) => {
    await page.route('**/mobile/admin/stats*', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByTestId('stat-pending')).toBeVisible();
    await expect(page.getByTestId('stat-pending-value')).toHaveCount(0);
    await screenshot(page, 'dashboard-03-loading');
    await expectCards(page, await apiStats(request, info));
  });
});

test.describe('report type filter', () => {
  test('options come from the API and each type shows that type\'s numbers', async ({ page, request }, info) => {
    await openDashboard(page);
    const all = await apiStats(request, info);

    const meta = await apiCall(request, info, token, 'get', '/admin-reports/meta/report-types');
    const options = meta.body.data.options as { value: string; label: string }[];
    expect(options.length).toBeGreaterThan(1);

    await page.getByTestId('report-type-select').click();
    await expect(page.getByRole('option')).toHaveText([ALL_TYPES, ...options.map((o) => o.label)]);
    await screenshot(page, 'dashboard-04-type-menu');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('option')).toHaveCount(0);

    let differing = 0;
    for (const o of options) {
      await pickType(page, o.label);
      await expect(page.getByTestId('report-type-select')).toContainText(o.label);
      const api = await apiStats(request, info, o.value);
      await expectCards(page, api);
      // The web list (drafts hidden by default) agrees with the type-filtered stats.
      expect(await listCount(request, info, undefined, o.value)).toBe(api.total);
      if (KEYS.some((k) => api[k] !== all[k])) {
        differing += 1;
        if (differing === 1) await screenshot(page, 'dashboard-05-filtered');
      }
    }
    expect(differing).toBeGreaterThan(0);

    await pickType(page, ALL_TYPES);
    await expect(page.getByTestId('report-type-select')).toContainText(ALL_TYPES);
    await expectCards(page, all);
  });
});

test.describe('navigation', () => {
  // The status and type params themselves are asserted in src/screens/admin/__tests__/DashboardScreen.test.tsx.
  test('tapping a card opens the Reports tab with that status and type', async ({ page, request }, info) => {
    await openDashboard(page);
    const all = await apiStats(request, info);
    const reports = page.getByRole('tab', { name: 'Reports' });
    await expect(reports).toHaveAttribute('aria-selected', 'false');

    await page.getByTestId('stat-pending').click();
    await expect(reports).toHaveAttribute('aria-selected', 'true');
    // The list's header repeats the dashboard number for that status.
    await expect(page.getByTestId('report-count')).toContainText(`Pending · ${fmt(all.pending)}`);
    await screenshot(page, 'dashboard-09-opened-reports');

    // Another status while Reports is already mounted, then a type, then Total (no status).
    await page.getByRole('tab', { name: 'Dashboard' }).click();
    await page.getByTestId('stat-approved').click();
    await expect(page.getByTestId('report-count')).toContainText(`Approved · ${fmt(all.approved)}`);

    const meta = await apiCall(request, info, token, 'get', '/admin-reports/meta/report-types');
    const type = meta.body.data.options[0] as { value: string; label: string };
    await page.getByRole('tab', { name: 'Dashboard' }).click();
    await pickType(page, type.label);
    const byType = await apiStats(request, info, type.value);
    await page.getByTestId('stat-total').click();
    await expect(reports).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('report-count')).toContainText(`All reports · ${fmt(byType.total)}`);
    await expect(page.getByTestId('type-select')).toContainText(type.label);
  });
});

test.describe('refreshing', () => {
  // The web build has no pull gesture (RefreshControl is a no-op there), so the refresh button stands in for it.
  test('refresh after approving a report through the API shows the new counts', async ({ page, request }, info) => {
    await openDashboard(page);
    const before = await apiStats(request, info);
    const approve = await apiCall(request, info, token, 'patch', `/admin-reports/${state.ids.reports.pending1}/approve`, { send_email: false });
    expect(approve.status).toBe(200);

    await page.getByTestId('dashboard-refresh').click();
    const after = await apiStats(request, info);
    expect(after.pending).toBe(before.pending - 1);
    expect(after.approved).toBe(before.approved + 1);
    expect(after.total).toBe(before.total);
    await expectCards(page, after);
  });

  test('refetches when the tab regains focus', async ({ page, request }, info) => {
    await openDashboard(page);
    await apiCall(request, info, token, 'patch', `/admin-reports/${state.ids.reports.pending2}/approve`, { send_email: false });
    await awayAndBack(page);
    await expectCards(page, await apiStats(request, info));
  });

  test('polls every 30 seconds while focused and not while away', async ({ page, request }, info) => {
    await page.clock.install();
    let calls = 0;
    page.on('request', (r) => {
      if (r.url().includes('/mobile/admin/stats')) calls += 1;
    });
    await openDashboard(page);
    await expect.poll(() => calls).toBe(1);

    await apiCall(request, info, token, 'patch', `/admin-reports/${state.ids.reports.pending1}/approve`, { send_email: false });
    await page.clock.fastForward(31_000);
    await expectCards(page, await apiStats(request, info));
    expect(calls).toBeGreaterThan(1);

    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByTestId('profile-name')).toBeVisible();
    const away = calls;
    await page.clock.fastForward(31_000);
    await page.clock.fastForward(31_000);
    await page.waitForTimeout(500);
    expect(calls).toBe(away);
  });
});

test.describe('failure states', () => {
  test('a 500 shows an error card, keeps the last numbers, and Retry recovers', async ({ page, request }, info) => {
    await openDashboard(page);
    const before = await apiStats(request, info);
    await expectCards(page, before);

    let failures = 3; // the first try plus two automatic retries
    await page.route('**/mobile/admin/stats*', (route) =>
      failures-- > 0
        ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'boom' }) })
        : route.continue()
    );
    await page.getByTestId('dashboard-refresh').click();
    await expect(page.getByTestId('dashboard-error')).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).toContainText(/Showing the numbers from \d{2}:\d{2}/);
    await expectCards(page, before); // stale numbers stay on screen
    await screenshot(page, 'dashboard-06-error-stale');

    await apiCall(request, info, token, 'patch', `/admin-reports/${state.ids.reports.pending1}/approve`, { send_email: false });
    await page.getByTestId('dashboard-retry').click();
    await expect(page.getByTestId('dashboard-error')).toHaveCount(0);
    await expectCards(page, await apiStats(request, info));
  });

  test('offline shows the offline message with stale numbers, then recovers', async ({ page, context, request }, info) => {
    await openDashboard(page);
    const before = await apiStats(request, info);

    await context.setOffline(true);
    await page.getByTestId('dashboard-refresh').click();
    // The client retries a dead connection twice before giving up.
    await expect(page.getByTestId('dashboard-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dashboard-error')).toContainText("You're offline");
    await expectCards(page, before);

    await context.setOffline(false);
    await page.getByTestId('dashboard-retry').click();
    await expect(page.getByTestId('dashboard-error')).toHaveCount(0);
  });

  test('a failed first load shows the error card with Retry, no fake numbers', async ({ page, request }, info) => {
    let failures = 3; // the first try plus two automatic retries
    await page.route('**/mobile/admin/stats*', (route) =>
      failures-- > 0
        ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'boom' }) })
        : route.continue()
    );
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByTestId('dashboard-error')).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).not.toContainText('Showing the numbers');
    await expect(page.getByTestId('stat-pending-value')).toHaveText('–');
    await screenshot(page, 'dashboard-07-error-first-load');

    await page.getByTestId('dashboard-retry').click();
    await expectCards(page, await apiStats(request, info));
    await expect(page.getByTestId('dashboard-error')).toHaveCount(0);
  });

  test('a revoked session signs the user out with the session-ended notice', async ({ page, request }, info) => {
    await openDashboard(page);
    await dbUpdate(request, info, 'MobileSession', {}, { $set: { revokedAt: new Date().toISOString() } });
    await awayAndBack(page); // refetch on focus hits a revoked session
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText('Your session ended. Sign in again.');
    await screenshot(page, 'dashboard-08-session-ended');
  });
});

test.describe('role gate', () => {
  test('an agent lands on My work, has no Dashboard, and the stats API refuses them', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveCount(0);
    await expect(page.getByTestId('stat-pending')).toHaveCount(0);

    const agent = await apiLogin(request, info, state.accounts.agents[0], state.password);
    const res = await apiCall(request, info, agent.accessToken, 'get', '/mobile/admin/stats');
    expect(res.status).toBe(403);
  });
});
