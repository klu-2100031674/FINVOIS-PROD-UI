import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { listMessages, postMessage, type RequestMessage } from '~/api/agentRequests';
import { useRequestMessages } from '../useRequestMessages';

jest.mock('~/api/agentRequests', () => ({
  ...jest.requireActual('~/api/agentRequests'),
  listMessages: jest.fn(),
  postMessage: jest.fn(),
}));
const mockList = listMessages as jest.Mock;
const mockPost = postMessage as jest.Mock;

const msg = (id: string, body: string, senderId = 'customer'): RequestMessage => ({
  id,
  body,
  senderId,
  senderRole: senderId === 'me' ? 'customer_service' : 'customer',
  createdAt: '2026-10-01T09:00:00Z',
});

const serverError = (status: number, error: string) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { success: false, error },
    statusText: '',
    headers: {},
    config: {} as never,
  });

function setup() {
  // gcTime Infinity: the default 5 minute garbage-collection timer would keep the Jest worker alive.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

const first = msg('m1', 'Please confirm the documents received.');

beforeEach(() => {
  mockList.mockReset();
  mockPost.mockReset();
  mockList.mockResolvedValue({ messages: [first], canPost: true });
});

describe('useRequestMessages', () => {
  it('lists the thread oldest first and reports whether posting is allowed', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRequestMessages('r1', 'me', true), { wrapper });
    await waitFor(() => expect(result.current.thread.data?.messages).toEqual([first]));
    expect(result.current.thread.data?.canPost).toBe(true);
    expect(mockList).toHaveBeenCalledWith('r1');
  });

  it('shows a sent message at once, then replaces it with the server list', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRequestMessages('r1', 'me', true), { wrapper });
    await waitFor(() => expect(result.current.thread.data).toBeDefined());

    let confirm: (m: RequestMessage) => void = () => {};
    mockPost.mockImplementationOnce(() => new Promise((resolve) => (confirm = resolve)));
    const stored = msg('m2', 'On it.', 'me');
    mockList.mockResolvedValue({ messages: [first, stored], canPost: true });

    await act(async () => {
      result.current.send.mutate('On it.');
    });
    await waitFor(() => expect(result.current.thread.data?.messages).toHaveLength(2));
    const optimistic = result.current.thread.data?.messages[1];
    expect(optimistic).toMatchObject({ body: 'On it.', senderId: 'me', pending: true });

    await act(async () => confirm(stored));
    await waitFor(() => expect(result.current.thread.data?.messages[1]).toEqual(stored));
    expect(mockPost).toHaveBeenCalledWith('r1', 'On it.');
  });

  it('removes the optimistic message again when the server refuses it', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRequestMessages('r1', 'me', true), { wrapper });
    await waitFor(() => expect(result.current.thread.data).toBeDefined());

    mockPost.mockRejectedValueOnce(serverError(403, 'Chat unlocks after a customer-service agent claims or is assigned to this request'));
    await act(async () => {
      result.current.send.mutate('Hello');
    });

    await waitFor(() => expect(result.current.send.isError).toBe(true));
    await waitFor(() => expect(result.current.thread.data?.messages).toEqual([first]));
    expect(result.current.thread.data?.messages.some((m) => m.pending)).toBe(false);
  });

  it('does not poll while the screen is not focused', async () => {
    jest.useFakeTimers();
    try {
      const { wrapper } = setup();
      const { rerender } = await renderHook(({ focused }: { focused: boolean }) => useRequestMessages('r1', 'me', focused), {
        wrapper,
        initialProps: { focused: false },
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(mockList).toHaveBeenCalledTimes(1);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(95_000);
      });
      expect(mockList).toHaveBeenCalledTimes(1);

      await rerender({ focused: true });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(61_000);
      });
      expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(3);
    } finally {
      jest.useRealTimers();
    }
  });
});
