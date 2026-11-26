import { AxiosError, type AxiosResponse } from 'axios';
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from '../errors';

const withResponse = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data } as AxiosResponse);

const noResponse = (code: string) => new AxiosError('failed', code);

describe('apiErrorMessage', () => {
  it('uses the server message for both error body shapes', () => {
    expect(apiErrorMessage(withResponse(400, { error: 'Report must be approved before it can be sent.' }))).toBe(
      'Report must be approved before it can be sent.'
    );
    expect(apiErrorMessage(withResponse(404, { success: false, error: 'Request not found' }))).toBe('Request not found');
  });

  it('keeps the server message for 402 and 403', () => {
    expect(apiErrorMessage(withResponse(402, { success: false, error: 'Payment must be completed.' }))).toBe(
      'Payment must be completed.'
    );
    expect(apiErrorMessage(withResponse(403, { error: 'Insufficient permissions' }))).toBe('Insufficient permissions');
  });

  it('reports offline when there was no response', () => {
    expect(apiErrorMessage(noResponse('ERR_NETWORK'))).toBe("You're offline. Check your connection.");
  });

  it('reports a timeout separately from offline', () => {
    expect(apiErrorMessage(noResponse('ECONNABORTED'))).toBe('The request timed out. Try again.');
    expect(apiErrorMessage(noResponse('ETIMEDOUT'))).toBe('The request timed out. Try again.');
  });

  it('has friendly text for 429 and 426', () => {
    expect(apiErrorMessage(withResponse(429, { success: false, error: 'Too many attempts. Try again later.' }))).toBe(
      'Too many attempts. Try again in a few minutes.'
    );
    expect(apiErrorMessage(withResponse(426, { success: false, error: 'Update required', code: 'UPDATE_REQUIRED' }))).toBe(
      'Update the app to keep using it.'
    );
  });

  it('never shows server text for 5xx', () => {
    const stack = "TypeError: Cannot read properties of undefined (reading 'x')\n    at handler (/srv/app.js:10:5)";
    for (const status of [500, 502, 503]) {
      expect(apiErrorMessage(withResponse(status, { error: stack }))).toBe('Something went wrong. Try again.');
    }
  });

  it('falls back when the body has no usable message', () => {
    const fallback = 'Something went wrong. Try again.';
    expect(apiErrorMessage(withResponse(400, undefined))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, null))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, {}))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, '<html>Bad gateway</html>'))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, new Blob(['{"error":"in a blob"}'])))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, { error: { message: 'nested' } }))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, { error: '   ' }))).toBe(fallback);
    expect(apiErrorMessage(withResponse(400, { error: 'x'.repeat(200) }))).toBe(fallback);
  });

  it('uses the caller fallback and ignores non-axios errors', () => {
    expect(apiErrorMessage(withResponse(400, {}), 'Could not approve the report.')).toBe('Could not approve the report.');
    expect(apiErrorMessage(new Error('boom: secret detail'))).toBe('Something went wrong. Try again.');
    expect(apiErrorMessage('boom')).toBe('Something went wrong. Try again.');
    expect(apiErrorMessage(null, 'Custom')).toBe('Custom');
    expect(apiErrorMessage(undefined)).toBe('Something went wrong. Try again.');
  });
});

describe('apiErrorCode', () => {
  it('reads a string code from the body', () => {
    expect(apiErrorCode(withResponse(403, { error: 'x', code: 'ROLE_NOT_ALLOWED' }))).toBe('ROLE_NOT_ALLOWED');
  });

  it('returns null when there is no string code', () => {
    expect(apiErrorCode(withResponse(403, { error: 'x' }))).toBeNull();
    expect(apiErrorCode(withResponse(403, { code: 7 }))).toBeNull();
    expect(apiErrorCode(withResponse(403, null))).toBeNull();
    expect(apiErrorCode(noResponse('ERR_NETWORK'))).toBeNull();
    expect(apiErrorCode(new Error('x'))).toBeNull();
  });
});

describe('apiErrorStatus', () => {
  it('returns the HTTP status or undefined', () => {
    expect(apiErrorStatus(withResponse(401, {}))).toBe(401);
    expect(apiErrorStatus(noResponse('ERR_NETWORK'))).toBeUndefined();
    expect(apiErrorStatus(new Error('x'))).toBeUndefined();
  });
});
