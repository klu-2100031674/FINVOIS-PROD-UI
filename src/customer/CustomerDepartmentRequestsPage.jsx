import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../components/layouts/ClientLayout';
import api, { apiErrorMessage } from '../api/apiClient';
import toast from 'react-hot-toast';
import { ChevronRight, ClipboardList, Download, FileQuestion, Search, X } from 'lucide-react';
import CustomerPayNowButton from './CustomerPayNowButton';
import {
  canDownloadPdf,
  needsPayment,
  requestStatusMeta,
  submittedLabel,
} from './customerDepartmentRequestUx';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pay', label: 'Payment pending' },
  { value: 'ca', label: 'Under CA' },
  { value: 'ready', label: 'Validated' },
];

function parseFilenameFromDisposition(header) {
  if (!header) return null;
  const match = String(header).match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/"/g, '').trim());
  } catch {
    return match[1].replace(/"/g, '').trim();
  }
}

async function downloadCustomerRequestPdf(requestId, fallbackName) {
  const res = await api.get(`/customer/department-requests/${requestId}/report/pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    parseFilenameFromDisposition(res.headers?.['content-disposition']) ||
    `${String(fallbackName || 'report').replace(/[^\w.\-() ]+/g, '_').slice(0, 80)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function RequestCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex">
        <div className="w-1.5 shrink-0 bg-gray-200 animate-pulse" />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function searchableText(req) {
  const data = req.submittedData || {};
  return [
    req.display_title,
    req.formId?.name,
    req.departmentId?.name,
    req.reportId?.display_name,
    req.reportId?.title,
    req.reportId?.client_name,
    data.govt_builtin_name,
    data.applicantName,
    data.name,
    data.fullname,
    data.msme_nature_of_business,
    data.natureOfBusiness,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const CustomerDepartmentRequestsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = async () => {
    const res = await api.get('/customer/department-requests');
    setRequests(res.data?.data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to load your requests'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      const meta = requestStatusMeta(req);
      if (statusFilter === 'pay' && meta.key !== 'pay') return false;
      if (statusFilter === 'ca' && meta.key !== 'ca') return false;
      if (statusFilter === 'ready' && meta.key !== 'ready') return false;
      if (q && !searchableText(req).includes(q)) return false;
      return true;
    });
  }, [requests, search, statusFilter]);

  const handleDownloadPdf = async (e, req) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setDownloadingId(req._id);
      await downloadCustomerRequestPdf(
        req._id,
        req.reportId?.display_name || req.display_title || 'report'
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to download PDF'));
    } finally {
      setDownloadingId(null);
    }
  };

  const hasActiveFilters = Boolean(search.trim() || statusFilter);

  return (
    <ClientLayout>
      <div className="py-6 space-y-6 font-['Inter']">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-['Manrope'] flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-purple-700" />
              My Department Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track status, documents, and chat for forms you submitted to government departments.
            </p>
          </div>
        </div>

        {!loading && requests.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by applicant or business name…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 sm:w-52"
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <RequestCardSkeleton />
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-dashed border-purple-200 rounded-2xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <FileQuestion size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">No requests yet</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              When you submit a department form, it will show up here so you can track CA validation,
              payment, and your PDF.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
            <p className="font-medium text-gray-800">No requests match your search</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="mt-3 text-sm font-semibold text-purple-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const meta = requestStatusMeta(req);
              const title = req.display_title || req.formId?.name || 'Form';
              const when = submittedLabel(req.createdAt);
              const showPdf = canDownloadPdf(req);
              const showPay = needsPayment(req);

              return (
                <div
                  key={req._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/customer/department-requests/${req._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/customer/department-requests/${req._id}`);
                    }
                  }}
                  className="group w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-md cursor-pointer"
                >
                  <div className="flex">
                    <div className={`w-1.5 shrink-0 ${meta.railClass}`} aria-hidden />
                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">{title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Department: {req.departmentId?.name || '—'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1" title={when.title}>
                            {when.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {showPay ? (
                            <CustomerPayNowButton
                              request={req}
                              onPaid={() => {
                                refresh().catch(() => {});
                              }}
                            />
                          ) : showPdf ? (
                            <button
                              type="button"
                              disabled={downloadingId === req._id}
                              onClick={(e) => handleDownloadPdf(e, req)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download size={14} />
                              {downloadingId === req._id ? '…' : 'PDF'}
                            </button>
                          ) : null}
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${meta.badgeClass}`}>
                            {meta.text}
                          </span>
                          <ChevronRight size={18} className="text-gray-400 group-hover:text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default CustomerDepartmentRequestsPage;
