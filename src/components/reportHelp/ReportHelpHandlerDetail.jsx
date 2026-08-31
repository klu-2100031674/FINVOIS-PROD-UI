import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  SparklesIcon,
  EyeIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ReportHelpStatusBadge from './ReportHelpStatusBadge';
import ReportHelpUpdatesThread from './ReportHelpUpdatesThread';
import { reportHelpAPI } from '../../api/endpoints';
import api from '../../api/apiClient';
import {
  DOCUMENT_CHECKLIST_LABELS,
  REPORT_TYPE_OPTIONS,
  URGENCY_OPTIONS,
} from '../../utils/reportHelpConstants';
import {
  ReportHelpBackLink,
  ReportHelpCard,
  ReportHelpDetailGrid,
  ReportHelpLoading,
  ReportHelpPageShell,
  ReportHelpPrimaryButton,
  ReportHelpSecondaryButton,
  ReportHelpTextarea,
} from './ReportHelpUi';

const reportTypeLabel = (v) => REPORT_TYPE_OPTIONS.find((o) => o.value === v)?.label || v;
const urgencyLabel = (v) => URGENCY_OPTIONS.find((o) => o.value === v)?.label || v;

const CHECKLIST_KEYS = Object.keys(DOCUMENT_CHECKLIST_LABELS);
const GENERATE_STATUSES = ['accepted', 'in_progress', 'documents_submitted'];

const validationLabel = (status) => {
  const map = {
    pending_validation: 'Pending CA validation',
    under_review: 'Under CA review',
    approved: 'Approved — client can download',
    rejected: 'Rejected',
    pending_payment: 'Awaiting payment',
    draft: 'Draft',
  };
  return map[status] || status;
};

/**
 * Shared handler view for channel partners and platform admins.
 */
export default function ReportHelpHandlerDetail({
  Layout,
  layoutProps = {},
  accent = 'green',
  listPath,
  buildGeneratePath,
  buildReportsLink,
  typeAccentClass = 'text-emerald-700',
  // Admin-only: view generated report PDF inline + send via WhatsApp/Email
  // (auto-filled from client contact, editable before sending).
  enableReportActions = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [docMessage, setDocMessage] = useState('');

  const [showReportViewer, setShowReportViewer] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [activeShareType, setActiveShareType] = useState(null); // 'email' | 'whatsapp' | null
  const [emailInput, setEmailInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reportHelpAPI.getById(id);
      setRequest(res?.data || null);
    } catch {
      toast.error('Request not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action, extra = {}) => {
    setActing(true);
    try {
      const res = await reportHelpAPI.performAction(id, { action, ...extra });
      setRequest(res?.data || null);
      setShowDocForm(false);
      toast.success('Action saved');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const handleNeedDocuments = (e) => {
    e.preventDefault();
    const selected = CHECKLIST_KEYS.filter((k) => checklist[k]);
    if (!selected.length) {
      toast.error('Select at least one document');
      return;
    }
    runAction('need_more_documents', { checklist: selected, message: docMessage });
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const handleViewGeneratedReport = async (linkedReport, user, request) => {
    if (!linkedReport?._id || !id) return;
    setEmailInput(request?.user_email || user?.email || '');
    setWhatsappInput(request?.contact_phone || user?.phone || '');
    setActiveShareType(null);
    setShowReportViewer(true);
    setLoadingPdf(true);
    try {
      const response = await api.get(`/report-help/${id}/linked-report/pdf?inline=true`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast.error('Failed to load report PDF');
      setShowReportViewer(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  const closeReportViewer = () => {
    setShowReportViewer(false);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setActiveShareType(null);
  };

  const handleSendReportEmail = async () => {
    if (!id) return;
    const email = emailInput.trim();
    if (!email) {
      toast.error('Please enter a recipient email address.');
      return;
    }
    setSendingEmail(true);
    try {
      const response = await api.post(`/report-help/${id}/linked-report/email`, { email });
      toast.success(response.data?.message || 'Report sent via email successfully.');
      setActiveShareType(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to send report email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReportWhatsapp = async () => {
    if (!id) return;
    const phone = whatsappInput.trim();
    if (!phone) {
      toast.error('Please enter a recipient phone number.');
      return;
    }
    setSendingWhatsapp(true);
    try {
      const response = await api.post(`/report-help/${id}/linked-report/whatsapp`, { phone });
      toast.success(response.data?.message || 'Report sent via WhatsApp successfully.');
      setActiveShareType(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to send report via WhatsApp');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  if (loading) {
    return (
      <Layout {...layoutProps}>
        <ReportHelpPageShell accent={accent}>
          <ReportHelpLoading label="Loading request…" accent={accent} />
        </ReportHelpPageShell>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout {...layoutProps}>
        <ReportHelpPageShell accent={accent}>
          <ReportHelpCard className="text-center py-12">
            <p className="text-gray-500">Request not found.</p>
          </ReportHelpCard>
        </ReportHelpPageShell>
      </Layout>
    );
  }

  const user = request.user_id;
  const clientUserId = user?._id || request.user_id;
  const canAct = request.canAct ?? ['pending', 'documents_submitted', 'rejected'].includes(request.status);
  const canGenerate = GENERATE_STATUSES.includes(request.status);
  const linkedReport = request.linked_report;
  const reportsLink = buildReportsLink?.(clientUserId, user?.name);

  const handleGenerateReport = () => {
    const path = buildGeneratePath?.(clientUserId, id);
    if (path) navigate(path);
  };

  const detailItems = [
    { label: 'Contact name', value: request.contact_name || user?.name },
    { label: 'Phone', value: request.contact_phone || user?.phone },
    { label: 'Loan amount', value: request.loan_amount },
    { label: 'Industry', value: request.industry },
    { label: 'Urgency', value: urgencyLabel(request.urgency_level) },
    { label: 'Client', value: `${user?.name || '—'}${user?.email ? ` · ${user.email}` : ''}` },
  ];

  return (
    <Layout {...layoutProps}>
      <ReportHelpPageShell accent={accent}>
        <ReportHelpBackLink to={listPath} accent={accent}>
          All requests
        </ReportHelpBackLink>

        <ReportHelpCard className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${typeAccentClass}`}>
                {reportTypeLabel(request.report_type)}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{request.business_name}</h1>
              {request.createdAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Received {new Date(request.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            <ReportHelpStatusBadge status={request.status} />
          </div>

          <ReportHelpDetailGrid items={detailItems} />

          {request.notes && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Client notes
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {request.notes}
              </div>
            </div>
          )}

          {canGenerate && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <ReportHelpPrimaryButton
                accent="purple"
                onClick={handleGenerateReport}
                className="!bg-[#7e22ce] hover:!bg-[#6b21a8]"
              >
                <SparklesIcon className="w-4 h-4" aria-hidden />
                Generate report for client
              </ReportHelpPrimaryButton>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                The report will be owned by the client and submitted for CA validation after generation.
              </p>
            </div>
          )}

          {linkedReport && (
            <div className="mt-6">
              <ReportHelpCard className="border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-white !p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7e22ce]">
                    <DocumentCheckIcon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Linked report</p>
                    <p className="text-purple-800 mt-0.5">{linkedReport.title}</p>
                    <p className="text-sm text-purple-700 mt-1">{validationLabel(linkedReport.validation_status)}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {reportsLink && (
                        <Link
                          to={reportsLink.to}
                          state={reportsLink.state}
                          className={`text-sm font-semibold hover:opacity-90 ${typeAccentClass}`}
                        >
                          {reportsLink.label} →
                        </Link>
                      )}
                      {enableReportActions && (
                        <button
                          type="button"
                          onClick={() => handleViewGeneratedReport(linkedReport, user, request)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <EyeIcon className="w-4 h-4" aria-hidden />
                          View report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </ReportHelpCard>
            </div>
          )}

          {canAct && !showDocForm && (
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
              <ReportHelpPrimaryButton
                accent={accent === 'green' ? 'green' : 'purple'}
                disabled={acting}
                onClick={() => runAction('accept')}
              >
                {request.status === 'rejected' ? 'Accept / reclaim request' : 'Accept request'}
              </ReportHelpPrimaryButton>
              <button
                type="button"
                disabled={acting}
                onClick={() => setShowDocForm(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 shadow-sm transition-colors"
              >
                Need more documents
              </button>
              {request.status !== 'rejected' && (
                <ReportHelpSecondaryButton
                  disabled={acting}
                  onClick={() => {
                    const reason = window.prompt('Rejection reason (optional):') || '';
                    runAction('reject', { rejection_reason: reason });
                  }}
                  className="!text-red-700 !border-red-200 hover:!bg-red-50"
                >
                  Reject
                </ReportHelpSecondaryButton>
              )}
            </div>
          )}

          {showDocForm && (
            <form
              onSubmit={handleNeedDocuments}
              className="mt-6 p-5 border border-orange-200 rounded-2xl bg-orange-50/50 space-y-4"
            >
              <p className="text-sm font-semibold text-orange-900">Request documents from client</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKLIST_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 text-sm text-orange-900 cursor-pointer bg-white/70 rounded-lg px-3 py-2 border border-orange-100"
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[key]}
                      onChange={() => setChecklist((p) => ({ ...p, [key]: !p[key] }))}
                      className="rounded border-orange-400 text-orange-600 focus:ring-orange-500"
                    />
                    {DOCUMENT_CHECKLIST_LABELS[key]}
                  </label>
                ))}
              </div>
              <ReportHelpTextarea
                accent={accent}
                value={docMessage}
                onChange={(e) => setDocMessage(e.target.value)}
                rows={2}
                placeholder="Optional note to client"
                className="!bg-white"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={acting}
                  className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50"
                >
                  Send document request
                </button>
                <ReportHelpSecondaryButton type="button" onClick={() => setShowDocForm(false)}>
                  Cancel
                </ReportHelpSecondaryButton>
              </div>
            </form>
          )}
        </ReportHelpCard>

        {(request.documents || []).length > 0 && (
          <ReportHelpCard className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client documents</h2>
            <ul className="space-y-2">
              {request.documents.map((doc, i) => (
                <li
                  key={doc._id || i}
                  className="flex items-center justify-between gap-3 text-sm bg-gray-50/80 rounded-xl px-4 py-3 border border-gray-100"
                >
                  <span className="min-w-0 truncate font-medium text-gray-800">
                    {doc.file_name}
                    <span className="text-gray-400 font-normal ml-2">({doc.batch})</span>
                  </span>
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" aria-hidden />
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </ReportHelpCard>
        )}

        <ReportHelpUpdatesThread
          requestId={id}
          updates={request.updates || []}
          onPosted={load}
          accent={accent}
          partnerLabel={accent === 'green' ? 'partner' : 'support team'}
        />
      </ReportHelpPageShell>

      {enableReportActions && showReportViewer && linkedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center gap-4 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate min-w-0 flex-1">
                {linkedReport.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {activeShareType === null ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveShareType('email')}
                      className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <EnvelopeIcon className="w-4 h-4 mr-1.5" aria-hidden />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveShareType('whatsapp')}
                      className="flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1.5" aria-hidden />
                      WhatsApp
                    </button>
                  </>
                ) : activeShareType === 'email' ? (
                  <>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Recipient email"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg w-56"
                    />
                    <button
                      type="button"
                      onClick={handleSendReportEmail}
                      disabled={sendingEmail}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      {sendingEmail ? 'Sending…' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveShareType(null)}
                      className="px-2 py-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="tel"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      placeholder="WhatsApp phone"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg w-44"
                    />
                    <button
                      type="button"
                      onClick={handleSendReportWhatsapp}
                      disabled={sendingWhatsapp}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      {sendingWhatsapp ? 'Sending…' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveShareType(null)}
                      className="px-2 py-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={closeReportViewer}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {loadingPdf ? (
                <div className="h-full flex items-center justify-center text-gray-500">Loading report…</div>
              ) : pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} title="Generated report" className="w-full h-full" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Report preview unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
