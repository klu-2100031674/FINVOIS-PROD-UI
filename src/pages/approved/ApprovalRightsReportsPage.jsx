/**
 * Approval Rights Reports Page
 * Cloned from AdminReportsPage for Channel Partner / Customer Service with Approval Rights.
 * Full validation workflow except Download Excel and Upload Revised Excel.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  FileText,
  Check,
  X,
  Eye,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Calendar,
  MessageSquare,
  MessageCircle,
  Loader2,
  Settings,
  Building2,
  Trash2
} from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import ClientLayout from '../../components/layouts/ClientLayout';
import { useAuth } from '../../hooks';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import { reportRequiresCaStamp } from '../../utils/frccFormUi';
import caIndiaStamp from '../../assets/CA_INDIA.jpg';
import {
  buildSheetCatalog,
  isSheetInSelection,
  normalizeSheetKey,
  toggleSheetInSelection,
} from '../../utils/sheetCatalog';
import { getTemplateDisplayName } from '../../utils/templateSectorConfig';
import { buildDedupedReportTypeOptions } from '../../utils/reportTypeOptions';
import { effectiveUserRole } from '../../utils/normalizeUserRole';

const getReportCompanyName = (report) => {
  if (report?.companyId?.companyName) return report.companyId.companyName;
  if (report?.user_id?.companyId?.companyName) return report.user_id.companyId.companyName;
  if (report?.user_id?.company_name) return report.user_id.company_name;
  return null;
};

const getReportNatureOfBusiness = (report) => {
  if (report?.nature_of_business) return report.nature_of_business;

  const fd = report?.form_data || {};
  const prompts = fd?.prompts_data || {};
  const general = fd?.['General Information'] || {};

  const NATURE_CELL_BY_TEMPLATE = {
    'CC1': 'i10', 'GOLD_LOAN': 'i10', 'CC2': 'i9', 'CC3': 'i10', 'CC4': 'i9', 'CC5': 'i9', 'CC6': 'i8', 'CC7': 'i9',
    'TERM_LOAN_CC': 'i15',
    'TERM_LOAN_SERVICE_WITHOUT_STOCK': 'i15',
    'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK': 'i15',
    'TERM_LOAN_EV_VEHICLE': 'i15',
    'TERM_LOAN_OTHER_THAN_EV_VEHICLE': 'i15',
    'TERM_LOAN_JCB_VEHICLE': 'i15',
    'TERM_LOAN_DRONE_VEHICLE': 'i15',
  };

  const rawId = (report?.templateId || report?.report_type || '').toUpperCase();
  const ccMatch = rawId.match(/CC(\d+)/);
  const normalizedTemplateId = ccMatch
    ? `CC${ccMatch[1]}`
    : Object.keys(NATURE_CELL_BY_TEMPLATE).find((key) => rawId.startsWith(key)) || rawId;
  const natureCellKey = NATURE_CELL_BY_TEMPLATE[normalizedTemplateId];

  return (
    prompts?.firm_constitution?.nature_of_business ||
    prompts?.product_details?.main_product ||
    (natureCellKey && general[natureCellKey]) ||
    fd?.natureOfFirm ||
    fd?.natureOfBusiness ||
    fd?.nature_of_business ||
    fd?.lineOfActivity ||
    fd?.businessActivity ||
    fd?.industryType ||
    report?.report_metadata?.nature_of_business ||
    'N/A'
  );
};

const isFrccReport = (templateId) => {
  if (String(templateId || '').trim().toUpperCase() === 'GOLD_LOAN') return true;
  const match = String(templateId || '').toUpperCase().match(/CC(\d+)/);
  if (match) {
    const ccNumber = parseInt(match[1], 10);
    return ccNumber >= 1 && ccNumber <= 7;
  }
  return [
    'TERM_LOAN_CC',
    'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
    'TERM_LOAN_SERVICE_WITHOUT_STOCK',
    'TERM_LOAN_EV_VEHICLE',
    'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
    'TERM_LOAN_JCB_VEHICLE',
    'TERM_LOAN_DRONE_VEHICLE'
  ].includes(String(templateId).trim().toUpperCase());
};

const getFrcc1StampEnabled = (report) => report?.report_metadata?.frcc1PlbsStampEnabled === true;

const showCaStampSlot = (validationStatus) =>
  validationStatus === 'approved' || validationStatus === 'under_review';

const VALIDATION_STATUSES = [
  { value: '', label: 'All Reports', icon: FileText, color: 'gray' },
  { value: 'pending_validation', label: 'Pending', icon: Clock, color: 'yellow' },
  { value: 'under_review', label: 'Under Review', icon: AlertCircle, color: 'blue' },
  { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' }
];

const STATS_OFFSETS = {
  pending: 0,
  under_review: 0,
  approved: 4492,
  rejected: 0
};

const ApprovalRightsReportsPage = () => {
  const { user } = useAuth();
  const role = effectiveUserRole(user);
  const isAgent = role === 'agent';
  // Company admins are routed to /company/reports via SuperAdminRoute, so this
  // page is effectively super-admin-only. The legacy `isCompanyAdmin` flag is
  // kept (defaulting false) to avoid touching a lot of downstream JSX.
  const isCompanyAdmin = false;
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const fetchSeqRef = useRef(0);
  const [activeTab, setActiveTab] = useState('pending_validation');
  const [expandedReport, setExpandedReport] = useState(null);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [reportType, setReportType] = useState(''); // backend filter: report_type
  const [reportTypeOptions, setReportTypeOptions] = useState([]);
  const [contentKind, setContentKind] = useState(''); // 'report' | 'theory'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [groupByCompany, setGroupByCompany] = useState(false);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);


  // Form data for modals
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk selection
  const [selectedReports, setSelectedReports] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const showBulkSelect = activeTab === 'pending_validation' || activeTab === 'under_review' || activeTab === '';
  const [stampTogglingId, setStampTogglingId] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [activeShareType, setActiveShareType] = useState(null); // 'email', 'whatsapp', or null
  // WhatsApp gateway health — null = loading, true = connected, false = disconnected
  const [waConnected, setWaConnected] = useState(null);

  // Sheet updates and selection states
  const [templateConfigs, setTemplateConfigs] = useState({}); // templateId -> template config
  const [selectedReportSheets, setSelectedReportSheets] = useState({}); // reportId -> selected sheet names
  const [updatingSheetsId, setUpdatingSheetsId] = useState(null); // reportId being updated

  const displayStats = useMemo(() => {
    const pending = (stats.pending ?? 0) + STATS_OFFSETS.pending;
    const under_review = (stats.under_review ?? 0) + STATS_OFFSETS.under_review;
    const approved = (stats.approved ?? 0) + STATS_OFFSETS.approved;
    const rejected = (stats.rejected ?? 0) + STATS_OFFSETS.rejected;
    return {
      pending,
      under_review,
      approved,
      rejected,
      total: pending + under_review + approved + rejected
    };
  }, [stats]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (companyFilter) params.append('company_id', companyFilter);
      const query = params.toString();
      const response = await api.get(`/admin-reports/stats${query ? `?${query}` : ''}`);
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [companyFilter]);

  const fetchReportTypes = useCallback(async () => {
    try {
      const response = await api.get('/admin-reports/meta/report-types');
      const apiOptions = response.data?.data?.options;
      if (Array.isArray(apiOptions) && apiOptions.length > 0) {
        setReportTypeOptions(
          apiOptions
            .map((opt) => ({
              value: String(opt.value || opt).trim(),
              label: String(opt.label || opt.value || opt).trim(),
            }))
            .filter((opt) => opt.value)
        );
        return;
      }
      const types = response.data?.data?.report_types || [];
      const templateIds = response.data?.data?.template_ids || [];
      setReportTypeOptions(buildDedupedReportTypeOptions(types, templateIds));
    } catch (error) {
      console.error('Error fetching report types:', error);
    }
  }, []);

  const fetchReports = useCallback(async (page = 1) => {
    const seq = ++fetchSeqRef.current;
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params = new URLSearchParams();
      if (activeTab) params.append('status', activeTab);
      if (reportType) params.append('report_type', reportType);
      if (contentKind) params.append('content_kind', contentKind);
      if (companyFilter) params.append('company_id', companyFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('page', page);
      params.append('limit', 20);

      const response = await api.get(`/admin-reports?${params.toString()}`);
      if (seq !== fetchSeqRef.current) return;
      setReports(response.data?.data?.reports || []);
      setPagination(response.data?.data?.pagination || { current_page: 1, total_pages: 1 });
      setSelectedReports([]);
      hasLoadedRef.current = true;
    } catch (error) {
      if (seq !== fetchSeqRef.current) return;
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeTab, reportType, contentKind, companyFilter, searchQuery, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchReports();
    // Tab/company only — search is applied via Search button / Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, companyFilter]);

  useEffect(() => {
    fetchReportTypes();
  }, [fetchReportTypes]);

  // Check WhatsApp gateway connection status once on mount
  useEffect(() => {
    let cancelled = false;
    api.get('/admin-reports/whatsapp-status')
      .then((res) => {
        if (!cancelled) setWaConnected(res.data?.connected === true);
      })
      .catch(() => {
        if (!cancelled) setWaConnected(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Approval Rights users cannot call admin company list API — skip to avoid 403 latency.
  useEffect(() => {
    setCompanies([]);
  }, []);

  const reportsByCompany = useMemo(() => {
    if (!groupByCompany) return null;
    const groups = new Map();
    for (const report of reports) {
      const name = getReportCompanyName(report) || 'Unassigned';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(report);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [reports, groupByCompany]);

  const fetchTemplateConfig = useCallback(async (templateId) => {
    if (!templateId || templateConfigs[templateId]) return;
    try {
      const response = await api.get(`/template-config/${templateId}`);
      if (response.data?.success) {
        setTemplateConfigs((prev) => ({
          ...prev,
          [templateId]: response.data.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching template config for ${templateId}:`, error);
    }
  }, [templateConfigs]);

  // Load template config and initialize sheets selection on report expansion
  useEffect(() => {
    if (expandedReport) {
      const report = reports.find((r) => r._id === expandedReport);
      if (report) {
        if (report.templateId) {
          fetchTemplateConfig(report.templateId);
        }
        setSelectedReportSheets((prev) => ({
          ...prev,
          [report._id]: report.requested_sheets || []
        }));
      }
    }
  }, [expandedReport, reports, fetchTemplateConfig]);

  const handleToggleSheet = (reportId, sheetName, templateId) => {
    setSelectedReportSheets((prev) => ({
      ...prev,
      [reportId]: toggleSheetInSelection(prev[reportId] || [], sheetName, templateId),
    }));
  };

  const handleUpdateReportSheets = async (report) => {
    const selectedSheets = selectedReportSheets[report._id];
    if (!selectedSheets || selectedSheets.length === 0) {
      toast.error('Please select at least one sheet.');
      return;
    }

    try {
      setUpdatingSheetsId(report._id);
      const response = await api.post(
        `/admin-reports/${report._id}/regenerate`,
        { requested_sheets: selectedSheets },
        { timeout: 600000 }
      );

      if (response.data?.success) {
        toast.success('Report regenerated successfully with selected sheets');

        // Update reports state with new pdf url and requested_sheets
        setReports((prev) =>
          prev.map((item) =>
            item._id === report._id
              ? {
                ...item,
                pdf_file_url: response.data.data.new_pdf_url,
                requested_sheets: response.data.data.requested_sheets || selectedSheets,
                all_available_sheets: response.data.data.all_available_sheets || item.all_available_sheets
              }
              : item
          )
        );
        setSelectedReportSheets((prev) => ({
          ...prev,
          [report._id]: response.data.data.requested_sheets || selectedSheets
        }));
      } else {
        toast.error(response.data?.error || 'Failed to update report sheets');
      }
    } catch (error) {
      console.error('Error updating report sheets:', error);
      toast.error(error.response?.data?.error || 'An error occurred while updating report sheets');
    } finally {
      setUpdatingSheetsId(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handleFrcc1StampToggle = async (report, enabled) => {
    if (!report?._id) return;
    const previousEnabled = getFrcc1StampEnabled(report);

    setReports((prev) =>
      prev.map((item) =>
        item._id === report._id
          ? {
            ...item,
            report_metadata: {
              ...(item.report_metadata || {}),
              frcc1PlbsStampEnabled: enabled,
            },
          }
          : item
      )
    );

    try {
      setStampTogglingId(report._id);
      const response = await api.patch(`/admin-reports/${report._id}/frcc1-stamp`, { enabled });
      const nextEnabled = response.data?.data?.frcc1PlbsStampEnabled === true;
      setReports((prev) =>
        prev.map((item) =>
          item._id === report._id
            ? {
              ...item,
              report_metadata: {
                ...(item.report_metadata || {}),
                frcc1PlbsStampEnabled: nextEnabled,
              },
              pdf_file_url: response.data?.data?.pdf_file_url || item.pdf_file_url,
            }
            : item
        )
      );
      toast.success(
        enabled
          ? 'CA stamp applied to report PDF'
          : 'CA stamp removed from PDF'
      );
    } catch (error) {
      const apiError = error.response?.data?.error || error.response?.data?.message;
      setReports((prev) =>
        prev.map((item) =>
          item._id === report._id
            ? {
              ...item,
              report_metadata: {
                ...(item.report_metadata || {}),
                frcc1PlbsStampEnabled: previousEnabled,
              },
            }
            : item
        )
      );
      toast.error(apiError || 'Failed to update CA stamp');
    } finally {
      setStampTogglingId(null);
    }
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
      const endpoint = (report.is_re_review || report.validation_status === 'rejected')
        ? `/admin-reports/${report._id}/re-review`
        : `/admin-reports/${report._id}/review`;
      await api.patch(endpoint);
      toast.success(report.is_re_review || report.validation_status === 'rejected' ? 'Report moved to under review for re-review' : 'Report marked as under review');
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update report status');
    }
  };

  const handleMoveToPending = async (report) => {
    try {
      await api.patch(`/admin-reports/${report._id}/pending`);
      toast.success('Report moved to pending section');
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to move report to pending');
    }
  };

  const handleBulkMoveToPending = async () => {
    if (selectedReports.length === 0) return;
    try {
      setBulkActionLoading(true);
      await api.post('/admin-reports/bulk-pending', { report_ids: selectedReports });
      toast.success(`Moved ${selectedReports.length} report(s) to pending section`);
      setSelectedReports([]);
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to bulk move reports to pending');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleViewPdf = async (report) => {
    setSelectedReport(report);
    setEmailInput(report?.user_id?.email || '');
    setWhatsappInput(report?.user_id?.phone || '');
    setActiveShareType(null);
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

  const handleSendEmail = async () => {
    if (!selectedReport) return;
    if (!emailInput.trim()) {
      toast.error('Please enter a recipient email address.');
      return;
    }

    if (!window.confirm(`Send report via email to ${emailInput.trim()}?`)) {
      return;
    }

    try {
      setSendingEmail(true);
      const response = await api.post(`/admin-reports/${selectedReport._id}/email`, {
        email: emailInput.trim()
      });
      toast.success(response.data?.message || 'Report sent via email successfully.');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error(
        typeof error === 'string' ? error : error?.response?.data?.error || error?.message || 'Failed to send report email'
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!selectedReport) return;
    if (!whatsappInput.trim()) {
      toast.error('Please enter a recipient phone number.');
      return;
    }

    if (!window.confirm(`Send report via WhatsApp to ${whatsappInput.trim()}?`)) {
      return;
    }

    try {
      setSendingWhatsapp(true);
      const response = await api.post(`/admin-reports/${selectedReport._id}/whatsapp`, {
        phone: whatsappInput.trim()
      });
      toast.success(response.data?.message || 'Report sent via WhatsApp successfully.');
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      toast.error(
        typeof error === 'string' ? error : error?.response?.data?.error || error?.message || 'Failed to send WhatsApp report'
      );
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleBulkReview = async () => {
    if (selectedReports.length === 0) return;

    if (!window.confirm(`Move ${selectedReports.length} report(s) to under review?`)) return;

    try {
      setBulkActionLoading(true);
      const response = await api.post('/admin-reports/bulk-review', {
        report_ids: selectedReports,
      });

      toast.success(response.data?.message || 'Reports moved to under review');
      setSelectedReports([]);
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error('Bulk review failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

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

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await api.post('/admin-reports/bulk-delete', {
        report_ids: selectedReports,
      });

      toast.success(response.data?.message || 'Bulk delete completed');
      setShowBulkDeleteModal(false);
      setSelectedReports([]);
      fetchReports();
      fetchStats();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Bulk delete failed');
    } finally {
      setBulkActionLoading(false);
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

  const getStatusBadge = (status, report) => {
    if (report?.is_re_review && (status === 'under_review' || status === 'pending_validation')) {
      return (
        <span className="inline-block max-w-full truncate px-2 py-1 text-xs font-semibold rounded-full bg-purple-200 text-purple-800 border border-purple-300" title="Re-Review Report">
          Re-Review
        </span>
      );
    }
    const statusConfig = {
      pending_validation: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      under_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Under Validation for CA' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Validated by CA' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-block max-w-full truncate px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`} title={config.label}>
        {config.label}
      </span>
    );
  };

  const pageBody = (
    <>
      <div className="p-6 w-full max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isCompanyAdmin ? 'Company DPRs' : 'Report Validation'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isCompanyAdmin
                ? 'View, review, and validate Detailed Project Reports generated by users in your company.'
                : 'Review and approve submitted reports'}
            </p>
          </div>
          <button
            onClick={() => { fetchReports(); fetchStats(); fetchReportTypes(); }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div
            onClick={() => setActiveTab('pending_validation')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'pending_validation' ? 'border-yellow-500' : 'border-transparent hover:border-yellow-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <Clock className="text-yellow-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{displayStats.pending}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Pending</p>
          </div>

          <div
            onClick={() => setActiveTab('under_review')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'under_review' ? 'border-[#7e22ce]' : 'border-transparent hover:border-purple-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <AlertCircle className="text-purple-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{displayStats.under_review}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Under Review</p>
          </div>

          <div
            onClick={() => setActiveTab('approved')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'approved' ? 'border-green-500' : 'border-transparent hover:border-green-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <CheckCircle className="text-green-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{displayStats.approved}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Approved</p>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'rejected' ? 'border-red-500' : 'border-transparent hover:border-red-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <XCircle className="text-red-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{displayStats.rejected}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Rejected</p>
          </div>

          <div
            onClick={() => setActiveTab('')}
            className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${activeTab === '' ? 'border-purple-500' : 'border-transparent hover:border-purple-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <FileText className="text-purple-500" size={24} />
              <span className="text-2xl font-bold text-gray-800">{displayStats.total}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Total</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full sm:w-44 shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                title="Filter by report type"
              >
                <option value="">All report types</option>
                {reportTypeOptions.map((opt) => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? getTemplateDisplayName(opt) : (opt.label || getTemplateDisplayName(opt.value));
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <select
                value={contentKind}
                onChange={(e) => setContentKind(e.target.value)}
                className="w-full sm:w-40 shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                title="Filter by content kind"
              >
                <option value="">All kinds</option>
                <option value="report">Reports</option>
                <option value="theory">Theory Pages</option>
              </select>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, email, company, applicant, title..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters
                  ? 'border-purple-300 bg-purple-50 text-purple-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                aria-expanded={showAdvancedFilters}
              >
                <SlidersHorizontal size={16} />
                Advanced filters
                {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="pt-3 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                        title="Filter by company"
                      >
                        <option value="">All companies</option>
                        {companies.map((company) => {
                          const id = company._id ?? company.id;
                          return (
                            <option key={id} value={id}>
                              {company.companyName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={groupByCompany}
                      onChange={(e) => setGroupByCompany(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    Group by company
                  </label>
                  {(companyFilter || searchQuery || reportType || contentKind || dateRange.start || dateRange.end || groupByCompany) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setSearchQuery('');
                        setReportType('');
                        setContentKind('');
                        setCompanyFilter('');
                        setGroupByCompany(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>

          {companyFilter && (
            <p className="mt-3 text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <Building2 size={16} />
              Showing reports for{" "}
              <span className="font-medium">
                {companies.find((c) => String(c._id ?? c.id) === String(companyFilter))?.companyName || 'selected company'}
              </span>
            </p>
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
                onClick={handleBulkReview}
                disabled={bulkActionLoading}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {bulkActionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <AlertCircle size={16} className="mr-2" />}
                Move to Under Review
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

        {selectedReports.length > 0 && activeTab === 'under_review' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-green-700 font-medium">
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
        {selectedReports.length > 0 && activeTab === '' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-red-700 font-medium">
              {selectedReports.length} report(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={bulkActionLoading}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} className="mr-2" />
                Bulk Delete
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
        <div className={`bg-white rounded-xl shadow-sm overflow-hidden min-h-[28rem] relative ${refreshing ? 'opacity-80' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20 min-h-[28rem]">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 min-h-[28rem] flex flex-col items-center justify-center">
              <FileText className="mx-auto text-gray-300" size={60} />
              <p className="text-gray-500 mt-4">No reports found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                {showBulkSelect && (
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === reports.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                )}
                <div className={showBulkSelect ? 'col-span-3' : 'col-span-4'}>Report</div>
                <div className="col-span-2">User</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {/* Report Rows */}
              {(groupByCompany && reportsByCompany ? reportsByCompany : [['', reports]]).map(([companyName, companyReports]) => (
                <React.Fragment key={companyName || 'all-reports'}>
                  {groupByCompany && companyName && (
                    <div className="bg-purple-50/80 px-6 py-2.5 border-b border-purple-100 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-purple-900">
                        <Building2 size={16} className="text-purple-600" />
                        {companyName}
                      </span>
                      <span className="text-xs text-purple-700 bg-white/80 px-2 py-0.5 rounded-full border border-purple-100">
                        {companyReports.length} report{companyReports.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                  {companyReports.map((report) => (
                    <div key={report._id} className="border-b border-gray-100 last:border-0">
                      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50">
                        {/* Checkbox */}
                        {showBulkSelect && (
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
                        <div className={`${showBulkSelect ? 'col-span-3' : 'col-span-4'} min-w-0`}>
                          <h3 className="font-medium text-gray-800 truncate" title={report.title}>{report.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full truncate" title={report.templateId || report.report_type}>
                              {getTemplateDisplayName(report.templateId || report.report_type)}
                            </span>
                            {(report.content_kind === 'theory' || String(report.templateId || '').startsWith('THEORY_')) && (
                              <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                Theory Page
                              </span>
                            )}
                            {reportRequiresCaStamp(report) && (
                              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                Required CA Stamp
                              </span>
                            )}
                            {report.client_name && (
                              <span className="text-xs text-gray-500 truncate" title={report.client_name}>• {report.client_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate" title={report.user_id?.name || 'Unknown'}>
                            {report.user_id?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={report.user_id?.email}>
                            {report.user_id?.email}
                          </p>
                          {getReportCompanyName(report) && (
                            <div
                              className="flex items-center gap-1.5 mt-0.5 min-w-0"
                              title={getReportCompanyName(report)}
                            >
                              <Building2 size={14} className="text-purple-500 shrink-0" aria-hidden />
                              <p className="text-xs text-purple-700 truncate">
                                {getReportCompanyName(report)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="col-span-1 min-w-0 flex flex-col justify-center">
                          <p className="text-sm text-gray-600 truncate">
                            {new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {new Date(report.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 min-w-0 pr-2">
                          {getStatusBadge(report.validation_status, report)}
                        </div>

                        {/* Actions — fixed stamp slot keeps buttons aligned across rows */}
                        <div className="col-span-3 flex items-center justify-end gap-1.5 min-w-0">
                          {showCaStampSlot(report.validation_status) && (
                            <div className="w-10 h-9 shrink-0 flex items-center justify-center">
                              {isFrccReport(report.templateId) ? (
                                <button
                                  type="button"
                                  title="CA Stamp"
                                  aria-pressed={getFrcc1StampEnabled(report)}
                                  disabled={stampTogglingId === report._id}
                                  onClick={() =>
                                    handleFrcc1StampToggle(report, !getFrcc1StampEnabled(report))
                                  }
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:cursor-wait"
                                >
                                  {stampTogglingId === report._id ? (
                                    <Loader2 size={14} className="animate-spin text-purple-600" />
                                  ) : (
                                    <img
                                      src={caIndiaStamp}
                                      alt="CA India stamp"
                                      className={`h-7 w-auto object-contain transition-opacity duration-200 ${getFrcc1StampEnabled(report) ? 'opacity-100' : 'opacity-20'
                                        }`}
                                    />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          )}

                          {report.pdf_file_url && (
                            <button
                              onClick={() => handleViewPdf(report)}
                              className="p-2 text-[#7e22ce] hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                              title="View PDF"
                            >
                              <Eye size={18} />
                            </button>
                          )}

                          {report.validation_status === 'under_review' && (
                            <>
                              <button
                                onClick={() => { setSelectedReport(report); setShowApproveModal(true); }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors shrink-0"
                                title="Approve"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => { setSelectedReport(report); setShowRejectModal(true); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                title="Reject"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}

                          {['pending_validation', 'rejected'].includes(report.validation_status) && (
                            <button
                              onClick={() => handleMarkUnderReview(report)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#7e22ce] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 shrink-0"
                              title={report.is_re_review || report.validation_status === 'rejected' ? "Start Re-Review" : "Start Review"}
                            >
                              <AlertCircle size={16} />
                              <span>{report.is_re_review || report.validation_status === 'rejected' ? "Re-Review" : "Start Review"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                          >
                            {expandedReport === report._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedReport === report._id && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <div className={`grid grid-cols-1 gap-6 ${report.user_comment ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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
                                {getReportCompanyName(report) && (
                                  <p><span className="text-gray-500">Company:</span> {getReportCompanyName(report)}</p>
                                )}
                              </div>
                            </div>

                            {/* Report Details */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <FileText size={16} className="mr-2" />
                                Report Details
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Nature of Business:</span> {report.nature_of_business || getReportNatureOfBusiness(report)}</p>
                                <p><span className="text-gray-500">Project Cost:</span> {report.project_cost || 'N/A'}</p>
                                <p><span className="text-gray-500">Term Period:</span> {report.term_period || 'N/A'}</p>
                                <p><span className="text-gray-500">Mobile No:</span> {report.mobile_no || report.user_id?.mobile || report.user_id?.phone || 'N/A'}</p>
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
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center flex-wrap gap-2">
                                <CheckCircle size={16} className="mr-1" />
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

                            {/* User Comment */}
                            {report.user_comment && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <MessageSquare size={16} className="mr-2" />
                                  User Comment
                                </h4>
                                <div className="space-y-1 text-sm bg-white p-3 rounded-lg border border-gray-200 min-h-[80px]">
                                  <p className="text-gray-700 whitespace-pre-wrap">{report.user_comment}</p>
                                </div>
                              </div>
                            )}

                            {/* Term Loan Analysis Options */}
                            {(() => {
                              const sheetCatalog = buildSheetCatalog({
                                allAvailable: report.all_available_sheets,
                                fullReportSheets: templateConfigs[report.templateId]?.full_report_sheets,
                                requested: report.requested_sheets,
                                selected: selectedReportSheets[report._id],
                                templateId: report.templateId,
                              });
                              const hasSheetSection = sheetCatalog.length > 0 || report.analysis_options;
                              if (!hasSheetSection) return null;

                              const activeSelection = selectedReportSheets[report._id] ?? report.requested_sheets ?? [];

                              return (
                                <div className={`col-span-1 mt-4 pt-4 border-t border-gray-200 ${report.user_comment ? 'md:col-span-4' : 'md:col-span-3'}`}>
                                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                      <Settings size={16} className="mr-2 text-purple-600" />
                                      Requested Analysis & Parameters
                                    </h4>
                                    {sheetCatalog.length > 0 && (
                                      <button
                                        onClick={() => handleUpdateReportSheets(report)}
                                        disabled={updatingSheetsId === report._id}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                                      >
                                        {updatingSheetsId === report._id ? (
                                          <>
                                            <Loader2 size={12} className="animate-spin mr-1" />
                                            <span>Updating...</span>
                                          </>
                                        ) : (
                                          <>
                                            <RefreshCw size={12} className="mr-1" />
                                            <span>Update</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sheetCatalog.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Requested Sheets</p>
                                        <div className="flex flex-wrap gap-2">
                                          {sheetCatalog.map((sheet) => {
                                            const isSelected = isSheetInSelection(
                                              sheet,
                                              activeSelection,
                                              report.templateId
                                            );
                                            return (
                                              <label
                                                key={normalizeSheetKey(sheet) || sheet}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer select-none transition-all ${isSelected
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium'
                                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
                                                  }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => handleToggleSheet(report._id, sheet, report.templateId)}
                                                  className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                                />
                                                <span>{sheet}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {/* Analysis Parameters section removed from UI
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
                                    */}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
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

      {/* Bulk Delete Confirmation Modal (Total tab only) */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Delete reports permanently?</h2>
              <p className="text-gray-500 mt-1">
                You are about to permanently delete {selectedReports.length} report
                {selectedReports.length === 1 ? '' : 's'}. This cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-red-50 border-y border-red-100">
              <p className="text-sm text-red-800">
                Hard delete removes the report records from the database (same as single report delete).
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkActionLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading || selectedReports.length === 0}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {bulkActionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Trash2 size={16} className="mr-2" />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle className="text-[#7e22ce]" size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-800">Signature will be applied</p>
                    <p className="text-[10px] text-[#7e22ce] mt-0.5">Your digital signature will be automatically added to the PDF.</p>
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
              <div className="p-4 border-b border-gray-200 flex justify-between items-center gap-4 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800 truncate min-w-0 flex-1" title={`${selectedReport.title} - PDF Preview`}>
                  {selectedReport.title} <span className="text-gray-400 font-normal text-sm hidden sm:inline">- PDF Preview</span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {activeShareType === null ? (
                    <>
                      {/* Email Option Button */}
                      <button
                        onClick={() => setActiveShareType('email')}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                        title="Share via Email"
                      >
                        <Mail size={14} className="mr-1.5" />
                        Email
                      </button>

                      {/* WhatsApp Option Button + connection badge */}
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={() => setActiveShareType('whatsapp')}
                          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                          title={
                            waConnected === null
                              ? 'Checking WhatsApp gateway…'
                              : waConnected
                              ? 'WhatsApp gateway is connected'
                              : 'WhatsApp gateway is DISCONNECTED — messages may fail'
                          }
                        >
                          <MessageCircle size={14} className="mr-1.5" />
                          WhatsApp
                        </button>
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            waConnected === null
                              ? 'bg-gray-400 animate-pulse'
                              : waConnected
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                          title={
                            waConnected === null
                              ? 'Checking…'
                              : waConnected
                              ? 'WhatsApp Connected'
                              : 'WhatsApp Disconnected'
                          }
                        />
                      </div>
                    </>
                  ) : activeShareType === 'email' ? (
                    /* Email Input & Send Button */
                    <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="px-2 py-1 text-sm bg-transparent outline-none w-48 text-gray-700 font-normal"
                        placeholder="Recipient email"
                        title="Recipient Email"
                        autoFocus
                      />
                      <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {sendingEmail ? (
                          <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <Mail size={14} className="mr-1.5" />
                        )}
                        Send
                      </button>
                      <button
                        onClick={() => setActiveShareType(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-1"
                        title="Back"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* WhatsApp Input & Send Button */
                    <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-gray-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
                      <input
                        type="text"
                        value={whatsappInput}
                        onChange={(e) => setWhatsappInput(e.target.value)}
                        className="px-2 py-1 text-sm bg-transparent outline-none w-36 text-gray-700 font-normal"
                        placeholder="WhatsApp phone"
                        title="WhatsApp Phone"
                        autoFocus
                      />
                      <button
                        onClick={handleSendWhatsapp}
                        disabled={sendingWhatsapp}
                        className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {sendingWhatsapp ? (
                          <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <MessageCircle size={14} className="mr-1.5" />
                        )}
                        Send
                      </button>
                      <button
                        onClick={() => setActiveShareType(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-1"
                        title="Back"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
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
                        toast.error(
                          typeof error === 'string' ? error : error?.message || 'Failed to download PDF'
                        );
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
                      setActiveShareType(null);
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
    </>
  );

  if (isAgent) {
    return <AgentLayout activeTab="approved-reports">{pageBody}</AgentLayout>;
  }
  return <ClientLayout wideContent>{pageBody}</ClientLayout>;
};

export default ApprovalRightsReportsPage;
