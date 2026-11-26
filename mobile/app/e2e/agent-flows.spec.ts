import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { apiBase, apiCall, apiLogin, dbUpdate, loginAs, resetDb, screenshot, type E2eState } from './real';

// A09 + A10: the agent's My work tabs, claim and release, request detail, documents and messages.
// Real API on an in-memory MongoDB. Seed: Anita has a claimed request (with a document and a message) and two
// completed ones; Suresh has an assigned request and one completed; three requests are open; Meena has nothing.
// Mocks only where a failure cannot be produced for real (a forced 500, a slow response, the storage host).
test.describe('agent work: queues, claim, release, detail, documents, messages', () => {
  let state: E2eState;
  let ids: E2eState['ids']['requests'];
  const tokens = new Map<string, string>();

  test.beforeEach(async ({ request }, info) => {
    state = await resetDb(request, info);
    ids = state.ids.requests;
    tokens.clear();
  });

  const ANITA = 0;
  const SURESH = 1;
  const MEENA = 2;
  const CLAIM_MS = 15 * 60 * 1000;

  const tokenFor = async (request: APIRequestContext, info: TestInfo, email: string) => {
    if (!tokens.has(email)) tokens.set(email, (await apiLogin(request, info, email, state.password)).accessToken);
    return tokens.get(email) as string;
  };
  const agentToken = (request: APIRequestContext, info: TestInfo, agent: number) =>
    tokenFor(request, info, state.accounts.agents[agent]);

  type Row = { _id: string; status: string; workflow: { key: string }; claimedBy?: { _id: string } | null };
  const queue = async (request: APIRequestContext, info: TestInfo, agent: number, name: string) => {
    const res = await apiCall(request, info, await agentToken(request, info, agent), 'get', `/govt-forms/requests?queue=${name}`);
    expect(res.status).toBe(200);
    return (res.body.data as Row[]).map((r) => r._id).sort();
  };
  const counts = async (request: APIRequestContext, info: TestInfo, agent: number) => {
    const res = await apiCall(request, info, await agentToken(request, info, agent), 'get', '/govt-forms/requests/counts');
    return res.body.data as { open: number; assigned: number };
  };
  const claimViaApi = async (request: APIRequestContext, info: TestInfo, agent: number, id: string) =>
    apiCall(request, info, await agentToken(request, info, agent), 'post', `/govt-forms/requests/${id}/claim`);

  const signIn = async (page: Page, agent = ANITA) => {
    await loginAs(page, state, state.accounts.agents[agent]);
    await expect(page.getByTestId('tab-open')).toBeVisible();
  };
  const goTab = async (page: Page, tab: 'open' | 'mine' | 'active' | 'done') => {
    await page.getByTestId(`tab-${tab}`).click();
    await expect(page.getByTestId(`work-list-${tab}`)).toBeVisible();
  };
  const rows = (page: Page) => page.locator('[data-testid^="work-row-"]');
  const rowIds = async (page: Page) =>
    (await rows(page).evaluateAll((els) => els.map((e) => (e.getAttribute('data-testid') ?? '').replace('work-row-', '')))).sort();
  const openDetail = async (page: Page, id: string) => {
    await page.getByTestId(`work-row-${id}`).click();
    await expect(page.getByTestId('request-detail')).toBeVisible();
  };
  const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

  // ── My work ────────────────────────────────────────────────────────────────────────────────────

  test('Anita: Open, Mine and Done show what the API lists, with matching counts', async ({ page, request }, info) => {
    await signIn(page);

    // Open: the three unowned requests, count from /requests/counts.
    const open = await queue(request, info, ANITA, 'open');
    expect(open).toEqual([ids.open1, ids.open2, ids.open3].sort());
    await expect(rows(page)).toHaveCount(open.length);
    expect(await rowIds(page)).toEqual(open);
    const c = await counts(request, info, ANITA);
    await expect(page.getByTestId('tab-open-count')).toHaveText(String(c.open));
    await expect(page.getByTestId(`work-name-${ids.open1}`)).toHaveText('Applicant 1');
    await expect(page.getByTestId(`work-row-${ids.open1}`)).toContainText('PMEGP');
    await expect(page.getByTestId(`work-pill-${ids.open1}`)).toHaveText('Pending');
    await expect(page.getByTestId(`claim-countdown-${ids.open1}`)).toHaveCount(0); // nobody owns it, so no timer
    await screenshot(page, 'a09-01-open-tab');

    // Mine: the claimed request with a live countdown.
    await goTab(page, 'mine');
    const mine = await queue(request, info, ANITA, 'assigned');
    expect(mine).toEqual([ids.claimedAnita]);
    expect(await rowIds(page)).toEqual(mine);
    await expect(page.getByTestId('tab-mine-count')).toHaveText(String(c.assigned));
    await expect(page.getByTestId(`work-pill-${ids.claimedAnita}`)).toHaveText('Request initiated');
    await expect(page.getByTestId(`claim-countdown-${ids.claimedAnita}`)).toHaveText(/^Claim expires in (14|15) min$/);
    await screenshot(page, 'a09-02-mine-tab');

    // In progress: started work. The request with the CA sits here, not in Mine or Done.
    await goTab(page, 'active');
    const active = await queue(request, info, ANITA, 'in-progress');
    expect(active).toEqual([ids.withCa]);
    expect(await rowIds(page)).toEqual(active);
    await expect(page.getByTestId('tab-active-count')).toHaveText('1');
    await expect(page.getByTestId(`work-pill-${ids.withCa}`)).toHaveText('Sent for CA validation');

    // Done: my approved and paid reports.
    await goTab(page, 'done');
    const done = await queue(request, info, ANITA, 'cs-completed');
    expect(done).toEqual([ids.generated]);
    expect(await rowIds(page)).toEqual(done);
    await expect(page.getByTestId('tab-done-count')).toHaveText('1');
    await expect(page.getByTestId(`work-pill-${ids.generated}`)).toHaveText('DPR generated');
    await expect(page.getByTestId(`claim-countdown-${ids.generated}`)).toHaveCount(0);
    await screenshot(page, 'a09-03-done-tab');
  });

  test('Suresh sees his own work only, and the CA assignment is labelled', async ({ page, request }, info) => {
    await signIn(page, SURESH);
    await goTab(page, 'mine');
    expect(await rowIds(page)).toEqual([ids.assignedSuresh]);
    expect(await queue(request, info, SURESH, 'assigned')).toEqual([ids.assignedSuresh]);
    await expect(page.getByTestId(`work-row-${ids.assignedSuresh}`)).toContainText('Assigned by CA');
    await expect(page.getByTestId(`claim-countdown-${ids.assignedSuresh}`)).toHaveText(/^Claim expires in (14|15) min$/);
    // Approved but unpaid is still work in progress.
    await goTab(page, 'active');
    expect(await rowIds(page)).toEqual([ids.generatedUnpaid]);
    await expect(page.getByTestId(`work-payment-${ids.generatedUnpaid}`)).toHaveText('Unpaid');
    await expect(page.getByTestId(`work-row-${ids.claimedAnita}`)).toHaveCount(0);
  });

  test('search narrows the list and says so when nothing matches, and the badge keeps the whole queue', async ({ page }) => {
    await signIn(page);
    await expect(rows(page)).toHaveCount(3);

    await page.getByTestId('queue-search').fill('Applicant 8');
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByTestId(`work-row-${ids.open3}`)).toBeVisible();
    await expect(page.getByTestId('tab-open-count')).toHaveText('3');
    await expect(page.getByTestId('queue-result-count')).toHaveText('Showing 1 of 3');
    await screenshot(page, 'a09-04-search');

    await page.getByTestId('queue-search').fill('zzz-nobody');
    await expect(page.getByTestId('empty-state')).toContainText('No matching requests');
    await screenshot(page, 'a09-05-search-empty');

    await page.getByTestId('queue-search-clear').click();
    await expect(rows(page)).toHaveCount(3);
  });

  test('Open shows its empty state when every request is already claimed', async ({ page, request }, info) => {
    for (const id of [ids.open1, ids.open2, ids.open3]) expect((await claimViaApi(request, info, MEENA, id)).status).toBe(200);
    await signIn(page); // Anita
    await expect(page.getByTestId('empty-state')).toContainText('No open requests');
    await expect(page.getByTestId('tab-open-count')).toHaveText('0');
    await screenshot(page, 'a09-06-open-empty');
  });

  test('an agent with no work sees empty Mine and Done tabs', async ({ page }) => {
    await signIn(page, MEENA);
    await goTab(page, 'mine');
    await expect(page.getByTestId('empty-state')).toContainText('Nothing claimed yet');
    await expect(page.getByTestId('tab-mine-count')).toHaveText('0');
    await goTab(page, 'done');
    await expect(page.getByTestId('empty-state')).toContainText('No completed requests');
    await expect(page.getByTestId('tab-done-count')).toHaveText('0');
    await screenshot(page, 'a09-06b-done-empty');
  });

  test('a failed load shows an error with Retry, and Retry recovers', async ({ page }) => {
    await page.route(/govt-forms\/requests\?queue=open/, (route) => route.fulfill(json(500, { success: false, error: 'Failed to list requests' })));
    await signIn(page);
    await expect(page.getByTestId('error-state')).toContainText("Couldn't load your work. Try again.");
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
    await screenshot(page, 'a09-07-error');

    await page.unroute(/govt-forms\/requests\?queue=open/);
    await page.getByTestId('retry-button').click();
    await expect(rows(page)).toHaveCount(3);
  });

  test('skeletons show while the first load is slow', async ({ page }) => {
    await page.route(/govt-forms\/requests\?queue=open/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await loginAs(page, state, state.accounts.agents[ANITA]);
    await expect(page.getByTestId('work-loading')).toBeVisible();
    await screenshot(page, 'a09-08-loading');
    await expect(rows(page)).toHaveCount(3);
    await expect(page.getByTestId('work-loading')).toHaveCount(0);
  });

  // ── Claim, race and release ────────────────────────────────────────────────────────────────────

  test('claiming an open request moves it to Mine', async ({ page, request }, info) => {
    await signIn(page);
    await openDetail(page, ids.open1);
    await expect(page.getByTestId('request-workflow')).toHaveText('Pending');
    await expect(page.getByTestId('release-button')).toHaveCount(0);
    await screenshot(page, 'a10-01-detail-open');

    await page.getByTestId('claim-button').click();
    // Pending until the refetch lands, then the detail shows the claimed state with its timer.
    await expect(page.getByTestId('release-button')).toBeVisible();
    await expect(page.getByTestId('request-workflow')).toHaveText('Request initiated');
    await expect(page.getByTestId('claim-countdown')).toHaveText(/^Claim expires in (14|15) min$/);
    await expect(page.getByTestId('claim-button')).toHaveCount(0);
    await screenshot(page, 'a10-02-detail-claimed');

    // The server agrees.
    expect(await queue(request, info, ANITA, 'assigned')).toEqual([ids.claimedAnita, ids.open1].sort());
    expect(await queue(request, info, ANITA, 'open')).toEqual([ids.open2, ids.open3].sort());

    // Back on My work, the badges and lists already reflect it.
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('tab-mine-count')).toHaveText('2');
    await expect(page.getByTestId('tab-open-count')).toHaveText('2');
    await goTab(page, 'mine');
    await expect(page.getByTestId(`work-row-${ids.open1}`)).toBeVisible();
  });

  test('two agents claim the same request: the second gets the friendly message', async ({ page, request }, info) => {
    await signIn(page); // Anita
    await openDetail(page, ids.open2);
    await expect(page.getByTestId('claim-button')).toBeVisible();

    // Suresh wins the race through the API while Anita still has the Claim button on screen.
    expect((await claimViaApi(request, info, SURESH, ids.open2)).status).toBe(200);

    await page.getByTestId('claim-button').click();
    await expect(page.getByTestId('claim-error')).toHaveText('Another agent claimed this request.');
    await expect(page.getByTestId('claim-button')).toHaveCount(0);
    await expect(page.getByTestId('access-denied')).toHaveCount(0); // the explanation stays on screen
    await screenshot(page, 'a10-03-claim-conflict');

    // Only one claim exists, and it is Suresh's.
    expect(await queue(request, info, SURESH, 'assigned')).toContain(ids.open2);
    expect(await queue(request, info, ANITA, 'assigned')).not.toContain(ids.open2);

    // Back on the list the request is gone from Open (the lists refreshed).
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId(`work-row-${ids.open2}`)).toHaveCount(0);
    await expect(page.getByTestId('tab-open-count')).toHaveText('2');
  });

  test('release asks first, then returns the request to Open', async ({ page, request }, info) => {
    expect((await claimViaApi(request, info, ANITA, ids.open3)).status).toBe(200);
    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.open3);

    await page.getByTestId('release-button').click();
    await expect(page.getByTestId('release-dialog')).toBeVisible();
    await screenshot(page, 'a10-04-release-dialog');
    await page.getByTestId('release-cancel').click();
    await expect(page.getByTestId('release-dialog')).toHaveCount(0);
    expect(await queue(request, info, ANITA, 'assigned')).toContain(ids.open3); // cancelling changed nothing

    await page.getByTestId('release-button').click();
    await page.getByTestId('release-confirm').click();
    await expect(page.getByTestId('tab-mine')).toBeVisible(); // back on My work
    expect(await queue(request, info, ANITA, 'assigned')).toEqual([ids.claimedAnita]);
    expect(await queue(request, info, ANITA, 'open')).toContain(ids.open3);
    await expect(page.getByTestId('tab-open-count')).toHaveText('3');
    await goTab(page, 'open');
    await expect(page.getByTestId(`work-row-${ids.open3}`)).toBeVisible();
  });

  test('a request the CA assigned cannot be released by the agent', async ({ page, request }, info) => {
    await signIn(page, SURESH);
    await goTab(page, 'mine');
    await openDetail(page, ids.assignedSuresh);
    await expect(page.getByTestId('release-button')).toHaveCount(0);
    await expect(page.getByTestId('release-hint')).toContainText('The CA assigned this request to you.');
    await screenshot(page, 'a10-05-assigned-by-ca');
    // The server refuses it too, whatever the UI shows.
    const res = await apiCall(request, info, await agentToken(request, info, SURESH), 'post', `/govt-forms/requests/${ids.assignedSuresh}/release`);
    expect(res.status).toBe(400);
  });

  test('a claim that ran out 16 minutes ago leaves Mine after the next refetch', async ({ page, request }, info) => {
    await signIn(page);
    await goTab(page, 'mine');
    await expect(page.getByTestId(`work-row-${ids.claimedAnita}`)).toBeVisible();

    await dbUpdate(request, info, 'DepartmentRequest', { _id: ids.claimedAnita }, { $set: { claimedAt: new Date(Date.now() - 16 * 60 * 1000) } });
    const job = await request.post(`${apiBase(info)}/__e2e/run-claim-job`);
    expect(((await job.json()) as { released: unknown }).released).toBeTruthy();

    // Leaving the tab and coming back refetches on focus.
    await page.getByRole('tab', { name: 'Profile' }).click();
    await page.getByRole('tab', { name: 'My work' }).click();
    await expect(page.getByTestId(`work-row-${ids.claimedAnita}`)).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toContainText('Nothing claimed yet');
    await screenshot(page, 'a09-09-mine-empty');
    await expect(page.getByTestId('tab-open-count')).toHaveText('4');
    await goTab(page, 'open');
    await expect(page.getByTestId(`work-row-${ids.claimedAnita}`)).toBeVisible();
  });

  test('the countdown reaches zero and the app refetches by itself', async ({ page, request }, info) => {
    test.setTimeout(90_000);
    const expiresAt = Date.now() + 25_000;
    await dbUpdate(request, info, 'DepartmentRequest', { _id: ids.claimedAnita }, { $set: { claimedAt: new Date(expiresAt - CLAIM_MS) } });

    await signIn(page);
    await goTab(page, 'mine');
    await expect(page.getByTestId(`claim-countdown-${ids.claimedAnita}`)).toHaveText('Claim expires in 1 min');

    // The server's job runs a moment after zero. Nobody touches the app: it asks again on its own.
    await page.waitForTimeout(Math.max(0, expiresAt - Date.now()) + 300);
    const job = await request.post(`${apiBase(info)}/__e2e/run-claim-job`);
    expect(((await job.json()) as { released: unknown }).released).toBeTruthy();
    await expect(page.getByTestId(`work-row-${ids.claimedAnita}`)).toHaveCount(0, { timeout: 25_000 });
    await expect(page.getByTestId('tab-open-count')).toHaveText('4');
  });

  // ── Request detail ─────────────────────────────────────────────────────────────────────────────

  test('detail shows the applicant, the progress timeline and the web-only note', async ({ page }) => {
    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);

    await expect(page.getByTestId('applicant-name')).toHaveText('Applicant 4');
    await expect(page.getByTestId('applicant-phone')).toHaveText('9800000014');
    await expect(page.getByTestId('applicant-email')).toHaveText('applicant4@e2e.test');
    await expect(page.getByTestId('request-scheme')).toContainText('PMEGP');
    await expect(page.getByTestId('open-documents-detail')).toHaveText('1');
    await expect(page.getByTestId('web-note')).toHaveText('Reports are created on the web.');
    await expect(page.getByTestId('step-initiated')).toHaveAttribute('aria-label', 'Initiated: current');
    await expect(page.getByTestId('step-preparation')).toHaveAttribute('aria-label', 'Preparing: todo');
    await expect(page.getByTestId('step-generated')).toHaveAttribute('aria-label', 'Generated: todo');
    // No report yet, so nothing to view or send.
    await expect(page.getByTestId('view-report-pdf')).toHaveCount(0);
    await expect(page.getByTestId('send-to-applicant')).toHaveCount(0);
    await screenshot(page, 'a10-06-detail-mine');
  });

  test('timeline and actions follow the workflow: with the CA, then generated', async ({ page }) => {
    await signIn(page);
    await goTab(page, 'active');

    await openDetail(page, ids.withCa);
    await expect(page.getByTestId('request-workflow')).toHaveText('Sent for CA validation');
    await expect(page.getByTestId('step-initiated')).toHaveAttribute('aria-label', 'Initiated: done');
    await expect(page.getByTestId('step-ca_validation')).toHaveAttribute('aria-label', 'With CA: current');
    await expect(page.getByTestId('send-to-applicant')).toHaveCount(0);
    await expect(page.getByTestId('view-report-pdf')).toHaveCount(0); // not approved yet
    await expect(page.getByTestId('release-button')).toHaveCount(0);
    await screenshot(page, 'a10-07-detail-with-ca');
    await page.getByTestId('back-button').click();

    await goTab(page, 'done');
    await openDetail(page, ids.generated);
    await expect(page.getByTestId('request-workflow')).toHaveText('DPR generated');
    await expect(page.getByTestId('step-generated')).toHaveAttribute('aria-label', 'Generated: done');
    await expect(page.getByTestId('send-to-applicant')).toBeVisible();
    await expect(page.getByTestId('view-report-pdf')).toBeVisible();
    await expect(page.getByTestId('claim-countdown')).toHaveCount(0);
    await screenshot(page, 'a10-08-detail-generated');
  });

  test('View report PDF opens the approved report through the agent route', async ({ page }) => {
    await signIn(page);
    await goTab(page, 'done');
    await openDetail(page, ids.generated);
    await page.getByTestId('view-report-pdf').click();
    await expect(page.getByTestId('pdf-frame')).toBeVisible();
    await expect(page.getByTestId('pdf-frame')).toHaveAttribute('src', /^blob:/);
    await screenshot(page, 'a10-09-report-pdf');
    await page.getByTestId('back-button').last().click(); // the viewer's header is the newest on the stack
    await expect(page.getByTestId('request-detail')).toBeVisible();
  });

  test('Call and WhatsApp open the right links, with the country code added', async ({ page }) => {
    const opened: string[] = [];
    // WhatsApp goes through window.open; tel: through a navigation request, which the browser cannot dial.
    await page.addInitScript(() => {
      const w = window as unknown as { __opened: string[] };
      w.__opened = [];
      window.open = ((url?: string | URL) => {
        w.__opened.push(String(url));
        return null;
      }) as typeof window.open;
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.enable');
    cdp.on('Page.frameRequestedNavigation', (e: { url: string }) => opened.push(e.url));

    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);

    await page.getByTestId('call-button').click();
    await expect.poll(() => opened.filter((u) => u.startsWith('tel:'))).toEqual(['tel:9800000014']);

    await page.getByTestId('whatsapp-button').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)).toEqual([
      'https://wa.me/919800000014',
    ]);
    await expect(page.getByTestId('link-error')).toHaveCount(0);
  });

  test('an applicant without a phone number gets disabled Call and WhatsApp buttons', async ({ page, request }, info) => {
    await dbUpdate(request, info, 'User', { email: 'applicant1@e2e.test' }, { $set: { phone: '' } });
    await dbUpdate(request, info, 'DepartmentRequest', { _id: ids.open1 }, { $set: { 'submittedData.govt_builtin_phone': '' } });
    await signIn(page);
    await openDetail(page, ids.open1);
    await expect(page.getByTestId('call-button')).toBeDisabled();
    await expect(page.getByTestId('whatsapp-button')).toBeDisabled();
    await expect(page.getByTestId('no-phone')).toBeVisible();
    await screenshot(page, 'a10-10-no-phone');
  });

  // ── Access ─────────────────────────────────────────────────────────────────────────────────────

  test('a request that another agent took shows the access message and no data', async ({ page, request }, info) => {
    await signIn(page);
    await openDetail(page, ids.open3);
    await expect(page.getByTestId('applicant-name')).toHaveText('Applicant 8');

    expect((await claimViaApi(request, info, SURESH, ids.open3)).status).toBe(200);
    // App comes back to the foreground: stale data reloads and the server now refuses it.
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));

    await expect(page.getByTestId('access-denied-message')).toHaveText("You don't have access to this request.");
    for (const id of ['applicant-name', 'applicant-phone', 'call-button', 'open-documents', 'open-messages', 'claim-button']) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }
    await expect(page.getByText('Applicant 8')).toHaveCount(0);
    await screenshot(page, 'a10-11-access-denied');

    await page.getByTestId('access-denied-back').click();
    await expect(page.getByTestId('tab-open')).toBeVisible();
  });

  test("the API refuses another agent's request, documents and messages, with no data in the body", async ({ request }, info) => {
    const anita = await agentToken(request, info, ANITA);
    const other = ids.assignedSuresh;
    for (const path of ['', '/documents', '/messages']) {
      const res = await apiCall(request, info, anita, 'get', `/govt-forms/requests/${other}${path}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toMatch(/Applicant|e2e\.test|9800000/);
    }
    const post = await apiCall(request, info, anita, 'post', `/govt-forms/requests/${other}/messages`, { body: 'hi' });
    expect(post.status).toBe(403);
    expect((await apiCall(request, info, anita, 'post', `/govt-forms/requests/${other}/release`)).status).toBe(400);
    // Nor does it show up in any of the queues this agent's phone asks for.
    for (const name of ['assigned', 'in-progress', 'cs-completed']) {
      expect(await queue(request, info, ANITA, name)).not.toContain(ids.generatedUnpaid);
    }
  });

  test('the agent shell has only My work and Profile, and admin routes refuse the agent', async ({ page, request }, info) => {
    await signIn(page);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible();
    for (const name of ['Dashboard', 'Reports', 'Requests']) await expect(page.getByRole('tab', { name, exact: true })).toHaveCount(0);

    const anita = await agentToken(request, info, ANITA);
    for (const [method, path] of [
      ['get', '/mobile/admin/stats'],
      ['get', '/mobile/admin/staff'],
      ['get', '/admin-reports/stats'],
      ['post', `/govt-forms/requests/${ids.open1}/assign`],
      ['post', `/govt-forms/requests/${ids.assignedSuresh}/admin-release`],
    ] as const) {
      const res = await apiCall(request, info, anita, method, path, method === 'post' ? { csUserId: state.ids.anita } : undefined);
      expect([401, 403], `${method} ${path}`).toContain(res.status);
    }
    // And the reverse: the CA cannot take an agent's queue slot.
    const ca = await tokenFor(request, info, state.accounts.admin);
    expect([401, 403]).toContain((await apiCall(request, info, ca, 'post', `/govt-forms/requests/${ids.open1}/claim`)).status);
    expect(await queue(request, info, ANITA, 'open')).toContain(ids.open1);
  });

  // ── Documents ──────────────────────────────────────────────────────────────────────────────────

  test('documents list the files, and one with no usable link says so', async ({ page }) => {
    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);
    await page.getByTestId('open-documents').click();
    await expect(page.getByTestId('documents-list')).toBeVisible();
    await expect(page.locator('[data-testid^="document-name-"]')).toHaveText(['aadhaar.pdf']);
    await expect(page.locator('[data-testid^="document-"][role="button"]').first()).toContainText('PDF');
    await screenshot(page, 'a10-12-documents');

    // The seed stores a relative path, which is not a downloadable link: say so rather than fail silently.
    await page.locator('[data-testid^="document-"][role="button"]').first().click();
    await expect(page.getByTestId('document-error')).toHaveText("aadhaar.pdf isn't available to open right now.");
    await screenshot(page, 'a10-13-document-unavailable');
  });

  test('opening a document downloads it without the access token and opens a copy', async ({ page, request }, info) => {
    await dbUpdate(request, info, 'DepartmentRequestDocument', { requestId: ids.claimedAnita }, {
      $set: { storageUrl: 'https://docs.e2e.test/signed/aadhaar.pdf?sig=abc' },
    });
    const downloads: Record<string, string>[] = [];
    // The viewer window is opened with window.open; record what it is asked to open instead of opening it.
    await page.addInitScript(() => {
      const w = window as unknown as { __opened: string[] };
      w.__opened = [];
      window.open = ((url?: string | URL) => {
        w.__opened.push(String(url));
        return null;
      }) as typeof window.open;
    });
    await page.route('https://docs.e2e.test/**', async (route) => {
      downloads.push(route.request().headers());
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'access-control-allow-origin': '*' },
        body: '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
      });
    });

    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);
    await page.getByTestId('open-documents').click();
    await expect(page.locator('[data-testid^="document-name-"]')).toHaveText(['aadhaar.pdf']);

    await page.locator('[data-testid^="document-"][role="button"]').first().click();
    // The viewer gets a local copy (a blob), not the storage link.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened))
      .toEqual([expect.stringMatching(/^blob:/)]);

    expect(downloads).toHaveLength(1);
    // The signed link carries its own proof: our bearer token must never reach the storage host.
    expect(downloads[0].authorization).toBeUndefined();
    await expect(page.getByTestId('document-error')).toHaveCount(0);
  });

  test('a request with no documents shows the empty state', async ({ page }) => {
    await signIn(page);
    await openDetail(page, ids.open1);
    await expect(page.getByTestId('open-documents-detail')).toHaveText('0');
    await page.getByTestId('open-documents').click();
    await expect(page.getByTestId('empty-state')).toContainText('No documents yet');
    await screenshot(page, 'a10-14-documents-empty');
  });

  test('a failed documents load shows an error with Retry', async ({ page }) => {
    await page.route(/requests\/[0-9a-f]{24}\/documents/, (route) => route.fulfill(json(500, { success: false, error: 'Failed to list documents' })));
    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);
    await page.getByTestId('open-documents').click();
    await expect(page.getByTestId('error-state')).toContainText("Couldn't load the documents. Try again.");
    await screenshot(page, 'a10-15-documents-error');
    await page.unroute(/requests\/[0-9a-f]{24}\/documents/);
    await page.getByTestId('retry-button').click();
    await expect(page.locator('[data-testid^="document-name-"]')).toHaveText(['aadhaar.pdf']);
  });

  // ── Messages ───────────────────────────────────────────────────────────────────────────────────

  const openMessages = async (page: Page, id = ids.claimedAnita) => {
    await goTab(page, 'mine');
    await openDetail(page, id);
    await page.getByTestId('open-messages').click();
    await expect(page.getByTestId('messages-list')).toBeVisible();
  };
  const thread = async (request: APIRequestContext, info: TestInfo, token: string, id = ids.claimedAnita) => {
    const res = await apiCall(request, info, token, 'get', `/govt-forms/requests/${id}/messages`);
    expect(res.status).toBe(200);
    return res.body.data as { body: string; senderRole: string; senderId: string }[];
  };

  test('messages: the thread shows, a sent message appears at the bottom and reaches the server', async ({ page, request }, info) => {
    await signIn(page);
    await openMessages(page);
    await expect(page.getByText('Please confirm the documents received.')).toBeVisible();
    await screenshot(page, 'a10-16-messages');

    await page.getByTestId('message-input').fill('Documents received, thank you.');
    await expect(page.getByTestId('send-message')).toBeEnabled();
    await page.getByTestId('send-message').click();
    await expect(page.getByTestId('message-input')).toHaveValue('');
    await expect(page.getByText('Documents received, thank you.')).toBeVisible();
    await expect(page.locator('[data-testid^="bubble-pending-"]')).toHaveCount(0); // replaced by the stored copy
    await screenshot(page, 'a10-17-message-sent');

    // It is in the thread the web reads (same endpoint, here read as the CA), written by Anita as support.
    const ca = await tokenFor(request, info, state.accounts.admin);
    const messages = await thread(request, info, ca);
    expect(messages.map((m) => m.body)).toEqual(['Please confirm the documents received.', 'Documents received, thank you.']);
    expect(messages[1]).toMatchObject({ senderRole: 'customer_service', senderId: state.ids.anita });
    // Newest at the bottom.
    const older = await page.getByText('Please confirm the documents received.').boundingBox();
    const newer = await page.getByText('Documents received, thank you.').boundingBox();
    expect(newer!.y).toBeGreaterThan(older!.y);
  });

  test('messages: a refused send is rolled back, the text stays in the box, and a retry works', async ({ page, request }, info) => {
    await signIn(page);
    await openMessages(page);

    await page.route(/requests\/[0-9a-f]{24}\/messages/, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await new Promise((resolve) => setTimeout(resolve, 800)); // long enough to see the optimistic copy
      return route.fulfill(json(500, { success: false, error: 'Failed to post message' }));
    });
    await page.getByTestId('message-input').fill('This one will fail');
    await page.getByTestId('send-message').click();

    // Shown at once, marked as sending.
    const pending = page.locator('[data-testid^="bubble-pending-"]');
    await expect(pending).toHaveCount(1);
    await expect(pending).toContainText('This one will fail');
    await expect(pending).toContainText('Sending');
    await screenshot(page, 'a10-18-message-sending');

    // Then rolled back, with a plain-language error and the text restored.
    await expect(pending).toHaveCount(0);
    await expect(page.getByTestId('send-error')).toContainText("Couldn't send your message. Try again.");
    await expect(page.getByTestId('message-input')).toHaveValue('This one will fail');
    await expect(page.getByText('This one will fail')).toHaveCount(1); // only the text box, not the thread
    await screenshot(page, 'a10-19-message-rolled-back');
    expect((await thread(request, info, await agentToken(request, info, ANITA))).map((m) => m.body)).toEqual([
      'Please confirm the documents received.',
    ]);

    // Retry once the server is reachable again.
    await page.unroute(/requests\/[0-9a-f]{24}\/messages/);
    await page.getByTestId('send-message').click();
    await expect(page.getByTestId('message-input')).toHaveValue('');
    await expect(page.getByTestId('send-error')).toHaveCount(0);
    await expect.poll(async () => (await thread(request, info, await agentToken(request, info, ANITA))).length).toBe(2);
  });

  test('messages: the send button stays off for empty text, and the server limit is enforced', async ({ page, request }, info) => {
    await signIn(page);
    await openMessages(page);
    await expect(page.getByTestId('send-message')).toBeDisabled();
    await page.getByTestId('message-input').fill('   ');
    await expect(page.getByTestId('send-message')).toBeDisabled();

    // The box stops at 4000 characters; the server refuses more, whatever the client does.
    const long = 'x'.repeat(4001);
    const res = await apiCall(request, info, await agentToken(request, info, ANITA), 'post', `/govt-forms/requests/${ids.claimedAnita}/messages`, { body: long });
    expect(res.status).toBe(400);
    await page.getByTestId('message-input').fill('y'.repeat(4100));
    expect(await page.getByTestId('message-input').inputValue()).toHaveLength(4000);
    await expect(page.getByTestId('message-count')).toHaveText('4000 / 4000');
  });

  test('messages: an open request is read-only until it is claimed', async ({ page, request }, info) => {
    await signIn(page);
    await openDetail(page, ids.open1);
    await page.getByTestId('open-messages').click();
    await expect(page.getByTestId('messages-locked')).toHaveText('You can message the applicant once you claim this request.');
    await expect(page.getByTestId('message-input')).toHaveCount(0);
    await screenshot(page, 'a10-20-messages-locked');
    const res = await apiCall(request, info, await agentToken(request, info, ANITA), 'post', `/govt-forms/requests/${ids.open1}/messages`, { body: 'hi' });
    expect(res.status).toBe(403);
  });

  test('messages: a message from someone else arrives by polling while the screen is open', async ({ page, request }, info) => {
    test.setTimeout(90_000);
    await signIn(page);
    await openMessages(page);
    await expect(page.getByText('Please confirm the documents received.')).toBeVisible();

    const ca = await tokenFor(request, info, state.accounts.admin);
    const post = await apiCall(request, info, ca, 'post', `/govt-forms/requests/${ids.claimedAnita}/messages`, { body: 'CA here: please call them today.' });
    expect(post.status).toBe(201);

    await expect(page.getByText('CA here: please call them today.')).toBeVisible({ timeout: 40_000 }); // 30 s poll
    await screenshot(page, 'a10-21-message-polled');
  });

  test('messages: a failed load shows an error with Retry', async ({ page }) => {
    await page.route(/requests\/[0-9a-f]{24}\/messages/, (route) => route.fulfill(json(500, { success: false, error: 'Failed to list messages' })));
    await signIn(page);
    await goTab(page, 'mine');
    await openDetail(page, ids.claimedAnita);
    await page.getByTestId('open-messages').click();
    await expect(page.getByTestId('error-state')).toContainText("Couldn't load the messages. Try again.");
    await page.unroute(/requests\/[0-9a-f]{24}\/messages/);
    await page.getByTestId('retry-button').click();
    await expect(page.getByText('Please confirm the documents received.')).toBeVisible();
  });
});
