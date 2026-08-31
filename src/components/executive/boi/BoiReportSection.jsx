import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Download, Loader2, Printer, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../common';
import { exportBoiPdf } from '../../../utils/boi/boiPdfExport';
import BoiReportDocument from './BoiReportDocument';
import './boiReport.css';

/**
 * Hook: A4 viewport scaling, pdfRef/viewportRef, and PDF download.
 * Optional external refs allow parent routes to share refs for submit + download.
 */
export function useBoiPdfSection(externalViewportRef, externalPdfRef) {
  const internalViewportRef = useRef(null);
  const internalPdfRef = useRef(null);
  const viewportRef = externalViewportRef ?? internalViewportRef;
  const pdfRef = externalPdfRef ?? internalPdfRef;
  const [isDownloading, setIsDownloading] = useState(false);

  useLayoutEffect(() => {
    const A4_PX = 794;
    const compute = () => {
      const el = viewportRef.current;
      if (!el) return;
      const styles = window.getComputedStyle(el);
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const w = el.getBoundingClientRect().width - horizontalPadding;
      const scale = Math.min(1, Math.max(0.3, (w - 8) / A4_PX));
      el.style.setProperty('--pdf-scale', String(scale));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [viewportRef]);

  const downloadPdf = useCallback(
    async (filename = 'boi-report.pdf') => {
      if (!pdfRef.current || isDownloading) return null;
      setIsDownloading(true);
      try {
        const blob = await exportBoiPdf(pdfRef, viewportRef);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
        return blob;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[boi-pdf] generation failed:', msg, err);
        toast.error(`Failed to generate PDF: ${msg}`);
        return null;
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading, pdfRef, viewportRef]
  );

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return { viewportRef, pdfRef, isDownloading, downloadPdf, printReport };
}

/**
 * Preview shell: report-shell viewport, pdfRef wrapper, toolbar with generate/download.
 */
export default function BoiReportSection({
  caseData,
  showToolbar = true,
  canDownload = true,
  defaultFilename,
  children,
  viewportRef: externalViewportRef,
  pdfRef: externalPdfRef,
  isDownloading: externalDownloading,
  downloadPdf: externalDownloadPdf,
  onSubmit,
  submitting = false,
}) {
  const internal = useBoiPdfSection(externalViewportRef, externalPdfRef);
  const viewportRef = externalViewportRef ?? internal.viewportRef;
  const pdfRef = externalPdfRef ?? internal.pdfRef;
  const isDownloading = externalDownloading ?? internal.isDownloading;
  const downloadPdf = externalDownloadPdf ?? internal.downloadPdf;
  const printReport = internal.printReport;

  const verificationId = caseData?.id ?? 'report';
  const pdfFilename = defaultFilename ?? `VER-${verificationId}.pdf`;
  const busy = isDownloading || submitting;

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="no-print flex flex-wrap items-center justify-end gap-2">
          <span className="hidden sm:inline text-xs text-gray-500 mr-auto">
            PDF · A4 · {verificationId}
          </span>
          {canDownload && (
            <>
              <Button type="button" variant="outline" onClick={printReport} className="h-9" disabled={busy}>
                <Printer className="h-4 w-4 mr-2 inline" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadPdf(pdfFilename)}
                disabled={busy || !caseData}
                className="h-9"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2 inline" />
                    Download PDF
                  </>
                )}
              </Button>
              {onSubmit && (
                <Button type="button" onClick={onSubmit} disabled={busy || !caseData} className="h-9">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2 inline" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div ref={viewportRef} className="report-shell print:py-0">
        <div ref={pdfRef} className="report-pdf-viewport">
          {children ?? (caseData ? <BoiReportDocument caseData={caseData} /> : null)}
        </div>
      </div>
    </div>
  );
}
