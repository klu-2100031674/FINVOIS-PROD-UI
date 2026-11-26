import { expect, test, type Page, type APIRequestContext, type TestInfo } from '@playwright/test';
import { apiCall, apiLogin, loginAs, pushes, resetDb, screenshot, type E2eState } from './real';

// A07: admin requests list, detail, assign and unassign. Real API on an in-memory MongoDB, no mocks except where
// a failure cannot be produced for real (forced 400 or 500, empty list, network down).
test.describe('admin requests: list, assign, unassign', () => {
  let state: E2eState;
  let ids: E2eState['ids']['requests'];
  let cachedToken: string | null; // admin API session for arranging and checking state from the test side

  test.beforeEach(async ({ request }, info) => {
    state = await resetDb(request, info);
    ids = state.ids.requests;
    cachedToken = null;
  });

  const openRequests = async (page: Page) => {
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    await expect(page.getByTestId('request-list')).toBeVisible();
  };

  const openDetail = async (page: Page, id: string, segment: 'pending' | 'assigned' | 'all' = 'all') => {
    await openRequests(page);
    await page.getByTestId(`segment-${segment}`).click();
    await page.getByTestId(`request-row-${id}`).click();
    await expect(page.getByTestId('applicant-name')).toBeVisible();
  };

  const adminToken = async (request: APIRequestContext, info: TestInfo) =>
    (cachedToken ??= (await apiLogin(request, info, state.accounts.admin, state.password)).accessToken);

  const fetchRequest = async (request: APIRequestContext, info: TestInfo, id: string) => {
    const res = await apiCall(request, info, await adminToken(request, info), 'get', `/govt-forms/requests/${id}`);
    expect(res.status).toBe(200);
    return res.body.data as {
      status: string;
      assignedTo: { name: string } | null;
      claimedBy: { name: string } | null;
      workflow: { key: string };
    };
  };

  const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

  test('lists the seeded requests with workflow pills and handlers', async ({ page }) => {
    await openRequests(page);

    // Pending segment: the three open requests nobody owns.
    await expect(page.getByTestId('segment-pending')).toContainText('Pending 3');
    await expect(page.getByTestId('segment-assigned')).toContainText('Assigned 5');
    await expect(page.getByTestId('segment-all')).toContainText('All 8');
    for (const id of [ids.open1, ids.open2, ids.open3]) {
      await expect(page.getByTestId(`request-pill-${id}`)).toHaveText('Pending');
      await expect(page.getByTestId(`request-handler-${id}`)).toHaveCount(0);
    }
    await expect(page.getByTestId(`request-row-${ids.assignedSuresh}`)).toHaveCount(0);
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toContainText('Applicant 1');
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toContainText('PMEGP');
    await screenshot(page, 'a07-01-list');

    // Assigned segment: everything a staff member owns, at every stage.
    await page.getByTestId('segment-assigned').click();
    const expected: [string, string, string][] = [
      [ids.assignedSuresh, 'Request initiated', 'Suresh'],
      [ids.claimedAnita, 'Request initiated', 'Anita'],
      [ids.withCa, 'Sent for CA validation', 'Anita'],
      [ids.generated, 'DPR generated', 'Anita'],
      [ids.generatedUnpaid, 'DPR generated', 'Suresh'],
    ];
    for (const [id, pill, handler] of expected) {
      await expect(page.getByTestId(`request-pill-${id}`)).toHaveText(pill);
      await expect(page.getByTestId(`request-handler-${id}`)).toHaveText(handler);
    }
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toHaveCount(0);

    await page.getByTestId('segment-all').click();
    await expect(page.locator('[data-testid^="request-row-"]')).toHaveCount(8);
  });

  test('searches by applicant name and phone', async ({ page }) => {
    await openRequests(page);
    await page.getByTestId('segment-all').click();

    await page.getByTestId('queue-search').fill('applicant 8');
    await expect(page.locator('[data-testid^="request-row-"]')).toHaveCount(1);
    await expect(page.getByTestId(`request-row-${ids.open3}`)).toBeVisible();

    // Applicant 2 has two requests (one open, one with the CA).
    await page.getByTestId('queue-search').fill('Applicant 2');
    await expect(page.locator('[data-testid^="request-row-"]')).toHaveCount(2);

    await page.getByTestId('queue-search').fill('98000-00011');
    await expect(page.locator('[data-testid^="request-row-"]')).toHaveCount(1);
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toBeVisible();

    await page.getByTestId('queue-search').fill('nobody by this name');
    await expect(page.getByTestId('empty-state')).toContainText('No matching requests');

    await page.getByTestId('queue-search').fill('');
    await expect(page.locator('[data-testid^="request-row-"]')).toHaveCount(8);
  });

  test('opens a request and shows applicant, scheme, workflow and handler', async ({ page }) => {
    await openDetail(page, ids.open1, 'pending');
    await expect(page.getByTestId('applicant-name')).toHaveText('Applicant 1');
    await expect(page.getByTestId('applicant-phone')).toHaveText('9800000011');
    await expect(page.getByTestId('applicant-email')).toHaveText('applicant1@e2e.test');
    await expect(page.getByTestId('request-scheme')).toHaveText('PMEGP');
    await expect(page.getByTestId('request-workflow')).toHaveText('Pending');
    await expect(page.getByTestId('request-handler')).toHaveText('None');
    await expect(page.getByTestId('report-status')).toHaveText('No report yet');
    await expect(page.getByTestId('assign-button')).toBeVisible();
    await expect(page.getByTestId('unassign-button')).toHaveCount(0);
    await expect(page.getByTestId('locked-notice')).toHaveCount(0);
    await screenshot(page, 'a07-02-detail');

    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('request-list')).toBeVisible();
  });

  test('assigns an open request to Suresh through the sheet', async ({ page, request }, info) => {
    const staff = (await apiCall(request, info, await adminToken(request, info), 'get', '/mobile/admin/staff')).body.data as {
      id: string;
      name: string;
      openCount: number;
    }[];
    expect(staff.map((s) => s.name)).toEqual(['Anita', 'Meena', 'Suresh']); // inactive agent and other roles are absent
    const suresh = staff.find((s) => s.name === 'Suresh')!;
    expect(suresh.id).toBe(state.ids.suresh);

    await openDetail(page, ids.open1, 'pending');
    await page.getByTestId('assign-button').click();
    await expect(page.getByTestId('assign-sheet')).toBeVisible();

    // The sheet shows exactly the counts the staff endpoint reports.
    for (const s of staff) {
      await expect(page.getByTestId(`staff-option-${s.id}`)).toContainText(s.name);
      await expect(page.getByTestId(`staff-open-${s.id}`)).toHaveText(`${s.openCount} open`);
    }
    await expect(page.getByTestId('assign-confirm')).toBeDisabled();

    await page.getByTestId(`staff-option-${suresh.id}`).click();
    await expect(page.getByTestId('assign-confirm')).toBeEnabled();
    await screenshot(page, 'a07-03-assign-sheet');
    await page.getByTestId('assign-confirm').click();

    await expect(page.getByTestId('assign-sheet')).toBeHidden();
    await expect(page.getByTestId('request-handler')).toHaveText('Suresh');
    await expect(page.getByTestId('request-workflow')).toHaveText('Request initiated');
    await expect(page.getByTestId('assign-button')).toHaveCount(0);
    await expect(page.getByTestId('unassign-button')).toBeVisible();

    const after = await fetchRequest(request, info, ids.open1);
    expect(after.assignedTo?.name).toBe('Suresh');
    expect(after.status).toBe('assigned');
    expect(after.workflow.key).toBe('initiated');

    // Suresh now owns one more request.
    const staffAfter = (await apiCall(request, info, await adminToken(request, info), 'get', '/mobile/admin/staff')).body.data as typeof staff;
    expect(staffAfter.find((s) => s.id === suresh.id)!.openCount).toBe(suresh.openCount + 1);

    // The list moved it from Pending to Assigned without a manual refresh.
    await page.getByTestId('back-button').click();
    await page.getByTestId('segment-pending').click();
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toHaveCount(0);
    await page.getByTestId('segment-assigned').click();
    await expect(page.getByTestId(`request-handler-${ids.open1}`)).toHaveText('Suresh');
  });

  test('pushes dpr_assigned to the agent who registered a device', async ({ page, request }, info) => {
    const token = 'ExponentPushToken[a07-suresh-device]';
    const suresh = await apiLogin(request, info, 'suresh@e2e.test', state.password);
    const reg = await apiCall(request, info, suresh.accessToken, 'post', '/mobile/push/register', {
      expoPushToken: token,
      deviceId: 'a07-suresh-device',
      platform: 'android',
    });
    expect(reg.status).toBe(200);
    expect(await pushes(request, info)).toEqual([]);

    await openDetail(page, ids.open2, 'pending');
    await page.getByTestId('assign-button').click();
    await page.getByTestId(`staff-option-${state.ids.suresh}`).click();
    await page.getByTestId('assign-confirm').click();
    await expect(page.getByTestId('request-handler')).toHaveText('Suresh');

    await expect.poll(async () => (await pushes(request, info)).length, { timeout: 10000 }).toBe(1);
    const [push] = await pushes(request, info);
    expect(push.to).toBe(token);
    expect(push.data).toEqual({ type: 'dpr_assigned', id: ids.open2 }); // type and id only, no applicant details
  });

  test('unassigns after a confirmation and returns the request to Pending', async ({ page, request }, info) => {
    await openDetail(page, ids.assignedSuresh, 'assigned');
    await expect(page.getByTestId('request-handler')).toHaveText('Suresh');
    await expect(page.getByTestId('assign-button')).toHaveCount(0);
    await expect(page.getByTestId('unassign-button')).toBeVisible();
    await screenshot(page, 'a07-02b-detail-assigned');

    // Backing out changes nothing.
    await page.getByTestId('unassign-button').click();
    await expect(page.getByTestId('unassign-dialog')).toContainText('Unassign this request?');
    await screenshot(page, 'a07-05-unassign-dialog');
    await page.getByTestId('unassign-cancel').click();
    await expect(page.getByTestId('unassign-dialog')).toBeHidden();
    expect((await fetchRequest(request, info, ids.assignedSuresh)).assignedTo?.name).toBe('Suresh');

    await page.getByTestId('unassign-button').click();
    await page.getByTestId('unassign-confirm').click();

    await expect(page.getByTestId('request-handler')).toHaveText('None');
    await expect(page.getByTestId('request-workflow')).toHaveText('Pending');
    await expect(page.getByTestId('assign-button')).toBeVisible();
    await expect(page.getByTestId('unassign-button')).toHaveCount(0);

    const after = await fetchRequest(request, info, ids.assignedSuresh);
    expect(after.status).toBe('open');
    expect(after.assignedTo).toBeNull();
    expect(after.claimedBy).toBeNull();
    expect(after.workflow.key).toBe('pending');

    await page.getByTestId('back-button').click();
    await page.getByTestId('segment-pending').click();
    await expect(page.getByTestId(`request-row-${ids.assignedSuresh}`)).toBeVisible();
    await expect(page.getByTestId('segment-pending')).toContainText('Pending 4');
  });

  test('offers no assign on an owned request, and the server refuses one anyway', async ({ page, request }, info) => {
    await openDetail(page, ids.claimedAnita);
    await expect(page.getByTestId('request-handler')).toHaveText('Anita');
    await expect(page.getByTestId('assign-button')).toHaveCount(0);
    await expect(page.getByTestId('unassign-button')).toBeVisible();

    const res = await apiCall(request, info, await adminToken(request, info), 'post', `/govt-forms/requests/${ids.claimedAnita}/assign`, {
      csUserId: state.ids.suresh,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unassign this request before assigning/i);
    expect((await fetchRequest(request, info, ids.claimedAnita)).claimedBy?.name).toBe('Anita');
  });

  test('shows no buttons while the request is with the CA, and the server refuses changes', async ({ page, request }, info) => {
    await openDetail(page, ids.withCa);
    await expect(page.getByTestId('request-workflow')).toHaveText('Sent for CA validation');
    await expect(page.getByTestId('locked-title')).toHaveText('Locked: with CA');
    await expect(page.getByTestId('assign-button')).toHaveCount(0);
    await expect(page.getByTestId('unassign-button')).toHaveCount(0);
    await expect(page.getByTestId('view-report-pdf')).toHaveCount(0); // the PDF opens only once the CA approves
    await expect(page.getByTestId('report-status')).toHaveText('Pending');
    await screenshot(page, 'a07-04-locked-detail');

    const release = await apiCall(request, info, await adminToken(request, info), 'post', `/govt-forms/requests/${ids.withCa}/admin-release`);
    expect(release.status).toBe(400);
    expect(release.body.error).toMatch(/cannot be unassigned after CA validation/i);
    const assign = await apiCall(request, info, await adminToken(request, info), 'post', `/govt-forms/requests/${ids.withCa}/assign`, {
      csUserId: state.ids.suresh,
    });
    expect(assign.status).toBe(400);
    const after = await fetchRequest(request, info, ids.withCa);
    expect([after.status, after.claimedBy?.name]).toEqual(['completed', 'Anita']);
  });

  test('shows no assignment buttons once the report is generated, but keeps the PDF', async ({ page }) => {
    await openDetail(page, ids.generated);
    await expect(page.getByTestId('request-workflow')).toHaveText('DPR generated');
    await expect(page.getByTestId('locked-title')).toHaveText('Report generated');
    await expect(page.getByTestId('assign-button')).toHaveCount(0);
    await expect(page.getByTestId('unassign-button')).toHaveCount(0);
    await expect(page.getByTestId('report-status')).toHaveText('Approved');
    await expect(page.getByTestId('view-report-pdf')).toBeVisible();
    await screenshot(page, 'a07-04b-generated-detail');
  });

  test('shows the server message when assign fails and lets the admin retry', async ({ page, request }, info) => {
    let calls = 0;
    await page.route('**/govt-forms/requests/*/assign', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      calls += 1;
      if (calls === 1) {
        return route.fulfill(json(400, { success: false, error: 'Selected user is not an active Customer Service agent' }));
      }
      return route.fallback();
    });

    await openDetail(page, ids.open3, 'pending');
    await page.getByTestId('assign-button').click();
    await page.getByTestId(`staff-option-${state.ids.meena}`).click();
    await page.getByTestId('assign-confirm').click();

    await expect(page.getByTestId('assign-error')).toContainText('Selected user is not an active Customer Service agent');
    await expect(page.getByTestId('assign-sheet')).toBeVisible();
    await expect(page.getByTestId('assign-confirm')).toBeEnabled();
    expect((await fetchRequest(request, info, ids.open3)).status).toBe('open');
    await screenshot(page, 'a07-08-assign-error');

    await page.getByTestId('assign-confirm').click();
    await expect(page.getByTestId('assign-sheet')).toBeHidden();
    await expect(page.getByTestId('request-handler')).toHaveText('Meena');
    expect(calls).toBe(2);
  });

  test('shows the server message when unassign fails', async ({ page, request }, info) => {
    await page.route('**/govt-forms/requests/*/admin-release', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill(json(400, { success: false, error: 'This request cannot be unassigned after CA validation or report generation' }));
    });

    await openDetail(page, ids.assignedSuresh, 'assigned');
    await page.getByTestId('unassign-button').click();
    await page.getByTestId('unassign-confirm').click();

    await expect(page.getByTestId('action-error')).toContainText('cannot be unassigned after CA validation');
    await expect(page.getByTestId('unassign-button')).toBeEnabled();
    expect((await fetchRequest(request, info, ids.assignedSuresh)).assignedTo?.name).toBe('Suresh');
  });

  test('shows skeletons while loading and an empty state with no requests', async ({ page }) => {
    await page.route('**/govt-forms/requests', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await new Promise((r) => setTimeout(r, 1200));
      return route.fulfill(json(200, { success: true, data: [] }));
    });
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    await expect(page.getByTestId('request-list-loading')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('No pending requests');
    await page.getByTestId('segment-all').click();
    await expect(page.getByTestId('empty-state')).toContainText('No requests yet');
    await screenshot(page, 'a07-06-empty');
  });

  test('shows an error with retry when the list fails, and when the network is down', async ({ page }) => {
    let fail: 'server' | 'network' | null = 'server';
    await page.route('**/govt-forms/requests', async (route) => {
      if (route.request().method() !== 'GET' || !fail) return route.fallback();
      return fail === 'server' ? route.fulfill(json(500, { success: false, error: 'boom' })) : route.abort('internetdisconnected');
    });
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();

    await expect(page.getByTestId('error-state')).toContainText("Couldn't load requests");
    await expect(page.getByTestId('error-state')).not.toContainText('boom'); // raw server text is never shown on a 500
    await screenshot(page, 'a07-07-error');

    fail = 'network';
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId('error-state')).toContainText("You're offline", { timeout: 15000 });

    fail = null;
    await page.getByTestId('retry-button').click();
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toBeVisible();
  });

  test('keeps the last list on screen when a refresh fails', async ({ page }) => {
    await openRequests(page);
    await expect(page.getByTestId(`request-row-${ids.open1}`)).toBeVisible();

    await page.route('**/govt-forms/requests', (route) =>
      route.request().method() === 'GET' ? route.fulfill(json(500, { success: false })) : route.fallback()
    );
    // Assigning refetches the list; with that endpoint failing, the old rows stay and a notice appears.
    await page.getByTestId(`request-row-${ids.open1}`).click();
    await page.getByTestId('assign-button').click();
    await page.getByTestId(`staff-option-${state.ids.anita}`).click();
    await page.getByTestId('assign-confirm').click();
    await expect(page.getByTestId('request-handler')).toHaveText('Anita');
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('refresh-error')).toBeVisible();
    await expect(page.getByTestId('request-list')).toBeVisible();
  });

  test('agents have no Requests tab and the server refuses their assign calls', async ({ page, request }, info) => {
    await loginAs(page, state, state.accounts.agents[0]);
    await expect(page.getByRole('tab', { name: 'My work' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Requests', exact: true })).toHaveCount(0);

    const agent = await apiLogin(request, info, state.accounts.agents[0], state.password);
    const assign = await apiCall(request, info, agent.accessToken, 'post', `/govt-forms/requests/${ids.open1}/assign`, {
      csUserId: state.ids.suresh,
    });
    expect(assign.status).toBe(403);
    expect((await apiCall(request, info, agent.accessToken, 'post', `/govt-forms/requests/${ids.assignedSuresh}/admin-release`)).status).toBe(403);
    expect((await apiCall(request, info, agent.accessToken, 'get', '/mobile/admin/staff')).status).toBe(403);
    expect((await fetchRequest(request, info, ids.open1)).status).toBe('open');
  });
});
