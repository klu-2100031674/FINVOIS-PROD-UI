import { chromium, devices, expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { apiCall, apiLogin, dbUpdate, loginAs, resetDb, screenshot, type E2eState } from './real';

// A05 + A06: admin reports list, detail, PDF viewer and review actions. Real API on an in-memory MongoDB.
// Expected rows and numbers always come from the API itself. Network faults that cannot be produced for real
// (500s, a page that fails once) are injected with page.route, which passes everything else to the real server.
let state: E2eState;
let ids: E2eState['ids']['reports'];
let token: string;

test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
  ids = state.ids.reports;
  token = (await apiLogin(request, info, state.accounts.admin, state.password)).accessToken;
});

const LIST_URL = /\/api\/admin-reports\?/;
const ROW = '[data-testid^="report-row-"]';
const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const back = (page: Page) => page.getByTestId('back-button').last(); // the top screen's button; earlier screens stay mounted

const rowIds = (page: Page) =>
  page.locator(ROW).evaluateAll((els) => els.map((e) => (e.getAttribute('data-testid') ?? '').slice('report-row-'.length)));

async function apiReportIds(request: APIRequestContext, info: TestInfo, query: Record<string, string> = {}) {
  const qs = new URLSearchParams({ page: '1', limit: '100', ...query });
  const res = await apiCall(request, info, token, 'get', `/admin-reports?${qs}`);
  expect(res.status).toBe(200);
  return (res.body.data.reports as { _id: string }[]).map((r) => r._id);
}

async function apiReport(request: APIRequestContext, info: TestInfo, id: string) {
  const res = await apiCall(request, info, token, 'get', `/admin-reports/${id}`);
  expect(res.status).toBe(200);
  return res.body.data as { validation_status: string; rejection_reason?: string };
}

async function apiStats(request: APIRequestContext, info: TestInfo) {
  const res = await apiCall(request, info, token, 'get', '/mobile/admin/stats');
  expect(res.status).toBe(200);
  return res.body.data as { pending: number; under_review: number; approved: number; rejected: number; total: number };
}

/** The rows on screen must be exactly what the web list route returns for the same filters, in the same order. */
async function expectRowsMatchApi(page: Page, request: APIRequestContext, info: TestInfo, query: Record<string, string> = {}) {
  const expected = await apiReportIds(request, info, query);
  await expect.poll(() => rowIds(page)).toEqual(expected);
  return expected;
}

async function openReports(page: Page) {
  await loginAs(page, state, state.accounts.admin);
  await page.getByRole('tab', { name: 'Reports', exact: true }).click();
  await expect(page.getByTestId('report-list')).toBeVisible();
  await expect(page.locator(ROW).first()).toBeVisible();
}

async function openDetail(page: Page, id: string) {
  await openReports(page);
  await page.getByTestId(`report-row-${id}`).click();
  await expect(page.getByTestId('report-detail')).toBeVisible();
  await expect(page.getByTestId('handler-card')).toBeVisible();
}

const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe('list', () => {
  test('shows every seeded report except drafts, with client, type, date and status', async ({ page, request }, info) => {
    await openReports(page);
    const expected = await expectRowsMatchApi(page, request, info);
    expect(expected).toHaveLength(6);
    expect(expected).not.toContain(ids.draft1);
    await expect(page.getByTestId('report-count')).toHaveText('All reports · 6');

    const row = page.getByTestId(`report-row-${ids.pending1}`);
    await expect(row).toContainText('Client Applicant 1');
    await expect(row).toContainText('dpr');
    await expect(row).toContainText(/\d{1,2} \w{3} \d{4}/);
    const pills: [string, string][] = [
      [ids.pending1, 'Pending'],
      [ids.review1, 'Under review'],
      [ids.approvedPaid, 'Approved'],
      [ids.rejected1, 'Rejected'],
    ];
    for (const [id, label] of pills) await expect(page.getByTestId(`report-status-${id}`)).toHaveText(label);
    expect(await noHorizontalScroll(page)).toBe(true);
    await screenshot(page, 'a05-01-list');
  });

  test('each status chip shows exactly what the API returns for that status', async ({ page, request }, info) => {
    await openReports(page);
    const chips = [
      ['pending_validation', 'Pending', 2],
      ['under_review', 'Under review', 1],
      ['approved', 'Approved', 2],
      ['rejected', 'Rejected', 1],
    ] as const;
    for (const [status, label, count] of chips) {
      await page.getByTestId(`chip-${status}`).click();
      const got = await expectRowsMatchApi(page, request, info, { status });
      expect(got).toHaveLength(count);
      await expect(page.getByTestId('report-count')).toHaveText(`${label} · ${count}`);
      await expect(page.getByTestId(`chip-${status}`)).toHaveAttribute('aria-selected', 'true');
    }
    await page.getByTestId('chip-pending_validation').click();
    await expect(page.locator(ROW)).toHaveCount(2);
    await screenshot(page, 'a05-02-list-filtered');
    await page.getByTestId('chip-all').click();
    await expectRowsMatchApi(page, request, info);
  });

  test('the report type select offers the API types and filters like the API', async ({ page, request }, info) => {
    await openReports(page);
    const meta = await apiCall(request, info, token, 'get', '/admin-reports/meta/report-types');
    const options = meta.body.data.options as { value: string; label: string }[];
    expect(options.length).toBeGreaterThan(1);

    // Items are found by role: the select library puts testID on the web option as a plain attribute, not data-testid.
    const option = (label: string) => page.getByRole('option', { name: label, exact: true });
    await page.getByTestId('type-select').click();
    await expect(page.getByRole('option')).toHaveCount(options.length + 1);
    await expect(option('All report types')).toBeVisible();
    for (const o of options) await expect(option(o.label)).toBeVisible();
    await option('TERM_LOAN').click();
    await expect(page.getByTestId('type-select')).toContainText('TERM_LOAN');
    const termLoan = await expectRowsMatchApi(page, request, info, { report_type: 'TERM_LOAN' });
    expect(termLoan).toEqual(expect.arrayContaining([ids.pending2, ids.approvedPaid]));
    expect(termLoan).toHaveLength(2);

    // Status and type combine.
    await page.getByTestId('chip-approved').click();
    expect(await expectRowsMatchApi(page, request, info, { report_type: 'TERM_LOAN', status: 'approved' })).toEqual([ids.approvedPaid]);

    await page.getByTestId('type-select').click();
    await option('CC').click();
    const cc = await expectRowsMatchApi(page, request, info, { report_type: 'CC', status: 'approved' });
    expect(cc).toEqual([ids.approvedUnpaid]);

    await page.getByTestId('type-select').click();
    await option('All report types').click();
    await page.getByTestId('chip-all').click();
    await expectRowsMatchApi(page, request, info);
  });

  test('search waits 400 ms after typing, then returns what the API returns', async ({ page, request }, info) => {
    await openReports(page);
    const searches: string[] = [];
    page.on('request', (r) => {
      if (LIST_URL.test(r.url())) {
        const s = new URL(r.url()).searchParams.get('search');
        if (s) searches.push(s);
      }
    });

    await page.getByTestId('report-search').pressSequentially('Applicant 3', { delay: 40 });
    const got = await expectRowsMatchApi(page, request, info, { search: 'Applicant 3' });
    expect(got).toEqual([ids.review1]);
    // One request for the finished text, none for "A", "Ap", "App" ...
    expect(searches).toEqual(['Applicant 3']);

    // Matches the client name, not just the title.
    await page.getByTestId('report-search').fill('client applicant 4');
    expect(await expectRowsMatchApi(page, request, info, { search: 'client applicant 4' })).toEqual([ids.approvedPaid]);

    await page.getByTestId('clear-search').click();
    await expect(page.getByTestId('report-search')).toHaveValue('');
    await expectRowsMatchApi(page, request, info);
  });

  test('a search with no results shows the empty state and Clear filters brings the list back', async ({ page, request }, info) => {
    await openReports(page);
    await page.getByTestId('chip-approved').click();
    await page.getByTestId('report-search').fill('nobody by this name');
    await expect(page.getByTestId('empty-state')).toContainText('No reports found');
    await expect(page.getByTestId('empty-state')).toContainText('Try a different search or filter.');
    expect(await apiReportIds(request, info, { search: 'nobody by this name', status: 'approved' })).toEqual([]);
    await expect(page.getByTestId('report-count')).toHaveText('Approved · 0');
    await screenshot(page, 'a05-03-empty');

    await page.getByTestId('clear-filters').click();
    await expect(page.getByTestId('report-search')).toHaveValue('');
    await expectRowsMatchApi(page, request, info);
  });

  test('shows skeleton rows while the first page loads', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.admin);
    await page.route(LIST_URL, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await expect(page.getByTestId('reports-loading')).toBeVisible();
    await screenshot(page, 'a05-00-loading');
    await expectRowsMatchApi(page, request, info);
    await expect(page.getByTestId('reports-loading')).toHaveCount(0);
  });

  test('a failed load shows the error with Retry, and Retry loads the list', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.admin);
    let fail = true;
    await page.route(LIST_URL, (route) => (fail ? route.fulfill(json(500, { error: 'boom' })) : route.continue()));
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await expect(page.getByTestId('error-state')).toContainText("Couldn't load reports");
    await expect(page.getByTestId('error-state')).not.toContainText('boom'); // server internals are never shown
    await screenshot(page, 'a05-04-error');

    fail = false;
    await page.getByTestId('retry-button').click();
    await expectRowsMatchApi(page, request, info);
  });

  test('loads further pages as the list ends, without duplicates (limit 2 forced on the wire)', async ({ page, request }, info) => {
    // The app asks for 20 per page. Rewriting it to 2 on the wire makes the real server paginate the 6 seeded reports.
    const pages: string[] = [];
    await page.route(LIST_URL, (route) => {
      const url = new URL(route.request().url());
      pages.push(url.searchParams.get('page') ?? '');
      url.searchParams.set('limit', '2');
      return route.continue({ url: url.toString() });
    });
    await openReports(page);
    const expected = await apiReportIds(request, info);
    await expect.poll(() => rowIds(page)).toEqual(expected);
    expect(new Set(await rowIds(page)).size).toBe(6);
    expect(pages).toEqual(['1', '2', '3']);
    await expect(page.getByTestId('loading-more')).toHaveCount(0);
  });

  test('a page that fails to load keeps the rows and offers Try again', async ({ page, request }, info) => {
    let failPage2 = true;
    await page.route(LIST_URL, (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('page') === '2' && failPage2) return route.fulfill(json(500, { error: 'boom' }));
      url.searchParams.set('limit', '2');
      return route.continue({ url: url.toString() });
    });
    await openReports(page);
    await expect(page.getByTestId('load-more-error')).toBeVisible();
    expect(await rowIds(page)).toHaveLength(2);
    await screenshot(page, 'a05-05-load-more-error');

    failPage2 = false;
    await page.getByTestId('load-more-error').getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => rowIds(page)).toEqual(await apiReportIds(request, info));
  });

  test('a dashboard card opens the list already filtered by that status', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByTestId('stat-approved-value')).toBeVisible();
    await page.getByTestId('stat-approved').click();
    await expect(page.getByTestId('chip-approved')).toHaveAttribute('aria-selected', 'true');
    await expectRowsMatchApi(page, request, info, { status: 'approved' });
    await expect(page.getByTestId('report-count')).toHaveText('Approved · 2');
  });

  test('pull-to-refresh data stays in sync: a report approved elsewhere shows after Retry/refetch on return', async ({ page, request }, info) => {
    await openReports(page);
    await expect(page.getByTestId(`report-status-${ids.pending1}`)).toHaveText('Pending');
    // Another admin approves it on the web.
    const res = await apiCall(request, info, token, 'patch', `/admin-reports/${ids.pending1}/approve`, {});
    expect(res.status).toBe(200);
    // Switching the filter fetches fresh data for that key.
    await page.getByTestId('chip-approved').click();
    await expectRowsMatchApi(page, request, info, { status: 'approved' });
    await expect(page.getByTestId(`report-status-${ids.pending1}`)).toHaveText('Approved');
  });
});

test.describe('role gate', () => {
  test('an agent has no Reports tab and the server refuses the report routes', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Reports', exact: true })).toHaveCount(0);

    const agent = await apiLogin(request, info, state.accounts.agents[0], state.password);
    const list = await apiCall(request, info, agent.accessToken, 'get', '/admin-reports');
    expect(list.status).toBe(403);
  });
});

test.describe('detail', () => {
  test('shows the report fields and status, and says no request is linked when there is none', async ({ page }) => {
    await openDetail(page, ids.pending1);
    await expect(page.getByTestId('report-status')).toHaveText('Pending');
    await expect(page.getByTestId('report-title')).toHaveText('DPR Applicant 1');
    await expect(page.getByTestId('report-type')).toHaveText('dpr');
    await expect(page.getByTestId('report-applicant')).toHaveText('Applicant 1');
    await expect(page.getByTestId('report-payment')).toHaveText('Paid');
    await expect(page.getByText('applicant1@e2e.test')).toBeVisible();
    await expect(page.getByTestId('handler-none')).toHaveText('No request is linked to this report.');
    await expect(page.getByTestId('open-request')).toHaveCount(0);
    expect(await noHorizontalScroll(page)).toBe(true);
    await screenshot(page, 'a05-06-detail');

    await back(page).click();
    await expect(page.getByTestId('report-list')).toBeVisible();
  });

  test('shows the handler from the context route and opens the linked request', async ({ page, request }, info) => {
    const ctx = await apiCall(request, info, token, 'get', `/mobile/admin/reports/${ids.pending2}/context`);
    expect(ctx.body.claimedBy.name).toBe('Anita');

    await openDetail(page, ids.pending2);
    await expect(page.getByTestId('handler-name')).toHaveText('Anita');
    await expect(page.getByTestId('handler-workflow')).toHaveText('Sent for CA validation');
    await screenshot(page, 'a05-07-detail-handler');

    await page.getByTestId('open-request').click();
    await expect(page.getByTestId('applicant-name')).toHaveText('Applicant 2');
    await expect(page.getByTestId('request-handler')).toHaveText('Anita');
    await back(page).click();
    await expect(page.getByTestId('report-detail')).toBeVisible();
  });

  test('a failing context request does not block the report, and can be retried', async ({ page }) => {
    let fail = true;
    await page.route(/\/mobile\/admin\/reports\/[^/]+\/context/, (route) =>
      fail ? route.fulfill(json(500, { success: false, error: 'boom' })) : route.continue()
    );
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await page.getByTestId(`report-row-${ids.pending2}`).click();
    await expect(page.getByTestId('report-title')).toHaveText('DPR Applicant 2');
    await expect(page.getByTestId('handler-error')).toBeVisible();
    await expect(page.getByTestId('approve')).toBeVisible();

    fail = false;
    await page.getByTestId('handler-card').getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('handler-name')).toHaveText('Anita');
  });

  test('a report that cannot be loaded shows the server message, then loads on Retry', async ({ page }) => {
    let fail = true;
    await page.route(/\/api\/admin-reports\/[a-f0-9]{24}$/, (route) =>
      fail ? route.fulfill(json(404, { error: 'Report not found' })) : route.continue()
    );
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await page.getByTestId(`report-row-${ids.pending1}`).click();
    await expect(page.getByTestId('error-state')).toContainText('Report not found');
    fail = false;
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId('report-title')).toHaveText('DPR Applicant 1');
  });

  test('buttons follow the status: review, approve and reject only while pending or under review', async ({ page }) => {
    const visible = async (names: string[]) => {
      for (const n of ['approve', 'reject', 'mark-review', 'send-report']) {
        await expect(page.getByTestId(n)).toHaveCount(names.includes(n) ? 1 : 0);
      }
    };

    await openDetail(page, ids.pending1);
    await visible(['approve', 'reject', 'mark-review']);
    await back(page).click();

    await page.getByTestId(`report-row-${ids.review1}`).click();
    await expect(page.getByTestId('report-status')).toHaveText('Under review');
    await visible(['approve', 'reject']); // Mark under review only from pending
    await back(page).click();

    await page.getByTestId(`report-row-${ids.approvedPaid}`).click();
    await expect(page.getByTestId('report-status')).toHaveText('Approved');
    await visible(['send-report']);
    await expect(page.getByTestId('send-report')).toBeEnabled();
    await expect(page.getByTestId('send-blocked')).toHaveCount(0);
    await back(page).click();

    // Approved but unpaid: Send is shown, disabled, with the reason (the server refuses it as well).
    await page.getByTestId(`report-row-${ids.approvedUnpaid}`).click();
    await expect(page.getByTestId('report-payment')).toHaveText('Pending');
    await visible(['send-report']);
    await expect(page.getByTestId('send-report')).toBeDisabled();
    await expect(page.getByTestId('send-blocked')).toContainText('Payment is not complete yet');
    await back(page).click();

    await page.getByTestId(`report-row-${ids.rejected1}`).click();
    await expect(page.getByTestId('report-status')).toHaveText('Rejected');
    await expect(page.getByTestId('report-rejection-reason')).toHaveText('Missing bank statements');
    await visible([]);
    await expect(page.getByTestId('view-pdf')).toBeVisible();
  });
});

test.describe('pdf viewer', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the destructuring pattern even with no fixtures
  test('opens the real PDF in the viewer and releases it when the viewer closes', async ({}, info) => {
    // The default headless shell has no PDF plugin and paints nothing inside the iframe, so this test drives full
    // Chromium (new headless mode), which draws the document.
    const browser = await chromium.launch({ channel: 'chromium' });
    const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: info.project.use.baseURL });
    const page = await context.newPage();
    try {
      await checkPdfViewer(page);
    } finally {
      await browser.close();
    }
  });

  async function checkPdfViewer(page: Page) {
    await openDetail(page, ids.pending1);
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/api\/admin-reports\/[^/]+\/pdf/.test(r.url())),
      page.getByTestId('view-pdf').click(),
    ]);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    const body = await res.body();
    expect(body.subarray(0, 4).toString()).toBe('%PDF');

    await expect(page.getByTestId('pdf-viewer')).toBeVisible();
    const frame = page.getByTestId('pdf-frame');
    await expect(frame).toBeVisible();
    const src = (await frame.getAttribute('src')) ?? '';
    expect(src.startsWith('blob:')).toBe(true);
    // What the viewer shows is the server's file, byte for byte.
    const shown = await page.evaluate(async (u) => {
      const blob = await (await fetch(u)).blob();
      return { type: blob.type, size: blob.size, head: await blob.slice(0, 4).text() };
    }, src);
    expect(shown).toEqual({ type: 'application/pdf', size: body.length, head: '%PDF' });
    await page.waitForTimeout(500);
    await screenshot(page, 'a05-08-pdf-viewer');

    await back(page).click();
    await expect(page.getByTestId('report-detail')).toBeVisible();
    // The in-memory copy is gone once the viewer closes (the native build deletes the cached file).
    const alive = await page.evaluate((u) => fetch(u).then(() => true, () => false), src);
    expect(alive).toBe(false);
  }

  test('a missing PDF says so in plain words and Retry works once it exists', async ({ page, request }, info) => {
    await dbUpdate(request, info, 'Report', { _id: ids.pending1 }, { $set: { pdf_file_url: 'temp/e2e/does-not-exist.pdf' } });
    await openDetail(page, ids.pending1);
    await page.getByTestId('view-pdf').click();
    await expect(page.getByTestId('error-state')).toContainText("The PDF isn't available yet.");
    await expect(page.getByTestId('pdf-frame')).toHaveCount(0);
    await screenshot(page, 'a05-09-pdf-missing');

    await dbUpdate(request, info, 'Report', { _id: ids.pending1 }, { $set: { pdf_file_url: 'temp/e2e/sample.pdf' } });
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId('pdf-frame')).toBeVisible();
  });

  test('the request route used by the agent flow returns a PDF for an approved request', async ({ page, request }, info) => {
    // The viewer is opened with source request-report from the admin request detail (same route the agent uses).
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    await page.getByTestId('segment-all').click();
    await page.getByTestId(`request-row-${state.ids.requests.generated}`).click();
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/govt-forms\/requests\/[^/]+\/report\/pdf/.test(r.url())),
      page.getByTestId('view-report-pdf').click(),
    ]);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    await expect(page.getByTestId('pdf-frame')).toBeVisible();

    // And the agent who owns the request gets the same bytes through the API.
    const agent = await apiLogin(request, info, state.accounts.agents[0], state.password);
    const asAgent = await request.get(`${info.config.metadata.apiBase}/api/govt-forms/requests/${state.ids.requests.generated}/report/pdf`, {
      headers: { Authorization: `Bearer ${agent.accessToken}` },
    });
    expect(asAgent.status()).toBe(200);
    expect((await asAgent.body()).subarray(0, 4).toString()).toBe('%PDF');
  });
});

test.describe('review actions', () => {
  test('mark under review: updates the status, confirms inline, and the server agrees', async ({ page, request }, info) => {
    await openDetail(page, ids.pending1);
    await page.getByTestId('mark-review').click();
    await expect(page.getByTestId('action-success')).toHaveText('Report marked as under review.');
    await expect(page.getByTestId('report-status')).toHaveText('Under review');
    await expect(page.getByTestId('mark-review')).toHaveCount(0);
    await expect(page.getByTestId('approve')).toBeVisible();
    expect((await apiReport(request, info, ids.pending1)).validation_status).toBe('under_review');

    await back(page).click();
    await expect(page.getByTestId(`report-status-${ids.pending1}`)).toHaveText('Under review');
  });

  test('approve asks first, then approves; list, detail and dashboard counts all follow', async ({ page, request }, info) => {
    const before = await apiStats(request, info);
    await loginAs(page, state, state.accounts.admin);
    await expect(page.getByTestId('stat-approved-value')).toHaveText(String(before.approved));
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await page.getByTestId('chip-pending_validation').click();
    await expect(page.locator(ROW)).toHaveCount(2);
    await page.getByTestId(`report-row-${ids.pending1}`).click();
    await expect(page.getByTestId('approve')).toBeVisible();

    await page.getByTestId('approve').click();
    await expect(page.getByTestId('approve-dialog')).toContainText('Approve this report?');
    await expect(page.getByTestId('approve-dialog')).toContainText('The customer service team can then send it.');
    await screenshot(page, 'a06-01-approve-dialog');
    await page.getByTestId('approve-cancel').click();
    await expect(page.getByTestId('approve-dialog')).toHaveCount(0);
    expect((await apiReport(request, info, ids.pending1)).validation_status).toBe('pending_validation');

    // Hold the response so the pending state can be seen: every action disables while one is running.
    await page.route(/\/admin-reports\/[^/]+\/approve$/, async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });
    await page.getByTestId('approve').click();
    await page.getByTestId('approve-confirm').click();
    await expect(page.getByTestId('approve-confirm')).toBeDisabled();
    await expect(page.getByTestId('approve-confirm')).toContainText('Approving');
    await expect(page.getByTestId('approve-cancel')).toBeDisabled();

    await expect(page.getByTestId('action-success')).toHaveText('Report approved.');
    await expect(page.getByTestId('report-status')).toHaveText('Approved');
    await expect(page.getByTestId('approve')).toHaveCount(0);
    await expect(page.getByTestId('reject')).toHaveCount(0);
    await expect(page.getByTestId('send-report')).toBeVisible(); // approved and paid
    await screenshot(page, 'a06-02-approved-detail');

    const apiAfter = await apiReport(request, info, ids.pending1);
    expect(apiAfter.validation_status).toBe('approved');
    const after = await apiStats(request, info);
    expect(after.pending).toBe(before.pending - 1);
    expect(after.approved).toBe(before.approved + 1);
    expect(after.total).toBe(before.total);

    // List (filtered to Pending) no longer has it, with the new count.
    await back(page).click();
    await expect(page.getByTestId(`report-row-${ids.pending1}`)).toHaveCount(0);
    await expect(page.getByTestId('report-count')).toHaveText(`Pending · ${after.pending}`);
    // Dashboard shows the new numbers.
    await page.getByRole('tab', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByTestId('stat-approved-value')).toHaveText(String(after.approved));
    await expect(page.getByTestId('stat-pending-value')).toHaveText(String(after.pending));
  });

  test('reject needs a reason of 5 to 500 characters, sends it, and shows it on the report', async ({ page, request }, info) => {
    const before = await apiStats(request, info);
    await openDetail(page, ids.pending2);
    await page.getByTestId('reject').click();
    await expect(page.getByTestId('reject-sheet')).toBeVisible();
    await expect(page.getByTestId('reject-confirm')).toBeDisabled();
    await page.waitForTimeout(600); // let the slide-in animation finish before the screenshot
    await screenshot(page, 'a06-03-reject-sheet');

    await page.getByTestId('reject-reason').fill('abc');
    await expect(page.getByTestId('reject-confirm')).toBeDisabled();
    await expect(page.getByTestId('reject-reason-hint')).toHaveText('Enter at least 5 characters.');
    await page.getByTestId('reject-reason').fill('     ');
    await expect(page.getByTestId('reject-confirm')).toBeDisabled();
    await screenshot(page, 'a06-04-reject-sheet-short');

    await page.getByTestId('reject-reason').fill('Missing the last three bank statements');
    await expect(page.getByTestId('reject-confirm')).toBeEnabled();
    await page.getByTestId('reject-confirm').click();
    await expect(page.getByTestId('reject-sheet')).toHaveCount(0);
    await expect(page.getByTestId('action-success')).toHaveText('Report rejected.');
    await expect(page.getByTestId('report-status')).toHaveText('Rejected');
    await expect(page.getByTestId('report-rejection-reason')).toHaveText('Missing the last three bank statements');
    await expect(page.getByTestId('approve')).toHaveCount(0);

    const rpt = await apiReport(request, info, ids.pending2);
    expect(rpt.validation_status).toBe('rejected');
    expect(rpt.rejection_reason).toBe('Missing the last three bank statements');
    const after = await apiStats(request, info);
    expect(after.pending).toBe(before.pending - 1);
    expect(after.rejected).toBe(before.rejected + 1);
  });

  test('cancelling the reject sheet changes nothing', async ({ page, request }, info) => {
    await openDetail(page, ids.pending1);
    await page.getByTestId('reject').click();
    await page.getByTestId('reject-reason').fill('Some reason here');
    await page.getByTestId('reject-cancel').click();
    await expect(page.getByTestId('reject-sheet')).toHaveCount(0);
    await expect(page.getByTestId('report-status')).toHaveText('Pending');
    expect((await apiReport(request, info, ids.pending1)).validation_status).toBe('pending_validation');
    // Reopening starts empty.
    await page.getByTestId('reject').click();
    await expect(page.getByTestId('reject-reason')).toHaveValue('');
  });

  test('the server rules hold when the app is bypassed', async ({ request }, info) => {
    const call = (method: 'patch' | 'get', path: string, body?: unknown) => apiCall(request, info, token, method, path, body);

    const noReason = await call('patch', `/admin-reports/${ids.pending1}/reject`, {});
    expect(noReason.status).toBe(400);
    expect(noReason.body.error).toBe('Rejection reason is required');

    // Invalid transitions: nothing changes and the message says why.
    const approveTwice = await call('patch', `/admin-reports/${ids.approvedPaid}/approve`, {});
    expect(approveTwice.status).toBe(400);
    expect(approveTwice.body.error).toBe('Report cannot be approved in current status');
    const rejectApproved = await call('patch', `/admin-reports/${ids.approvedPaid}/reject`, { rejection_reason: 'Too late now' });
    expect(rejectApproved.status).toBe(400);
    expect(rejectApproved.body.error).toBe('Report cannot be rejected in current status');
    const reviewTwice = await call('patch', `/admin-reports/${ids.review1}/review`);
    expect(reviewTwice.status).toBe(400);
    expect(reviewTwice.body.error).toBe('Report status must be pending validation or rejected');
    expect((await apiReport(request, info, ids.approvedPaid)).validation_status).toBe('approved');

    // An agent cannot use any of it (the app hides the screens, the server is what refuses).
    const agent = await apiLogin(request, info, state.accounts.agents[0], state.password);
    for (const [method, path] of [
      ['get', '/admin-reports'],
      ['get', `/admin-reports/${ids.pending1}`],
      ['get', `/admin-reports/${ids.pending1}/pdf`],
      ['patch', `/admin-reports/${ids.pending1}/approve`],
      ['patch', `/admin-reports/${ids.pending1}/reject`],
      ['patch', `/admin-reports/${ids.pending1}/review`],
      ['get', `/mobile/admin/reports/${ids.pending1}/context`],
    ] as const) {
      const res = await apiCall(request, info, agent.accessToken, method, path, method === 'patch' ? { rejection_reason: 'Agent attempt' } : undefined);
      expect([401, 403], `${method} ${path}`).toContain(res.status);
    }
    expect((await apiReport(request, info, ids.pending1)).validation_status).toBe('pending_validation');
  });

  test('approving a report that was already approved elsewhere shows the server message and the screen recovers', async ({ page, request }, info) => {
    await openDetail(page, ids.pending1);
    // Someone else approves it after this screen loaded.
    await dbUpdate(request, info, 'Report', { _id: ids.pending1 }, { $set: { validation_status: 'approved' } });

    await page.getByTestId('approve').click();
    await page.getByTestId('approve-confirm').click();
    await expect(page.getByTestId('approve-error')).toHaveText('Report cannot be approved in current status');
    await screenshot(page, 'a06-05-action-error');
    await page.getByTestId('approve-cancel').click();
    // The screen refetched: it now shows the real status and no longer offers approve.
    await expect(page.getByTestId('report-status')).toHaveText('Approved');
    await expect(page.getByTestId('approve')).toHaveCount(0);
    await expect(page.getByTestId('send-report')).toBeVisible();
  });

  test('rejecting a report whose status changed shows the server message inside the sheet', async ({ page, request }, info) => {
    await openDetail(page, ids.pending1);
    await dbUpdate(request, info, 'Report', { _id: ids.pending1 }, { $set: { validation_status: 'approved' } });

    await page.getByTestId('reject').click();
    await page.getByTestId('reject-reason').fill('Missing bank statements');
    await page.getByTestId('reject-confirm').click();
    await expect(page.getByTestId('reject-error')).toHaveText('Report cannot be rejected in current status');
    await expect(page.getByTestId('reject-sheet')).toBeVisible();
    await screenshot(page, 'a06-06-reject-error');
    // The sheet stays usable: the reason is kept and the user can cancel.
    await expect(page.getByTestId('reject-reason')).toHaveValue('Missing bank statements');
    await page.getByTestId('reject-cancel').click();
    await expect(page.getByTestId('report-status')).toHaveText('Approved');
  });

  test('a failed action on a flaky network shows a friendly message, never raw error text', async ({ page }) => {
    await openDetail(page, ids.pending1);
    await page.route(/\/admin-reports\/[^/]+\/review$/, (route) => route.fulfill(json(500, { error: 'TypeError: x is undefined at /srv/app.js:99' })));
    await page.getByTestId('mark-review').click();
    await expect(page.getByTestId('action-error')).toHaveText('Something went wrong. Try again.');
    await expect(page.getByTestId('mark-review')).toBeEnabled(); // can retry
    await expect(page.getByTestId('report-status')).toHaveText('Pending');
  });
});
