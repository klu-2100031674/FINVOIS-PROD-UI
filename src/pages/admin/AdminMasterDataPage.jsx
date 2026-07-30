import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Download, Loader2, RefreshCw, Search, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import adminExecutiveReportsAPI from '../../api/adminExecutiveReportsAPI';

const FORM_TYPE_OPTIONS = [
  { value: '', label: 'All form types' },
  { value: 'SBI_House', label: 'SBI House' },
  { value: 'SBI_Office', label: 'SBI Office' },
  { value: 'SBI_Bussiness', label: 'SBI Business' },
  { value: 'SBI_IncomeTax', label: 'Income Tax (ITR)' }
];

// "Scheme Data" covers every active scheme (CMEP / PMEGP / AP IDP).
const SCHEME_OPTIONS = [
  { value: '', label: 'All schemes' },
  { value: 'cmep', label: 'CMEP' },
  { value: 'pmegp', label: 'PMEGP' },
  { value: 'ap_idp_4_0', label: 'AP IDP' }
];

const TABS = [
  { id: 'reports', label: 'Lead DPR' },
  { id: 'executive', label: 'SBI Executive' },
  { id: 'emi', label: 'Calculator' },
  { id: 'scheme', label: 'Scheme Data' },
  { id: 'client-screening', label: 'Client Screening' },
  { id: 'franchise', label: 'Franchise' },
  { id: 'lead-request', label: 'Lead Request' }
];

const LEAD_TABS = new Set(['lead-request']);
const CLIENT_SCREENING_TAB = 'client-screening';
const SCHEME_TAB = 'scheme';
const REPORTS_TAB = 'reports';

const getMasterDataColumnCount = (tab) => {
  if (tab === 'emi') return 3;
  // Scheme Data adds a select checkbox column and a per-row export actions column
  // on top of the 4 requested data columns (Scheme Name / Applicant / Phone / Business Name).
  if (tab === SCHEME_TAB) return 6;
  if (tab === CLIENT_SCREENING_TAB) return 4;
  if (tab === REPORTS_TAB) return 6;
  return 5;
};

const getSearchPlaceholder = (tab) => {
  if (tab === REPORTS_TAB) return 'Search name, business name, phone, email…';
  if (tab === 'executive') return 'Search applicant, form type, file name…';
  if (tab === 'emi') return 'Search name, phone number…';
  if (tab === SCHEME_TAB) return 'Search name, phone number, scheme…';
  if (tab === 'client-screening') return 'Search name, phone number, topics…';
  if (tab === 'franchise') return 'Search applicant name, phone, email, city, franchise…';
  if (tab === 'lead-request') return 'Search name, phone, email, service, partner…';
  return 'Search…';
};

const getFormTypeColumnLabel = (tab) => {
  if (tab === 'executive') return 'Form Type';
  if (tab === SCHEME_TAB) return 'Scheme';
  if (tab === CLIENT_SCREENING_TAB) return 'Date & Time';
  if (tab === 'franchise') return 'Franchise';
  if (tab === 'lead-request') return 'Service';
  return 'Form Type';
};

const showCell = (v) => (v && String(v).trim() ? String(v) : '—');

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
  }, [activeTab]);

  useEffect(() => {
    fetchRows(1);
    // Selection is page/filter-scoped — stale ids from a previous page would
    // otherwise silently get included in the next export.
    setSelectedIds(new Set());
  }, [fetchRows]);

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
              Lead DPR master data (same source as Admin Reports), plus other form submissions for export.
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
              {activeTab === 'executive' && (
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="w-full sm:w-56 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  aria-label="Filter option"
                >
                  {FORM_TYPE_OPTIONS.map((opt) => (
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
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone no</th>
                        <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
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
                        <th className="px-4 py-3 text-left font-semibold">Template ID</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Business name</th>
                        <th className="px-4 py-3 text-left font-semibold">Ph no</th>
                        <th className="px-4 py-3 text-left font-semibold">Loan Amount</th>
                        <th className="px-4 py-3 text-left font-semibold">Sector</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left font-semibold">
                          {getFormTypeColumnLabel(activeTab)}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Phone no</th>
                        <th className="px-4 py-3 text-left font-semibold">
                          {activeTab === 'franchise'
                            ? 'Occupation / Budget'
                            : activeTab === 'lead-request'
                              ? 'Other details'
                              : 'Business/Job'}
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
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{showCell(r.address)}</td>
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
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.template_id)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{showCell(r.name)}</td>
                            <td className="px-4 py-3">{showCell(r.business_name)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{showCell(r.phone)}</td>
                            <td className="px-4 py-3">{showCell(r.loan_amount)}</td>
                            <td className="px-4 py-3">{showCell(r.sector)}</td>
                          </>
                        ) : (
                          <>
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
      </div>
    </AdminLayout>
  );
};

export default AdminMasterDataPage;
