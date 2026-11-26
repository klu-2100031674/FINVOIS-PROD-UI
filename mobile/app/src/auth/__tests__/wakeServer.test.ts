import { ensureServerAwake, wakeConfigured } from '../wakeServer';

const url = 'https://vm-start.example/api/StartVm';
const key = 'k&1';
const reply = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('ensureServerAwake', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('does nothing when the start URL or key is missing', async () => {
    expect(wakeConfigured('', key)).toBe(false);
    expect(wakeConfigured(url, '')).toBe(false);
    await expect(ensureServerAwake({ url: '', key: '' })).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs with the encoded key and stops once the VM is running', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { status: 'starting' })).mockReturnValueOnce(reply(200, { status: 'running' }));
    await expect(ensureServerAwake({ url, key, attempts: 5, delayMs: 0 })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(`${url}?code=k%261`, { method: 'POST' });
  });

  it('retries through errors and gives up after the last attempt', async () => {
    fetchMock
      .mockReturnValueOnce(Promise.reject(new Error('offline')))
      .mockReturnValueOnce(reply(500, { error: 'boom' }))
      .mockReturnValue(reply(200, { status: 'starting' }));
    await expect(ensureServerAwake({ url, key, attempts: 3, delayMs: 0 })).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
