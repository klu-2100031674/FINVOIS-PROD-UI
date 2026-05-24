/**
 * Reports Page
 * View all generated reports
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks';
import ReactDOM from 'react-dom/client';
import ClientLayout from '../components/layouts/ClientLayout';
import { AdminLayout } from '../components/layouts';
import {
  fetchReports,
  selectReports,
  selectReportLoading,
} from '../store/slices/reportSlice';
import { Button, Loading } from '../components/common';
import { reportAPI } from '../api/endpoints';
import { formatDate, formatDateTime, downloadUserReportFile } from '../utils';
import toast from 'react-hot-toast';
import Invoice from '../components/Invoice';
import { effectiveUserRole } from '../utils/normalizeUserRole';

// PDF generation libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Lucide-react icons for modern UI
import {
  FileText,
  FileStack,
  Download,
  FolderOpen, // For empty state
  CheckCircle, // For approved status
  Clock, // For pending status
  XCircle, // For rejected status
  FileX, // For draft status
  Receipt, // For invoice button
  Calendar, // For date filter
  Filter, // For filter icon
  X, // For close/clear
} from 'lucide-react';

const ReportsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const navRole = effectiveUserRole(user);
  const reports = useSelector(selectReports);
  const loading = useSelector(selectReportLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // report_type/templateId
  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    preset: 'all' // all, today, yesterday, week, month, year, custom
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const filteredReports = useMemo(() => {
    if (dateFilter.preset === 'all') return reports;

    let startDate, endDate;
    const now = new Date();

    switch (dateFilter.preset) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
        break;
      default:
        return reports;
    }

    if (!startDate || !endDate) return reports;

    return reports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= startDate && reportDate <= endDate;
    });
  }, [reports, dateFilter]);

  const reportTypeOptions = useMemo(() => {
    const set = new Set();
    (reports || []).forEach((r) => {
      const t = r?.report_type || r?.templateId;
      if (t) set.add(String(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const filteredReportsBySearch = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    const type = String(typeFilter || '').trim();
    return (filteredReports || []).filter((report) => {
      const reportDisplayName =
        report.display_name || report.client_name || report.title || `Report ${report.templateId}`;
      const reportType = report.report_type || report.templateId || '';
      const matchesType = !type || String(reportType) === type;
      const matchesQuery =
        !q ||
        String(reportDisplayName || '').toLowerCase().includes(q) ||
        String(report.title || '').toLowerCase().includes(q) ||
        String(report.client_name || '').toLowerCase().includes(q) ||
        String(reportType || '').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [filteredReports, searchQuery, typeFilter]);

  // Handle date filter changes
  const handleDateFilterChange = (preset) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (preset) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
    }

    setDateFilter({ startDate, endDate, preset });
    setShowDateFilter(false);
  };

  const handleCustomDateChange = (start, end) => {
    setDateFilter({
      startDate: start ? new Date(start) : null,
      endDate: end ? new Date(end) : null,
      preset: 'custom'
    });
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null, preset: 'all' });
    setShowDateFilter(false);
  };

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  // Close date filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDateFilter && !event.target.closest('.date-filter-container')) {
        setShowDateFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDateFilter]);

  const handleDownloadInvoice = async (report) => {
    try {
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Render the Invoice component
      const root = ReactDOM.createRoot(tempDiv);
      root.render(<Invoice report={report} payment={report.payment} />);

      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF from the rendered component
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`invoice-${report.title || 'report'}.pdf`);

      // Clean up
      root.unmount();
      document.body.removeChild(tempDiv);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  const handleDownloadExcel = async (report, type) => {
    try {
      const kind = type === 'pdf' ? 'pdf' : 'excel';
      await downloadUserReportFile(report, kind);
      toast.success(`${kind === 'pdf' ? 'PDF' : 'Excel'} file downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${type} file:`, error);
      const message =
        typeof error?.message === 'string' && error.message
          ? error.message
          : `Failed to download ${type === 'pdf' ? 'PDF' : 'Excel'} file`;
      toast.error(message);
    }
  };

  const getStatusBadge = (validationStatus) => {
    const statusConfig = {
      approved: {
        icon: CheckCircle,
        text: 'Validated by CA',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        iconColor: 'text-green-600'
      },
      pending_validation: {
        icon: Clock,
        text: 'Under Validation for CA',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600'
      },
      rejected: {
        icon: XCircle,
        text: 'Queried',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        iconColor: 'text-red-600'
      },
      draft: {
        icon: FileX,
        text: 'Draft',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600'
      },
      under_review: {
        icon: Clock,
        text: 'Under Validation for CA',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        iconColor: 'text-[#7e22ce]'
      }
    };

    const config = statusConfig[validationStatus] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <IconComponent className={`w-3 h-3 mr-1 ${config.iconColor}`} />
        {config.text}
      </span>
    );
  };

  // Categorize reports by date
  const categorizedReports = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const thisYear = new Date(today);
    thisYear.setFullYear(thisYear.getFullYear() - 1);

    const categories = {
      today: { label: 'Today', reports: [] },
      yesterday: { label: 'Yesterday', reports: [] },
      thisWeek: { label: 'This Week', reports: [] },
      thisMonth: { label: 'This Month', reports: [] },
      thisYear: { label: 'This Year', reports: [] },
      older: { label: 'Older', reports: [] }
    };

    filteredReportsBySearch.forEach(report => {
      const reportDate = new Date(report.createdAt);
      const reportDateOnly = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());

      if (reportDateOnly.getTime() === today.getTime()) {
        categories.today.reports.push(report);
      } else if (reportDateOnly.getTime() === yesterday.getTime()) {
        categories.yesterday.reports.push(report);
      } else if (reportDateOnly >= thisWeek) {
        categories.thisWeek.reports.push(report);
      } else if (reportDateOnly >= thisMonth) {
        categories.thisMonth.reports.push(report);
      } else if (reportDateOnly >= thisYear) {
        categories.thisYear.reports.push(report);
      } else {
        categories.older.reports.push(report);
      }
    });

    // Sort reports within each category by createdAt (newest first)
    Object.values(categories).forEach(category => {
      category.reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    // Return only categories that have reports
    return Object.entries(categories)
      .filter(([key, category]) => category.reports.length > 0)
      .map(([key, category]) => ({ key, ...category }));
  }, [filteredReportsBySearch]);

  if (loading) {
    if (navRole === 'agent') {
      return <Loading fullScreen text="Loading reports..." />;
    }
    return (
      <ClientLayout>
        <div className="flex justify-center py-24">
          <Loading text="Loading reports..." />
        </div>
      </ClientLayout>
    );
  }

  const reportsBody = (
    <main className={navRole === 'agent' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10' : 'py-2 sm:py-4'}>
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-50 p-6 rounded-xl shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-['Manrope'] mb-2">
                My Reports
              </h2>
              <p className="text-gray-700 text-lg">Manage and view your generated Excel reports</p>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                  <FileStack className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">{filteredReportsBySearch.length}</span>
                  <span className="text-gray-600 text-sm">Reports</span>
                </div>
              </div>

              {/* Date Filter */}
              <div className="relative date-filter-container">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors duration-200 ${dateFilter.preset !== 'all'
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateFilter.preset === 'all' ? 'All Time' :
                    dateFilter.preset === 'today' ? 'Today' :
                      dateFilter.preset === 'yesterday' ? 'Yesterday' :
                        dateFilter.preset === 'week' ? 'This Week' :
                          dateFilter.preset === 'month' ? 'This Month' :
                            dateFilter.preset === 'year' ? 'This Year' :
                              'Custom Range'}
                  {dateFilter.preset !== 'all' && (
                    <X
                      className="w-4 h-4 ml-2 cursor-pointer hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateFilter();
                      }}
                    />
                  )}
                </button>

                {/* Date Filter Dropdown */}
                {showDateFilter && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Quick Filters
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleDateFilterChange('all')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'all' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          All Time
                        </button>
                        <button
                          onClick={() => handleDateFilterChange('today')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'today' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handleDateFilterChange('yesterday')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'yesterday' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => handleDateFilterChange('week')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'week' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          This Week
                        </button>
                        <button
                          onClick={() => handleDateFilterChange('month')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'month' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => handleDateFilterChange('year')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${dateFilter.preset === 'year' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                            }`}
                        >
                          This Year
                        </button>
                      </div>

                      <div className="border-t border-gray-200 mt-3 pt-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Custom Range
                        </div>
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleCustomDateChange(e.target.value, dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : null)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Start date"
                          />
                          <input
                            type="date"
                            value={dateFilter.endDate ? dateFilter.endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleCustomDateChange(dateFilter.startDate ? dateFilter.startDate.toISOString().split('T')[0] : null, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="End date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search + Type Filter */}
        {reports.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Search (Applicant / Title)
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by applicant name or report title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Type of Report
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">All types</option>
                  {reportTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(searchQuery || typeFilter) && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('');
                  }}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="bg-white p-16 rounded-xl shadow-md border border-gray-100 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-6">
              Generate your first report from the dashboard
            </p>
            <Button
              onClick={() =>
                navRole === 'agent'
                  ? navigate('/agent/dashboard')
                  : navRole === 'company_admin'
                  ? navigate('/company/generate')
                  : navigate('/dashboard')
              }
              variant="primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        ) : filteredReportsBySearch.length === 0 ? (
          <div className="bg-white p-16 rounded-xl shadow-md border border-gray-100 text-center">
            <Filter className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-6">
              No reports match your current filters. Try adjusting your filters or clear them to see all reports.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={clearDateFilter} variant="secondary">
                Clear Date Filter
              </Button>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('');
                }}
                variant="secondary"
              >
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {categorizedReports.map((category) => (
              <div key={category.key} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 font-['Manrope']">
                    {category.label}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                    {category.reports.length} {category.reports.length === 1 ? 'report' : 'reports'}
                  </span>
                </div>

                {/* Reports Grid for this category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {category.reports.map((report) => {
                    const reportDisplayName = report.display_name || report.client_name || report.title || `Report ${report.templateId}`;
                    return (
                    <div
                      key={report._id}
                      className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-purple-100 transition-all duration-300 flex flex-col"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 group-hover:scale-105 transition-transform duration-300">
                            <FileText className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 font-manrope truncate" title={reportDisplayName}>
                              {reportDisplayName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <span>{formatDate(report.createdAt)}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="truncate max-w-[100px]">{report.user_id?.name || 'User'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(report.validation_status)}
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-8">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Applicant Name</span>
                          <span className="font-semibold text-gray-900 text-sm truncate block" title={reportDisplayName}>{reportDisplayName}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Type</span>
                          <span className="font-semibold text-gray-900 text-sm truncate block" title={report.report_type}>{report.report_type}</span>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Payment Status</span>
                            <span className={`text-sm font-bold ${report.payment?.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {report.payment?.status === 'completed' ? 'Paid' : 'Unpaid'} • {report.payment ? `₹${report.payment.amount.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                          {report.payment?.status === 'completed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(report); }}
                              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                              title="Download Invoice"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Invoice
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-auto">
                        {report.validation_status === 'approved' && (
                          <div className="flex items-center gap-3">
                            {report.pdf_file_url && (
                              <button
                                onClick={() => handleDownloadExcel(report,"pdf")}
                                className="flex-1 inline-flex justify-center items-center h-11 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                                title="Download PDF"
                              >
                                <FileText className="w-4 h-4 mr-2 text-red-500" />
                                PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadExcel(report,"excel")}
                              className="flex-[1.5] inline-flex justify-center items-center h-11 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 shadow-md shadow-gray-200 transition-all"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Excel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
  );

  if (navRole === 'agent') {
    return (
      <div className="min-h-screen bg-gray-50 font-['Inter']">
        {reportsBody}
      </div>
    );
  }

  if (navRole === 'company_admin') {
    return <AdminLayout>{reportsBody}</AdminLayout>;
  }

  return <ClientLayout>{reportsBody}</ClientLayout>;
};

export default ReportsPage;
