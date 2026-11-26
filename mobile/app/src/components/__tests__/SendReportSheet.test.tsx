import type { ComponentProps } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { sendReport, type SendResult } from '~/api/send';
import { SendReportSheet } from '../SendReportSheet';

// The first render loads the whole component library, which can take longer than 5 s on a busy machine.
jest.setTimeout(30000);
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null })); // the package ships untransformed ESM
jest.mock('~/api/send', () => ({ ...jest.requireActual('~/api/send'), sendReport: jest.fn() }));
// The admin's sheet asks about the WhatsApp gateway when it opens. Unmocked, that is a real request from a unit test.
jest.mock('~/api/adminReports', () => ({ whatsappConnected: jest.fn().mockResolvedValue(true) }));

const integrity = { blocked: false, message: null as string | null };
jest.mock('~/security/deviceIntegrity', () => ({ useSendBlockedByIntegrity: () => integrity }));

const mockSend = sendReport as jest.Mock;

const ok = (recipient: SendResult['recipient'], channel: SendResult['channel']): SendResult => ({ recipient, channel, status: 'sent' });
const bad = (recipient: SendResult['recipient'], channel: SendResult['channel'], reason = 'WhatsApp delivery failed.'): SendResult => ({
  recipient,
  channel,
  status: 'failed',
  reason,
});

const httpError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never });

const APPLICANT = { name: 'Applicant 4', phone: '9800000013', email: 'applicant4@e2e.test' };

async function renderSheet(props: Partial<ComponentProps<typeof SendReportSheet>> = {}) {
  const onClose = jest.fn();
  const onSent = jest.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  await render(
    <QueryClientProvider client={client}>
      <SendReportSheet visible onClose={onClose} onSent={onSent} reportId="rep1" role="admin" hasStaff applicant={APPLICANT} {...props} />
    </QueryClientProvider>
  );
  return { onClose, onSent };
}

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

beforeEach(() => {
  mockSend.mockReset();
  integrity.blocked = false;
  integrity.message = null;
});

describe('default selection', () => {
  it('admin starts with me and the assigned staff, both channels, applicant off', async () => {
    await renderSheet();
    expect(screen.getByTestId('recipient-me')).toBeChecked();
    expect(screen.getByTestId('recipient-staff')).toBeChecked();
    expect(screen.getByTestId('recipient-applicant')).not.toBeChecked();
    expect(screen.getByTestId('channel-whatsapp')).toBeChecked();
    expect(screen.getByTestId('channel-email')).toBeChecked();
    expect(screen.queryByTestId('send-applicant-contact')).toBeNull();

    mockSend.mockResolvedValue({ results: [ok('me', 'email')] });
    await press('send-confirm');
    expect(mockSend).toHaveBeenCalledWith('rep1', { recipients: ['me', 'staff'], channels: ['whatsapp', 'email'] });
    await screen.findByTestId('send-results');
  });

  it('admin with nobody assigned gets a disabled staff row that says why, and it is not sent', async () => {
    await renderSheet({ hasStaff: false });
    expect(screen.getByTestId('recipient-staff')).toBeDisabled();
    expect(screen.getByTestId('recipient-staff')).not.toBeChecked();
    expect(screen.getByTestId('recipient-staff-note')).toHaveTextContent('No staff member is assigned to this request yet.');
    mockSend.mockResolvedValue({ results: [ok('me', 'email')] });
    await press('send-confirm');
    expect(mockSend).toHaveBeenCalledWith('rep1', { recipients: ['me'], channels: ['whatsapp', 'email'] });
    await screen.findByTestId('send-results');
  });

  it('agent starts with the applicant, whose contact is prefilled and sent as shown', async () => {
    await renderSheet({ role: 'customer_service' });
    expect(screen.getByTestId('recipient-applicant')).toBeChecked();
    expect(screen.getByTestId('recipient-me')).not.toBeChecked();
    expect(screen.getByTestId('send-applicant-phone').props.value).toBe(APPLICANT.phone);
    expect(screen.getByTestId('send-applicant-email').props.value).toBe(APPLICANT.email);

    mockSend.mockResolvedValue({ results: [ok('me', 'email')] });
    await fireEvent.changeText(screen.getByTestId('send-applicant-phone'), '+91 98000 00099');
    await press('send-confirm');
    expect(mockSend).toHaveBeenCalledWith('rep1', {
      recipients: ['applicant'],
      channels: ['whatsapp', 'email'],
      applicant: { phone: '+919800000099', email: APPLICANT.email },
    });
    await screen.findByTestId('send-results');
  });
});

describe('validation', () => {
  it('blocks Send for a malformed applicant phone and shows why', async () => {
    await renderSheet({ role: 'customer_service' });
    await fireEvent.changeText(screen.getByTestId('send-applicant-phone'), '12345');
    expect(screen.getByTestId('send-applicant-phone-error')).toHaveTextContent(/10-digit/);
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
    await press('send-confirm');
    expect(mockSend).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('send-applicant-phone'), '9876543210');
    expect(screen.queryByTestId('send-applicant-phone-error')).toBeNull();
    expect(screen.getByTestId('send-confirm')).toBeEnabled();
  });

  it('blocks Send for a malformed or empty applicant email', async () => {
    await renderSheet({ role: 'customer_service' });
    await fireEvent.changeText(screen.getByTestId('send-applicant-email'), 'not-an-email');
    expect(screen.getByTestId('send-applicant-email-error')).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('send-applicant-email'), '');
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
  });

  it('only checks the contact for a channel that is on', async () => {
    await renderSheet({ role: 'customer_service', applicant: { ...APPLICANT, phone: 'n/a' } });
    expect(screen.getByTestId('send-confirm')).toBeDisabled(); // WhatsApp is on and the phone is not usable
    await press('channel-whatsapp');
    expect(screen.queryByTestId('send-applicant-phone')).toBeNull();
    expect(screen.getByTestId('send-confirm')).toBeEnabled();
    mockSend.mockResolvedValue({ results: [ok('me', 'email')] });
    await press('send-confirm');
    expect(mockSend).toHaveBeenCalledWith('rep1', { recipients: ['applicant'], channels: ['email'], applicant: { email: APPLICANT.email } });
    await screen.findByTestId('send-results');
  });

  it('needs at least one recipient and one channel', async () => {
    await renderSheet();
    await press('recipient-me');
    await press('recipient-staff');
    expect(screen.getByTestId('send-hint')).toHaveTextContent('Choose at least one recipient and one channel.');
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
    await press('recipient-me');
    expect(screen.queryByTestId('send-hint')).toBeNull();
    await press('channel-whatsapp');
    await press('channel-email');
    expect(screen.getByTestId('send-hint')).toBeTruthy();
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
  });
});

describe('sending', () => {
  it('disables everything while pending and sends once however often Send is pressed', async () => {
    let finish: (v: { results: SendResult[] }) => void = () => undefined;
    mockSend.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { onClose } = await renderSheet();

    await press('send-confirm');
    await press('send-confirm');
    await press('send-confirm');
    expect(mockSend).toHaveBeenCalledTimes(1);
    // The pending state reaches the screen on the next tick; the single send above must not depend on it.
    await waitFor(() => expect(screen.getByTestId('send-confirm')).toBeDisabled());
    expect(screen.getByTestId('send-cancel')).toBeDisabled();
    expect(screen.getByTestId('channel-email')).toBeDisabled();
    expect(screen.getByTestId('recipient-me')).toBeDisabled();
    await press('send-sheet-backdrop');
    expect(onClose).not.toHaveBeenCalled();

    finish({ results: [ok('me', 'whatsapp')] });
    await screen.findByTestId('send-results');
  });

  it('shows the server message and keeps the form when the whole request is refused', async () => {
    mockSend.mockRejectedValue(httpError(402, { success: false, error: 'Payment must be completed before the report can be sent.', error_code: 'PAYMENT_REQUIRED' }));
    await renderSheet({ role: 'customer_service' });
    await press('send-confirm');
    expect(await screen.findByTestId('send-sheet-error')).toHaveTextContent('Payment must be completed before the report can be sent.');
    // No bypass: the form is still the only thing offered, and a retry just asks the server again.
    expect(screen.queryByTestId('send-results')).toBeNull();
    expect(screen.queryByTestId('retry-failed')).toBeNull();
    expect(screen.getByTestId('send-confirm')).toBeEnabled();
  });

  it.each([
    [400, 'Report must be approved before it can be sent.'],
    [403, 'You can only send reports for requests assigned to you.'],
    [429, 'Too many requests. Wait a minute and try again.'],
  ])('shows the server message for %i', async (status, error) => {
    mockSend.mockRejectedValue(httpError(status, { success: false, error }));
    await renderSheet();
    await press('send-confirm');
    expect(await screen.findByTestId('send-sheet-error')).toHaveTextContent(error);
  });

  it('lists a total failure (502) per recipient and channel, with the retry offered', async () => {
    mockSend.mockResolvedValue({ results: [bad('me', 'whatsapp'), bad('me', 'email', 'Email delivery failed.')], message: 'The report could not be delivered.' });
    await renderSheet({ hasStaff: false });
    await press('send-confirm');
    expect(await screen.findByTestId('send-summary')).toHaveTextContent('Nothing was delivered.');
    expect(screen.getByTestId('send-sheet-error')).toHaveTextContent('The report could not be delivered.');
    expect(screen.getByTestId('retry-failed')).toBeTruthy();
  });

  it('is blocked, with an explanation, on a device that looks compromised', async () => {
    integrity.blocked = true;
    integrity.message = "This device looks rooted or jailbroken, so reports can't be sent from it.";
    await renderSheet();
    expect(screen.getByTestId('send-integrity-block')).toHaveTextContent(/rooted or jailbroken/);
    expect(screen.getByTestId('send-confirm')).toBeDisabled();
    await press('send-confirm');
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('results and retry', () => {
  const partial = [ok('me', 'whatsapp'), bad('me', 'email', 'Email delivery failed.'), ok('staff', 'whatsapp'), bad('staff', 'email', 'Email delivery failed.')];

  it('lists every pair with Delivered or Failed and the reason', async () => {
    mockSend.mockResolvedValue({ results: partial });
    await renderSheet();
    await press('send-confirm');
    expect(await screen.findByTestId('send-summary')).toHaveTextContent('Delivered 2 of 4. 2 failed.');
    expect(screen.getByTestId('result-status-me-whatsapp')).toHaveTextContent('Delivered');
    expect(screen.getByTestId('result-status-me-email')).toHaveTextContent('Failed: Email delivery failed.');
    expect(screen.getByTestId('result-status-staff-whatsapp')).toHaveTextContent('Delivered');
    expect(screen.getByTestId('retry-failed')).toHaveTextContent('Retry failed (2)');
  });

  it('retry resends only the failed pairs and merges the answer into the list', async () => {
    mockSend.mockResolvedValueOnce({ results: partial });
    await renderSheet();
    await press('send-confirm');
    await screen.findByTestId('retry-failed');

    mockSend.mockResolvedValueOnce({ results: [ok('me', 'email'), bad('staff', 'email', 'Email delivery failed.')] });
    await press('retry-failed');
    await waitFor(() => expect(screen.getByTestId('result-status-me-email')).toHaveTextContent('Delivered'));
    expect(mockSend).toHaveBeenLastCalledWith('rep1', { recipients: ['me', 'staff'], channels: ['email'] });
    expect(screen.getByTestId('result-status-staff-email')).toHaveTextContent(/^Failed/);
    expect(screen.getByTestId('result-status-me-whatsapp')).toHaveTextContent('Delivered');
    expect(screen.getByTestId('retry-failed')).toHaveTextContent('Retry failed (1)');

    mockSend.mockResolvedValueOnce({ results: [ok('staff', 'email')] });
    await press('retry-failed');
    await waitFor(() => expect(screen.queryByTestId('retry-failed')).toBeNull());
    expect(mockSend).toHaveBeenLastCalledWith('rep1', { recipients: ['staff'], channels: ['email'] });
    expect(screen.getByTestId('send-summary')).toHaveTextContent('Delivered 4 of 4.');
  });

  it('retries an applicant failure with the contact that was shown', async () => {
    mockSend.mockResolvedValueOnce({ results: [ok('applicant', 'whatsapp'), bad('applicant', 'email', 'Email delivery failed.')] });
    await renderSheet({ role: 'customer_service' });
    await press('send-confirm');
    await screen.findByTestId('retry-failed');
    mockSend.mockResolvedValueOnce({ results: [ok('applicant', 'email')] });
    await press('retry-failed');
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(2));
    expect(mockSend).toHaveBeenLastCalledWith('rep1', { recipients: ['applicant'], channels: ['email'], applicant: { email: APPLICANT.email } });
  });

  it('keeps the list and shows the message when the retry itself is refused', async () => {
    mockSend.mockResolvedValueOnce({ results: partial });
    await renderSheet();
    await press('send-confirm');
    await screen.findByTestId('retry-failed');
    mockSend.mockRejectedValueOnce(httpError(429, { success: false, error: 'Too many requests. Wait a minute and try again.' }));
    await press('retry-failed');
    expect(await screen.findByTestId('send-sheet-error')).toHaveTextContent(/Too many requests/);
    expect(screen.getByTestId('result-status-me-email')).toHaveTextContent(/^Failed/);
    expect(screen.getByTestId('retry-failed')).toBeEnabled();
  });

  it('Done closes the sheet and tells the caller something was delivered', async () => {
    mockSend.mockResolvedValue({ results: [ok('me', 'whatsapp')] });
    const { onClose, onSent } = await renderSheet({ hasStaff: false });
    await press('send-confirm');
    await screen.findByTestId('send-done');
    expect(screen.queryByTestId('retry-failed')).toBeNull();
    await press('send-done');
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('the Android back button follows the same rules: blocked mid-send, reports a delivery afterwards', async () => {
    let finish: (v: { results: SendResult[] }) => void = () => undefined;
    mockSend.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { onClose, onSent } = await renderSheet({ hasStaff: false });
    const back = () => fireEvent(screen.getByTestId('send-sheet'), 'requestClose'); // the Modal's onRequestClose
    await press('send-confirm');
    await back();
    expect(onClose).not.toHaveBeenCalled();
    finish({ results: [ok('me', 'whatsapp')] });
    await screen.findByTestId('send-results');
    await back();
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not report a send when nothing was delivered, and Cancel just closes', async () => {
    mockSend.mockResolvedValue({ results: [bad('me', 'whatsapp')], message: 'The report could not be delivered.' });
    const { onClose, onSent } = await renderSheet({ hasStaff: false });
    await press('send-confirm');
    await screen.findByTestId('send-done');
    await press('send-done');
    expect(onSent).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
