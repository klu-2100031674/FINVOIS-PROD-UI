/**
 * Admin Reports Page
 * Full-featured admin dashboard for report validation workflow
 * - View pending, under review, approved, rejected reports
 * - Approve/Reject reports with notes
 * - View PDF and download Excel files
 * - Filter and search reports
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText,
  Check,
  X,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Mail,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  Upload,
  Settings
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import { useAuth } from '../../hooks';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const VALIDATION_STATUSES = [
  { value: '', label: 'All Reports', icon: FileText, color: 'gray' },
  { value: 'pending_validation', label: 'Pending', icon: Clock, color: 'yellow' },
  { value: 'under_review', label: 'Under Review', icon: AlertCircle, color: 'blue' },
  { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' }
];

const AdminReportsPage = () => {
  const { user } = useAuth();
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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  // Upload modal state
  const [uploadFile, setUploadFile] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Form data for modals
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk selection
  const [selectedReports, setSelectedReports] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin-reports/stats');
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab) params.append('status', activeTab);
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('page', page);
      params.append('limit', 20);

      const response = await api.get(`/admin-reports?${params.toString()}`);
      setReports(response.data?.data?.reports || []);
      setPagination(response.data?.data?.pagination || { current_page: 1, total_pages: 1 });
      setSelectedReports([]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, dateRange]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      await api.patch(`/admin-reports/${selectedReport._id}/approve`, {
        validation_notes: approvalNotes,
        send_email: sendEmail
      });
      
      toast.success('Report approved successfully');
      setShowApproveModal(false);
      setApprovalNotes('');
      setSelectedReport(null);
      fetchReports();
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
      await api.patch(`/admin-reports/${selectedReport._id}/reject`, {
        rejection_reason: rejectionReason,
        send_email: sendEmail
      });
      
      toast.success('Report rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedReport(null);
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnderReview = async (report) => {
    try {
      await api.patch(`/admin-reports/${report._id}/review`);
      toast.success('Report marked as under review');
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update report status');
    }
  };

  const handleViewPdf = async (report) => {
    setSelectedReport(report);
    setShowPdfViewer(true);
    setLoadingPdf(true);
    
    try {
      // Fetch PDF with authentication
      const response = await api.get(`/admin-reports/${report._id}/pdf?inline=true`, {
        responseType: 'blob'
      });
      
      // Create blob URL for iframe
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

  // Cleanup blob URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleBulkApprove = async () => {
    if (selectedReports.length === 0) return;
    
    if (!window.confirm(`Approve ${selectedReports.length} reports?`)) return;
    
    try {
      setBulkActionLoading(true);
      const response = await api.post('/admin-reports/bulk-approve', {
        report_ids: selectedReports,
        send_email: true
      });
      
      toast.success(response.data?.message || 'Bulk approval completed');
      setSelectedReports([]);
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error('Bulk approval failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadExcel = async (report) => {
    try {
      const response = await api.get(`/admin-reports/${report._id}/excel`, {
        responseType: 'blob'
      });
      
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
      toast.error('Failed to download Excel file');
    }
  };

  const handleOpenUploadModal = (report) => {
    setSelectedReport(report);
    setUploadFile(null);
    setRevisionNotes('');
    setShowUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      const validExts = ['.xlsx', '.xls'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      // Validate file size (25 MB)
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size must be less than 25 MB');
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUploadRevisedExcel = async () => {
    if (!selectedReport || !uploadFile) {
      toast.error('Please select an Excel file to upload');
      return;
    }
    
    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('excel', uploadFile);
      if (revisionNotes.trim()) {
        formData.append('revision_notes', revisionNotes.trim());
      }
      
      const response = await api.post(
        `/admin-reports/${selectedReport._id}/upload-revised-excel`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000 // 10 minutes timeout for PDF regeneration
        }
      );
      
      if (response.data?.success) {
        toast.success('Excel uploaded and PDF regenerated successfully');
        setShowUploadModal(false);
        setUploadFile(null);
        setRevisionNotes('');
        setSelectedReport(null);
        fetchReports();
      } else if (response.data?.partial_success) {
        toast.warning('Excel uploaded but PDF regeneration failed. You may need to retry.');
        setShowUploadModal(false);
        fetchReports();
      } else {
        toast.error(response.data?.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload revised Excel');
    } finally {
      setUploadLoading(false);
    }
  };

  const toggleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r._id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_validation: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Report Validation</h1>
            <p className="text-gray-500 mt-1">Review and approve submitted reports</p>
          </div>
          <button
            onClick={() => { fetchReports(); fetchStats(); }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div 
            onClick={() => setActiveTab('pending_validation')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
              activeTab === 'pending_validation' ? 'border-yellow-500' : 'border-transparent hover:border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Clock className="text-yellow-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{stats.pending}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Pending</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('under_review')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
              activeTab === 'under_review' ? 'border-blue-500' : 'border-transparent hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <AlertCircle className="text-blue-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{stats.under_review}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Under Review</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('approved')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
              activeTab === 'approved' ? 'border-green-500' : 'border-transparent hover:border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <CheckCircle className="text-green-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{stats.approved}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Approved</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('rejected')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
              activeTab === 'rejected' ? 'border-red-500' : 'border-transparent hover:border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <XCircle className="text-red-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{stats.rejected}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Rejected</p>
          </div>
          
          <div 
            onClick={() => setActiveTab('')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
              activeTab === '' ? 'border-purple-500' : 'border-transparent hover:border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <FileText className="text-purple-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Total</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, client name, template..."
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
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
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
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => { setDateRange({ start: '', end: '' }); setSearchQuery(''); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && activeTab === 'pending_validation' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-purple-700 font-medium">
              {selectedReports.length} report(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {bulkActionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                Bulk Approve
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto text-gray-300" size={60} />
              <p className="text-gray-500 mt-4">No reports found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                {activeTab === 'pending_validation' && (
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === reports.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                )}
                <div className={activeTab === 'pending_validation' ? 'col-span-3' : 'col-span-4'}>Report</div>
                <div className="col-span-2">User</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Report Rows */}
              {reports.map((report) => (
                <div key={report._id} className="border-b border-gray-100 last:border-0">
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50">
                    {/* Checkbox */}
                    {activeTab === 'pending_validation' && (
                      <div className="col-span-1 hidden md:block">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report._id)}
                          onChange={() => toggleSelectReport(report._id)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                      </div>
                    )}

                    {/* Report Info */}
                    <div className={activeTab === 'pending_validation' ? 'col-span-3' : 'col-span-4'}>
                      <h3 className="font-medium text-gray-800 truncate" title={report.title}>{report.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full truncate" title={report.templateId || report.report_type}>
                          {report.templateId || report.report_type}
                        </span>
                        {report.client_name && (
                          <span className="text-xs text-gray-500 truncate" title={report.client_name}>• {report.client_name}</span>
                        )}
                      </div>
                    </div>

                    {/* User */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {report.user_id?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{report.user_id?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{report.user_id?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {getStatusBadge(report.validation_status)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {/* View PDF */}
                      {report.pdf_file_url && (
                        <button
                          onClick={() => handleViewPdf(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View PDF"
                        >
                          <Eye size={18} />
                        </button>
                      )}

                      {/* Download Excel */}
                      <button
                        onClick={() => handleDownloadExcel(report)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>

                      {/* Approve/Reject buttons - only for under_review status (must start review first) */}
                      {report.validation_status === 'under_review' && (
                        <>
                          <button
                            onClick={() => { setSelectedReport(report); setShowApproveModal(true); }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => { setSelectedReport(report); setShowRejectModal(true); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}

                      {/* Mark as Under Review - Start Review button */}
                      {report.validation_status === 'pending_validation' && (
                        <button
                          onClick={() => handleMarkUnderReview(report)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          title="Start Review"
                        >
                          <AlertCircle size={16} />
                          <span>Start Review</span>
                        </button>
                      )}

                      {/* Upload Revised Excel - only for under_review status */}
                      {report.validation_status === 'under_review' && (
                        <button
                          onClick={() => handleOpenUploadModal(report)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Upload Revised Excel"
                        >
                          <Upload size={18} />
                        </button>
                      )}

                      {/* Expand */}
                      <button
                        onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedReport === report._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedReport === report._id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* User Details */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <User size={16} className="mr-2" />
                            User Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Name:</span> {report.user_id?.name}</p>
                            <p><span className="text-gray-500">Email:</span> {report.user_id?.email}</p>
                            <p><span className="text-gray-500">Phone:</span> {report.user_id?.phone || 'N/A'}</p>
                            <p><span className="text-gray-500">Role:</span> {report.user_id?.role}</p>
                          </div>
                        </div>

                        {/* Report Details */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FileText size={16} className="mr-2" />
                            Report Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Template:</span> {report.templateId}</p>
                            <p><span className="text-gray-500">Type:</span> {report.report_type || 'N/A'}</p>
                            <p><span className="text-gray-500">Client:</span> {report.client_name || 'N/A'}</p>
                            <p><span className="text-gray-500">Payment:</span> 
                              <span className={`ml-1 ${report.payment?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {report.payment?.status || 'N/A'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Validation Info */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CheckCircle size={16} className="mr-2" />
                            Validation Info
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Status:</span> {report.validation_status}</p>
                            {report.validated_by && (
                              <p><span className="text-gray-500">Validated By:</span> {report.validated_by?.name}</p>
                            )}
                            {report.validated_at && (
                              <p><span className="text-gray-500">Validated At:</span> {new Date(report.validated_at).toLocaleString('en-IN')}</p>
                            )}
                            {report.rejection_reason && (
                              <p className="text-red-600"><span className="text-gray-500">Reason:</span> {report.rejection_reason}</p>
                            )}
                          </div>
                        </div>

                        {/* Term Loan Analysis Options */}
                        {(report.requested_sheets?.length > 0 || report.analysis_options) && (
                          <div className="col-span-1 md:col-span-3 mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <Settings size={16} className="mr-2" />
                              Requested Analysis & Parameters
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {report.requested_sheets?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Requested Sheets</p>
                                  <div className="flex flex-wrap gap-2">
                                    {report.requested_sheets.map((sheet, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                        {sheet}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {report.analysis_options?.extra_data && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Analysis Parameters</p>
                                  <div className="space-y-2 text-sm">
                                    {report.analysis_options.extra_data.sensitivity && (
                                      <div className="p-2 bg-orange-50 rounded border border-orange-100">
                                        <p className="text-xs font-medium text-orange-800">Sensitivity Analysis</p>
                                        <p className="text-gray-700">Selling Price Decrease: <span className="font-bold">{report.analysis_options.extra_data.sensitivity.sellingPriceDecrease}%</span></p>
                                      </div>
                                    )}
                                    {report.analysis_options.extra_data.bep && (
                                      <div className="p-2 bg-green-50 rounded border border-green-100">
                                        <p className="text-xs font-medium text-green-800">BEP Analysis</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                          <p className="text-xs text-gray-500">Unit: <span className="text-gray-800 font-medium">{report.analysis_options.extra_data.bep.productManufactured}</span></p>
                                          <p className="text-xs text-gray-500">Price: <span className="text-gray-800 font-medium">₹{report.analysis_options.extra_data.bep.sellingPricePerUnit}</span></p>
                                          <p className="text-xs text-gray-500">Growth: <span className="text-gray-800 font-medium">{report.analysis_options.extra_data.bep.sellingPriceGrowth}%</span></p>
                                          <p className="text-xs text-gray-500">Capacity: <span className="text-gray-800 font-medium">{report.analysis_options.extra_data.bep.plantCapacity}</span></p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
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
              onClick={() => fetchReports(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Approve Report</h2>
              <p className="text-gray-500 mt-1">{selectedReport.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes for internal reference..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded mr-2"
                />
                <span className="text-sm text-gray-700">Send approval email to user</span>
              </label>

              {user?.signature_url ? (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-800">Signature will be applied</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">Your digital signature will be automatically added to the PDF.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertCircle className="text-amber-600" size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-800">No signature found</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Upload your signature in Profile to include it in reports.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowApproveModal(false); setSelectedReport(null); setApprovalNotes(''); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Reject Report</h2>
              <p className="text-gray-500 mt-1">{selectedReport.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Please explain why this report is being rejected..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded mr-2"
                />
                <span className="text-sm text-gray-700">Send rejection email to user</span>
              </label>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedReport(null); setRejectionReason(''); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <X size={16} className="mr-2" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">{selectedReport.title} - PDF Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/admin-reports/${selectedReport._id}/pdf`, {
                        responseType: 'blob'
                      });
                      const blob = new Blob([response.data], { type: 'application/pdf' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${selectedReport.title}.pdf`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success('PDF downloaded successfully');
                    } catch (error) {
                      toast.error('Failed to download PDF');
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
                <button
                  onClick={() => { 
                    setShowPdfViewer(false); 
                    setSelectedReport(null);
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
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
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <p className="text-red-600">Failed to load PDF</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Revised Excel Modal */}
      {showUploadModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Upload Revised Excel</h2>
              <p className="text-gray-500 mt-1">{selectedReport.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> Uploading a revised Excel will regenerate the PDF report automatically.
                  The original files will be kept in the revision history.
                </p>
              </div>

              {user?.signature_url && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-800">Signature will be applied</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">Your digital signature will be automatically added to the regenerated PDF.</p>
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploadFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="text-green-600" size={24} />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">{uploadFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-600">
                        Click to select or drag & drop Excel file
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Max size: 25 MB (.xlsx, .xls)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revision Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revision Notes (Optional)
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe what was changed..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { 
                  setShowUploadModal(false); 
                  setSelectedReport(null); 
                  setUploadFile(null);
                  setRevisionNotes('');
                }}
                disabled={uploadLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadRevisedExcel}
                disabled={uploadLoading || !uploadFile}
                className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Uploading & Regenerating...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload & Regenerate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReportsPage;
