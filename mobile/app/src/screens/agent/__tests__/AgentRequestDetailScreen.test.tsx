import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { Linking, ScrollView } from 'react-native';
import { claimRequest, getRequest, listDocuments, type AgentRequest } from '~/api/agentRequests';
import AgentRequestDetailScreen from '../AgentRequestDetailScreen';

jest.mock('~/api/agentRequests', () => ({
  ...jest.requireActual('~/api/agentRequests'),
  getRequest: jest.fn(),
  listDocuments: jest.fn(),
  claimRequest: jest.fn(),
  releaseRequest: jest.fn(),
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null })); // the package ships untransformed ESM
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('~/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: { id: 'me', name: 'Anita', email: 'anita@e2e.test', role: 'customer_service' } }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
// The sheet belongs to another task. Here only whether the screen hands it a report matters.
jest.mock('~/components/SendReportSheet', () => ({ SendReportSheet: () => null }));
// The real dialog needs native portals and reanimated; the release dialog is covered end to end in the e2e spec.
jest.mock('~/components/ui/alert-dialog', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  return {
    AlertDialog: Passthrough,
    AlertDialogAction: Passthrough,
    AlertDialogCancel: Passthrough,
    AlertDialogContent: () => null,
    AlertDialogDescription: Passthrough,
    AlertDialogFooter: Passthrough,
    AlertDialogHeader: Passthrough,
    AlertDialogTitle: Passthrough,
    React,
  };
});

const mockGet = getRequest as jest.Mock;
const mockDocs = listDocuments as jest.Mock;
const mockClaim = claimRequest as jest.Mock;

const httpError = (status: number, error: string) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { success: false, error },
    statusText: '',
    headers: {},
    config: {} as never,
  });

const base: AgentRequest = {
  _id: 'r1',
  status: 'open',
  workflow: { key: 'pending', label: 'Pending' },
  createdAt: '2026-10-01T00:00:00Z',
  formId: { name: 'AP MSME DPR' },
  submittedData: { scheme: 'PMEGP' },
  customerId: { _id: 'c1', name: 'Ravi Traders', phone: '9800000011', email: 'ravi@example.com' },
};
const generated: AgentRequest = {
  ...base,
  status: 'completed',
  claimedBy: { _id: 'me' },
  workflow: { key: 'generated', label: 'DPR Generated successfully' },
  reportId: { _id: 'rep1', validation_status: 'approved', payment: { status: 'completed' } },
};

async function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const route = { key: 'AgentRequestDetail', name: 'AgentRequestDetail', params: { requestId: 'r1' } } as const;
  await render(<AgentRequestDetailScreen navigation={navigation as never} route={route as never} />, { wrapper });
  return { navigation };
}

// react-native loads ScrollView on first access, which takes 0.5-1 s here. Without this, that load lands inside
// the first findBy (1 s limit) that shows a loaded request, and times out on a busy machine.
beforeAll(() => {
  expect(ScrollView).toBeDefined();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDocs.mockResolvedValue({ documents: [{ id: 'd1', fileName: 'aadhaar.pdf' }], canMutate: true, maxFiles: 10, maxFileBytes: 5242880 });
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
});

describe('AgentRequestDetailScreen', () => {
  it('shows only the access message, with no applicant data or actions, when the API refuses', async () => {
    mockGet.mockRejectedValue(httpError(403, 'You do not have access to this request'));
    await renderScreen();
    expect(await screen.findByTestId('access-denied-message')).toHaveTextContent("You don't have access to this request.");
    for (const id of ['applicant-name', 'call-button', 'claim-button', 'open-documents', 'open-messages', 'send-to-applicant']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
    expect(mockDocs).not.toHaveBeenCalled();
  });

  it('treats a missing request the same as someone else one', async () => {
    mockGet.mockRejectedValue(httpError(404, 'Request not found'));
    await renderScreen();
    expect(await screen.findByTestId('access-denied')).toBeTruthy();
  });

  it('shows a real failure as a retryable error, not as an access problem', async () => {
    mockGet.mockRejectedValue(httpError(500, 'boom'));
    await renderScreen();
    expect(await screen.findByTestId('error-state')).toBeTruthy();
    expect(screen.queryByTestId('access-denied')).toBeNull();
  });

  it('offers Claim, Call and WhatsApp on an open request, and no Send or Release', async () => {
    mockGet.mockResolvedValue(base);
    await renderScreen();
    expect(await screen.findByTestId('claim-button')).toBeTruthy();
    expect(screen.getByTestId('applicant-name')).toHaveTextContent('Ravi Traders');
    expect(screen.getByTestId('web-note')).toHaveTextContent('Reports are created on the web.');
    await waitFor(() => expect(screen.getByTestId('open-documents-detail')).toHaveTextContent('1'));
    expect(screen.queryByTestId('send-to-applicant')).toBeNull();
    expect(screen.queryByTestId('release-button')).toBeNull();

    await fireEvent.press(screen.getByTestId('call-button'));
    expect(Linking.openURL).toHaveBeenLastCalledWith('tel:9800000011');
    await fireEvent.press(screen.getByTestId('whatsapp-button'));
    expect(Linking.openURL).toHaveBeenLastCalledWith('https://wa.me/919800000011');
  });

  it('shows Send to applicant and the PDF only for a generated request with an approved report', async () => {
    mockGet.mockResolvedValue(generated);
    await renderScreen();
    expect(await screen.findByTestId('send-to-applicant')).toBeTruthy();
    expect(screen.getByTestId('view-report-pdf')).toBeTruthy();
    expect(screen.queryByTestId('claim-button')).toBeNull();
  });

  it('hides Send to applicant while the report is still with the CA', async () => {
    mockGet.mockResolvedValue({
      ...generated,
      workflow: { key: 'ca_validation', label: 'DPR sent for CA validation' },
      reportId: { _id: 'rep1', validation_status: 'pending_validation' },
    });
    await renderScreen();
    await screen.findByTestId('applicant-name');
    expect(screen.queryByTestId('send-to-applicant')).toBeNull();
    expect(screen.queryByTestId('view-report-pdf')).toBeNull();
  });

  it('says another agent got there first when Claim loses the race, and hides the button', async () => {
    mockGet.mockResolvedValue(base);
    mockClaim.mockRejectedValue(httpError(400, 'This request is not open for claiming'));
    await renderScreen();
    await fireEvent.press(await screen.findByTestId('claim-button'));
    expect(await screen.findByTestId('claim-error')).toHaveTextContent('Another agent claimed this request.');
    expect(screen.queryByTestId('claim-button')).toBeNull();
    // The explanation stays: reloading the request now would swap it for the access message.
    expect(screen.queryByTestId('access-denied')).toBeNull();
  });

  it('keeps the Claim button for a failure that is not a lost race, with the server message', async () => {
    mockGet.mockResolvedValue(base);
    mockClaim.mockRejectedValue(httpError(404, 'Request not found'));
    await renderScreen();
    await fireEvent.press(await screen.findByTestId('claim-button'));
    expect(await screen.findByTestId('claim-error')).toHaveTextContent('Request not found');
  });

  it('explains why Release is missing for a request the CA assigned', async () => {
    mockGet.mockResolvedValue({
      ...base,
      status: 'assigned',
      assignedTo: { _id: 'me' },
      claimedAt: new Date().toISOString(),
      workflow: { key: 'initiated', label: 'Request initiated' },
    });
    await renderScreen();
    expect(await screen.findByTestId('release-hint')).toHaveTextContent(/^The CA assigned this request to you./);
    expect(screen.queryByTestId('release-button')).toBeNull();
    expect(screen.getByTestId('claim-countdown')).toHaveTextContent(/^Claim expires in \d+ min$/);
  });
});
