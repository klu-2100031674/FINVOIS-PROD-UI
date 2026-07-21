import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { ArrowLeft, Inbox, ShieldAlert, CheckCircle2, FileText, Send, Zap, UserCheck, Smartphone, Eye, Plus, X, RefreshCw, Clock } from 'lucide-react';
import api, { apiErrorMessage } from '../../api/apiClient';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { isTermLoanTemplateId, resolveTemplateSector } from '../../utils/templateSectorConfig';

// Available templates list for selection
const TEMPLATES_LIST = [
  { id: 'frcc1', name: 'Cash Credit Form 1' },
  { id: 'frcc2', name: 'Cash Credit Form 2' },
  { id: 'frcc3', name: 'Cash Credit Form 3' },
  { id: 'frcc4', name: 'Cash Credit Form 4' },
  { id: 'frcc5', name: 'Cash Credit Form 5' },
  { id: 'frcc6', name: 'Cash Credit Form 6' },
  { id: 'frcc7', name: 'Cash Credit Form 7' },
  { id: 'TERM_LOAN_SERVICE_WITHOUT_STOCK', name: 'Term Loan Form' },
  { id: 'TERM_LOAN_CC', name: 'Term Loan Cash Credit Form' },
  { id: 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', name: 'Term Loan With Stock Form' },
  { id: 'TERM_LOAN_EV_VEHICLE', name: 'EV Commercial Vehicle' },
  { id: 'TERM_LOAN_OTHER_THAN_EV_VEHICLE', name: 'Other Than EV Commercial Vehicle' },
  { id: 'TERM_LOAN_JCB_VEHICLE', name: 'JCB Vehicle' },
  { id: 'TERM_LOAN_DRONE_VEHICLE', name: 'Drone Vehicle' },
];

const PENDING_REPORT_STATUSES = ['pending_payment', 'pending_validation', 'under_review'];
const STATUS_POLL_INTERVAL_MS = 15000;

const getReportStatusMeta = (validationStatus) => {
  switch (validationStatus) {
    case 'approved':
      return { label: 'APPROVED', badgeClass: 'bg-green-100 text-green-800', description: 'Report is approved. You can send it to the applicant.' };
    case 'rejected':
      return { label: 'REJECTED', badgeClass: 'bg-red-100 text-red-800', description: 'Report was rejected by CA. Generate a new report if needed.' };
    case 'under_review':
      return { label: 'UNDER CA REVIEW', badgeClass: 'bg-blue-100 text-blue-800', description: 'A CA is reviewing the report. Status updates automatically.' };
    case 'pending_validation':
      return { label: 'AWAITING CA REVIEW', badgeClass: 'bg-orange-100 text-orange-800', description: 'Report submitted and waiting for CA review.' };
    case 'pending_payment':
      return { label: 'PAYMENT PENDING', badgeClass: 'bg-yellow-100 text-yellow-800', description: 'Complete payment in the generation wizard to submit for CA review.' };
    default:
      return { label: 'IN PROGRESS', badgeClass: 'bg-gray-100 text-gray-800', description: 'Report generation is in progress.' };
  }
};

const CustomerServiceRequestScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('frcc1');
  const [updatingComm, setUpdatingComm] = useState(false);

  // States for interactive Email and WhatsApp dispatch
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [statusPolling, setStatusPolling] = useState(false);
  const prevValidationStatusRef = useRef(null);

  const fetchRequestDetails = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/govt-forms/requests/${id}`);
      const reqData = res.data?.data || null;

      const newStatus = reqData?.reportId?.validation_status;
      if (
        silent &&
        prevValidationStatusRef.current &&
        prevValidationStatusRef.current !== 'approved' &&
        newStatus === 'approved'
      ) {
        toast.success('Report approved! You can now send it to the applicant.');
      }
      if (newStatus) prevValidationStatusRef.current = newStatus;

      setRequest(reqData);

      if (reqData && reqData.submittedData) {
        const data = reqData.submittedData;
        const fields = reqData.formId?.fields || [];
        const emailField = fields.find(
          (f) => f.type === 'email' || f.id === 'govt_builtin_email' || f.id?.toLowerCase().includes('email')
        );
        const phoneField = fields.find(
          (f) =>
            f.type === 'phone' ||
            f.id === 'govt_builtin_phone' ||
            f.id?.toLowerCase().includes('phone') ||
            f.id?.toLowerCase().includes('mobile')
        );
        const applicantEmail =
          data.govt_builtin_email ||
          (emailField ? data[emailField.id] : '') ||
          reqData.customerId?.email ||
          data.email ||
          data.applicantEmail ||
          '';
        const applicantPhone =
          data.govt_builtin_phone ||
          (phoneField ? data[phoneField.id] : '') ||
          reqData.customerId?.phone ||
          data.phone ||
          data.mobile ||
          data.applicantPhone ||
          '';
        // Ignore internal placeholder emails used for phone-only customers
        const isPlaceholderEmail =
          typeof applicantEmail === 'string' && applicantEmail.endsWith('@phone.customer.finvois');
        setEmailValue(isPlaceholderEmail ? '' : applicantEmail);
        setPhoneValue(applicantPhone);
      }
    } catch (err) {
      if (!silent) {
        toast.error('Failed to load request details');
        navigate('/customer-service/open');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  useEffect(() => {
    const validationStatus = request?.reportId?.validation_status;
    const shouldPoll = Boolean(request?.reportId && PENDING_REPORT_STATUSES.includes(validationStatus));

    if (!shouldPoll) {
      setStatusPolling(false);
      return undefined;
    }

    setStatusPolling(true);
    const intervalId = setInterval(() => {
      fetchRequestDetails({ silent: true });
    }, STATUS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [request?.reportId?.validation_status, request?.reportId, fetchRequestDetails]);

  const handleSendEmail = async () => {
    if (!emailValue.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingEmail(true);
    try {
      await api.post(`/govt-forms/requests/${id}/send-email`, { email: emailValue.trim() });
      toast.success('Email dispatched successfully');
      setShowEmailInput(false);
      fetchRequestDetails();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send email'));
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!phoneValue.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setSendingWhatsApp(true);
    try {
      await api.post(`/govt-forms/requests/${id}/send-whatsapp`, { phone: phoneValue.trim() });
      toast.success('WhatsApp dispatched successfully');
      setShowPhoneInput(false);
      fetchRequestDetails();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send WhatsApp'));
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleClaim = async () => {
    try {
      await api.post(`/govt-forms/requests/${id}/claim`);
      toast.success('Request claimed successfully');
      fetchRequestDetails();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to claim request'));
    }
  };

  const handleRelease = async () => {
    try {
      await api.post(`/govt-forms/requests/${id}/release`);
      toast.success('Claim released successfully');
      fetchRequestDetails();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to release request'));
    }
  };

  const handleToggleComm = async (field, currentVal) => {
    setUpdatingComm(true);
    try {
      const payload = { [field]: !currentVal };
      await api.patch(`/govt-forms/requests/${id}/communication`, payload);
      toast.success(`Record updated: ${field === 'emailSent' ? 'Email status' : 'WhatsApp status'}`);
      fetchRequestDetails();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update communication status'));
    } finally {
      setUpdatingComm(false);
    }
  };

  const handleGenerateReport = () => {
    // Navigate directly to the report generation wizard with templateId and requestId query params
    const params = new URLSearchParams({
      templateId: selectedTemplate,
      newDraft: '1',
      requestId: id,
    });

    if (isTermLoanTemplateId(selectedTemplate)) {
      const { presetSector, lockSector } = resolveTemplateSector(selectedTemplate);
      if (presetSector) params.set('presetSector', presetSector);
      if (lockSector) params.set('lockSector', '1');
    }

    navigate(`/generate?${params.toString()}`);
  };

  const isOwner = () => {
    if (!request) return false;
    const currentUserId = user?._id?.toString();
    const claimantId = request.claimedBy?._id?.toString() || request.claimedBy?.toString();
    const assigneeId = request.assignedTo?._id?.toString() || request.assignedTo?.toString();
    return currentUserId === claimantId || currentUserId === assigneeId;
  };

  const reportValidationStatus = request?.reportId?.validation_status;
  const isReportApproved = reportValidationStatus === 'approved';
  const reportStatusMeta = request?.reportId ? getReportStatusMeta(reportValidationStatus) : null;
  const canSendReport = isOwner() && request?.reportId && isReportApproved;

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
        </div>
      </ClientLayout>
    );
  }

  if (!request) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Request Not Found</h2>
        </div>
      </ClientLayout>
    );
  }

  const data = request.submittedData || {};
  
  const fields = request.formId?.fields || [];
  const nameField = fields.find(f => f.id && (f.id.toLowerCase().includes('name') || f.label?.toLowerCase().includes('name') || f.label?.toLowerCase().includes('applicant')));
  const dynamicName = nameField ? data[nameField.id] : null;

  const emailField = fields.find(f => f.type === 'email' || f.id?.toLowerCase().includes('email') || f.label?.toLowerCase().includes('email'));
  const dynamicEmail = emailField ? data[emailField.id] : null;

  const phoneField = fields.find(f => f.type === 'phone' || f.id?.toLowerCase().includes('phone') || f.id?.toLowerCase().includes('mobile') || f.label?.toLowerCase().includes('phone') || f.label?.toLowerCase().includes('whatsapp'));
  const dynamicPhone = phoneField ? data[phoneField.id] : null;

  const applicantName = request.customerId?.name || dynamicName || data.name || data.fullname || data.applicantName || 'N/A';
  const applicantEmail = request.customerId?.email || dynamicEmail || data.email || data.applicantEmail || 'N/A';
  const applicantPhone = request.customerId?.phone || dynamicPhone || data.phone || data.mobile || data.applicantPhone || 'N/A';

  return (
    <ClientLayout>
      {/* Top navigation header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Back to List
        </button>

        <div className="flex gap-2">
          {request.status === 'open' && (
            <button
              onClick={handleClaim}
              className="flex items-center gap-2 bg-[#7e22ce] text-white px-4 py-2 rounded-lg hover:bg-[#6b21a8] text-sm font-semibold transition-colors shadow-sm"
            >
              <Zap size={16} /> Claim Request
            </button>
          )}

          {request.status === 'claimed' && isOwner() && (
            <button
              onClick={handleRelease}
              className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-semibold transition-colors shadow-sm"
            >
              <X size={16} /> Release Claim
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Request Meta & Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">{request.formId?.name || 'Deleted Form'}</h1>
            <p className="text-sm text-gray-500">
              Department: <strong>{request.departmentId?.name}</strong>
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                STATUS: {request.status.toUpperCase()}
              </span>
              {(request.assignedTo || request.claimedBy) && (
                <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  STAFF OWNER: {request.assignedTo?.name || request.claimedBy?.name}
                </span>
              )}
            </div>
          </div>

          {/* Form Responses Data */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Submitted Form Responses</h2>
            <div className="space-y-4">
              {request.formId?.fields?.map(field => {
                const val = request.submittedData?.[field.id];

                if (field.type === 'file') {
                  const fileData = val || {};
                  return (
                    <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                      {fileData.base64 ? (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-sm font-medium text-purple-700 truncate max-w-xs">{fileData.fileName}</span>
                          <a
                            href={fileData.base64}
                            download={fileData.fileName}
                            className="text-xs font-bold text-[#7e22ce] hover:underline flex items-center gap-1"
                          >
                            <Eye size={12} /> Download File
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
                    <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">{val !== undefined ? String(val) : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Action panel, report generation & communications logs */}
        <div className="space-y-6">
          {/* Action validation & report generation */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Generate Report</h3>

            {request.reportId && reportStatusMeta && (
              <div className="mb-4 p-4 rounded-xl border flex flex-col gap-2 bg-purple-50/50 border-purple-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Generated Report Status</span>
                  <div className="flex items-center gap-2">
                    {statusPolling && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                        <RefreshCw size={12} className="animate-spin" />
                        Auto-updating
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchRequestDetails({ silent: true })}
                      className="p-1 rounded hover:bg-purple-100 text-purple-700"
                      title="Refresh status"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-bold text-gray-800 truncate" title={request.reportId.title}>{request.reportId.title}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{request.reportId.templateId}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${reportStatusMeta.badgeClass}`}>
                    {reportStatusMeta.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 flex items-start gap-1.5">
                  <Clock size={12} className="mt-0.5 shrink-0" />
                  {reportStatusMeta.description}
                </p>
                {request.reportId.updatedAt && (
                  <p className="text-xs text-gray-400">
                    Last updated: {new Date(request.reportId.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {!request.reportId && request.draftId && (
              <div className="mb-4 p-4 rounded-xl border flex flex-col gap-2 bg-amber-50/50 border-amber-100">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Report Draft In Progress</span>
                <p className="text-xs text-gray-600">
                  A draft exists for template <strong className="capitalize">{request.draftId.templateId}</strong>. Resume the wizard to complete generation.
                </p>
              </div>
            )}

            {!isOwner() ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-start gap-2">
                <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
                <span>You must claim or be assigned this request before generating reports for it.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Report Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce]"
                  >
                    {TEMPLATES_LIST.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerateReport}
                  className="w-full px-4 py-2.5 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> {request.reportId ? 'Generate Again' : 'Open Generation Wizard'}
                </button>
              </div>
            )}
          </div>

          {/* Existing Reports linkages */}
          {(request.draftId || request.reportId) && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Existing Report Section</h3>
              <div className="space-y-3">
                {request.draftId && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Draft version:</div>
                      <div className="text-sm font-semibold text-gray-700 capitalize">{request.draftId.templateId}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/generate?templateId=${request.draftId.templateId}&draftId=${request.draftId._id}&requestId=${id}`)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 border border-purple-200 bg-white px-3 py-1.5 rounded hover:bg-purple-50"
                    >
                      Resume Wizard
                    </button>
                  </div>
                )}

                {request.reportId && (
                  <div className="p-3 bg-green-50 rounded border border-green-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-green-700">Generated Report:</div>
                      <div className="text-sm font-bold text-green-950 truncate max-w-[150px]">{request.reportId.title}</div>
                    </div>
                    <button
                      onClick={() => {
                        const reportId = request.reportId?._id || request.reportId;
                        if (reportId) navigate(`/reports?highlight=${reportId}`);
                        else navigate('/reports');
                      }}
                      className="text-xs font-bold text-green-900 hover:bg-green-200 bg-white border border-green-300 px-3 py-1.5 rounded"
                    >
                      View Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Send Report through Email or Mobile */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Send Report</h3>

            {request.reportId && !isReportApproved && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-start gap-2">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  {reportValidationStatus === 'rejected'
                    ? 'This report was rejected and cannot be sent. Generate a new report if needed.'
                    : 'Sending is available only after CA approval. Track the status above — this page refreshes automatically.'}
                </span>
              </div>
            )}

            {isReportApproved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-start gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>Report approved. You can now send it to the applicant via email or WhatsApp.</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email dispatch section */}
              <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[#7e22ce]">
                      <Send size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">Email Address</div>
                      {request.emailSent && (
                        <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded mt-0.5">
                          ✓ Sent successfully
                        </span>
                      )}
                    </div>
                  </div>
                  {!showEmailInput && (
                    <button
                      disabled={!canSendReport}
                      onClick={() => setShowEmailInput(true)}
                      className="px-3 py-1.5 bg-[#7e22ce] text-white text-xs font-bold rounded hover:bg-[#6b21a8] disabled:opacity-50 transition-colors"
                      title={
                        !request.reportId
                          ? 'Generate a report first'
                          : !isReportApproved
                          ? 'Report must be CA-approved before sending'
                          : ''
                      }
                    >
                      Send via Email
                    </button>
                  )}
                </div>

                {showEmailInput && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg flex flex-col gap-2">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce] outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowEmailInput(false)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={sendingEmail}
                        onClick={handleSendEmail}
                        className="px-2 py-1 text-xs bg-[#7e22ce] text-white font-bold rounded hover:bg-[#6b21a8] disabled:opacity-50 flex items-center gap-1"
                      >
                        {sendingEmail && <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />}
                        {sendingEmail ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp dispatch section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[#7e22ce]">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">Mobile Number (WhatsApp)</div>
                      {request.whatsAppSent && (
                        <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded mt-0.5">
                          ✓ Sent successfully
                        </span>
                      )}
                    </div>
                  </div>
                  {!showPhoneInput && (
                    <button
                      disabled={!canSendReport}
                      onClick={() => setShowPhoneInput(true)}
                      className="px-3 py-1.5 bg-[#7e22ce] text-white text-xs font-bold rounded hover:bg-[#6b21a8] disabled:opacity-50 transition-colors"
                      title={
                        !request.reportId
                          ? 'Generate a report first'
                          : !isReportApproved
                          ? 'Report must be CA-approved before sending'
                          : ''
                      }
                    >
                      Send via WhatsApp
                    </button>
                  )}
                </div>

                {showPhoneInput && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg flex flex-col gap-2">
                    <input
                      type="text"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder="e.g. +919999999999"
                      className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce] outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowPhoneInput(false)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={sendingWhatsApp}
                        onClick={handleSendWhatsApp}
                        className="px-2 py-1 text-xs bg-[#7e22ce] text-white font-bold rounded hover:bg-[#6b21a8] disabled:opacity-50 flex items-center gap-1"
                      >
                        {sendingWhatsApp && <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />}
                        {sendingWhatsApp ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Applicant Info Summary card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">Applicant Contact Info</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-500">Name:</span> {applicantName}
              </div>
              <div>
                <span className="font-semibold text-gray-500">Email:</span> {applicantEmail}
              </div>
              <div>
                <span className="font-semibold text-gray-500">Phone:</span> {applicantPhone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default CustomerServiceRequestScreen;
