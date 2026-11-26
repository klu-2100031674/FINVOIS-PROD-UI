import { render, screen } from '@testing-library/react-native';
import App from '../../App';

// Smoke test: the root component boots, restores "no session" from an empty secure-store and lands on sign-in.
jest.mock('../../global.css', () => ({})); // Tailwind source, only Metro compiles it
jest.mock('~/auth/storage', () => ({
  getSecure: async () => null,
  setSecure: async () => undefined,
  deleteSecure: async () => undefined,
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] })); // font files are not needed to render
// lucide-react-native ships untransformed ESM: any icon becomes an empty component.
jest.mock('lucide-react-native', () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name as never] : () => null) }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
// reanimated needs its native worklets runtime; entering/exiting animations are irrelevant to this test.
jest.mock('react-native-reanimated', () => {
  const chain: unknown = new Proxy(() => chain, { get: () => chain });
  return {
    __esModule: true,
    default: { View: 'View', createAnimatedComponent: (component: unknown) => component },
    FadeIn: chain,
    FadeOut: chain,
    ReduceMotion: { System: 'system' },
  };
});
jest.mock('expo-notifications', () => ({})); // native push module; nothing here registers for push
jest.mock('~/notifications/NotificationBootstrap', () => ({ NotificationBootstrap: () => null })); // native push setup

jest.setTimeout(30_000); // the first render loads every screen

describe('App', () => {
  it('shows the sign-in screen when there is no stored session', async () => {
    await render(<App />);
    expect(await screen.findByText('Admin and support staff only')).toBeTruthy();
    expect(screen.getByTestId('login-button')).toBeTruthy();
    expect(screen.queryByTestId('update-required')).toBeNull();
  });
});
