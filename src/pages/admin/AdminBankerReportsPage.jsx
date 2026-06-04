/**
 * Admin Banker Reports — validation queue for executive (SBI) PDF reports.
 * Modeled on AdminReportsPage (Report Validation) with a reduced feature set.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  FileText,
  Check,
  X,
  Eye,
  Download,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Loader2
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import adminExecutiveReportsAPI from '../../api/adminExecutiveReportsAPI';
import toast from 'react-hot-toast';

const TEMPLATE_OPTIONS = [
  { value: '', label: 'All templates' },
  { value: 'SBI_House', label: 'SBI House' },
  { value: 'SBI_Office', label: 'SBI Office' },
  { value: 'SBI_Bussiness', label: 'SBI Business' },
  { value: 'SBI_IncomeTax', label: 'Income Tax (ITR)' }
];

const templateLabel = (code) =>
  TEMPLATE_OPTIONS.find((t) => t.value === code)?.label || code || '—';

const AdminBankerReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_validation');
  const [expandedReport, setExpandedReport] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);

  const canSelect = ['pending_validation', 'under_review', 'approved'].includes(activeTab);
  const canBulkApproveReject = activeTab === 'pending_validation' || activeTab === 'under_review';
  const canBulkDownload = activeTab === 'approved';

  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    reports.length > 0 && reports.every((r) => selectedIds.includes(String(r._id)));

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminExecutiveReportsAPI.getStats();
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching banker report stats:', error);
    }
  }, []);

  const fetchReports = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const response = await adminExecutiveReportsAPI.listReports({
          status: activeTab || undefined,
          search: searchQuery || undefined,
          templateCode: templateFilter || undefined,
          start_date: dateRange.start || undefined,
          end_date: dateRange.end || undefined,
          page,
          limit: 20
        });
        setReports(response.data?.data?.reports || []);
        setPagination(response.data?.data?.pagination || { current_page: 1, total_pages: 1 });
        setSelectedIds([]);
      } catch (error) {
        console.error('Error fetching banker reports:', error);
        toast.error('Failed to fetch banker reports');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchQuery, templateFilter, dateRange]
  );

  useEffect(() => {
    setSelectedIds([]);
    fetchStats();
    fetchReports(1);
  }, [activeTab]);

  const toggleSelect = (id) => {
    const sid = String(id);
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map((r) => String(r._id)));
    }
  };

  const selectedReports = useMemo(
    () => reports.filter((r) => selectedIds.includes(String(r._id))),
    [reports, selectedIds]
  );

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(1);
    fetchStats();
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    try {
      setActionLoading(true);
      await adminExecutiveReportsAPI.approve(selectedReport._id, approvalNotes);
      toast.success('Report approved successfully');
      setShowApproveModal(false);
      setApprovalNotes('');
      setSelectedReport(null);
      fetchReports(pagination.current_page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      setActionLoading(true);
      await adminExecutiveReportsAPI.reject(selectedReport._id, rejectionReason.trim());
      toast.success('Report rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedReport(null);
      fetchReports(pagination.current_page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnderReview = async (report) => {
    try {
      await adminExecutiveReportsAPI.markUnderReview(report._id);
      toast.success('Report marked as under review');
      fetchReports(pagination.current_page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update report status');
    }
  };

  const handleViewPdf = async (report) => {
    setSelectedReport(report);
    setShowPdfViewer(true);
    setLoadingPdf(true);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    try {
      const response = await adminExecutiveReportsAPI.fetchPdfBlob(report._id, true);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF preview');
      setShowPdfViewer(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await adminExecutiveReportsAPI.bulkApprove(selectedIds, approvalNotes);
      const data = res.data?.data;
      toast.success(res.data?.message || `Approved ${data?.success ?? 0} report(s)`);
      setShowBulkApproveModal(false);
      setApprovalNotes('');
      setSelectedIds([]);
      fetchReports(pagination.current_page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bulk approve failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      setBulkActionLoading(true);
      const res = await adminExecutiveReportsAPI.bulkReject(selectedIds, rejectionReason.trim());
      const data = res.data?.data;
      toast.success(res.data?.message || `Rejected ${data?.success ?? 0} report(s)`);
      setShowBulkRejectModal(false);
      setRejectionReason('');
      setSelectedIds([]);
      fetchReports(pagination.current_page);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bulk reject failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedReports.length === 0) return;
    try {
      setBulkActionLoading(true);
      const zip = new JSZip();
      let added = 0;
      for (const report of selectedReports) {
        try {
          const response = await adminExecutiveReportsAPI.fetchPdfBlob(report._id, false);
          const name = report.fileName || `report-${report._id}.pdf`;
          zip.file(name, response.data);
          added += 1;
        } catch (err) {
          console.error('Failed to fetch PDF for zip', report._id, err);
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
      link.download = `banker-reports-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${added} PDF(s) as ZIP`);
      if (added < selectedReports.length) {
        toast.error(`${selectedReports.length - added} file(s) could not be included`);
      }
    } catch (error) {
      toast.error(error?.message || 'Bulk download failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadPdf = async (report) => {
    try {
      const response = await adminExecutiveReportsAPI.fetchPdfBlob(report._id, false);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fileName || 'banker-report.pdf';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to download PDF');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_validation: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      under_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Under Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const reportTitle = (report) =>
    report.applicant_name?.trim() ||
    report.formData?.applicant_name ||
    report.formData?.name ||
    report.fileName ||
    'Banker report';

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Banker Reports</h1>
            <p className="text-gray-500 mt-1">
              Review and approve executive verification reports before they are visible to bankers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchReports(pagination.current_page);
              fetchStats();
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { key: 'pending_validation', label: 'Pending', icon: Clock, color: 'yellow', stat: stats.pending },
            { key: 'under_review', label: 'Under Review', icon: AlertCircle, color: 'purple', stat: stats.under_review },
            { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'green', stat: stats.approved },
            { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'red', stat: stats.rejected },
            { key: '', label: 'Total', icon: FileText, color: 'purple', stat: stats.total }
          ].map(({ key, label, icon: Icon, color, stat }) => (
            <button
              key={key || 'all'}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 text-left transition-all ${
                activeTab === key ? `border-${color}-500` : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`text-${color}-500`} size={24} />
                <span className="text-2xl font-bold text-gray-800">{stat ?? 0}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{label}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="w-full sm:w-44 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search executive, applicant, RLMS, file name…"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((p) => !p)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <SlidersHorizontal size={16} />
                Filters
                {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {canSelect && selectedCount > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-purple-800 font-medium">
              {selectedCount} report{selectedCount === 1 ? '' : 's'} selected
            </span>
            <div className="flex flex-wrap gap-2">
              {canBulkApproveReject && (
                <>
                  <button
                    type="button"
                    disabled={bulkActionLoading}
                    onClick={() => setShowBulkApproveModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <Check size={16} className="mr-2" />
                    Bulk approve
                  </button>
                  <button
                    type="button"
                    disabled={bulkActionLoading}
                    onClick={() => setShowBulkRejectModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <X size={16} className="mr-2" />
                    Bulk reject
                  </button>
                </>
              )}
              {canBulkDownload && (
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={handleBulkDownload}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                >
                  {bulkActionLoading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Download size={16} className="mr-2" />
                  )}
                  Download ZIP
                </button>
              )}
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

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto text-gray-300" size={60} />
              <p className="text-gray-500 mt-4">No banker reports found</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                {canSelect && (
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 rounded"
                      title="Select all on this page"
                    />
                  </div>
                )}
                <div className={canSelect ? 'col-span-3' : 'col-span-4'}>Report</div>
                <div className="col-span-2">Executive</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {reports.map((report) => (
                <div key={report._id} className="border-b border-gray-100 last:border-0">
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50">
                    {canSelect && (
                      <div className="col-span-1 flex items-center md:justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(report._id))}
                          onChange={() => toggleSelect(report._id)}
                          className="w-4 h-4 text-purple-600 rounded"
                          aria-label={`Select ${reportTitle(report)}`}
                        />
                      </div>
                    )}
                    <div className={`${canSelect ? 'col-span-3' : 'col-span-4'} min-w-0`}>
                      <h3 className="font-medium text-gray-800 truncate">{reportTitle(report)}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          {templateLabel(report.templateCode)}
                        </span>
                        {(report.rlms_number || report.formData?.rlms) && (
                          <span className="text-xs text-gray-500 truncate">
                            RLMS: {report.rlms_number || report.formData?.rlms}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {report.user_id?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{report.user_id?.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <div className="col-span-2">{getStatusBadge(report.validation_status)}</div>
                    <div className="col-span-2 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleViewPdf(report)}
                        className="p-2 text-purple-700 hover:bg-purple-50 rounded-lg"
                        title="View PDF"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(report)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      {report.validation_status === 'under_review' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowApproveModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowRejectModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {report.validation_status === 'pending_validation' && (
                        <button
                          type="button"
                          onClick={() => handleMarkUnderReview(report)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                        >
                          <AlertCircle size={16} />
                          Start Review
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReport(expandedReport === report._id ? null : report._id)
                        }
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        {expandedReport === report._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                  {expandedReport === report._id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <User size={16} className="mr-2" />
                          Executive
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-gray-500">Name:</span> {report.user_id?.name}
                          </p>
                          <p>
                            <span className="text-gray-500">Email:</span> {report.user_id?.email}
                          </p>
                          <p>
                            <span className="text-gray-500">Phone:</span>{' '}
                            {report.user_id?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <CheckCircle size={16} className="mr-2" />
                          Validation
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-gray-500">File:</span> {report.fileName}
                          </p>
                          {report.validated_at && (
                            <p>
                              <span className="text-gray-500">Validated:</span>{' '}
                              {new Date(report.validated_at).toLocaleString('en-IN')}
                            </p>
                          )}
                          {report.rejection_reason && (
                            <p className="text-red-600">
                              <span className="text-gray-500">Rejection:</span>{' '}
                              {report.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => fetchReports(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              type="button"
              onClick={() => fetchReports(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showApproveModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Approve Report</h2>
              <p className="text-gray-500 mt-1">{reportTitle(selectedReport)}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Internal notes…"
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedReport(null);
                  setApprovalNotes('');
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Reject Report</h2>
              <p className="text-gray-500 mt-1">{reportTitle(selectedReport)}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Shown to the executive on their reports page…"
                required
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReport(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <X size={16} className="mr-2" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Bulk approve</h2>
              <p className="text-gray-500 mt-1">{selectedCount} report(s) selected</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Internal notes…"
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkApproveModal(false);
                  setApprovalNotes('');
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Check size={16} className="mr-2" />
                )}
                Approve {selectedCount}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Bulk reject</h2>
              <p className="text-gray-500 mt-1">{selectedCount} report(s) selected</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Shown to executives on their reports page…"
                required
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={bulkActionLoading || !rejectionReason.trim()}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <X size={16} className="mr-2" />
                )}
                Reject {selectedCount}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfViewer && selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold truncate pr-4">
                {reportTitle(selectedReport)} — PDF
              </h2>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedReport)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfViewer(false);
                    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100">
              {loadingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-purple-600" size={40} />
                </div>
              ) : pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} className="w-full h-full" title="PDF Preview" />
              ) : (
                <p className="text-center text-red-600 py-12">Failed to load PDF</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBankerReportsPage;
