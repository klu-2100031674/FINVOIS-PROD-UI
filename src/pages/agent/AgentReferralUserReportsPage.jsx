/**
 * Channel partner: view all reports for a referred user.
 * Route: /agent/referrals/:userId/reports
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AgentLayout } from '../../components/layouts';
import api from '../../api/apiClient';

const getStatusBadge = (status) => {
  const statusConfig = {
    pending_validation: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    under_review: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Validation for CA' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Validated by CA' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' }
  };
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const AgentReferralUserReportsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();

  const displayName = location?.state?.userName || 'User';
  const targetUserId = useMemo(() => String(userId || '').trim(), [userId]);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportTypeOptions, setReportTypeOptions] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const fetchReports = useCallback(
    async (page = 1) => {
      if (!targetUserId) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeTab) params.append('status', activeTab);
        if (reportType) params.append('report_type', reportType);
        if (searchQuery) params.append('search', searchQuery);
        if (dateRange.start) params.append('start_date', dateRange.start);
        if (dateRange.end) params.append('end_date', dateRange.end);
        params.append('page', page);
        params.append('limit', 20);

        const response = await api.get(
          `/users/referrals/${targetUserId}/reports?${params.toString()}`
        );
        const serverReports = response.data?.data?.reports || [];
        setReports(serverReports);
        setPagination(response.data?.data?.pagination || { current_page: 1, total_pages: 1 });

        const types = new Set();
        serverReports.forEach((r) => {
          if (r.report_type) types.add(String(r.report_type));
          if (r.templateId) types.add(String(r.templateId));
        });
        setReportTypeOptions((prev) => {
          const merged = new Set([...prev, ...types]);
          return Array.from(merged).sort((a, b) => a.localeCompare(b));
        });
      } catch (error) {
        console.error('Error fetching referral reports:', error);
        const message = error.response?.data?.error || 'Failed to fetch reports';
        toast.error(message);
        if (error.response?.status === 403) {
          navigate('/agent/referrals');
        }
      } finally {
        setLoading(false);
      }
    },
    [activeTab, dateRange.end, dateRange.start, navigate, reportType, searchQuery, targetUserId]
  );

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handleViewPdf = async (report) => {
    setSelectedReport(report);
    setShowPdfViewer(true);
    setLoadingPdf(true);

    try {
      const response = await api.get(
        `/users/referrals/${targetUserId}/reports/${report._id}/pdf?inline=true`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF preview');
      setShowPdfViewer(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadExcel = async (report) => {
    try {
      const response = await api.get(
        `/users/referrals/${targetUserId}/reports/${report._id}/excel`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.title || 'report'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedReport) return;
    try {
      const response = await api.get(
        `/users/referrals/${targetUserId}/reports/${selectedReport._id}/pdf`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport.title || 'report'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF');
    }
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setSelectedReport(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  return (
    <AgentLayout activeTab="referrals">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={() => navigate('/agent/referrals')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to referred users
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              Reports for {displayName}
            </h1>
            <p className="text-gray-500 mt-1">
              All reports generated by this referred user.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-56">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                title="Filter by report type"
              >
                <option value="">All Types</option>
                {reportTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by applicant name or title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} className="mr-2" />
              Filters
              {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
            </button>

            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Search
            </button>
          </form>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setSearchQuery('');
                    setReportType('');
                    setActiveTab('');
                    fetchReports(1);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto text-gray-300" size={60} />
              <p className="text-gray-500 mt-4">No reports found for this user</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-6">Report</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {reports.map((report) => (
                <div key={report._id} className="border-b border-gray-100 last:border-0">
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50">
                    <div className="col-span-6 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate" title={report.title}>
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full truncate"
                          title={report.templateId || report.report_type}
                        >
                          {report.templateId || report.report_type}
                        </span>
                        {report.client_name && (
                          <span className="text-xs text-gray-500 truncate" title={report.client_name}>
                            • {report.client_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="col-span-2">{getStatusBadge(report.validation_status)}</div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {report.pdf_file_url && (
                        <button
                          type="button"
                          onClick={() => handleViewPdf(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View PDF"
                        >
                          <Eye size={18} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadExcel(report)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>
                    </div>
                  </div>
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
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showPdfViewer && selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">{selectedReport.title} - PDF Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={closePdfViewer}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
              {loadingPdf ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-purple-600" size={48} />
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} className="w-full h-full" title="PDF Preview" />
              ) : (
                <p className="text-red-600">Failed to load PDF</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AgentLayout>
  );
};

export default AgentReferralUserReportsPage;
