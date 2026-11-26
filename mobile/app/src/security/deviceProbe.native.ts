// Root / jailbreak / hook detection with jail-monkey (3.0.0, released 2026-04-28, supports the New Architecture).
// Loaded lazily: Expo Go and unit tests have no JailMonkey native module, and that must never crash the app.
type Monkey = { isJailBroken(): boolean; hookDetected(): boolean; isDebuggedMode(): Promise<boolean> };

const monkey = (): Monkey | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy on purpose, see above
    return require('jail-monkey').default as Monkey;
  } catch {
    return null;
  }
};

export function isCompromisedNow(): boolean {
  try {
    const m = monkey();
    return !!m && (m.isJailBroken() || m.hookDetected());
  } catch {
    return false;
  }
}

/** A debugger attached to a release build. Skipped in development, where one is expected. */
export async function isDebuggerAttached(): Promise<boolean> {
  if (__DEV__) return false;
  try {
    return (await monkey()?.isDebuggedMode()) === true;
  } catch {
    return false;
  }
}
