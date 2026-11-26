import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { sessionStore } from '../sessionStore';
import { UpdateRequiredGate } from '../UpdateRequiredGate';

jest.mock('lucide-react-native', () => ({ CircleArrowUp: () => null })); // the package ships untransformed ESM
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- a mock factory cannot use top-level imports
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('~/api/auth', () => ({ loginRequest: jest.fn(), refreshRequest: jest.fn(), logoutRequest: jest.fn() }));

jest.setTimeout(20_000); // the first render loads the whole component tree

// One test file shares one session store, so the order matters: the flag lasts until the app restarts.
describe('UpdateRequiredGate', () => {
  it('shows the app while the server accepts this version', async () => {
    await render(
      <UpdateRequiredGate>
        <Text testID="app">app content</Text>
      </UpdateRequiredGate>
    );
    expect(screen.getByTestId('app')).toBeTruthy();
    expect(screen.queryByTestId('update-required')).toBeNull();
  });

  it('replaces the whole app with a blocking update screen as soon as the API answers 426', async () => {
    await render(
      <UpdateRequiredGate>
        <Text testID="app">app content</Text>
      </UpdateRequiredGate>
    );

    await act(async () => {
      sessionStore.flagUpdateRequired();
    });

    expect(screen.getByTestId('update-required')).toBeTruthy();
    expect(screen.getByText('Update the app to keep using it')).toBeTruthy();
    expect(screen.getByText(/Installed version 1\.0\.0/)).toBeTruthy();
    // Nothing underneath stays mounted, so it cannot be used or interacted with.
    expect(screen.queryByTestId('app')).toBeNull();
  });
});
