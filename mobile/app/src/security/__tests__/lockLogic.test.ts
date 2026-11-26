import {
  DEFAULT_LOCK_TIMEOUT_MS,
  MAX_ATTEMPTS,
  isWrongPassword,
  parseLeftAt,
  parseTimeout,
  recordFailure,
  shouldLock,
} from '../lockLogic';

describe('parseTimeout', () => {
  it('defaults to 10 minutes', () => {
    expect(DEFAULT_LOCK_TIMEOUT_MS).toBe(600000);
    expect(parseTimeout(undefined)).toBe(DEFAULT_LOCK_TIMEOUT_MS);
    expect(parseTimeout('')).toBe(DEFAULT_LOCK_TIMEOUT_MS);
  });
  it('accepts a shorter build-time value', () => {
    expect(parseTimeout('2000')).toBe(2000);
  });
  it('never lets a build lengthen the lock or disable it', () => {
    expect(parseTimeout('99999999')).toBe(DEFAULT_LOCK_TIMEOUT_MS);
    expect(parseTimeout('0')).toBe(DEFAULT_LOCK_TIMEOUT_MS);
    expect(parseTimeout('-5')).toBe(DEFAULT_LOCK_TIMEOUT_MS);
    expect(parseTimeout('abc')).toBe(DEFAULT_LOCK_TIMEOUT_MS);
  });
});

describe('shouldLock', () => {
  const T = 600000;
  it('does not lock when the app never left', () => {
    expect(shouldLock(null, 1000, T)).toBe(false);
  });
  it('does not lock for a short absence', () => {
    expect(shouldLock(1000, 1000 + T - 1, T)).toBe(false);
  });
  it('locks at and after the timeout', () => {
    expect(shouldLock(1000, 1000 + T, T)).toBe(true);
    expect(shouldLock(1000, 1000 + T * 3, T)).toBe(true);
  });
  it('fails closed when the clock moved backwards', () => {
    expect(shouldLock(5000, 1000, T)).toBe(true);
  });
  it('fails closed when the stored time is unreadable', () => {
    expect(shouldLock(NaN, 1000, T)).toBe(true);
  });
});

describe('parseLeftAt', () => {
  it('reads a stored timestamp', () => {
    expect(parseLeftAt('1700000000000')).toBe(1700000000000);
  });
  it('means "not away" when nothing is stored', () => {
    expect(parseLeftAt(null)).toBeNull();
    expect(shouldLock(parseLeftAt(null), 1000, 600000)).toBe(false);
  });
  it('turns a corrupted value into a lock, not a skipped lock', () => {
    expect(shouldLock(parseLeftAt('garbage'), 1000, 600000)).toBe(true);
    expect(shouldLock(parseLeftAt(''), 1700000000000, 600000)).toBe(true);
  });
  it('locks a cold start that happens after the timeout and not one before it', () => {
    const left = 1700000000000;
    expect(shouldLock(parseLeftAt(String(left)), left + 600000 - 1, 600000)).toBe(false);
    expect(shouldLock(parseLeftAt(String(left)), left + 600000, 600000)).toBe(true);
  });
});

describe('recordFailure', () => {
  it('counts down and signs out on the third wrong password', () => {
    expect(MAX_ATTEMPTS).toBe(3);
    const one = recordFailure(0);
    expect(one).toEqual({ failures: 1, left: 2, signOut: false });
    const two = recordFailure(one.failures);
    expect(two).toEqual({ failures: 2, left: 1, signOut: false });
    const three = recordFailure(two.failures);
    expect(three).toEqual({ failures: 3, left: 0, signOut: true });
  });
});

describe('isWrongPassword', () => {
  it('counts only a 401 from the login API', () => {
    expect(isWrongPassword({ response: { status: 401 } })).toBe(true);
    expect(isWrongPassword({ response: { status: 429 } })).toBe(false);
    expect(isWrongPassword({ response: { status: 500 } })).toBe(false);
    expect(isWrongPassword({ response: { status: 403 } })).toBe(false);
  });
  it('does not count being offline or unknown errors', () => {
    expect(isWrongPassword({ message: 'Network Error' })).toBe(false);
    expect(isWrongPassword(null)).toBe(false);
    expect(isWrongPassword(undefined)).toBe(false);
  });
});
