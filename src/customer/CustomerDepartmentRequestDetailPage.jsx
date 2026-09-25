import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  ShieldAlert,
  CheckCircle,
  Clock,
  FileText,
  UserCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import ClientLayout from '../components/layouts/ClientLayout';
import api, { apiErrorMessage } from '../api/apiClient';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import RequestDocumentsPanel from '../components/department/RequestDocumentsPanel';
import RequestChatPanel from '../components/department/RequestChatPanel';
import CustomerPayNowButton from './CustomerPayNowButton';
import {
  canDownloadPdf,
  celebrationStorageKey,
  needsPayment,
  requestStatusMeta,
  submittedLabel,
} from './customerDepartmentRequestUx';

async function viewCustomerRequestPdf(requestId) {
  const res = await api.get(`/customer/department-requests/${requestId}/report/pdf?inline=1`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function DetailSkeleton() {
  return (
    <div className="py-6 space-y-6 max-w-4xl animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-gray-200" />
      <div className="h-28 rounded-xl bg-gray-100 border border-gray-200" />
      <div className="h-56 rounded-xl bg-gray-100 border border-gray-200" />
      <div className="h-40 rounded-xl bg-gray-100 border border-gray-200" />
    </div>
  );
}

function ConfettiBurst() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 rounded-sm opacity-90"
          style={{
            left: `${6 + ((i * 5.2) % 88)}%`,
            backgroundColor: ['#10b981', '#34d399', '#a78bfa', '#fbbf24', '#60a5fa'][i % 5],
            animation: `customerConfettiFall 1.1s ease-out ${i * 0.03}s both`,
            transform: `rotate(${i * 20}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes customerConfettiFall {
          0% { transform: translateY(-8px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(72px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function RequestStatusTimeline({ request }) {
  const fmt = (date) =>
    date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  const reportStatus = request.reportId?.validation_status || null;
  const reportCreatedAt = request.reportId?.createdAt || null;

  const stages = [
    {
      key: 'submitted',
      label: 'Application Submitted',
      detail: fmt(request.createdAt),
      done: true,
      icon: Send,
    },
    {
      key: 'assigned',
      label: 'Assigned to Customer Service',
      detail: request.claimedBy?.name
        ? `${request.claimedBy.name}${request.claimedAt ? ' — ' + fmt(request.claimedAt) : ''}`
        : request.assignedTo?.name
        ? request.assignedTo.name
        : null,
      done: !!(request.claimedBy || request.assignedTo || request.claimedAt),
      icon: UserCheck,
    },
    {
      key: 'generation',
      label: 'Report Generation Started',
      detail: fmt(request.generationStartedAt),
      done: !!request.generationStartedAt,
      icon: FileText,
    },
    {
      key: 'ready',
      label: 'Report Generated',
      detail: fmt(reportCreatedAt),
      done: !!request.reportId,
      icon: ClipboardList,
    },
    {
      key: 'approved',
      label: 'Validated by CA',
      detail:
        reportStatus === 'approved' && request.reportId?.payment?.status === 'completed'
          ? 'Your report is ready to view'
          : reportStatus === 'approved'
          ? 'Waiting for payment to unlock'
          : null,
      done: reportStatus === 'approved' && request.reportId?.payment?.status === 'completed',
      active:
        (reportStatus === 'pending_validation' || reportStatus === 'under_review') &&
        request.reportId?.payment?.status === 'completed',
      icon: CheckCircle,
    },
  ];

  const lastDone = stages.reduce((acc, s, i) => (s.done ? i : acc), -1);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
        <Clock className="h-5 w-5 text-purple-600" />
        Request Status Timeline
      </h2>
      <ol className="relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isComplete = stage.done;
          const isCurrent = !isComplete && idx === lastDone + 1;
          const isLast = idx === stages.length - 1;

          return (
            <li key={stage.key} className={`flex gap-4 ${isLast ? '' : 'pb-6'}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    isComplete
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : isCurrent
                      ? 'bg-orange-50 border-orange-400 text-orange-500'
                      : 'bg-gray-50 border-gray-200 text-gray-300'
                  }`}
                >
                  <Icon size={15} />
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 mt-1 ${
                      idx < lastDone ? 'bg-purple-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              <div className="pb-1">
                <p
                  className={`text-sm font-semibold ${
                    isComplete
                      ? 'text-purple-700'
                      : isCurrent
                      ? 'text-orange-600'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      In Progress
                    </span>
                  )}
                </p>
                {stage.detail && (
                  <p className="text-xs text-gray-500 mt-0.5">{stage.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const CustomerDepartmentRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const celebratedRef = useRef(false);

  const loadRequest = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/customer/department-requests/${id}`);
      setRequest(res.data?.data || null);
    } catch (err) {
      if (!silent) {
        toast.error(apiErrorMessage(err, 'Failed to load request'));
        setRequest(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  useEffect(() => {
    if (request?.reportId?.payment?.status === 'completed') return undefined;
    if (!request?.reportId) return undefined;
    const timer = setInterval(() => loadRequest({ silent: true }), 8000);
    return () => clearInterval(timer);
  }, [id, request?.reportId, request?.reportId?.payment?.status]);

  useEffect(() => {
    if (!request?._id || celebratedRef.current) return;
    if (!canDownloadPdf(request)) return;
    let seen = false;
    try {
      seen = localStorage.getItem(celebrationStorageKey(request._id)) === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    celebratedRef.current = true;
    setCelebrate(true);
    try {
      localStorage.setItem(celebrationStorageKey(request._id), '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setCelebrate(false), 1600);
    return () => clearTimeout(t);
  }, [request]);

  const handleViewPdf = async () => {
    try {
      setViewingPdf(true);
      await viewCustomerRequestPdf(id);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to open PDF'));
    } finally {
      setViewingPdf(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <DetailSkeleton />
      </ClientLayout>
    );
  }

  if (!request) {
    return (
      <ClientLayout>
        <div className="text-center py-16">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Request Not Found</h2>
          <button
            type="button"
            onClick={() => navigate('/customer/department-requests')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to my requests
          </button>
        </div>
      </ClientLayout>
    );
  }

  const apiBase = `/customer/department-requests/${id}`;
  const showPdf = canDownloadPdf(request);
  const showPay = needsPayment(request);
  const meta = requestStatusMeta(request);
  const when = submittedLabel(request.createdAt);
  const pageTitle = request.display_title || request.formId?.name || 'Department Request';
  const waitingTip = meta.key === 'ca' && meta.tip;

  return (
    <ClientLayout>
      <div className={`py-6 space-y-6 font-['Inter'] max-w-4xl ${showPay || showPdf ? 'pb-28 md:pb-6' : ''}`}>
        <button
          type="button"
          onClick={() => navigate('/customer/department-requests')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Requests
        </button>

        <div
          className={`relative overflow-hidden rounded-xl shadow-md border bg-white transition-colors ${
            celebrate ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'
          }`}
        >
          {celebrate && <ConfettiBurst />}
          <div className="flex">
            <div className={`w-1.5 shrink-0 ${meta.railClass}`} aria-hidden />
            <div className="flex-1 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 font-['Manrope'] flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-purple-700" />
                    {pageTitle}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Department: <strong>{request.departmentId?.name || '—'}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.badgeClass}`}>
                      {meta.text}
                    </span>
                    {request.createdAt && (
                      <span className="text-xs text-gray-500 px-2 py-1" title={when.title}>
                        {when.text}
                      </span>
                    )}
                  </div>
                </div>
                {/* Desktop primary CTA only — mobile uses sticky bar */}
                <div className="hidden md:block">
                  {showPay ? (
                    <CustomerPayNowButton
                      request={request}
                      onPaid={() => loadRequest({ silent: true })}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60"
                    />
                  ) : showPdf ? (
                    <button
                      type="button"
                      disabled={viewingPdf}
                      onClick={handleViewPdf}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
                    >
                      <Eye size={16} />
                      {viewingPdf ? 'Opening…' : 'View PDF'}
                    </button>
                  ) : null}
                </div>
              </div>

              {celebrate && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                  <Sparkles size={14} /> Validated by CA — your report is ready
                </p>
              )}
            </div>
          </div>
        </div>

        {waitingTip && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">What happens next</p>
              <p className="text-blue-800/90 mt-0.5 text-xs sm:text-sm">{meta.tip}</p>
            </div>
          </div>
        )}

        {showPay && (
          <div className="hidden md:flex bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6 flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-yellow-900">Payment required</h2>
              <p className="text-sm text-yellow-800 mt-1">
                Pay ₹{Number(request.reportId?.payment?.amount || 0).toLocaleString('en-IN')} to unlock
                your report. Customer Service can still work on it while payment is pending.
              </p>
            </div>
            <CustomerPayNowButton
              request={request}
              onPaid={() => loadRequest({ silent: true })}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60"
            />
          </div>
        )}

        <RequestStatusTimeline request={request} />

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Submitted Form Responses</h2>
          <div className="space-y-4">
            {(request.formId?.fields || []).map((field) => {
              const val = request.submittedData?.[field.id];
              if (field.type === 'file') {
                const fileData = val || {};
                return (
                  <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                    {fileData.base64 ? (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-medium text-purple-700 truncate max-w-xs">
                          {fileData.fileName}
                        </span>
                        <a
                          href={fileData.base64}
                          download={fileData.fileName}
                          className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                        >
                          <Eye size={12} /> Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No document uploaded</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                  <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">
                    {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <RequestDocumentsPanel
          requestId={id}
          apiBase={apiBase}
          status={request.status}
          currentUserId={user?._id}
          isCustomer
        />

        <RequestChatPanel
          requestId={id}
          apiBase={apiBase}
          status={request.status}
          currentUserId={user?._id}
          trackUnread
        />
      </div>

      {/* Sticky mobile action bar — one primary CTA */}
      {(showPay || showPdf) && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          {showPay ? (
            <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">Payment due</p>
                <p className="text-sm font-bold text-yellow-700">
                  ₹{Number(request.reportId?.payment?.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <CustomerPayNowButton
                request={request}
                onPaid={() => loadRequest({ silent: true })}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60 shrink-0"
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={viewingPdf}
              onClick={handleViewPdf}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
            >
              <Eye size={16} />
              {viewingPdf ? 'Opening…' : 'View PDF'}
            </button>
          )}
        </div>
      )}
    </ClientLayout>
  );
};

export default CustomerDepartmentRequestDetailPage;
