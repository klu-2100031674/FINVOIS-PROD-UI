import { useSyncExternalStore } from 'react';
import { isCompromisedNow, isDebuggerAttached } from './deviceProbe';

// Informational, never the only defence: an attacker who controls the device can bypass client checks.
// The server still enforces every rule; it only logs this header (Q5: warn, log, block sending reports).

const HEADER = 'X-Device-Integrity';
export const SEND_BLOCKED_MESSAGE =
  "This device looks rooted or jailbroken, so reports can't be sent from it. Use a different device or the web app.";

/** The header the API client adds to every request, or an empty object on a clean device. */
export const integrityHeader = (suspect: boolean): Record<string, string> =>
  suspect ? { [HEADER]: 'suspect' } : {};

/** Why sending is blocked, or null when it is allowed. */
export const sendBlockReason = (suspect: boolean): string | null => (suspect ? SEND_BLOCKED_MESSAGE : null);

let suspect = isCompromisedNow();
const listeners = new Set<() => void>();
const set = () => {
  if (suspect) return;
  suspect = true;
  listeners.forEach((l) => l());
};
void isDebuggerAttached().then((attached) => attached && set());

export const isSuspect = () => suspect;

/** One-line wiring for api/client.ts request interceptor: `config.headers.set(getIntegrityHeader())`. */
export const getIntegrityHeader = () => integrityHeader(suspect);

export function useIsSuspect() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    isSuspect,
    () => false
  );
}

/** For the send sheet: disable Send and show `message` when `blocked`. */
export function useSendBlockedByIntegrity() {
  const blocked = useIsSuspect();
  return { blocked, message: sendBlockReason(blocked) };
}
