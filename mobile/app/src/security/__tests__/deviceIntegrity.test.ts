import { act, renderHook } from '@testing-library/react-native';
import { SEND_BLOCKED_MESSAGE, getIntegrityHeader, integrityHeader, isSuspect, sendBlockReason } from '../deviceIntegrity';

type Integrity = typeof import('../deviceIntegrity');

/** Loads a fresh copy of the module with the probe answering as given. React stays the renderer's own copy. */
function loadWithProbe(probe: { compromised: boolean; debugger: boolean }): Integrity {
  const react = jest.requireActual('react');
  let mod: Integrity | undefined;
  jest.isolateModules(() => {
    jest.doMock('react', () => react);
    jest.doMock('../deviceProbe', () => ({
      isCompromisedNow: () => probe.compromised,
      isDebuggerAttached: async () => probe.debugger,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous require
    mod = require('../deviceIntegrity') as Integrity;
  });
  return mod as Integrity;
}

describe('integrity gating', () => {
  it('sends the header only for a suspect device', () => {
    expect(integrityHeader(true)).toEqual({ 'X-Device-Integrity': 'suspect' });
    expect(integrityHeader(false)).toEqual({});
  });

  it('blocks sending (and only sending) with a message for a suspect device', () => {
    expect(sendBlockReason(true)).toBe(SEND_BLOCKED_MESSAGE);
    expect(sendBlockReason(false)).toBeNull();
    expect(SEND_BLOCKED_MESSAGE).not.toMatch(/!|\p{Extended_Pictographic}/u);
  });

  it('treats a device without the detection module as clean instead of crashing', () => {
    // jest has no JailMonkey native module; the probe must swallow that.
    expect(isSuspect()).toBe(false);
    expect(getIntegrityHeader()).toEqual({});
  });
});

describe('a suspect device', () => {
  it('is reported suspect, adds the header and blocks sending', async () => {
    const m = loadWithProbe({ compromised: true, debugger: false });
    expect(m.isSuspect()).toBe(true);
    expect(m.getIntegrityHeader()).toEqual({ 'X-Device-Integrity': 'suspect' });
    const { result } = await renderHook(() => m.useSendBlockedByIntegrity());
    expect(result.current).toEqual({ blocked: true, message: SEND_BLOCKED_MESSAGE });
  });

  it('a clean device is never blocked', async () => {
    const m = loadWithProbe({ compromised: false, debugger: false });
    const { result } = await renderHook(() => m.useSendBlockedByIntegrity());
    expect(result.current).toEqual({ blocked: false, message: null });
    expect(m.getIntegrityHeader()).toEqual({});
  });

  it('a debugger found after launch flips a clean device to suspect and tells mounted screens', async () => {
    const m = loadWithProbe({ compromised: false, debugger: true });
    const { result } = await renderHook(() => m.useSendBlockedByIntegrity());
    await act(async () => {
      await Promise.resolve(); // let the async probe settle
    });
    expect(m.isSuspect()).toBe(true);
    expect(result.current.blocked).toBe(true);
    expect(m.getIntegrityHeader()).toEqual({ 'X-Device-Integrity': 'suspect' });
  });
});
