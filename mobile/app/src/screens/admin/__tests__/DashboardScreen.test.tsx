/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories run before imports, so they must require */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { getStats } from '~/api/adminStats';
import DashboardScreen from '../DashboardScreen';

jest.mock('~/api/adminStats', () => ({ getStats: jest.fn() }));
jest.mock('~/api/reportTypes', () => ({
  getReportTypes: jest.fn().mockResolvedValue([
    { value: 'CC', label: 'CC' },
    { value: 'frcc2', label: 'Format CC2' },
  ]),
}));
jest.mock('lucide-react-native', () => ({ AlertCircle: () => null, RefreshCw: () => null })); // the package ships untransformed ESM
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('~/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: { id: 'u1', name: 'Test CA', email: 'ca@e2e.test', role: 'admin' } }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
// The real Select needs native portals and reanimated; a flat stand-in keeps this test about the screen's logic.
jest.mock('~/components/ui/select', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  const Ctx = React.createContext({ value: { label: '' }, onValueChange: (_o: unknown) => {} });
  return {
    Select: ({ value, onValueChange, children }: { value: unknown; onValueChange: (o: unknown) => void; children: ReactNode }) => (
      <Ctx.Provider value={{ value: value as { label: string }, onValueChange }}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children, testID }: { children: ReactNode; testID?: string }) => <View testID={testID}>{children}</View>,
    SelectValue: () => <Text testID="select-label">{React.useContext(Ctx).value.label}</Text>,
    SelectContent: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    SelectGroup: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    SelectItem: ({ value, label, testID }: { value: string; label: string; testID?: string }) => {
      const ctx = React.useContext(Ctx);
      return (
        <Pressable testID={testID} onPress={() => ctx.onValueChange({ value, label })}>
          <Text>{label}</Text>
        </Pressable>
      );
    },
  };
});

jest.setTimeout(20_000); // the first render loads the whole component tree; slow machines need the room
const mockGetStats = getStats as jest.Mock;
const all = { pending: 12, under_review: 8, approved: 431, rejected: 5, total: 123456, today_pending: 7 };
const cc = { pending: 3, under_review: 2, approved: 90, rejected: 1, total: 96, today_pending: 0 };

async function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const navigate = jest.fn();
  const navigation = { navigate } as never;
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const ui = <DashboardScreen navigation={navigation} route={{ key: 'Dashboard', name: 'Dashboard' }} />;
  await render(ui, { wrapper });
  // Let the report-type list land too, so its re-render does not arrive after the test body (act warning).
  await screen.findByTestId('report-type-CC');
  return { navigate };
}

const value = (key: string) => screen.getByTestId(`stat-${key}-value`);

beforeEach(() => {
  mockGetStats.mockReset();
  mockGetStats.mockImplementation(async ({ reportType }: { reportType?: string } = {}) => (reportType === 'CC' ? cc : all));
});

describe('DashboardScreen', () => {
  it('greets the user and renders the five raw counts, locale formatted', async () => {
    await renderScreen();
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));
    expect(value('under_review')).toHaveTextContent('8');
    expect(value('approved')).toHaveTextContent('431'); // raw, no web offset (D3)
    expect(value('rejected')).toHaveTextContent('5');
    expect(value('total')).toHaveTextContent('1,23,456');
    expect(screen.getByTestId('dashboard-greeting')).toHaveTextContent(/^Good (morning|afternoon|evening), Test CA$/);
    expect(screen.getByTestId('dashboard-updated')).toHaveTextContent(/^Updated \d{2}:\d{2}$/);
    expect(screen.queryByText('7')).toBeNull(); // today_pending stays unused
  });

  it('opens the Reports tab with the status of the tapped card', async () => {
    const { navigate } = await renderScreen();
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));

    await fireEvent.press(screen.getByTestId('stat-pending'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: 'pending_validation', reportType: undefined });
    await fireEvent.press(screen.getByTestId('stat-under_review'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: 'under_review', reportType: undefined });
    await fireEvent.press(screen.getByTestId('stat-approved'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: 'approved', reportType: undefined });
    await fireEvent.press(screen.getByTestId('stat-rejected'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: 'rejected', reportType: undefined });
    await fireEvent.press(screen.getByTestId('stat-total'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: undefined, reportType: undefined });
  });

  it('filters by report type, shows that type\'s numbers, and passes the type on', async () => {
    const { navigate } = await renderScreen();
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));
    expect(screen.getByTestId('select-label')).toHaveTextContent('All types');

    await fireEvent.press(await screen.findByTestId('report-type-CC'));
    await waitFor(() => expect(value('pending')).toHaveTextContent('3'));
    expect(mockGetStats).toHaveBeenLastCalledWith({ reportType: 'CC' });
    expect(value('total')).toHaveTextContent('96');
    expect(screen.getByTestId('select-label')).toHaveTextContent('CC');

    await fireEvent.press(screen.getByTestId('stat-approved'));
    expect(navigate).toHaveBeenLastCalledWith('Reports', { status: 'approved', reportType: 'CC' });

    await fireEvent.press(screen.getByTestId('report-type-__all__'));
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));
    expect(mockGetStats).toHaveBeenLastCalledWith({ reportType: undefined });
  });

  it('shows skeletons, not numbers, before the first response', async () => {
    mockGetStats.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    expect(screen.queryByTestId('stat-pending-value')).toBeNull();
    expect(screen.getByTestId('stat-pending')).toBeTruthy();
  });

  it('keeps the last numbers and offers Retry when a refresh fails', async () => {
    await renderScreen();
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));
    expect(screen.queryByTestId('dashboard-error')).toBeNull();

    mockGetStats.mockRejectedValue(new AxiosError('Network Error'));
    await fireEvent.press(screen.getByTestId('dashboard-refresh'));
    await waitFor(() => expect(screen.getByTestId('dashboard-error')).toBeTruthy());
    expect(screen.getByTestId('dashboard-error')).toHaveTextContent(/You're offline. Check your connection./);
    expect(screen.getByTestId('dashboard-error')).toHaveTextContent(/Showing the numbers from \d{2}:\d{2}/);
    expect(value('pending')).toHaveTextContent('12');
    expect(value('total')).toHaveTextContent('1,23,456');

    mockGetStats.mockResolvedValue({ ...all, pending: 11 });
    await fireEvent.press(screen.getByTestId('dashboard-retry'));
    await waitFor(() => expect(screen.queryByTestId('dashboard-error')).toBeNull());
    expect(value('pending')).toHaveTextContent('11');
  });

  it('shows dashes and the error card, never zeros, when the first load fails', async () => {
    mockGetStats.mockRejectedValue(new Error('boom'));
    await renderScreen();
    await waitFor(() => expect(screen.getByTestId('dashboard-error')).toBeTruthy());
    expect(screen.getByTestId('dashboard-error')).toHaveTextContent(/Couldn't load the numbers. Try again./);
    expect(screen.getByTestId('dashboard-error')).not.toHaveTextContent(/Showing the numbers/);
    expect(value('pending')).toHaveTextContent('–');
  });

  it('pull to refresh refetches the numbers', async () => {
    await renderScreen();
    await waitFor(() => expect(value('pending')).toHaveTextContent('12'));
    mockGetStats.mockResolvedValue({ ...all, pending: 10, approved: 433 });

    const control = screen.getByTestId('dashboard-scroll').props.refreshControl;
    await act(async () => {
      await control.props.onRefresh();
    });
    await waitFor(() => expect(value('approved')).toHaveTextContent('433'));
    expect(value('pending')).toHaveTextContent('10');
  });
});
