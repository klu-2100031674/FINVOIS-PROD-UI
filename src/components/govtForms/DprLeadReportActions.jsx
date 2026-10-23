import { useState } from 'react';
import { Download, Eye, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../../api/apiClient';
import { WORKFLOW_KEYS, workflowFromLead } from '../../utils/dprWorkflowStatus';

function requestIdFromLead(lead) {
  const nested = lead?.departmentRequestId;
  if (nested && typeof nested === 'object') return nested._id || null;
  if (nested) return nested;
  return lead?.departmentRequest?._id || null;
}

function paymentLinkFromLead(lead) {
  const r = lead?.report || lead?.departmentRequest?.reportId;
  return r?.payment_link_url || r?.payment?.payment_link_url || null;
}

export function leadHasGeneratedReport(lead) {
  const wf = workflowFromLead(lead);
  if (wf.key === WORKFLOW_KEYS.generated) return true;
  const report = lead?.report || lead?.departmentRequest?.reportId;
  if (!report) return false;
  if (typeof report === 'object') {
    return (
      report.validation_status === 'approved' ||
      Boolean(report.pdf_file_url || report.excel_file_url)
    );
  }
  return true;
}

async function fetchReportBlob(requestId, kind, inline = false) {
  const qs = kind === 'pdf' && inline ? '?inline=1' : '';
  return api.get(`/govt-forms/requests/${requestId}/report/${kind}${qs}`, {
    responseType: 'blob',
  });
}

const DprLeadReportActions = ({ lead }) => {
  const [busy, setBusy] = useState(null);
  const requestId = requestIdFromLead(lead);
  const hasReport = leadHasGeneratedReport(lead) && Boolean(requestId);
  const payUrl = paymentLinkFromLead(lead);

  if (!hasReport && !payUrl) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const run = async (action, fn) => {
    try {
      setBusy(action);
      await fn();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to open report'));
    } finally {
      setBusy(null);
    }
  };

  const viewPdf = async () => {
    const res = await fetchReportBlob(requestId, 'pdf', true);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const downloadFile = async (kind) => {
    const res = await fetchReportBlob(requestId, kind, false);
    const type =
      kind === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
    const blob = new Blob([res.data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'excel' ? `report-${requestId}.xlsx` : `report-${requestId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleCopyPaymentLink = (e) => {
    e.stopPropagation();
    if (!payUrl) return;
    navigator.clipboard.writeText(payUrl);
    toast.success('Payment link copied to clipboard');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {payUrl && (
        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleCopyPaymentLink}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-l-lg transition-colors"
            title="Copy payment link"
          >
            <Link2 className="h-3.5 w-3.5 text-blue-600" />
            Pay Link
          </button>
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-xs text-blue-700 bg-blue-50 border border-l-0 border-blue-200 hover:bg-blue-100 rounded-r-lg"
            title="Open payment link in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
          </a>
        </div>
      )}
      {hasReport && (
        <>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('view', viewPdf)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {busy === 'view' ? '…' : 'View'}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('pdf', () => downloadFile('pdf'))}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {busy === 'pdf' ? '…' : 'PDF'}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('excel', () => downloadFile('excel'))}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {busy === 'excel' ? '…' : 'Excel'}
          </button>
        </>
      )}
    </div>
  );
};

export default DprLeadReportActions;
