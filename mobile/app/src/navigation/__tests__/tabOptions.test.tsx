import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTabOptions } from '../tabOptions';

const withBottomInset = (bottom: number) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, left: 0, right: 0, bottom } }}>
        {children}
      </SafeAreaProvider>
    );
  };

describe('tab bar height', () => {
  it.each([
    ['no system navigation bar', 0],
    ['gesture navigation', 16],
    ['3-button navigation', 48],
  ])('sits above the phone bar with %s', async (_label, bottom) => {
    const { result } = await renderHook(() => useTabOptions(), { wrapper: withBottomInset(bottom) });
    expect(result.current.tabBarStyle.paddingBottom).toBe(bottom + 8);
    expect(result.current.tabBarStyle.height).toBe(66 + bottom);
  });
});
