import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NotAPdfError, fetchPdfBytes, type PdfSource } from '~/api/adminReports';
import { pdfFileName, removePdf, savePdf, sweepPdfCache, type CachedPdf } from '~/lib/pdfCache';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

/** Short sentence for a failed PDF load. A 404 is the usual case: the file is missing from storage. */
export function pdfErrorMessage(err: unknown): string {
  if (apiErrorStatus(err) === 404) return "The PDF isn't available yet.";
  if (err instanceof NotAPdfError) return "The PDF couldn't be opened. Try again.";
  return apiErrorMessage(err, "The PDF couldn't be loaded. Try again.");
}

/**
 * Downloads the report PDF into the app cache and removes it again when the screen unmounts.
 * The query is never kept (gcTime 0): the file, not the cache entry, is the sensitive part.
 */
export function usePdfDocument(source: PdfSource, id: string) {
  const name = pdfFileName(source, id);
  const query = useQuery<CachedPdf>({
    queryKey: ['pdf', source, id],
    queryFn: async ({ signal }) => {
      const bytes = await fetchPdfBytes(source, id, signal);
      // The screen closed mid-download: do not leave a file behind that nothing will clean up.
      if (signal.aborted) throw new Error('Cancelled');
      return savePdf(name, bytes);
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    networkMode: 'always',
  });

  useEffect(() => {
    sweepPdfCache();
    return () => removePdf(name);
  }, [name]);

  return query;
}
