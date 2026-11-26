import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { NotAPdfError, fetchPdfBytes } from '~/api/adminReports';
import { removePdf, savePdf, sweepPdfCache } from '~/lib/pdfCache';
import { pdfErrorMessage, usePdfDocument } from '../useAdminReportsPdf';

jest.mock('~/api/adminReports', () => ({ ...jest.requireActual('~/api/adminReports'), fetchPdfBytes: jest.fn() }));
jest.mock('~/lib/pdfCache', () => ({
  ...jest.requireActual('~/lib/pdfCache'),
  savePdf: jest.fn((name: string) => ({ name, uri: `file:///cache/reports/${name}` })),
  removePdf: jest.fn(),
  sweepPdfCache: jest.fn(),
}));
const mockFetch = fetchPdfBytes as jest.Mock;

const httpError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, { status, data: new ArrayBuffer(0) } as never);

describe('pdfErrorMessage', () => {
  it('explains a missing PDF in one friendly sentence', () => {
    expect(pdfErrorMessage(httpError(404))).toBe("The PDF isn't available yet.");
  });
  it('does not cache or show a body that is not a PDF', () => {
    expect(pdfErrorMessage(new NotAPdfError())).toMatch(/couldn't be opened/);
  });
  it('never leaks raw exception text', () => {
    expect(pdfErrorMessage(new Error('ECONNRESET at socket.js:12'))).toBe("The PDF couldn't be loaded. Try again.");
  });
});

describe('usePdfDocument', () => {
  beforeEach(() => jest.clearAllMocks());
  // One client per test; gcTime Infinity leaves no garbage-collection timer running after the test.
  let client: QueryClient;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

  it('sweeps stale files on mount, caches the download and deletes the file on unmount', async () => {
    mockFetch.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    const { result, unmount } = await renderHook(() => usePdfDocument('admin-report', 'abc123'), { wrapper });
    await waitFor(() => expect(result.current.data?.name).toBe('admin-report-abc123.pdf'));
    expect(sweepPdfCache).toHaveBeenCalled();
    expect(savePdf).toHaveBeenCalledWith('admin-report-abc123.pdf', expect.any(Uint8Array));
    expect(removePdf).not.toHaveBeenCalled();

    await unmount();
    expect(removePdf).toHaveBeenCalledWith('admin-report-abc123.pdf');
  });

  it('uses the request route for the agent source and a different file name', async () => {
    mockFetch.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    const { result } = await renderHook(() => usePdfDocument('request-report', 'req9'), { wrapper });
    await waitFor(() => expect(result.current.data?.name).toBe('request-report-req9.pdf'));
    expect(mockFetch).toHaveBeenCalledWith('request-report', 'req9', expect.anything());
  });

  it('writes nothing when the download fails', async () => {
    mockFetch.mockRejectedValue(httpError(404));
    const { result } = await renderHook(() => usePdfDocument('admin-report', 'gone'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(savePdf).not.toHaveBeenCalled();
  });
});
