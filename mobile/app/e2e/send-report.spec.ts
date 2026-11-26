import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { apiCall, apiLogin, dbUpdate, failNext, loginAs, resetDb, screenshot, sent, type E2eState } from './real';

// A08: the shared send-report sheet, driven through the real admin and agent screens against the real API on an
// in-memory MongoDB. Mail and WhatsApp are captured by the test server (never sent), so every delivery is checked
// at /__e2e/sent. Seed: approvedPaid is linked to the generated request, handled by Anita; approvedUnpaid to
// Suresh's generated request; pending1 has no request; pending2 is with the CA on Anita's request.
// Contacts (E.164 as the server normalizes them): CA 9000000001, Anita 9000000002, applicant 4 9800000014.
const CA = { email: 'ca@e2e.test', phone: '+919000000001' };
const ANITA = { email: 'anita@e2e.test', phone: '+919000000002' };
const APPLICANT = { email: 'applicant4@e2e.test', phone: '+919800000014' };
const PAYMENT_MESSAGE = 'Payment must be completed before the report can be sent.';
const NOT_APPROVED_MESSAGE = 'Report must be approved before it can be sent.';
const ALL_CHANNELS = ['whatsapp', 'email'];

let state: E2eState;
let reports: E2eState['ids']['reports'];
let requests: E2eState['ids']['requests'];

test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
  reports = state.ids.reports;
  requests = state.ids.requests;
});

const SEND_URL = /\/mobile\/reports\/[^/]+\/send$/;
type SendBody = { recipients: string[]; channels: string[]; applicant?: { phone?: string; email?: string } };

/** Every POST the page makes to the send route, in order. */
function recordSends(page: Page) {
  const bodies: SendBody[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && SEND_URL.test(req.url())) bodies.push(req.postDataJSON() as SendBody);
  });
  return bodies;
}

const delivery = (d: { channel: string; to: string }) => `${d.channel}:${d.to}`;
const deliveries = async (request: APIRequestContext, info: TestInfo) => (await sent(request, info)).map(delivery).sort();

async function token(request: APIRequestContext, info: TestInfo, email: string) {
  return (await apiLogin(request, info, email, state.password)).accessToken;
}

const callSend = async (request: APIRequestContext, info: TestInfo, email: string, reportId: string, body: unknown) =>
  apiCall(request, info, await token(request, info, email), 'post', `/mobile/reports/${reportId}/send`, body);

async function openAdminReport(page: Page, id: string) {
  await loginAs(page, state, state.accounts.admin);
  await page.getByRole('tab', { name: 'Reports', exact: true }).click();
  await page.getByTestId(`report-row-${id}`).click();
  await expect(page.getByTestId('report-detail')).toBeVisible();
  await expect(page.getByTestId('handler-card')).toBeVisible();
  await expect(page.getByTestId('handler-loading')).toHaveCount(0); // the staff row depends on the handler lookup
}

async function openAgentRequest(page: Page, agent: number, id: string, tab: 'active' | 'done' = 'done') {
  await loginAs(page, state, state.accounts.agents[agent]);
  await page.getByTestId(`tab-${tab}`).click();
  await page.getByTestId(`work-row-${id}`).click();
  await expect(page.getByTestId('request-detail')).toBeVisible();
}

const openSheet = async (page: Page, button: 'send-report' | 'send-to-applicant') => {
  await page.getByTestId(button).click();
  await expect(page.getByTestId('send-sheet')).toBeVisible();
  // The sheet slides up; wait until it has settled so screenshots and clicks see its final position.
  await expect
    .poll(() => page.getByTestId('send-cancel').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight))
    .toBe(true);
};

const isChecked = (page: Page, testID: string, on: boolean) =>
  expect(page.getByTestId(testID)).toHaveAttribute('aria-checked', String(on));

const resultText = (page: Page, key: string) => page.getByTestId(`result-status-${key}`);

// ── Admin ────────────────────────────────────────────────────────────────────────────────────────

test.describe('admin', () => {
  test('sends an approved, paid report to me and the assigned staff by WhatsApp and email', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');

    // Defaults for the CA: me and the assigned staff member (Anita), applicant off, both channels on.
    await isChecked(page, 'recipient-me', true);
    await isChecked(page, 'recipient-staff', true);
    await isChecked(page, 'recipient-applicant', false);
    await isChecked(page, 'channel-whatsapp', true);
    await isChecked(page, 'channel-email', true);
    await expect(page.getByTestId('send-applicant-contact')).toHaveCount(0);
    await expect(page.getByTestId('send-confirm')).toBeEnabled();
    await screenshot(page, 'a08-01-admin-form');

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 4 of 4.');
    for (const key of ['me-whatsapp', 'me-email', 'staff-whatsapp', 'staff-email']) await expect(resultText(page, key)).toHaveText('Delivered');
    await expect(page.getByTestId('retry-failed')).toHaveCount(0);
    await screenshot(page, 'a08-02-admin-results');

    // The captured deliveries are exactly those recipients on exactly those channels, each with the PDF attached.
    const out = await sent(request, info);
    expect(out.map(delivery).sort()).toEqual(
      [`email:${CA.email}`, `email:${ANITA.email}`, `whatsapp:${CA.phone}`, `whatsapp:${ANITA.phone}`].sort()
    );
    for (const d of out) {
      expect(d.bytes).toBeGreaterThan(0);
      expect(d.title).toBe('DPR Applicant 4');
    }
    expect(new Set(out.map((d) => d.bytes)).size).toBe(1); // the same PDF everywhere
    expect(posts).toEqual([{ recipients: ['me', 'staff'], channels: ALL_CHANNELS }]);

    await page.getByTestId('send-done').click();
    await expect(page.getByTestId('send-sheet')).toHaveCount(0);
    await expect(page.getByTestId('send-report')).toBeVisible();
  });

  test('can add the applicant: the contact is editable and the edited number gets the report', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');

    await page.getByTestId('recipient-me').click();
    await page.getByTestId('recipient-staff').click();
    await page.getByTestId('recipient-applicant').click();
    await page.getByTestId('channel-email').click(); // WhatsApp only
    await expect(page.getByTestId('send-applicant-phone')).toHaveValue('9800000014');
    await expect(page.getByTestId('send-applicant-email')).toHaveCount(0); // email is off, so its field is not asked for

    await page.getByTestId('send-applicant-phone').fill('+91 91234 56780');
    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 1 of 1.');
    expect(await deliveries(request, info)).toEqual(['whatsapp:+919123456780']);
    expect(posts).toEqual([{ recipients: ['applicant'], channels: ['whatsapp'], applicant: { phone: '+919123456780' } }]);
  });

  test('no assigned staff: the staff row is disabled with the reason, and the server refuses staff anyway', async ({ page, request }, info) => {
    await dbUpdate(request, info, 'DepartmentRequest', { _id: requests.generated }, { $unset: { claimedBy: 1 } });
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');

    await expect(page.getByTestId('recipient-staff')).toHaveAttribute('aria-disabled', 'true');
    await isChecked(page, 'recipient-staff', false);
    await isChecked(page, 'recipient-me', true);
    await expect(page.getByTestId('recipient-staff-note')).toHaveText('No staff member is assigned to this request yet.');
    await screenshot(page, 'a08-03-no-staff');

    const res = await callSend(request, info, state.accounts.admin, reports.approvedPaid, { recipients: ['staff'], channels: ['email'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No staff member is assigned to this request.');
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('an unapproved report has no Send button, and the API refuses to send it', async ({ page, request }, info) => {
    await openAdminReport(page, reports.pending1);
    await expect(page.getByTestId('view-pdf')).toBeVisible();
    await expect(page.getByTestId('send-report')).toHaveCount(0);
    await screenshot(page, 'a08-04-pending-no-send');

    for (const id of [reports.pending1, reports.review1, reports.rejected1]) {
      const res = await callSend(request, info, state.accounts.admin, id, { recipients: ['me'], channels: ['email'] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(NOT_APPROVED_MESSAGE);
    }
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('unpaid is refused for the CA too: the button is disabled and the API answers 402', async ({ page, request }, info) => {
    await openAdminReport(page, reports.approvedUnpaid);
    await expect(page.getByTestId('send-report')).toBeDisabled();
    await expect(page.getByTestId('send-blocked')).toContainText('Payment is not complete yet');

    const res = await callSend(request, info, state.accounts.admin, reports.approvedUnpaid, { recipients: ['me'], channels: ['email'] });
    expect(res.status).toBe(402);
    expect(res.body).toMatchObject({ error: PAYMENT_MESSAGE, error_code: 'PAYMENT_REQUIRED' });
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('payment reversed while the sheet is open: the server message is shown and nothing is sent', async ({ page, request }, info) => {
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');
    await dbUpdate(request, info, 'Report', { _id: reports.approvedPaid }, { $set: { 'payment.status': 'pending' } });

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-sheet-error')).toHaveText(PAYMENT_MESSAGE);
    await expect(page.getByTestId('send-results')).toHaveCount(0);
    await expect(page.getByTestId('retry-failed')).toHaveCount(0);
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('a partial WhatsApp failure is shown accurately and Retry failed resends only WhatsApp', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');
    await failNext(request, info, 'whatsapp'); // the first WhatsApp delivery (to me) fails

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 3 of 4. 1 failed.');
    await expect(resultText(page, 'me-whatsapp')).toHaveText('Failed: WhatsApp delivery failed.');
    for (const key of ['me-email', 'staff-whatsapp', 'staff-email']) await expect(resultText(page, key)).toHaveText('Delivered');
    await expect(page.getByTestId('retry-failed')).toHaveText('Retry failed (1)');
    await screenshot(page, 'a08-05-partial-failure');
    expect(await deliveries(request, info)).toEqual([`email:${CA.email}`, `email:${ANITA.email}`, `whatsapp:${ANITA.phone}`].sort());

    await page.getByTestId('retry-failed').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 4 of 4.');
    await expect(resultText(page, 'me-whatsapp')).toHaveText('Delivered');
    await expect(page.getByTestId('retry-failed')).toHaveCount(0);
    await screenshot(page, 'a08-06-retry-delivered');

    // The retry went out as one request for the failed pair only, so nothing that was delivered was sent twice.
    expect(posts).toEqual([
      { recipients: ['me', 'staff'], channels: ALL_CHANNELS },
      { recipients: ['me'], channels: ['whatsapp'] },
    ]);
    expect(await deliveries(request, info)).toEqual(
      [`email:${CA.email}`, `email:${ANITA.email}`, `whatsapp:${CA.phone}`, `whatsapp:${ANITA.phone}`].sort()
    );
    await page.getByTestId('send-done').click();
    await expect(page.getByTestId('send-sheet')).toHaveCount(0);
  });

  test('when every delivery fails (502) each pair is listed with the reason, and the retry then goes through', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');
    await page.getByTestId('recipient-staff').click();
    await page.getByTestId('channel-email').click(); // me by WhatsApp only: one pair
    await failNext(request, info, 'whatsapp');

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Nothing was delivered.');
    await expect(resultText(page, 'me-whatsapp')).toHaveText('Failed: WhatsApp delivery failed.');
    await expect(page.getByTestId('send-sheet-error')).toHaveText('The report could not be delivered. Check the results and try again.');
    await screenshot(page, 'a08-07-all-failed');
    expect(await deliveries(request, info)).toEqual([]);

    await page.getByTestId('retry-failed').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 1 of 1.');
    await expect(page.getByTestId('send-sheet-error')).toHaveCount(0);
    expect(await deliveries(request, info)).toEqual([`whatsapp:${CA.phone}`]);
    expect(posts).toEqual([
      { recipients: ['me'], channels: ['whatsapp'] },
      { recipients: ['me'], channels: ['whatsapp'] },
    ]);
  });

  test('the send limit (429) shows the server message and keeps the form', async ({ page, request }, info) => {
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');
    // Ten refused calls use up the per-user limit without sending anything.
    for (let i = 0; i < 10; i += 1) await callSend(request, info, state.accounts.admin, reports.approvedPaid, {});

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-sheet-error')).toHaveText('Too many attempts. Try again later.');
    await expect(page.getByTestId('send-confirm')).toBeEnabled();
    await screenshot(page, 'a08-08-rate-limited');
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('a double tap sends once, and the server does not repeat a delivery asked for again within a minute', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');

    // Two clicks in the same tick, before the page can re-render.
    await page.getByTestId('send-confirm').evaluate((el) => {
      (el as HTMLElement).click();
      (el as HTMLElement).click();
    });
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 4 of 4.');
    expect(posts).toHaveLength(1);
    expect(await sent(request, info)).toHaveLength(4);

    // The same request again (a retry after an app kill, or a second device) is answered without sending.
    const again = await callSend(request, info, state.accounts.admin, reports.approvedPaid, { recipients: ['me', 'staff'], channels: ALL_CHANNELS });
    expect(again.status).toBe(200);
    expect(again.body.results).toHaveLength(4);
    expect(again.body.results.every((r: { status: string }) => r.status === 'sent')).toBe(true);
    expect(await sent(request, info)).toHaveLength(4);
  });

  test('a device that looks rooted cannot send: Send is disabled and says why', async ({ page, request }, info) => {
    await page.addInitScript(() => {
      (window as unknown as { __FINVOIS_SUSPECT__?: boolean }).__FINVOIS_SUSPECT__ = true; // what the web probe reads
    });
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');
    await expect(page.getByTestId('send-integrity-block')).toContainText('rooted or jailbroken');
    await expect(page.getByTestId('send-confirm')).toBeDisabled();
    await screenshot(page, 'a08-15-integrity-blocked');
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('controls are disabled while the request is in flight', async ({ page, request }, info) => {
    await page.route(SEND_URL, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await openAdminReport(page, reports.approvedPaid);
    await openSheet(page, 'send-report');

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-confirm')).toBeDisabled();
    await expect(page.getByTestId('send-cancel')).toBeDisabled();
    await expect(page.getByTestId('channel-email')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('recipient-me')).toHaveAttribute('aria-disabled', 'true');
    await screenshot(page, 'a08-09-sending');
    await page.getByTestId('send-sheet-backdrop').click({ position: { x: 5, y: 5 } }); // cannot dismiss mid-send
    await expect(page.getByTestId('send-sheet')).toBeVisible();

    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 4 of 4.');
    expect(await sent(request, info)).toHaveLength(4);
  });
});

// ── Agent ────────────────────────────────────────────────────────────────────────────────────────

test.describe('agent', () => {
  test('Anita sends the report to the applicant: prefilled contact, both channels, request flags updated', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAgentRequest(page, 0, requests.generated);
    await openSheet(page, 'send-to-applicant');

    await isChecked(page, 'recipient-applicant', true);
    await isChecked(page, 'recipient-me', false);
    await expect(page.getByTestId('send-applicant-phone')).toHaveValue('9800000014');
    await expect(page.getByTestId('send-applicant-email')).toHaveValue(APPLICANT.email);
    await screenshot(page, 'a08-10-agent-form');

    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 2 of 2.');
    await expect(resultText(page, 'applicant-whatsapp')).toHaveText('Delivered');
    await expect(resultText(page, 'applicant-email')).toHaveText('Delivered');
    await screenshot(page, 'a08-11-agent-results');

    const out = await sent(request, info);
    expect(out.map(delivery).sort()).toEqual([`email:${APPLICANT.email}`, `whatsapp:${APPLICANT.phone}`].sort());
    expect(out.every((d) => d.bytes > 0)).toBe(true);
    expect(posts).toEqual([
      { recipients: ['applicant'], channels: ALL_CHANNELS, applicant: { phone: '9800000014', email: APPLICANT.email } },
    ]);

    // Same side effect as the web agent endpoints: the request records that the applicant got it.
    const detail = await apiCall(request, info, await token(request, info, state.accounts.agents[0]), 'get', `/govt-forms/requests/${requests.generated}`);
    expect(detail.body.data).toMatchObject({ emailSent: true, whatsAppSent: true });

    await page.getByTestId('send-done').click();
    await expect(page.getByTestId('send-sheet')).toHaveCount(0);
    await expect(page.getByTestId('request-detail')).toBeVisible();
  });

  test('edited applicant contact is what gets the report', async ({ page, request }, info) => {
    await openAgentRequest(page, 0, requests.generated);
    await openSheet(page, 'send-to-applicant');
    await page.getByTestId('send-applicant-phone').fill('9123456780');
    await page.getByTestId('send-applicant-email').fill('new.address@example.org');
    await page.getByTestId('send-confirm').click();
    await expect(page.getByTestId('send-summary')).toHaveText('Delivered 2 of 2.');
    expect(await deliveries(request, info)).toEqual(['email:new.address@example.org', 'whatsapp:+919123456780']);
  });

  test('an invalid applicant phone or email is blocked on the device, and the server refuses it too', async ({ page, request }, info) => {
    const posts = recordSends(page);
    await openAgentRequest(page, 0, requests.generated);
    await openSheet(page, 'send-to-applicant');

    const phone = page.getByTestId('send-applicant-phone');
    await phone.fill('12345');
    await expect(page.getByTestId('send-applicant-phone-error')).toContainText('10-digit');
    await expect(page.getByTestId('send-confirm')).toBeDisabled();
    await screenshot(page, 'a08-12-invalid-phone');

    await phone.fill('9123456780');
    await expect(page.getByTestId('send-applicant-phone-error')).toHaveCount(0);
    await page.keyboard.press('Enter'); // "next" moves to the email field
    await expect(page.getByTestId('send-applicant-email')).toBeFocused();
    await page.getByTestId('send-applicant-email').fill('not-an-email');
    await expect(page.getByTestId('send-applicant-email-error')).toHaveText('Enter a valid email address.');
    await expect(page.getByTestId('send-confirm')).toBeDisabled();
    await page.getByTestId('send-confirm').click({ force: true });
    expect(posts).toHaveLength(0);
    expect(await deliveries(request, info)).toEqual([]);

    // The server does not trust that check.
    const badPhone = await callSend(request, info, state.accounts.agents[0], reports.approvedPaid, {
      recipients: ['applicant'],
      channels: ['whatsapp'],
      applicant: { phone: '12345' },
    });
    expect(badPhone.status).toBe(400);
    expect(badPhone.body.error).toBe('Applicant phone number is not valid.');
    const badEmail = await callSend(request, info, state.accounts.agents[0], reports.approvedPaid, {
      recipients: ['applicant'],
      channels: ['email'],
      applicant: { email: 'not-an-email' },
    });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error).toBe('Applicant email address is not valid.');
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('an unpaid report says why it cannot be sent, as on the web, and the server refuses it too', async ({ page, request }, info) => {
    await openAgentRequest(page, 1, requests.generatedUnpaid, 'active'); // Suresh's request
    await expect(page.getByTestId('send-to-applicant')).toBeDisabled();
    await expect(page.getByTestId('send-blocked')).toContainText('after payment is completed');
    await screenshot(page, 'a08-13-unpaid-blocked');
    expect(await deliveries(request, info)).toEqual([]);

    const res = await callSend(request, info, state.accounts.agents[1], reports.approvedUnpaid, { recipients: ['applicant'], channels: ['email'] });
    expect(res.status).toBe(402);
    expect(res.body.error_code).toBe('PAYMENT_REQUIRED');
    expect(await deliveries(request, info)).toEqual([]);
  });

  test('a report still with the CA cannot be sent: no button, and the API answers 400', async ({ page, request }, info) => {
    await openAgentRequest(page, 0, requests.withCa, 'active');
    await expect(page.getByTestId('send-to-applicant')).toHaveCount(0);
    await screenshot(page, 'a08-14-agent-with-ca');

    const res = await callSend(request, info, state.accounts.agents[0], reports.pending2, { recipients: ['applicant'], channels: ['email'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(NOT_APPROVED_MESSAGE);
    expect(await deliveries(request, info)).toEqual([]);
  });

  test("role gate: an agent cannot send another agent's report, and a request without a token is refused", async ({ request }, info) => {
    const other = await callSend(request, info, state.accounts.agents[1], reports.approvedPaid, { recipients: ['me'], channels: ['email'] });
    expect(other.status).toBe(403);
    const meena = await callSend(request, info, state.accounts.agents[2], reports.approvedPaid, { recipients: ['me'], channels: ['email'] });
    expect(meena.status).toBe(403);
    const anon = await request.post(`http://127.0.0.1:${new URL(info.config.metadata.apiBase).port}/api/mobile/reports/${reports.approvedPaid}/send`, {
      data: { recipients: ['me'], channels: ['email'] },
    });
    expect(anon.status()).toBe(401);
    expect(await deliveries(request, info)).toEqual([]);
  });
});
