import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { apiBase, apiCall, apiLogin, dbUpdate, loginAs, resetDb, screenshot, type E2eState } from './real';

// Email automation against the real API on an in-memory MongoDB. The test server blocks every outbound connection and
// never starts the sending job, so nothing here can reach a real mailbox. Cloud storage is the one thing it can't do, so
// attachment uploads are mocked.
let state: E2eState;

// parseExcel sniffs the content, and CSV keeps this readable. The emulator run covers a real .xlsx.
const SHEET = [
  'Email,Bank name,Region,Branch',
  'one@bank.test,Andhra Bank,South,Kakinada',
  'two@bank.test,Andhra Bank,South,Vizag',
  'not-an-email,Andhra Bank,South,Guntur',
  'one@bank.test,Andhra Bank,South,Kakinada',
].join('\n');

test.beforeEach(async ({ request }, info) => {
  state = await resetDb(request, info);
});

async function openEmail(page: Page) {
  await loginAs(page, state, state.accounts.admin);
  await page.getByRole('tab', { name: 'Email', exact: true }).click();
  await expect(page.getByTestId('email-list')).toBeVisible();
}

async function arrange(request: APIRequestContext, info: TestInfo) {
  const { accessToken } = await apiLogin(request, info, state.accounts.admin, state.password);
  const call = async (method: 'get' | 'post' | 'put' | 'delete', path: string, data?: unknown) => {
    const res = await apiCall(request, info, accessToken, method, `/email-automation${path}`, data);
    expect(res.status).toBeLessThan(300);
    return res.body.data;
  };
  const upload = async (folderId: string, csv = SHEET) => {
    const res = await request.post(`${apiBase(info)}/api/email-automation/folders/${folderId}/upload`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      multipart: {
        file: { name: 'list.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(csv) },
        mapping: JSON.stringify({ email: 'Email', bank: 'Bank name', region: 'Region', extra: 'Branch' }),
      },
    });
    expect(res.ok()).toBeTruthy();
  };
  return { call, upload };
}

async function seedFolderAndTemplate(request: APIRequestContext, info: TestInfo) {
  const { call, upload } = await arrange(request, info);
  const folder = await call('post', '/folders', { name: 'Andhra Bank' });
  await upload(folder._id);
  const template = await call('post', '/templates', { name: 'Intro', subject: 'Hello {{bank}}', body: 'Dear {{Branch}},\nWelcome' });
  return { call, upload, folder, template };
}

/** A request as it looks after a finished send, without any sending. */
async function finishedRequest(request: APIRequestContext, info: TestInfo, seed: Awaited<ReturnType<typeof seedFolderAndTemplate>>) {
  const scheduled = await seed.call('post', '/schedules', { folderIds: [seed.folder._id], templateId: seed.template._id, scheduledAt: new Date().toISOString() });
  await dbUpdate(request, info, 'EmailRequest', { _id: scheduled._id }, { $set: { status: 'completed', completed_at: new Date().toISOString() } });
  await dbUpdate(request, info, 'EmailRecipient', { request: scheduled._id, email: 'one@bank.test' }, { $set: { status: 'sent', sent_at: new Date().toISOString() } });
  await dbUpdate(request, info, 'EmailRecipient', { request: scheduled._id, email: 'two@bank.test' }, { $set: { status: 'failed', error: 'Mailbox not found' } });
  return scheduled._id as string;
}

test.describe('email data', () => {
  test('a folder is created, filled from Excel, searched and emptied', async ({ page }) => {
    await openEmail(page);
    await page.getByTestId('email-tab-data').click();
    await expect(page.getByTestId('empty-state')).toContainText('No folders yet');

    await page.getByTestId('folder-name').fill('Andhra Bank');
    await page.getByTestId('create-folder').click();
    await expect(page.getByTestId('folder-screen')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('No emails yet');

    await expect(page.getByTestId('upload-excel')).toBeDisabled();
    await page.getByTestId('mapping-toggle').click();
    await page.getByTestId('mapping-extra').fill('Branch');
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('choose-excel').click();
    await (await chooser).setFiles({ name: 'list.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(SHEET) });
    await expect(page.getByTestId('chosen-excel')).toHaveText('list.xlsx');
    await page.getByTestId('upload-excel').click();

    // One valid pair; the bad address and the repeat are skipped.
    await expect(page.getByTestId('upload-summary')).toContainText('list.xlsx: 2 added, 0 updated, 2 skipped');
    await expect(page.getByTestId('contacts-total')).toHaveText('2 emails');
    await expect(page.getByText('Branch: Kakinada')).toBeVisible();
    await screenshot(page, 'p02-01-folder');

    await page.getByTestId('contact-search').fill('two@');
    await expect(page.getByTestId('contacts-total')).toHaveText('1 email');
    await page.getByTestId('contact-search').fill('');
    await expect(page.getByTestId('contacts-total')).toHaveText('2 emails');

    await page.locator('[data-testid^="contact-remove-"]').first().click();
    await expect(page.getByTestId('remove-contact-dialog')).toContainText('one@bank.test');
    await page.getByTestId('remove-contact-dialog-confirm').click();
    await expect(page.getByTestId('contacts-total')).toHaveText('1 email');

    await page.getByTestId('delete-folder').click();
    await expect(page.getByTestId('delete-folder-dialog')).toContainText('Andhra Bank and its 1 emails');
    await page.getByTestId('delete-folder-dialog-confirm').click();
    await expect(page.getByTestId('empty-state')).toContainText('No folders yet');
  });

  test('a duplicate folder name and an unreadable column show the server message', async ({ page, request }, info) => {
    const { folder } = await seedFolderAndTemplate(request, info);
    await openEmail(page);
    await page.getByTestId('email-tab-data').click();
    await page.getByTestId('folder-name').fill('Andhra Bank');
    await page.getByTestId('create-folder').click();
    await expect(page.getByTestId('create-folder-error')).toContainText('A folder with this name already exists');

    await page.getByTestId(`email-folder-${folder._id}`).click();
    await page.getByTestId('mapping-toggle').click();
    await page.getByTestId('mapping-email').fill('Wrong column');
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('choose-excel').click();
    await (await chooser).setFiles({ name: 'other.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('Name,Phone\nA,1') });
    await page.getByTestId('upload-excel').click();
    await expect(page.getByTestId('folder-problem')).toBeVisible();
    await expect(page.getByTestId('contacts-total')).toHaveText('2 emails');
  });
});

test.describe('templates', () => {
  test('a template is created with placeholders, edited and deleted', async ({ page }) => {
    await openEmail(page);
    await page.getByTestId('email-tab-templates').click();
    await expect(page.getByTestId('empty-state')).toContainText('No templates yet');

    await page.getByTestId('new-template').click();
    await expect(page.getByTestId('template-save')).toBeDisabled();
    await page.getByTestId('template-name').fill('Intro');
    await page.getByTestId('template-subject').fill('Hello ');
    await page.getByTestId('template-subject').click();
    await page.getByTestId('placeholder-bank').click();
    await expect(page.getByTestId('template-subject')).toHaveValue('Hello {{bank}}');
    await page.getByTestId('template-body').fill('Dear team,\nWelcome');
    await page.getByTestId('template-save').click();

    const row = page.locator('[data-testid^="email-template-"]').first();
    await expect(row).toContainText('Hello {{bank}}');
    await row.click();
    await expect(page.getByTestId('template-body')).toHaveValue('Dear team,\nWelcome');
    await page.getByTestId('template-name').fill('Intro two');
    await page.getByTestId('template-save').click();
    await expect(page.locator('[data-testid^="email-template-"]').first()).toContainText('Intro two');

    await page.locator('[data-testid^="email-template-delete-"]').click();
    await expect(page.getByTestId('delete-template-dialog')).toContainText('Intro two');
    await page.getByTestId('delete-template-dialog-confirm').click();
    await expect(page.getByTestId('empty-state')).toContainText('No templates yet');
  });

  test('editing a web-formatted template keeps its formatting unless the admin replaces it', async ({ page, request }, info) => {
    const { call } = await arrange(request, info);
    const html = '<p><strong>Dear</strong> {{bank}}</p>';
    const t = await call('post', '/templates', { name: 'Rich', subject: 'Hi', body: html });
    await openEmail(page);
    await page.getByTestId('email-tab-templates').click();
    await page.getByTestId(`email-template-${t._id}`).click();

    await expect(page.getByTestId('template-formatted-note')).toBeVisible();
    await expect(page.getByTestId('template-body-preview')).toHaveText('Dear {{bank}}');
    await page.getByTestId('template-name').fill('Rich two');
    await page.getByTestId('template-save').click();
    await expect(page.getByTestId(`email-template-${t._id}`)).toContainText('Rich two');
    let [saved] = (await call('get', '/templates')) as { body: string }[];
    expect(saved.body).toBe(html);

    await page.getByTestId(`email-template-${t._id}`).click();
    await page.getByTestId('template-rewrite').click();
    await page.getByTestId('template-body').fill('Plain now');
    await page.getByTestId('template-save').click();
    await expect(page.getByTestId(`email-template-${t._id}`)).toContainText('Plain now');
    [saved] = (await call('get', '/templates')) as { body: string }[];
    expect(saved.body).toBe('Plain now');
  });
});

test.describe('scheduling', () => {
  test('folders, a template and dates become a scheduled request at the chosen India time', async ({ page, request }, info) => {
    const { folder, template, call } = await seedFolderAndTemplate(request, info);
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();

    await expect(page.getByTestId('schedule-submit')).toBeDisabled();
    await expect(page.getByTestId('send-now')).toBeDisabled();

    await page.getByTestId(`pick-folder-${folder._id}`).click();
    await expect(page.getByTestId('selected-summary')).toContainText('1 folder, 2 unique emails');
    await expect(page.getByTestId('selected-total')).toHaveText('2 unique emails');
    await expect(page.getByTestId('selected-one@bank.test')).toContainText('Branch: Kakinada');

    await page.getByTestId('pick-template').click();
    await page.getByTestId(`pick-template-option-${template._id}`).click();
    await expect(page.getByTestId('template-preview-subject')).toHaveText('Subject: Hello {{bank}}');
    await expect(page.getByTestId('template-preview-body')).toContainText('Dear {{Branch}},');

    await page.getByTestId('send-time').click();
    await page.getByTestId('send-time-option-14:30').click();
    await page.getByTestId('schedule-mode-week').click();
    await expect(page.getByTestId('schedule-summary')).toContainText('7 send dates at 2:30 PM IST');
    await page.locator('[data-testid^="skip-date-"]').last().click();
    await expect(page.getByTestId('schedule-summary')).toContainText('6 send dates');
    await screenshot(page, 'p02-02-schedule');

    await page.getByTestId('schedule-submit').click();
    await expect(page.getByTestId('email-notice')).toContainText('Scheduled for 6 dates at 2:30 PM IST');

    const [saved] = (await call('get', '/requests')) as { _id: string; status: string; send_dates: string[]; name: string }[];
    expect(saved.status).toBe('scheduled');
    expect(saved.send_dates).toHaveLength(6);
    // 2:30 PM IST is 09:00 UTC, whatever zone the phone is in.
    for (const d of saved.send_dates) expect(d).toMatch(/T09:00:00\.000Z$/);
    await expect(page.getByTestId(`email-request-status-${saved._id}`)).toHaveText('Scheduled');
    await expect(page.getByTestId('stat-scheduled')).toHaveText('2');
    await screenshot(page, 'p02-03-scheduled');
  });

  test('Send now asks first, and a template with an unknown column is refused', async ({ page, request }, info) => {
    const { folder, call, template } = await seedFolderAndTemplate(request, info);
    const bad = await call('post', '/templates', { name: 'Bad', subject: 'Hi {{Nope}}', body: 'x' });
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();
    await page.getByTestId(`pick-folder-${folder._id}`).click();
    await page.getByTestId('pick-template').click();
    await page.getByTestId(`pick-template-option-${bad._id}`).click();

    await page.getByTestId('schedule-submit').click();
    await expect(page.getByTestId('schedule-error')).toContainText('Template uses columns not found in the selected folders: Nope');

    await page.getByTestId('pick-template').click();
    await page.getByTestId(`pick-template-option-${template._id}`).click();
    await page.getByTestId('send-now').click();
    await expect(page.getByTestId('send-now-dialog')).toContainText('Send to 2 emails now?');
    await page.getByTestId('send-now-dialog-cancel').click();
    expect(await call('get', '/requests')).toHaveLength(0);

    await page.getByTestId('send-now').click();
    await page.getByTestId('send-now-dialog-confirm').click();
    await expect(page.getByTestId('email-notice')).toContainText('Sending starts within about 30 seconds');
    const [saved] = (await call('get', '/requests')) as { status: string; send_dates: string[] }[];
    expect(saved.status).toBe('scheduled');
    expect(saved.send_dates).toHaveLength(1);
  });

  test('a new template made while scheduling comes back selected, with the folder columns offered', async ({ page, request }, info) => {
    const { folder } = await seedFolderAndTemplate(request, info);
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();
    await page.getByTestId(`pick-folder-${folder._id}`).click();
    await page.getByTestId('schedule-new-template').click();

    await page.getByTestId('template-name').fill('Made here');
    await page.getByTestId('template-subject').fill('Subject');
    await page.getByTestId('template-body').fill('Branch: ');
    await page.getByTestId('placeholder-branch').click();
    await expect(page.getByTestId('template-body')).toHaveValue('Branch: {{Branch}}');
    await page.getByTestId('template-save').click();

    await expect(page.getByTestId('pick-template-value')).toHaveText('Made here');
    // The folder choice survived the round trip.
    await expect(page.getByTestId('selected-summary')).toContainText('2 unique emails');
  });

  test('the calendar picks dates and skips the ones already past', async ({ page, request }, info) => {
    const { folder } = await seedFolderAndTemplate(request, info);
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();
    await page.getByTestId(`pick-folder-${folder._id}`).click();

    await page.getByTestId('schedule-mode-pick').click();
    await expect(page.getByTestId('schedule-summary')).toHaveCount(0);
    await expect(page.getByTestId('calendar-prev')).toBeDisabled();
    await page.getByTestId('calendar-next').click();
    const days = page.locator('[data-testid^="calendar-day-"]');
    await days.nth(4).click();
    await days.nth(9).click();
    await expect(page.getByTestId('schedule-summary')).toContainText('2 send dates');
    await days.nth(4).click();
    await expect(page.getByTestId('schedule-summary')).toContainText('1 send date ');
  });
});

test.describe('tracking', () => {
  test('a finished send shows its records, retries failures and is reused for a new send', async ({ page, request }, info) => {
    const seed = await seedFolderAndTemplate(request, info);
    const id = await finishedRequest(request, info, seed);
    await openEmail(page);

    await expect(page.getByTestId(`email-request-counts-${id}`)).toHaveText('2 total · 1 sent · 0 pending · 1 failed');
    await expect(page.getByTestId('stat-sent')).toHaveText('1');
    await expect(page.getByTestId('stat-failed')).toHaveText('1');
    await expect(page.getByTestId('stat-completed')).toHaveText('1');
    await page.getByTestId(`email-request-${id}`).click();

    await expect(page.getByTestId('email-detail-status')).toHaveText('Completed');
    await expect(page.getByTestId('email-detail-template')).toHaveText('Template: Intro');
    await expect(page.getByText('Mailbox not found')).toBeVisible();
    await expect(page.getByText('Bank name: Andhra Bank')).toHaveCount(0); // not repeated under "Bank"
    await expect(page.locator('[data-testid^="recipient-remove-"]')).toHaveCount(0);
    await screenshot(page, 'p02-04-detail');

    await page.getByTestId('email-retry').click();
    await expect(page.getByTestId('retry-dialog')).toContainText('the 1 that failed');
    await page.getByTestId('retry-dialog-confirm').click();
    await expect(page.getByTestId('email-detail-status')).toHaveText('Scheduled');
    await expect(page.getByTestId('email-cancel')).toBeVisible();
    await expect(page.getByTestId('email-retry')).toHaveCount(0);

    // Back to finished, then reuse.
    await dbUpdate(request, info, 'EmailRequest', { _id: id }, { $set: { status: 'completed' } });
    await page.reload();
    await page.getByRole('tab', { name: 'Email', exact: true }).click();
    await page.getByTestId(`email-request-${id}`).click();
    await page.getByTestId('email-reuse').click();
    await expect(page.getByTestId('reuse-note')).toBeVisible();
    await expect(page.getByTestId('schedule-form').getByTestId('recipients-panel')).toContainText('one@bank.test');

    await page.getByTestId('discard-request').click();
    await page.getByTestId('discard-dialog-confirm').click();
    await expect(page.getByTestId('email-list')).toBeVisible();
    const left = (await seed.call('get', '/requests')) as { _id: string }[];
    expect(left.map((r) => r._id)).toEqual([id]);
  });

  test('a schedule is cancelled into a draft, a record is removed, then it is continued', async ({ page, request }, info) => {
    const seed = await seedFolderAndTemplate(request, info);
    const made = await seed.call('post', '/schedules', { folderIds: [seed.folder._id], templateId: seed.template._id, scheduledAt: new Date().toISOString() });
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId(`email-request-${made._id}`).click();

    await page.getByTestId('email-cancel').click();
    await expect(page.getByTestId('email-detail-status')).toHaveText('Draft');

    await page.locator('[data-testid^="recipient-remove-"]').first().click();
    await page.getByTestId('remove-recipient-dialog-confirm').click();
    await expect(page.getByTestId('recipients-total')).toHaveText('1 record');

    await page.getByTestId('email-continue').click();
    await expect(page.getByTestId('schedule-form')).toBeVisible();
    await page.getByTestId('pick-template').click();
    await page.getByTestId(`pick-template-option-${seed.template._id}`).click();
    await page.getByTestId('schedule-submit').click();
    await expect(page.getByTestId('email-notice')).toContainText('Scheduled for 1 date');
    await expect(page.getByTestId(`email-request-status-${made._id}`)).toHaveText('Scheduled');
  });

  test('records filter by validation and page through', async ({ page, request }, info) => {
    const seed = await seedFolderAndTemplate(request, info);
    const rows = Array.from({ length: 30 }, (_, i) => `r${String(i).padStart(2, '0')}@bank.test,Andhra Bank,South,B${i}`);
    await seed.upload(seed.folder._id, ['Email,Bank name,Region,Branch', ...rows].join('\n'));
    const made = await seed.call('post', '/schedules', { folderIds: [seed.folder._id], templateId: seed.template._id, scheduledAt: new Date().toISOString() });
    await dbUpdate(request, info, 'EmailRecipient', { request: made._id, email: 'r00@bank.test' }, { $set: { validation: 'invalid', validation_errors: ['Invalid email'] } });

    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId(`email-request-${made._id}`).click();
    await expect(page.getByTestId('recipients-page')).toHaveText('1 / 2');
    await page.getByTestId('recipients-next').click();
    await expect(page.getByTestId('recipients-page')).toHaveText('2 / 2');
    await expect(page.getByTestId('recipients-next')).toBeDisabled();

    await page.getByTestId('recipient-filter-invalid').click();
    await expect(page.getByTestId('recipients-total')).toHaveText('1 record');
    await expect(page.getByText('Invalid email')).toBeVisible();
  });
});

test.describe('limit and attachments', () => {
  test('the daily limit shows and is changed', async ({ page, request }, info) => {
    const { call } = await arrange(request, info);
    await openEmail(page);
    await expect(page.getByTestId('email-quota-text')).toContainText('0 / 50,000 sent');
    await page.getByTestId('change-limit').click();
    await page.getByTestId('limit-input').fill('0');
    await expect(page.getByTestId('limit-save')).toBeDisabled();
    await page.getByTestId('limit-input').fill('2000');
    await page.getByTestId('limit-save').click();
    await expect(page.getByTestId('email-quota-text')).toContainText('0 / 2,000 sent');
    expect((await call('get', '/quota')).limit).toBe(2000);
    await screenshot(page, 'p02-05-email-home');
  });

  test('an extra file is uploaded, counted with the template files, and sent with the schedule', async ({ page, request }, info) => {
    const { folder, template } = await seedFolderAndTemplate(request, info);
    let scheduled: { attachmentIds?: string[] } = {};
    await page.route('**/api/email-automation/attachments', (route) =>
      route.fulfill({ status: 201, json: { success: true, data: { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', filename: 'brochure.pdf', content_type: 'application/pdf', size: 2048 } } })
    );
    await page.route('**/api/email-automation/schedules', (route) => {
      scheduled = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { success: true, data: {} } });
    });

    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();
    await page.getByTestId(`pick-folder-${folder._id}`).click();
    await page.getByTestId('pick-template').click();
    await page.getByTestId(`pick-template-option-${template._id}`).click();

    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('add-attachment').click();
    await (await chooser).setFiles({ name: 'brochure.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
    await expect(page.getByTestId('attachment-name-aaaaaaaaaaaaaaaaaaaaaaaa')).toHaveText('brochure.pdf');
    await expect(page.getByTestId('attachment-totals')).toHaveText('1/10 · 2 KB of 10 MB');

    await page.getByTestId('schedule-submit').click();
    await expect(page.getByTestId('email-notice')).toBeVisible();
    expect(scheduled.attachmentIds).toEqual(['aaaaaaaaaaaaaaaaaaaaaaaa']);
  });

  test('a file that takes the email over 10 MB is refused before uploading', async ({ page, request }, info) => {
    const { folder } = await seedFolderAndTemplate(request, info);
    let uploaded = false;
    await page.route('**/api/email-automation/attachments', (route) => {
      uploaded = true;
      return route.abort();
    });
    await openEmail(page);
    await page.getByTestId('email-tab-schedule').click();
    await page.getByTestId('schedule-new').click();
    await page.getByTestId(`pick-folder-${folder._id}`).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('add-attachment').click();
    await (await chooser).setFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(11 * 1024 * 1024) });
    await expect(page.getByTestId('attachment-problem')).toContainText("huge.pdf doesn't fit");
    expect(uploaded).toBe(false);
  });
});

test('an agent has no Email tab', async ({ page }) => {
  await loginAs(page, state, state.accounts.agents[0]);
  await expect(page.getByTestId('tab-open')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Email', exact: true })).toHaveCount(0);
});
