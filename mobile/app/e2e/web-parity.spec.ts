import { expect, test, type Page } from '@playwright/test';
import { apiCall, apiLogin, dbUpdate, loginAs, resetDb, screenshot, type E2eState } from './real';

// D12: what the web has that the app was missing. Real API on an in-memory MongoDB, with mocks only where the test
// server cannot produce the case (cloud storage, a disconnected WhatsApp gateway).
let state: E2eState;

test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
});

const rows = (page: Page) => page.locator('[data-testid^="work-row-"]');
const reportRows = (page: Page) => page.locator('[data-testid^="report-row-"]');
const option = (page: Page, name: string) => page.getByRole('option', { name, exact: true });

async function signInAgent(page: Page, agent = 0) {
  await loginAs(page, state, state.accounts.agents[agent]);
  await expect(page.getByTestId('tab-open')).toBeVisible();
}

async function openReport(page: Page, id: string) {
  await loginAs(page, state, state.accounts.admin);
  await page.getByRole('tab', { name: 'Reports', exact: true }).click();
  await page.getByTestId(`report-row-${id}`).click();
  await expect(page.getByTestId('report-detail')).toBeVisible();
}

test.describe('agent queues', () => {
  test('a request whose work has started moves from Mine to In progress instead of vanishing', async ({ page, request }, info) => {
    const id = state.ids.requests.claimedAnita;
    await dbUpdate(request, info, 'DepartmentRequest', { _id: id }, { $set: { generationStartedAt: new Date().toISOString() } });
    await signInAgent(page);

    await page.getByTestId('tab-mine').click();
    await expect(page.getByTestId(`work-row-${id}`)).toHaveCount(0);
    await page.getByTestId('tab-active').click();
    await expect(page.getByTestId(`work-row-${id}`)).toBeVisible();
    await expect(page.getByTestId('tab-active-count')).toHaveText('2');
    await screenshot(page, 'p01-01-in-progress');
  });

  test('In progress groups the work the way the web does', async ({ page }) => {
    await signInAgent(page);
    await page.getByTestId('tab-active').click();
    const { withCa } = state.ids.requests;
    await expect(page.getByTestId(`work-row-${withCa}`)).toBeVisible();
    await expect(page.getByTestId('kind-ca')).toContainText('With CA 1');

    await page.getByTestId('kind-rejected').click();
    await expect(page.getByTestId('empty-state')).toContainText('No matching requests');
    await page.getByTestId('kind-ca').click();
    await expect(page.getByTestId(`work-row-${withCa}`)).toBeVisible();
  });

  test('filters narrow a queue, count themselves, and reset', async ({ page, request }, info) => {
    await dbUpdate(request, info, 'DepartmentRequest', { _id: state.ids.requests.open1 }, { $set: { reportId: state.ids.reports.approvedPaid } });
    await signInAgent(page);
    await expect(rows(page)).toHaveCount(3);

    await page.getByTestId('queue-filters-toggle').click();
    await page.getByTestId('filter-department').click();
    await option(page, 'AP MSME').click();
    await expect(page.getByTestId('queue-filters-count')).toHaveText('1');
    await expect(rows(page)).toHaveCount(3);

    await page.getByTestId('filter-payment').click();
    await option(page, 'Paid').click();
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByTestId(`work-payment-${state.ids.requests.open1}`)).toHaveText('Paid');
    await screenshot(page, 'p01-02-filters');

    await page.getByTestId('queue-filters-reset').click();
    await expect(rows(page)).toHaveCount(3);
  });
});

test.describe('request detail', () => {
  test('the agent reads the submitted application, department and handler', async ({ page }) => {
    await signInAgent(page);
    await page.getByTestId('tab-mine').click();
    await page.getByTestId(`work-row-${state.ids.requests.claimedAnita}`).click();
    await expect(page.getByTestId('request-department')).toContainText('AP MSME');
    await expect(page.getByTestId('request-staff-owner')).toHaveText('Handled by Anita');

    await page.getByTestId('open-form').click();
    await expect(page.getByTestId('form-value-govt_builtin_name')).toHaveText('Applicant 4');
    await screenshot(page, 'p01-03-application');
  });

  test('an approved, paid report shows its status, sent state and Excel download', async ({ page, request }, info) => {
    const id = state.ids.requests.generated;
    await dbUpdate(request, info, 'DepartmentRequest', { _id: id }, { $set: { emailSent: true } });
    await signInAgent(page);
    await page.getByTestId('tab-done').click();
    await page.getByTestId(`work-row-${id}`).click();

    await expect(page.getByTestId('report-status')).toHaveText('Approved');
    await expect(page.getByTestId('report-note')).toContainText('send it to the applicant');
    await expect(page.getByTestId('sent-email')).toBeVisible();
    await expect(page.getByTestId('sent-whatsapp')).toHaveCount(0);
    await expect(page.getByTestId('send-blocked')).toHaveCount(0);
    await expect(page.getByTestId('send-to-applicant')).toBeEnabled();

    // The seeded report has a PDF but no workbook.
    await page.getByTestId('download-excel').click();
    await expect(page.getByTestId('excel-error')).toBeVisible();
    await screenshot(page, 'p01-04-report-card');
  });

  test('a workbook is downloaded through the agent route', async ({ page }) => {
    let path = '';
    await page.route(/\/report\/excel$/, (route) => {
      path = new URL(route.request().url()).pathname;
      // The two bytes that open every .xlsx file are enough for the app's check.
      return route.fulfill({ status: 200, contentType: 'application/octet-stream', body: Buffer.from('PK\u0003\u0004rest') });
    });
    await signInAgent(page);
    await page.getByTestId('tab-done').click();
    await page.getByTestId(`work-row-${state.ids.requests.generated}`).click();

    const download = page.waitForEvent('download');
    await page.getByTestId('download-excel').click();
    expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
    expect(path).toContain(`/govt-forms/requests/${state.ids.requests.generated}/report/excel`);
  });

  test('documents can be uploaded and deleted when the server allows it', async ({ page }) => {
    const id = state.ids.requests.claimedAnita;
    const added = { id: 'new1', fileName: 'bank.pdf', kind: 'document', size: 2048, url: 'https://storage.e2e.test/bank.pdf' };
    let uploaded = false;
    let posted = '';
    let deleted = false;
    // Cloud storage does not exist on the test server, so the write itself is mocked. canMutate comes from the real API.
    await page.route(new RegExp(`/requests/${id}/documents$`), async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        posted = req.postData() ?? '';
        uploaded = true;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: [added] }) });
      }
      const res = await route.fetch();
      const body = await res.json();
      if (uploaded && !deleted) body.data.push(added);
      return route.fulfill({ response: res, json: body });
    });
    await page.route(new RegExp(`/requests/${id}/documents/new1$`), (route) => {
      deleted = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await signInAgent(page);
    await page.getByTestId('tab-mine').click();
    await page.getByTestId(`work-row-${id}`).click();
    await page.getByTestId('open-documents').click();
    await expect(page.getByTestId('upload-limits')).toContainText('5 MB each, 10 files');

    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('upload-documents').click();
    await (await chooser).setFiles({ name: 'bank.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
    await expect(page.getByTestId('document-name-new1')).toHaveText('bank.pdf');
    expect(posted).toContain('name="files"');
    expect(posted).toContain('filename="bank.pdf"');
    await screenshot(page, 'p01-05-documents');

    await page.getByTestId('document-delete-new1').click();
    await expect(page.getByTestId('delete-document-dialog')).toContainText('bank.pdf');
    await page.getByTestId('delete-document-confirm').click();
    await expect(page.getByTestId('document-new1')).toHaveCount(0);
    expect(deleted).toBe(true);
  });

  test('a file over the limit is refused before anything is sent', async ({ page }) => {
    let sentUpload = false;
    await page.route(/\/documents$/, (route) => {
      if (route.request().method() === 'POST') sentUpload = true;
      return route.continue();
    });
    await signInAgent(page);
    await page.getByTestId('tab-mine').click();
    await page.getByTestId(`work-row-${state.ids.requests.claimedAnita}`).click();
    await page.getByTestId('open-documents').click();

    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('upload-documents').click();
    await (await chooser).setFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(6 * 1024 * 1024) });
    await expect(page.getByTestId('upload-error')).toContainText('huge.pdf is too large');
    expect(sentUpload).toBe(false);
  });

  test('the admin reaches contact, application, documents and messages from a request', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    await page.getByTestId('segment-all').click();
    await page.getByTestId(`request-row-${state.ids.requests.claimedAnita}`).click();
    await expect(page.getByTestId('request-department')).toHaveText('AP MSME');
    await expect(page.getByTestId('call-button')).toBeEnabled();
    await expect(page.getByTestId('whatsapp-button')).toBeEnabled();
    await screenshot(page, 'p01-06-admin-request');

    await page.getByTestId('open-form').click();
    await expect(page.getByTestId('form-value-govt_builtin_name')).toHaveText('Applicant 4');
    // The web stack keeps the screen underneath in the page, so the top screen's button is the last one.
    await page.getByTestId('back-button').last().click();

    await page.getByTestId('open-documents').click();
    await expect(page.getByText('aadhaar.pdf')).toBeVisible();
    await page.getByTestId('back-button').last().click();

    await page.getByTestId('open-messages').click();
    await expect(page.getByText('Please confirm the documents received.')).toBeVisible();
  });
});

test.describe('admin reports', () => {
  test('a channel-partner report needs the amount to collect, prefilled from the template price', async ({ page, request }, info) => {
    const id = state.ids.reports.pending1;
    await dbUpdate(request, info, 'Report', { _id: id }, {
      $set: { 'payment.collect_on_download': true, 'payment.status': 'pending', 'payment.template_amount': 2500 },
    });
    await openReport(page, id);
    await page.getByTestId('approve').click();

    await expect(page.getByTestId('approve-amount')).toHaveValue('2500');
    await page.getByTestId('approve-amount').fill('');
    await expect(page.getByTestId('approve-confirm')).toBeDisabled();
    await expect(page.getByTestId('approve-amount-hint')).toHaveText('Enter an amount of 0 or more.');
    await page.getByTestId('approve-amount').fill('1800');
    await page.getByTestId('approve-notes').fill('Checked against the bank letter');
    await screenshot(page, 'p01-07-approve-amount');
    await page.getByTestId('approve-confirm').click();

    await expect(page.getByTestId('action-success')).toHaveText('Report approved.');
    await expect(page.getByTestId('report-notes')).toHaveText('Checked against the bank letter');
    await expect(page.getByTestId('report-amount')).toHaveText('₹1,800');
    const token = (await apiLogin(request, info, state.accounts.admin, state.password)).accessToken;
    const saved = await apiCall(request, info, token, 'get', `/admin-reports/${id}`);
    expect(saved.body.data.validation_status).toBe('approved');
    expect(saved.body.data.payment.amount).toBe(1800);
  });

  test('an ordinary report asks for no amount, and the email switch reaches the server', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    page.on('request', (r) => {
      if (/\/(approve|reject)$/.test(r.url()) && r.method() === 'PATCH') bodies.push(r.postDataJSON());
    });
    await openReport(page, state.ids.reports.pending1);
    await page.getByTestId('approve').click();
    await expect(page.getByTestId('approve-amount')).toHaveCount(0);
    await page.getByTestId('approve-send-email').click();
    await page.getByTestId('approve-confirm').click();
    await expect(page.getByTestId('action-success')).toBeVisible();
    expect(bodies[0]).toEqual({ send_email: false });
  });

  test('rejecting keeps the email on by default', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    page.on('request', (r) => {
      if (/\/reject$/.test(r.url())) bodies.push(r.postDataJSON());
    });
    await openReport(page, state.ids.reports.pending1);
    await page.getByTestId('reject').click();
    await page.getByTestId('reject-reason').fill('Bank statements are missing');
    await page.getByTestId('reject-confirm').click();
    await expect(page.getByTestId('action-success')).toHaveText('Report rejected.');
    expect(bodies[0]).toEqual({ rejection_reason: 'Bank statements are missing', send_email: true });
  });

  test('a rejected report can go back for re-review', async ({ page }) => {
    await openReport(page, state.ids.reports.rejected1);
    await expect(page.getByTestId('approve')).toHaveCount(0);
    await page.getByTestId('start-re-review').click();
    await expect(page.getByTestId('action-success')).toContainText('re-review');
    await expect(page.getByTestId('report-status')).toHaveText('Re-review');
    await expect(page.getByTestId('approve')).toBeVisible();
    await screenshot(page, 'p01-08-re-review');
  });

  test('the date filter asks the server for that range', async ({ page }) => {
    await loginAs(page, state, state.accounts.admin);
    await page.getByRole('tab', { name: 'Reports', exact: true }).click();
    await expect(reportRows(page).first()).toBeVisible();

    const filtered = page.waitForRequest((r) => r.url().includes('/admin-reports?') && r.url().includes('start_date='));
    await page.getByTestId('more-filters-toggle').click();
    await page.getByTestId('filter-date').click();
    await option(page, 'Last 30 days').click();
    const start = new Date(new URL((await filtered).url()).searchParams.get('start_date') as string).getTime();
    const days = (Date.now() - start) / 86400000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(31.1);

    await expect(page.getByTestId('more-filters-toggle')).toContainText('More filters (1)');
    await expect(reportRows(page).first()).toBeVisible(); // everything seeded was created today
    await screenshot(page, 'p01-09-date-filter');

    await page.getByTestId('filter-date').click();
    await option(page, 'Any time').click();
    await expect(page.getByTestId('more-filters-toggle')).toHaveText('More filters');
  });

  test('the send sheet warns when the WhatsApp gateway is down, only while WhatsApp is chosen', async ({ page }) => {
    await page.route(/whatsapp-status$/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ connected: false }) })
    );
    await openReport(page, state.ids.reports.approvedPaid);
    await page.getByTestId('send-report').click();
    await expect(page.getByTestId('send-whatsapp-offline')).toBeVisible();
    await page.getByTestId('channel-whatsapp').click();
    await expect(page.getByTestId('send-whatsapp-offline')).toHaveCount(0);
  });
});

test.describe('passwords', () => {
  const NEW_PASSWORD = 'Brand-New-Passw0rd';

  const signInWith = async (page: Page, email: string, password: string) => {
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('login-button').click();
  };

  test('changing your password checks the rules and the current one, then asks you to sign in again', async ({ page }) => {
    const email = state.accounts.agents[0];
    await signInAgent(page);
    await page.getByRole('tab', { name: 'Profile' }).click();
    await page.getByTestId('change-password').click();

    await page.getByTestId('current-password').fill('wrong-current');
    await page.getByTestId('new-password').fill('short');
    await expect(page.getByTestId('new-password-hint')).toHaveText('Use at least 8 characters.');
    await page.getByTestId('new-password').fill(NEW_PASSWORD);
    await page.getByTestId('confirm-password').fill('something else');
    await expect(page.getByTestId('confirm-password-error')).toBeVisible();
    await expect(page.getByTestId('change-password-confirm')).toBeDisabled();
    await page.getByTestId('confirm-password').fill(NEW_PASSWORD);
    await screenshot(page, 'p01-10-change-password');

    await page.getByTestId('change-password-confirm').click();
    await expect(page.getByTestId('change-password-error')).toHaveText('Current password is incorrect');

    await page.getByTestId('current-password').fill(state.password);
    await page.getByTestId('change-password-confirm').click();
    await expect(page.getByTestId('login-notice')).toHaveText('Password changed. Sign in with your new password.');
    await expect(page.getByTestId('login-error')).toHaveCount(0);

    await signInWith(page, email, state.password);
    await expect(page.getByTestId('login-error')).toHaveText('Email or password is incorrect.');
    await signInWith(page, email, NEW_PASSWORD);
    await expect(page.getByTestId('tab-open')).toBeVisible();
  });

  test('an account on a temporary password must set its own before it can use the app', async ({ page, request }, info) => {
    const email = state.accounts.agents[0];
    await dbUpdate(request, info, 'User', { email }, { $set: { must_change_password: true } });
    await loginAs(page, state, email);
    await expect(page.getByTestId('set-password')).toBeVisible();
    await expect(page.getByTestId('tab-open')).toHaveCount(0);
    await screenshot(page, 'p01-11-set-password');

    await page.getByTestId('set-password-input').fill(NEW_PASSWORD);
    await page.getByTestId('set-password-confirm').fill(NEW_PASSWORD);
    await page.getByTestId('set-password-save').click();
    await expect(page.getByTestId('login-notice')).toHaveText('Password set. Sign in with your new password.');

    await signInWith(page, email, NEW_PASSWORD);
    await expect(page.getByTestId('tab-open')).toBeVisible();
    await expect(page.getByTestId('set-password')).toHaveCount(0);
  });

  test('an account without a temporary password is not stopped', async ({ page }) => {
    await signInAgent(page);
    await expect(page.getByTestId('set-password')).toHaveCount(0);
  });
});
