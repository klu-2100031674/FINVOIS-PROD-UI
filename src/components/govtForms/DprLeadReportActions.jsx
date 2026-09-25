import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../../api/apiClient';
import { WORKFLOW_KEYS, workflowFromLead } from '../../utils/dprWorkflowStatus';

function requestIdFromLead(lead) {
  const nested = lead?.departmentRequestId;
  if (nested && typeof nested === 'object') return nested._id || null;
  if (nested) return nested;
  return lead?.departmentRequest?._id || null;
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

  if (!leadHasGeneratedReport(lead) || !requestId) {
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

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};

export default DprLeadReportActions;
