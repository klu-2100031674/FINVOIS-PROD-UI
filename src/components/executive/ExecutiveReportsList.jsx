import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Eye, Filter, Search, X, RefreshCw, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import { executiveAPI } from '../../api/executiveAPI';

const PAGE_SIZE = 50;

const TEMPLATE_BADGES = {
  SBI_House: { label: 'SBI House', className: 'bg-blue-50 text-blue-700' },
  SBI_Office: { label: 'SBI Office', className: 'bg-indigo-50 text-indigo-700' },
  SBI_Bussiness: { label: 'SBI Business', className: 'bg-amber-50 text-amber-700' },
  SBI_IncomeTax: { label: 'Income Tax', className: 'bg-teal-50 text-teal-700' }
};

function StatusBadge({ status }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
        Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
        Rejected
      </span>
    );
  }
  if (status === 'pending_validation') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
        Pending approval
      </span>
    );
  }
  if (status === 'under_review') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
        Under review
      </span>
    );
  }
  return null;
}

function RejectionNote({ reason }) {
  if (!reason?.trim()) return null;
  return (
    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
      <span className="font-semibold">Admin note: </span>
      {reason}
    </div>
  );
}

function PendingStatusNote({ status }) {
  if (status === 'pending_validation') {
    return (
      <p className="mt-2 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
        Waiting for admin approval. View and download will be available after approval.
      </p>
    );
  }
  if (status === 'under_review') {
    return (
      <p className="mt-2 text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
        Admin is reviewing this report. View and download will be available after approval.
      </p>
    );
  }
  return null;
}

function TemplateBadge({ code }) {
  const badge = TEMPLATE_BADGES[code];
  if (!badge) return <span className="text-gray-600">{code || '—'}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
}

const ExecutiveReportsList = () => {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: PAGE_SIZE
  });

  const [templateFilter, setTemplateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const openedFromNavRef = useRef(false);

  const isApproved = (row) => row.validationStatus === 'approved';

  const approvedOnPage = useMemo(() => reports.filter(isApproved), [reports]);

  const selectedApprovedReports = useMemo(
    () => reports.filter((r) => selectedIds.includes(String(r.id)) && isApproved(r)),
    [reports, selectedIds]
  );

  const allApprovedOnPageSelected =
    approvedOnPage.length > 0 &&
    approvedOnPage.every((r) => selectedIds.includes(String(r.id)));

  const loadReports = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        const res = await executiveAPI.listReports({
          page: pageNum,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          templateCode: templateFilter || undefined,
          search: searchQuery || undefined,
          start_date: dateFrom || undefined,
          end_date: dateTo || undefined
        });
        setReports(res?.data || []);
        setPagination(
          res?.pagination || {
            current_page: pageNum,
            total_pages: 1,
            total_count: (res?.data || []).length,
            per_page: PAGE_SIZE
          }
        );
        setSelectedIds([]);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, templateFilter, dateFrom, dateTo, searchQuery]
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, templateFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    const delay = searchQuery ? 400 : 0;
    const t = setTimeout(() => loadReports(page), delay);
    return () => clearTimeout(t);
  }, [page, statusFilter, templateFilter, dateFrom, dateTo, searchQuery, loadReports]);

  const revokePdfUrl = useCallback(() => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  const closePdfViewer = useCallback(() => {
    revokePdfUrl();
    setSelectedReport(null);
  }, [revokePdfUrl]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const toggleSelect = (row) => {
    if (!isApproved(row)) return;
    const sid = String(row.id);
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const toggleSelectAllApproved = () => {
    if (allApprovedOnPageSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(approvedOnPage.map((r) => String(r.id)));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedApprovedReports.length === 0) {
      toast.error('Select approved reports to download');
      return;
    }
    try {
      setBulkDownloading(true);
      const zip = new JSZip();
      let added = 0;
      for (const report of selectedApprovedReports) {
        try {
          const response = await executiveAPI.fetchReportBlobRaw(report.id);
          zip.file(report.fileName || `report-${report.id}.pdf`, response.data);
          added += 1;
        } catch (err) {
          console.error('Bulk download failed for', report.id, err);
        }
      }
      if (added === 0) {
        toast.error('Could not download any PDFs');
        return;
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-reports-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${added} PDF(s) as ZIP`);
      if (added < selectedApprovedReports.length) {
        toast.error(`${selectedApprovedReports.length - added} file(s) could not be included`);
      }
    } catch {
      toast.error('Bulk download failed');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleView = useCallback(
    async (report) => {
      if (!isApproved(report)) {
        const status = report.validationStatus;
        if (status === 'rejected') {
          toast.error('This report was rejected and cannot be previewed');
        } else if (status === 'under_review') {
          toast.error('This report is under admin review and cannot be previewed yet');
        } else if (status === 'pending_validation') {
          toast.error('This report is awaiting admin approval and cannot be previewed yet');
        } else {
          toast.error('Report is not available until admin approval');
        }
        return;
      }
      if (selectedReport?.id === report.id && pdfBlobUrl) {
        return;
      }

      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSelectedReport(report);
      setLoadingPdf(true);

      try {
        const { objectUrl } = await executiveAPI.fetchReportBlob(report.id);
        setPdfBlobUrl(objectUrl);
      } catch {
        toast.error('Failed to load report');
        setSelectedReport(null);
      } finally {
        setLoadingPdf(false);
      }
    },
    [selectedReport?.id, pdfBlobUrl]
  );

  useEffect(() => {
    const openReportId = location.state?.openReportId;
    if (!openReportId || openedFromNavRef.current || loading || reports.length === 0) return;

    const report = reports.find((r) => r.id === openReportId);
    if (report) {
      openedFromNavRef.current = true;
      handleView(report);
    }
  }, [location.state?.openReportId, reports, loading, handleView]);

  const handleDownload = async (report) => {
    if (!isApproved(report)) {
      const status = report.validationStatus;
      if (status === 'rejected') {
        toast.error('This report was rejected and cannot be downloaded');
      } else if (status === 'under_review') {
        toast.error('This report is under admin review and cannot be downloaded yet');
      } else if (status === 'pending_validation') {
        toast.error('This report is awaiting admin approval and cannot be downloaded yet');
      } else {
        toast.error('Report is not available until admin approval');
      }
      return;
    }
    try {
      await executiveAPI.downloadReport(report.id, report.fileName);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Download failed');
    }
  };

  const hasActiveFilters = statusFilter || templateFilter || dateFrom || dateTo || searchQuery;
  const showPdfPanel = selectedReport && (loadingPdf || pdfBlobUrl);
  const showBulkBar = selectedApprovedReports.length > 0;

  useEffect(() => {
    if (!showPdfPanel) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closePdfViewer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showPdfPanel, closePdfViewer]);

  const filterBar = (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <Filter className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Filter Reports</span>
          {pagination.total_count > 0 && (
            <span className="text-xs font-normal text-gray-500">
              ({pagination.total_count} total)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadReports(page)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 min-h-[44px] sm:min-h-0"
            title="Refresh report list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setTemplateFilter('');
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
              className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 font-medium min-h-[44px] sm:min-h-0 px-2"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending_validation">Pending approval</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Type</label>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="w-full text-sm px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
          >
            <option value="">All Templates</option>
            <option value="SBI_House">SBI House</option>
            <option value="SBI_Office">SBI Office</option>
            <option value="SBI_Bussiness">SBI Business</option>
            <option value="SBI_IncomeTax">Income Tax</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-sm px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-sm px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, file, RLMS…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );

  const reportActions = (row) => {
    const approved = isApproved(row);
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleView(row)}
          disabled={!approved}
          className={`inline-flex items-center min-h-[44px] sm:min-h-0 font-medium transition-colors ${
            !approved
              ? 'text-gray-400 cursor-not-allowed'
              : selectedReport?.id === row.id
                ? 'text-purple-800'
                : 'text-blue-600 hover:text-blue-800'
          }`}
          title={approved ? 'View PDF' : 'Not available'}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </button>
        <button
          type="button"
          onClick={() => handleDownload(row)}
          disabled={!approved}
          className={`inline-flex items-center min-h-[44px] sm:min-h-0 font-medium transition-colors ${
            approved ? 'text-purple-600 hover:text-purple-800' : 'text-gray-400 cursor-not-allowed'
          }`}
          title={approved ? 'Download PDF file' : 'Not available'}
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </button>
      </div>
    );
  };

  const paginationBar =
    pagination.total_pages > 1 ? (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-sm text-gray-600">
          Page {pagination.current_page} of {pagination.total_pages}
          <span className="text-gray-400"> · {PAGE_SIZE} per page</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.current_page <= 1 || loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
            disabled={pagination.current_page >= pagination.total_pages || loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    ) : (
      pagination.total_count > 0 && (
        <p className="text-xs text-gray-500 pt-2">
          Showing up to {PAGE_SIZE} reports per page
          {pagination.total_count <= PAGE_SIZE
            ? ` (${pagination.total_count} total)`
            : ` (${pagination.total_count} total)`}
        </p>
      )
    );

  const pdfViewerOverlay = showPdfPanel && (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="PDF preview"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={closePdfViewer}
        aria-label="Close preview"
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] sm:h-[90vh] flex flex-col overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 shrink-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate pr-2">
            {selectedReport.fileName || 'PDF Preview'}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownload(selectedReport)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#7e22ce] rounded-lg hover:bg-[#6b21a8] min-h-[44px] sm:min-h-0"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </button>
            <button
              type="button"
              onClick={closePdfViewer}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 flex items-center justify-center min-h-0 overflow-hidden">
          {loadingPdf ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#7e22ce]" />
              <p className="text-sm text-gray-600">Loading PDF…</p>
            </div>
          ) : pdfBlobUrl ? (
            <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="PDF Preview" />
          ) : (
            <p className="text-sm text-red-600">Failed to load PDF</p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <p className="text-sm text-gray-500">Loading reports…</p>
        </div>
      </div>
    );
  }

  if (!loading && reports.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <p className="text-sm text-gray-500 text-center py-8 max-w-md mx-auto">
          {hasActiveFilters
            ? 'No reports match your filters.'
            : 'No reports yet. Generate a report from a template on the dashboard — it will appear here while pending approval, and you can view or download it once approved.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filterBar}

      {showBulkBar && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-purple-800 font-medium text-sm">
            {selectedApprovedReports.length} approved report
            {selectedApprovedReports.length === 1 ? '' : 's'} selected for download
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkDownloading}
              onClick={handleBulkDownload}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
            >
              {bulkDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download ZIP
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 min-w-0">
          <div className="md:hidden space-y-3">
            {approvedOnPage.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 px-1">
                <input
                  type="checkbox"
                  checked={allApprovedOnPageSelected}
                  onChange={toggleSelectAllApproved}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                Select all approved on this page
              </label>
            )}
            {reports.map((row) => (
              <div
                key={row.id}
                className={`border rounded-xl p-4 bg-white shadow-sm ${
                  selectedReport?.id === row.id ? 'border-purple-400 ring-1 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isApproved(row) ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(row.id))}
                      onChange={() => toggleSelect(row)}
                      className="w-4 h-4 mt-0.5 text-purple-600 rounded shrink-0"
                      aria-label={`Select ${row.fileName}`}
                    />
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{row.fileName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <TemplateBadge code={row.templateCode} />
                      <StatusBadge status={row.validationStatus} />
                      <span className="text-xs text-gray-500">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    <RejectionNote reason={row.rejectionReason} />
                    <PendingStatusNote status={row.validationStatus} />
                    <div className="mt-3 pt-3 border-t border-gray-100">{reportActions(row)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 font-semibold text-xs">
                  <th className="py-3 px-4 w-10">
                    {approvedOnPage.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allApprovedOnPageSelected}
                        onChange={toggleSelectAllApproved}
                        className="w-4 h-4 text-purple-600 rounded"
                        title="Select all approved on this page"
                      />
                    )}
                  </th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 transition-colors ${
                      selectedReport?.id === row.id ? 'bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      {isApproved(row) ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(row.id))}
                          onChange={() => toggleSelect(row)}
                          className="w-4 h-4 text-purple-600 rounded"
                          aria-label={`Select ${row.fileName}`}
                        />
                      ) : null}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs">{row.fileName}</td>
                    <td className="py-3 px-4">
                      <TemplateBadge code={row.templateCode} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.validationStatus} />
                      <RejectionNote reason={row.rejectionReason} />
                      <PendingStatusNote status={row.validationStatus} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">{reportActions(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginationBar}
      </div>

      {pdfViewerOverlay}
    </div>
  );
};

export default ExecutiveReportsList;
