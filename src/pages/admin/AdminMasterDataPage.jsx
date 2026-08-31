import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Download, Loader2, RefreshCw, Search, FileSpreadsheet, FileText, X, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import adminExecutiveReportsAPI from '../../api/adminExecutiveReportsAPI';
import api from '../../api/apiClient';

const SBI_FORM_TYPE_OPTIONS = [
  { value: '', label: 'All form types' },
  { value: 'SBI_House', label: 'SBI House' },
  { value: 'SBI_Office', label: 'SBI Office' },
  { value: 'SBI_Bussiness', label: 'SBI Business' },
  { value: 'SBI_IncomeTax', label: 'Income Tax (ITR)' }
];

const BOI_FORM_TYPE_OPTIONS = [
  { value: '', label: 'All form types' },
  { value: 'BOI_Housing', label: 'BOI Housing' },
  { value: 'BOI', label: 'BOI' }
];

const REPORT_HELP_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_documents', label: 'Needs documents' },
  { value: 'documents_submitted', label: 'Documents submitted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted_for_validation', label: 'Submitted for validation' },
  { value: 'completed', label: 'Completed' }
];

// "Scheme Data" covers every active scheme (CMEP / PMEGP / AP IDP).
const SCHEME_OPTIONS = [
  { value: '', label: 'All schemes' },
  { value: 'cmep', label: 'CMEP' },
  { value: 'pmegp', label: 'PMEGP' },
  { value: 'ap_idp_4_0', label: 'AP IDP' }
];

const TABS = [
  { id: 'reports', label: 'DPR Data' },
  { id: 'executive', label: 'SBI Templates' },
  { id: 'boi-executive', label: 'BOI Templates' },
  { id: 'emi', label: 'Calculator' },
  { id: 'scheme', label: 'Scheme Data' },
  { id: 'client-screening', label: 'Client Screening' },
  { id: 'franchise', label: 'Franchise' },
  { id: 'lead-request', label: 'Lead Request' },
  { id: 'report-help', label: 'Report Help' }
];

const LEAD_TABS = new Set(['lead-request']);
const CLIENT_SCREENING_TAB = 'client-screening';
const SCHEME_TAB = 'scheme';
const REPORTS_TAB = 'reports';
const REPORT_HELP_TAB = 'report-help';
const BOI_EXECUTIVE_TAB = 'boi-executive';
const EXECUTIVE_TABS = new Set(['executive', BOI_EXECUTIVE_TAB]);

const getMasterDataColumnCount = (tab) => {
  if (tab === 'emi') return 3;
  // Scheme Data: checkbox + Date & Time + 4 data cols + export
  if (tab === SCHEME_TAB) return 7;
  if (tab === CLIENT_SCREENING_TAB) return 4;
  if (tab === REPORTS_TAB) return 7;
  if (tab === REPORT_HELP_TAB) return 9;
  if (EXECUTIVE_TABS.has(tab) || tab === 'franchise' || LEAD_TABS.has(tab)) return 6;
  return 5;
};

const getSearchPlaceholder = (tab) => {
  if (tab === REPORTS_TAB) return 'Search name, business name, phone, email…';
  if (EXECUTIVE_TABS.has(tab)) return 'Search applicant, form type, file name…';
  if (tab === 'emi') return 'Search name, phone number…';
  if (tab === SCHEME_TAB) return 'Search name, phone number, scheme…';
  if (tab === 'client-screening') return 'Search name, phone number, topics…';
  if (tab === 'franchise') return 'Search applicant name, phone, email, city, franchise…';
  if (tab === 'lead-request') return 'Search name, phone, email, service, partner…';
  if (tab === REPORT_HELP_TAB) return 'Search business, client, phone, email, type…';
  return 'Search…';
};

const getFormTypeColumnLabel = (tab) => {
  if (EXECUTIVE_TABS.has(tab)) return 'Form Type';
  if (tab === SCHEME_TAB) return 'Scheme';
  if (tab === CLIENT_SCREENING_TAB) return 'Date & Time';
  if (tab === 'franchise') return 'Franchise';
  if (tab === 'lead-request') return 'Service';
  return 'Form Type';
};

const getBusinessJobColumnLabel = (tab) => {
  if (tab === BOI_EXECUTIVE_TAB) return 'Loan Amount';
  if (tab === 'franchise') return 'Occupation / Budget';
  if (tab === 'lead-request') return 'Other details';
  return 'Business/Job';
};

const showCell = (v) => (v && String(v).trim() ? String(v) : '—');

/** Hide internal admin test mailbox in Report Help UI. */
const formatReportHelpEmail = (email) => {
  const raw = String(email || '').trim();
  if (!raw) return '';
  if (raw.toLowerCase() === 'admin@test.com') return 'Admin';
  return raw;
};

const showEmailCell = (email) => showCell(formatReportHelpEmail(email));

const formatStatusLabel = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const reportHelpStatusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (s === 'rejected') return 'bg-red-100 text-red-800';
  if (s === 'pending') return 'bg-amber-100 text-amber-800';
  if (s === 'accepted') return 'bg-sky-100 text-sky-800';
  if (s === 'in_progress') return 'bg-blue-100 text-blue-800';
  if (s === 'needs_documents') return 'bg-orange-100 text-orange-800';
  if (s === 'documents_submitted') return 'bg-violet-100 text-violet-800';
  if (s === 'submitted_for_validation') return 'bg-teal-100 text-teal-800';
  return 'bg-gray-100 text-gray-700';
};

const fmtChatTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt
    .toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    .replace(/\b(AM|PM)\b/gi, (m) => m.toLowerCase());
};

const AdminMasterDataPage = () => {
  const [activeTab, setActiveTab] = useState(REPORTS_TAB);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [formTypeFilter, setFormTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Scheme Data row selection for per-record / bulk export (Excel or PDF).
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportingRecordId, setExportingRecordId] = useState(null);
  const [exportingSelected, setExportingSelected] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [downloadingGeneratedId, setDownloadingGeneratedId] = useState(null);

  const formTypeOptions = activeTab === 'boi-executive' ? BOI_FORM_TYPE_OPTIONS : SBI_FORM_TYPE_OPTIONS;

  const queryParams = useMemo(
    () => ({
      tab: activeTab,
      templateCode: formTypeFilter || undefined,
      search: searchQuery || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined
    }),
    [activeTab, formTypeFilter, searchQuery, dateRange]
  );

  const fetchRows = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const response = await adminExecutiveReportsAPI.listMasterData({
          ...queryParams,
          page,
          limit: 50
        });
        setRows(response.data?.data?.rows || []);
        setPagination(response.data?.data?.pagination || { current_page: 1, total_pages: 1 });
      } catch (error) {
        console.error('Error fetching master data:', error);
        toast.error(error?.response?.data?.error || 'Failed to load master data');
      } finally {
        setLoading(false);
      }
    },
    [queryParams]
  );

  useEffect(() => {
    setFormTypeFilter('');
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setSelectedIds(new Set());
    setDetailOpen(false);
    setDetail(null);
  }, [activeTab]);

  useEffect(() => {
    fetchRows(1);
    // Selection is page/filter-scoped — stale ids from a previous page would
    // otherwise silently get included in the next export.
    setSelectedIds(new Set());
  }, [fetchRows]);

  const openReportHelpDetail = async (id) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetail(null);
      const response = await adminExecutiveReportsAPI.getReportHelpMasterDetail(id);
      setDetail(response.data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load report-help detail');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadGeneratedReport = async (helpRequestId, fileTitle) => {
    if (!helpRequestId) return;
    try {
      setDownloadingGeneratedId(helpRequestId);
      const response = await api.get(`/report-help/${helpRequestId}/linked-report/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = String(fileTitle || 'generated-report')
        .replace(/[^\w.\-() ]+/g, '_')
        .slice(0, 120);
      link.setAttribute('download', `${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Generated report downloaded');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to download generated report');
    } finally {
      setDownloadingGeneratedId(null);
    }
  };

  const toggleRowSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allRowsOnPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r._id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      if (allRowsOnPageSelected) {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r._id));
        return next;
      }
      const next = new Set(prev);
      rows.forEach((r) => next.add(r._id));
      return next;
    });
  };

  // Pulls a usable filename out of Content-Disposition, falling back to a
  // sensible default — the server decides the extension (.xlsx/.pdf/.zip)
  // based on how many records were requested, so we can't hardcode it here.
  const downloadBlobResponse = (response, fallbackName) => {
    const disposition = response.headers?.['content-disposition'] || '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const fileName = match ? match[1] : fallbackName;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportSchemeRecord = async (id, format) => {
    try {
      setExportingRecordId(id);
      const response = await adminExecutiveReportsAPI.exportSchemeRecords({ ids: [id], format });
      downloadBlobResponse(response, `scheme-data.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} downloaded`);
    } catch (error) {
      toast.error(error?.response?.data?.error || `Failed to export ${format === 'pdf' ? 'PDF' : 'Excel'}`);
    } finally {
      setExportingRecordId(null);
    }
  };

  const handleExportSchemeSelected = async (format) => {
    if (selectedIds.size === 0) return;
    try {
      setExportingSelected(true);
      const response = await adminExecutiveReportsAPI.exportSchemeRecords({
        ids: Array.from(selectedIds),
        format
      });
      const fallback = selectedIds.size > 1 ? 'scheme-data-export.zip' : `scheme-data.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadBlobResponse(response, fallback);
      toast.success(`Exported ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to export selected records');
    } finally {
      setExportingSelected(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await adminExecutiveReportsAPI.downloadMasterDataExcel(queryParams);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-master-data-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to download Excel';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const canPrev = (pagination.current_page || 1) > 1;
  const canNext = (pagination.current_page || 1) < (pagination.total_pages || 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Layers className="text-purple-600" size={28} />
              <h1 className="text-3xl font-bold">Master Data</h1>
            </div>
            <p className="text-gray-500 mt-1">
              DPR Data master data (same source as Admin Reports), plus other form submissions for export.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRows(pagination.current_page || 1)}
              className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
              Download Excel
            </button>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {EXECUTIVE_TABS.has(activeTab) && (
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="w-full sm:w-56 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  aria-label="Filter option"
                >
                  {formTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {activeTab === REPORT_HELP_TAB && (
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="w-full sm:w-56 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  aria-label="Filter status"
                >
                  {REPORT_HELP_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {activeTab === SCHEME_TAB && (
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="w-full sm:w-56 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  aria-label="Filter scheme"
                >
                  {SCHEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder(activeTab)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => fetchRows(1)}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === SCHEME_TAB && selectedIds.size > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-purple-900">
              {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportSchemeSelected('excel')}
                disabled={exportingSelected}
                className="flex items-center px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {exportingSelected ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <FileSpreadsheet size={16} className="mr-1.5" />}
                Export Selected (Excel)
              </button>
              <button
                type="button"
                onClick={() => handleExportSchemeSelected('pdf')}
                disabled={exportingSelected}
                className="flex items-center px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {exportingSelected ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <FileText size={16} className="mr-1.5" />}
                Export Selected (PDF)
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {pagination.total_count ? `${pagination.total_count} records` : '0 records'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchRows((pagination.current_page || 1) - 1)}
                disabled={!canPrev || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-gray-600">
                Page {pagination.current_page || 1} / {pagination.total_pages || 1}
              </div>
              <button
                type="button"
                onClick={() => fetchRows((pagination.current_page || 1) + 1)}
                disabled={!canNext || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center text-gray-600">
              <Loader2 className="animate-spin mr-2" size={18} />
              Loading…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    {activeTab === 'emi' ? (
                      <>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone no</th>
                      </>
                    ) : activeTab === SCHEME_TAB ? (
                      <>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allRowsOnPageSelected}
                            onChange={toggleSelectAllOnPage}
                            aria-label="Select all rows on this page"
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Scheme Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Applicant Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone Number</th>
                        <th className="px-4 py-3 text-left font-semibold">Business Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Export</th>
                      </>
                    ) : activeTab === CLIENT_SCREENING_TAB ? (
                      <>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone no</th>
                        <th className="px-4 py-3 text-left font-semibold">Business/Job</th>
                      </>
                    ) : activeTab === REPORTS_TAB ? (
                      <>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Template ID</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Business name</th>
                        <th className="px-4 py-3 text-left font-semibold">Ph no</th>
                        <th className="px-4 py-3 text-left font-semibold">Loan Amount</th>
                        <th className="px-4 py-3 text-left font-semibold">Sector</th>
                      </>
                    ) : activeTab === REPORT_HELP_TAB ? (
                      <>
                        <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-[7.5rem]">Date & Time</th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[8rem]">Business</th>
                        <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-[4.5rem]">Type</th>
                        <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-[7rem]">Status</th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[7rem]">Client</th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[9rem]">Client Email</th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[9rem]">Generated By</th>
                        {/* <th className="px-4 py-3 text-left font-semibold">Docs</th>
                        <th className="px-4 py-3 text-left font-semibold">Chat</th> */}
                        <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-[6.5rem]">Generated Report</th>
                        <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-[4.5rem]">View</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left font-semibold">
                          {getFormTypeColumnLabel(activeTab)}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone no</th>
                        <th className="px-4 py-3 text-left font-semibold">
                          {getBusinessJobColumnLabel(activeTab)}
                        </th>
                        {activeTab !== CLIENT_SCREENING_TAB && (
                          <th className="px-4 py-3 text-left font-semibold">
                            {LEAD_TABS.has(activeTab) ? 'Email / Partner / Date' : 'Location / Address'}
                          </th>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={getMasterDataColumnCount(activeTab)} className="px-4 py-10 text-center text-gray-500">
                        No data found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        {activeTab === 'emi' ? (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.address)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                          </>
                        ) : activeTab === SCHEME_TAB ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(r._id)}
                                onChange={() => toggleRowSelected(r._id)}
                                aria-label={`Select ${r.name || 'record'}`}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.date_time)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.scheme_name || r.templateLabel)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3">{showCell(r.business_job)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Export this record as Excel"
                                  onClick={() => handleExportSchemeRecord(r._id, 'excel')}
                                  disabled={exportingRecordId === r._id}
                                  className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {exportingRecordId === r._id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <FileSpreadsheet size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  title="Export this record as PDF"
                                  onClick={() => handleExportSchemeRecord(r._id, 'pdf')}
                                  disabled={exportingRecordId === r._id}
                                  className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {exportingRecordId === r._id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <FileText size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </>
                        ) : activeTab === CLIENT_SCREENING_TAB ? (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.date_time)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3">{showCell(r.business_job)}</td>
                          </>
                        ) : activeTab === REPORTS_TAB ? (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.date || r.date_time)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.template_id)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3">{showCell(r.business_name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3">{showCell(r.loan_amount)}</td>
                            <td className="px-4 py-3">{showCell(r.sector)}</td>
                          </>
                        ) : activeTab === REPORT_HELP_TAB ? (
                          <>
                            <td className="px-2 py-2.5 align-top w-[7.5rem]">
                              {r.date_time ? (
                                <div className="text-[11px] leading-snug text-gray-500" title={r.date_time}>
                                  <div className="whitespace-nowrap">{String(r.date_time).split(',')[0]}</div>
                                  <div className="whitespace-nowrap text-gray-400">
                                    {(String(r.date_time).split(',')[1] || '').trim()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top font-medium text-gray-900">
                              <div className="line-clamp-2 text-sm leading-snug" title={r.business_name || ''}>
                                {showCell(r.business_name)}
                              </div>
                            </td>
                            <td className="px-2 py-2.5 align-top w-[4.5rem]">
                              <span
                                className="inline-block max-w-[4.5rem] truncate text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                                title={r.report_type || ''}
                              >
                                {showCell(r.report_type)}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 align-top w-[7rem]">
                              <span
                                className={`inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight ${reportHelpStatusBadgeClass(r.status)}`}
                                title={formatStatusLabel(r.status)}
                              >
                                {formatStatusLabel(r.status)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[9rem]" title={r.contact_name || ''}>
                                {showCell(r.contact_name)}
                              </div>
                              <div className="text-[11px] text-gray-500 whitespace-nowrap">{showCell(r.contact_phone)}</div>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div
                                className="text-xs text-gray-700 truncate max-w-[11rem]"
                                title={formatReportHelpEmail(r.client_email) || r.client_email || ''}
                              >
                                {showEmailCell(r.client_email)}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div
                                className="text-xs text-gray-700 truncate max-w-[11rem]"
                                title={formatReportHelpEmail(r.generated_by_email) || r.generated_by_email || ''}
                              >
                                {showEmailCell(r.generated_by_email)}
                              </div>
                            </td>
                            {/* Docs / Chat columns commented out */}
                            <td className="px-2 py-2.5 align-top whitespace-nowrap w-[6.5rem]">
                              {r.has_generated_report ? (
                                <button
                                  type="button"
                                  onClick={() => downloadGeneratedReport(r._id, r.business_name)}
                                  disabled={downloadingGeneratedId === r._id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  {downloadingGeneratedId === r._id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Download size={12} />
                                  )}
                                  Download
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 align-top whitespace-nowrap w-[4.5rem]">
                              <button
                                type="button"
                                onClick={() => openReportHelpDetail(r._id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <Eye size={12} />
                                Open
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.date_time)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {showCell(r.formType || r.templateLabel)}
                            </td>
                            <td className="px-4 py-3">{showCell(r.name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3">{showCell(r.business_job)}</td>
                            {activeTab !== CLIENT_SCREENING_TAB && (
                              <td className="px-4 py-3">{showCell(r.address)}</td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {detailOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close detail"
              onClick={() => {
                setDetailOpen(false);
                setDetail(null);
              }}
            />
            <div className="relative h-full w-full max-w-xl bg-white shadow-xl overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Report Help detail</h3>
                  <p className="text-xs text-gray-500">Documents and chat included</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDetailOpen(false);
                    setDetail(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-10 flex items-center justify-center text-gray-600">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Loading…
                </div>
              ) : !detail ? (
                <div className="p-10 text-center text-gray-500">No detail available.</div>
              ) : (
                <div className="p-4 space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="font-medium">{showCell(detail.date_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${reportHelpStatusBadgeClass(detail.status)}`}
                        >
                          {formatStatusLabel(detail.status)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Business</p>
                      <p className="font-medium">{showCell(detail.business_name)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Report type</p>
                      <p className="font-medium uppercase">{showCell(detail.report_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Client Email</p>
                      <p className="font-medium break-all">{showEmailCell(detail.client_email)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Generated By</p>
                      <p className="font-medium break-all">
                        {showEmailCell(
                          detail.generated_by_email ||
                            detail.linked_report?.generated_by_email
                        )}
                      </p>
                      {(detail.generated_by_name || detail.linked_report?.generated_by_name) ? (
                        <p className="text-xs text-gray-500">
                          {detail.generated_by_name || detail.linked_report?.generated_by_name}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Client</p>
                      <p className="font-medium">{showCell(detail.contact_name)}</p>
                      <p className="text-xs text-gray-500">{showCell(detail.contact_phone)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Loan / Industry</p>
                      <p className="font-medium">{showCell(detail.loan_amount)}</p>
                      <p className="text-xs text-gray-500">{showCell(detail.industry)}</p>
                    </div>
                    {detail.notes ? (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="font-medium whitespace-pre-wrap">{detail.notes}</p>
                      </div>
                    ) : null}
                    {detail.rejection_reason ? (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Rejection reason</p>
                        <p className="font-medium text-red-700">{detail.rejection_reason}</p>
                      </div>
                    ) : null}
                  </div>

                  {detail.routing === 'platform' ? (
                    <a
                      href={`/admin/report-help/${detail._id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-purple-700 hover:underline"
                    >
                      <ExternalLink size={14} />
                      Open in Report Help workspace
                    </a>
                  ) : null}

                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated Report</h4>
                    {!detail.linked_report && !detail.has_generated_report ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
                        No generated report linked yet.
                      </p>
                    ) : (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {detail.linked_report?.title || detail.business_name || 'Generated report'}
                          </p>
                          {detail.linked_report?.validation_status ? (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatStatusLabel(detail.linked_report.validation_status)}
                            </p>
                          ) : null}
                          {(detail.generated_by_email || detail.linked_report?.generated_by_email) ? (
                            <p className="text-xs text-gray-500 mt-0.5 break-all">
                              By{' '}
                              {formatReportHelpEmail(
                                detail.generated_by_email ||
                                  detail.linked_report?.generated_by_email
                              )}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadGeneratedReport(
                              detail._id,
                              detail.linked_report?.title || detail.business_name
                            )
                          }
                          disabled={downloadingGeneratedId === detail._id}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 disabled:opacity-50"
                        >
                          {downloadingGeneratedId === detail._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          Download
                        </button>
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Documents ({detail.documents?.length || 0})
                    </h4>
                    {!detail.documents?.length ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
                        No documents uploaded.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.documents.map((doc) => (
                          <li
                            key={doc._id || doc.id || doc.file_name}
                            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {doc.document_label || doc.file_name || 'Document'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.uploaded_by || 'user'}
                                {doc.batch ? ` · ${doc.batch}` : ''}
                              </p>
                            </div>
                            {doc.signed_url || doc.azure_url ? (
                              <a
                                href={doc.signed_url || doc.azure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <Download size={14} />
                                Open
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Chat / updates ({detail.updates?.length || 0})
                    </h4>
                    {!detail.updates?.length ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
                        No chat updates yet.
                      </p>
                    ) : (
                      <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {detail.updates.map((u) => {
                          const isHandler = u.author_role === 'agent' || u.author_role === 'admin';
                          return (
                            <li
                              key={u._id}
                              className={`rounded-lg border px-3 py-2.5 text-sm ${
                                isHandler
                                  ? 'border-purple-100 bg-purple-50/60'
                                  : 'border-gray-100 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-gray-800">
                                  {isHandler
                                    ? u.author_role === 'admin'
                                      ? 'Finvois support'
                                      : 'Channel partner'
                                    : 'Client'}
                                  {u.author_name ? (
                                    <span className="font-normal text-gray-500"> · {u.author_name}</span>
                                  ) : null}
                                </span>
                                <time className="text-xs text-gray-400 whitespace-nowrap">
                                  {fmtChatTime(u.createdAt)}
                                </time>
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap">{u.message}</p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMasterDataPage;
