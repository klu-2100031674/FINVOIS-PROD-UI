// Web and fallback probe. Web is only a test harness, so there is nothing to detect; the window flag lets
// Playwright show the "suspect" UI. Native builds use deviceProbe.native.ts and never bundle this file.
export const isCompromisedNow = (): boolean =>
  typeof window !== 'undefined' && (window as { __FINVOIS_SUSPECT__?: boolean }).__FINVOIS_SUSPECT__ === true;

export const isDebuggerAttached = async (): Promise<boolean> => false;
