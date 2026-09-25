import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { ArrowLeft, Inbox, ShieldAlert, CheckCircle2, FileText, Send, Zap, UserCheck, Smartphone, Eye, Plus, X, RefreshCw, Clock, Download, FileSpreadsheet, Copy, Link2 } from 'lucide-react';
import api, { apiErrorMessage } from '../../api/apiClient';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { isTermLoanTemplateId, resolveTemplateSector } from '../../utils/templateSectorConfig';
import RequestDocumentsPanel from '../../components/department/RequestDocumentsPanel';
import RequestChatPanel from '../../components/department/RequestChatPanel';
import PaymentModal from '../../components/common/PaymentModal';
import {
  canUnclaimRequest,
  claimExpiresAt,
  getDprWorkflowStatus,
} from '../../utils/dprWorkflowStatus';
import { displayMsmeLoanType } from '../../utils/msmeLoanTypeDisplay';

async function fetchCsRequestReportBlob(requestId, kind = 'pdf', inline = false) {
  const qs = kind === 'pdf' && inline ? '?inline=1' : '';
  return api.get(`/govt-forms/requests/${requestId}/report/${kind}${qs}`, {
    responseType: 'blob',
  });
}

async function viewApprovedRequestPdf(requestId) {
  const res = await fetchCsRequestReportBlob(requestId, 'pdf', true);
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function downloadApprovedRequestFile(requestId, kind = 'pdf') {
  const res = await fetchCsRequestReportBlob(requestId, kind, false);
  const type =
    kind === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
  const blob = new Blob([res.data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = kind === 'excel' ? `report-${requestId}.xlsx` : `report-${requestId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function CsApprovedReportActions({ requestId, showDownload = true }) {
  const [busy, setBusy] = useState(null);

  const run = async (action, fn) => {
    try {
      setBusy(action);
      await fn();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to open report'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => run('view', () => viewApprovedRequestPdf(requestId))}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        <Eye className="h-4 w-4 shrink-0" />
        {busy === 'view' ? 'Opening…' : 'View PDF'}
      </button>
      {showDownload && (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run('pdf', () => downloadApprovedRequestFile(requestId, 'pdf'))}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4 shrink-0 text-gray-500" />
          {busy === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run('excel', () => downloadApprovedRequestFile(requestId, 'excel'))}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
          {busy === 'excel' ? '…' : 'Excel'}
        </button>
      </div>
      )}
    </div>
  );
}

// Available templates list for selection
const TEMPLATES_LIST = [
  { id: 'frcc1', name: 'Cash Credit Form 1' },
  { id: 'frcc2', name: 'Cash Credit Form 2' },
  { id: 'frcc3', name: 'Cash Credit Form 3' },
  { id: 'frcc4', name: 'Cash Credit Form 4' },
  { id: 'frcc5', name: 'Cash Credit Form 5' },
  { id: 'frcc6', name: 'Cash Credit Form 6' },
  { id: 'frcc7', name: 'Cash Credit Form 7' },
  { id: 'TERM_LOAN_SERVICE_WITHOUT_STOCK', name: 'term loan without stock' },
  { id: 'TERM_LOAN_CC', name: 'Term Loan + CC' },
  { id: 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', name: 'Term Loan With Stock Form' },
  { id: 'TERM_LOAN_EV_VEHICLE', name: 'EV Commercial Vehicle' },
  { id: 'TERM_LOAN_OTHER_THAN_EV_VEHICLE', name: 'Other Than EV Commercial Vehicle' },
  { id: 'TERM_LOAN_JCB_VEHICLE', name: 'JCB Vehicle' },
  { id: 'TERM_LOAN_DRONE_VEHICLE', name: 'Drone Vehicle' },
  { id: 'GOLD_LOAN', name: 'Gold Loan' },
];

const MSME_EXTRA_FIELDS = [
  { id: 'aadharNumber', label: 'Aadhaar Number', aliases: ['aadharNumber', 'aadhaarNumber'] },
  { id: 'panNumber', label: 'PAN Number', aliases: ['panNumber'] },
  { id: 'loanType', label: 'Loan Type', aliases: ['msme_loan_type', 'dpr_request_loan_type', 'loanType'] },
  { id: 'sector', label: 'Sector', aliases: ['msme_sector', 'dpr_request_sector', 'sector'] },
  { id: 'natureOfBusiness', label: 'Nature of Business', aliases: ['msme_nature_of_business', 'dpr_request_nature_of_business', 'natureOfBusiness'] },
  { id: 'enterpriseType', label: 'Enterprise Type', aliases: ['msme_enterprise_type', 'dpr_request_enterprise_type', 'enterpriseType'] },
  { id: 'yearOfRegistration', label: 'Year of Registration', aliases: ['msme_year_of_registration', 'dpr_request_year_of_registration', 'yearOfRegistration'] },
  { id: 'schemeAppliedUnder', label: 'Scheme Applied Under', aliases: ['msme_scheme_applied_under', 'dpr_request_scheme_applied_under', 'schemeAppliedUnder'] },
  { id: 'gender', label: 'Gender', aliases: ['msme_gender', 'dpr_request_gender', 'gender'] },
  { id: 'ruralUrbanCategory', label: 'Rural / Urban Category', aliases: ['msme_rural_urban_category', 'dpr_request_rural_urban_category', 'ruralUrbanCategory'] },
  { id: 'villageCity', label: 'Village / City', aliases: ['msme_village_city', 'dpr_request_village_city', 'villageCity'] },
  { id: 'mandal', label: 'Mandal', aliases: ['msme_mandal', 'dpr_request_mandal', 'mandal'] },
  { id: 'district', label: 'District', aliases: ['msme_district', 'dpr_request_district', 'district'] },
  { id: 'description', label: 'Description', aliases: ['msme_description', 'dpr_request_description', 'description'] },
  { id: 'hasOtherDprInfo', label: 'Other DPR information provided', aliases: ['hasOtherDprInfo'] },
  { id: 'workingCapital', label: 'Working capital loan (₹)', aliases: ['workingCapital'] },
  { id: 'workingCapitalMargin', label: 'Working capital Margin (%)', aliases: ['workingCapitalMargin'] },
  { id: 'workingCapitalRateOfInterest', label: 'Working capital rate of interest (%)', aliases: ['workingCapitalRateOfInterest'] },
  { id: 'loanTermPeriod', label: 'Loan Term Period (years)', aliases: ['loanTermPeriod'] },
  { id: 'rateOfInterest', label: 'Rate of Interest (%)', aliases: ['rateOfInterest'] },
  { id: 'processingFee', label: 'Processing Fee (%)', aliases: ['processingFee'] },
  { id: 'moratoriumPeriod', label: 'Moratorium period (months)', aliases: ['moratoriumPeriod'] },
  { id: 'loanAmount', label: 'Loan Amount', aliases: ['loanAmount'] },
];

const MSME_ALWAYS_SHOW_IDS = new Set([
  'aadharNumber',
  'panNumber',
  'loanType',
  'sector',
  'workingCapital',
  'workingCapitalMargin',
  'workingCapitalRateOfInterest',
  'loanTermPeriod',
  'rateOfInterest',
  'processingFee',
  'moratoriumPeriod',
  'loanAmount',
  'hasOtherDprInfo',
]);
const MSME_HIGHLIGHT_IDS = ['loanType', 'sector'];

const isMsmeRequest = (request) =>
  String(request?.formId?.customRoute || '').toLowerCase() === 'msme-dpr';

const isDprRequest = (request) =>
  String(request?.formId?.customRoute || '').toLowerCase() === 'dpr-request';

const isMsmeLikeRequest = (request) => isMsmeRequest(request) || isDprRequest(request);

const isMepmaRequest = (request) =>
  String(request?.formId?.customRoute || '').toLowerCase() === 'mepma-dpr';

const MEPMA_EXTRA_FIELDS = [
  { id: 'aadharNumber', label: 'Aadhaar Number', aliases: ['aadharNumber', 'aadhaarNumber'] },
  { id: 'panNumber', label: 'PAN Number', aliases: ['panNumber'] },
  { id: 'loanType', label: 'Loan Type', aliases: ['mepma_loan_type', 'loanType'] },
  { id: 'sector', label: 'Sector', aliases: ['mepma_sector', 'sector'] },
  { id: 'natureOfBusiness', label: 'Nature of Business', aliases: ['mepma_nature_of_business', 'natureOfBusiness'] },
  { id: 'enterpriseType', label: 'Enterprise Type', aliases: ['mepma_enterprise_type', 'enterpriseType'] },
  { id: 'yearOfRegistration', label: 'Year of Registration', aliases: ['mepma_year_of_registration', 'yearOfRegistration'] },
  { id: 'schemeAppliedUnder', label: 'Scheme Applied Under', aliases: ['mepma_scheme_applied_under', 'schemeAppliedUnder'] },
  { id: 'gender', label: 'Gender', aliases: ['mepma_gender', 'gender'] },
  { id: 'ruralUrbanCategory', label: 'Rural / Urban Category', aliases: ['mepma_rural_urban_category', 'ruralUrbanCategory'] },
  { id: 'villageCity', label: 'Village / City', aliases: ['mepma_village_city', 'villageCity'] },
  { id: 'mandal', label: 'Mandal', aliases: ['mepma_mandal', 'mandal'] },
  { id: 'district', label: 'District', aliases: ['mepma_district', 'district'] },
  { id: 'description', label: 'Description', aliases: ['mepma_description', 'description'] },
  { id: 'hasOtherDprInfo', label: 'Other DPR information provided', aliases: ['hasOtherDprInfo'] },
  { id: 'workingCapital', label: 'Working capital loan (₹)', aliases: ['workingCapital'] },
  { id: 'workingCapitalMargin', label: 'Working capital Margin (%)', aliases: ['workingCapitalMargin'] },
  { id: 'workingCapitalRateOfInterest', label: 'Working capital rate of interest (%)', aliases: ['workingCapitalRateOfInterest'] },
  { id: 'loanTermPeriod', label: 'Loan Term Period (years)', aliases: ['loanTermPeriod'] },
  { id: 'rateOfInterest', label: 'Rate of Interest (%)', aliases: ['rateOfInterest'] },
  { id: 'processingFee', label: 'Processing Fee (%)', aliases: ['processingFee'] },
  { id: 'moratoriumPeriod', label: 'Moratorium period (months)', aliases: ['moratoriumPeriod'] },
  { id: 'loanAmount', label: 'Loan Amount', aliases: ['loanAmount'] },
];

const MEPMA_ALWAYS_SHOW_IDS = new Set([
  'aadharNumber',
  'panNumber',
  'loanType',
  'sector',
  'workingCapital',
  'workingCapitalMargin',
  'workingCapitalRateOfInterest',
  'loanTermPeriod',
  'rateOfInterest',
  'processingFee',
  'moratoriumPeriod',
  'loanAmount',
  'hasOtherDprInfo',
]);
const MEPMA_HIGHLIGHT_IDS = ['loanType', 'sector'];

const firstNonEmpty = (data, keys) => {
  for (const key of keys) {
    const val = data?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') return val;
  }
  return undefined;
};

const formatSubmittedValue = (val, fieldId) => {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.length ? val.map((item) => String(item)).join(', ') : '—';
  if (fieldId === 'loanType') return displayMsmeLoanType(val);
  return String(val);
};

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
      return { label: 'PAYMENT PENDING', badgeClass: 'bg-yellow-100 text-yellow-800', description: 'Waiting for the customer to pay. You can resend the payment link or pay on their behalf.' };
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
  const [sendingPaymentRequest, setSendingPaymentRequest] = useState(false);
  const [payingOnBehalf, setPayingOnBehalf] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

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

      if (reqData && String(reqData?.formId?.customRoute || '').toLowerCase() === 'dpr-request') {
        try {
          const listRes = await api.get('/dpr-request-leads', {
            params: { departmentRequestId: id, limit: 1 },
          });
          const lead = listRes.data?.submissions?.[0];
          if (lead) {
            reqData.submittedData = {
              ...(reqData.submittedData || {}),
              workingCapital: reqData.submittedData?.workingCapital || lead.workingCapital || '',
              workingCapitalMargin:
                reqData.submittedData?.workingCapitalMargin || lead.workingCapitalMargin || '',
              workingCapitalRateOfInterest:
                reqData.submittedData?.workingCapitalRateOfInterest ||
                lead.workingCapitalRateOfInterest ||
                '',
              loanTermPeriod: reqData.submittedData?.loanTermPeriod || lead.loanTermPeriod || '',
              rateOfInterest: reqData.submittedData?.rateOfInterest || lead.rateOfInterest || '',
              processingFee: reqData.submittedData?.processingFee || lead.processingFee || '',
              moratoriumPeriod: reqData.submittedData?.moratoriumPeriod || lead.moratoriumPeriod || '',
              loanAmount: reqData.submittedData?.loanAmount || lead.loanAmount || '',
              hasOtherDprInfo: reqData.submittedData?.hasOtherDprInfo ?? lead.hasOtherDprInfo,
              dprAssets:
                Array.isArray(reqData.submittedData?.dprAssets) && reqData.submittedData.dprAssets.length > 0
                  ? reqData.submittedData.dprAssets
                  : Array.isArray(lead.dprAssets)
                    ? lead.dprAssets
                    : [],
              aadharNumber: reqData.submittedData?.aadharNumber || lead.aadharNumber || '',
              panNumber: reqData.submittedData?.panNumber || lead.panNumber || '',
            };
          }
        } catch {
          // Keep department request data if the lead lookup fails.
        }
      }

      if (reqData && String(reqData?.formId?.customRoute || '').toLowerCase() === 'msme-dpr') {
        try {
          const listRes = await api.get('/msme-dpr-leads', {
            params: { departmentRequestId: id, limit: 1 },
          });
          const lead = listRes.data?.submissions?.[0];
          if (lead) {
            reqData.submittedData = {
              ...(reqData.submittedData || {}),
              workingCapital: reqData.submittedData?.workingCapital || lead.workingCapital || '',
              workingCapitalMargin:
                reqData.submittedData?.workingCapitalMargin || lead.workingCapitalMargin || '',
              workingCapitalRateOfInterest:
                reqData.submittedData?.workingCapitalRateOfInterest ||
                lead.workingCapitalRateOfInterest ||
                '',
              loanTermPeriod: reqData.submittedData?.loanTermPeriod || lead.loanTermPeriod || '',
              rateOfInterest: reqData.submittedData?.rateOfInterest || lead.rateOfInterest || '',
              processingFee: reqData.submittedData?.processingFee || lead.processingFee || '',
              moratoriumPeriod: reqData.submittedData?.moratoriumPeriod || lead.moratoriumPeriod || '',
              loanAmount: reqData.submittedData?.loanAmount || lead.loanAmount || '',
              hasOtherDprInfo: reqData.submittedData?.hasOtherDprInfo ?? lead.hasOtherDprInfo,
              dprAssets:
                Array.isArray(reqData.submittedData?.dprAssets) && reqData.submittedData.dprAssets.length > 0
                  ? reqData.submittedData.dprAssets
                  : Array.isArray(lead.dprAssets)
                    ? lead.dprAssets
                    : [],
              aadharNumber: reqData.submittedData?.aadharNumber || lead.aadharNumber || '',
              panNumber: reqData.submittedData?.panNumber || lead.panNumber || '',
            };
          }
        } catch {
          // Keep department request data if the lead lookup fails.
        }
      }

      if (reqData && String(reqData?.formId?.customRoute || '').toLowerCase() === 'mepma-dpr') {
        try {
          const listRes = await api.get('/mepma-dpr-leads', {
            params: { departmentRequestId: id, limit: 1 },
          });
          const lead = listRes.data?.submissions?.[0];
          if (lead) {
            reqData.submittedData = {
              ...(reqData.submittedData || {}),
              workingCapital: reqData.submittedData?.workingCapital || lead.workingCapital || '',
              workingCapitalMargin:
                reqData.submittedData?.workingCapitalMargin || lead.workingCapitalMargin || '',
              workingCapitalRateOfInterest:
                reqData.submittedData?.workingCapitalRateOfInterest ||
                lead.workingCapitalRateOfInterest ||
                '',
              loanTermPeriod: reqData.submittedData?.loanTermPeriod || lead.loanTermPeriod || '',
              rateOfInterest: reqData.submittedData?.rateOfInterest || lead.rateOfInterest || '',
              processingFee: reqData.submittedData?.processingFee || lead.processingFee || '',
              moratoriumPeriod: reqData.submittedData?.moratoriumPeriod || lead.moratoriumPeriod || '',
              loanAmount: reqData.submittedData?.loanAmount || lead.loanAmount || '',
              hasOtherDprInfo: reqData.submittedData?.hasOtherDprInfo ?? lead.hasOtherDprInfo,
              dprAssets:
                Array.isArray(reqData.submittedData?.dprAssets) && reqData.submittedData.dprAssets.length > 0
                  ? reqData.submittedData.dprAssets
                  : Array.isArray(lead.dprAssets)
                    ? lead.dprAssets
                    : [],
              aadharNumber: reqData.submittedData?.aadharNumber || lead.aadharNumber || '',
              panNumber: reqData.submittedData?.panNumber || lead.panNumber || '',
              mepma_sector: reqData.submittedData?.mepma_sector || lead.sector || '',
              sector: reqData.submittedData?.sector || lead.sector || '',
            };
          }
        } catch {
          // Keep department request data if the lead lookup fails.
        }
      }

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

  useEffect(() => {
    const expiresAt = claimExpiresAt(request);
    if (!expiresAt) return undefined;
    const tick = setInterval(() => {
      const next = Date.now();
      setNowTs(next);
      if (next >= expiresAt.getTime()) {
        fetchRequestDetails({ silent: true });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [request, fetchRequestDetails]);

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

  const handleGenerateReport = async () => {
    try {
      await api.post(`/govt-forms/requests/${id}/generation-started`);
    } catch {
      // Navigation should still proceed; lock is best-effort.
    }

    const params = new URLSearchParams({
      templateId: selectedTemplate,
      newDraft: '1',
      requestId: id,
    });

    if (isTermLoanTemplateId(selectedTemplate)) {
      const { presetSector } = resolveTemplateSector(selectedTemplate);
      if (presetSector) params.set('presetSector', presetSector);
      // Sector stays editable after auto-select.
      // if (lockSector) params.set('lockSector', '1');
    }

    navigate(`/generate?${params.toString()}`);
  };

  const handleContinueGeneration = () => {
    const report = request?.reportId;
    const templateId = report?.templateId || selectedTemplate;
    const reportId = report?._id || report;
    if (!templateId || !reportId) return;
    const params = new URLSearchParams({
      templateId,
      requestId: id,
      paidReportId: String(reportId),
    });
    navigate(`/generate?${params.toString()}`);
  };

  const handleResendPaymentRequest = async () => {
    const reportId = request?.reportId?._id || request?.reportId;
    if (!reportId) return;
    setSendingPaymentRequest(true);
    try {
      await api.post(`/reports/${reportId}/send-payment-request`);
      toast.success('Payment request sent to the customer');
      fetchRequestDetails({ silent: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send payment request'));
    } finally {
      setSendingPaymentRequest(false);
    }
  };

  const handleCopyPaymentLink = async () => {
    const link = request?.reportId?.payment?.payment_link_url;
    if (!link) {
      toast.error('No payment link yet. Send a payment request first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Payment link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Opens the full PaymentModal so CS can choose free credit or Razorpay.
  // A fresh payment order is created; after success the report is generated.
  const handlePayOnBehalf = () => {
    setShowPayModal(true);
  };

  // Called by PaymentModal after payment (free credit or Razorpay) succeeds.
  const handlePayModalSuccess = (paymentData) => {
    const alreadyGenerated = Boolean(
      request?.reportId?.excel_file_url ||
      request?.reportId?.pdf_file_url ||
      request?.reportId?.status === 'completed'
    );
    if (alreadyGenerated && !paymentData?.generate_without_payment) {
      toast.success('Payment recorded. The existing report was not regenerated.');
      fetchRequestDetails({ silent: true });
      return;
    }
    if (alreadyGenerated && paymentData?.generate_without_payment) {
      toast.success('Payment request sent. The existing report was not regenerated.');
      fetchRequestDetails({ silent: true });
      return;
    }
    const templateId = request?.reportId?.templateId || selectedTemplate;
    const params = new URLSearchParams({
      templateId,
      requestId: id,
      paidReportId: String(paymentData.report_id),
    });
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
  const paymentCompleted = request?.reportId?.payment?.status === 'completed';
  const canSendReport = isOwner() && request?.reportId && isReportApproved && paymentCompleted;
  const isPaymentPending = Boolean(request?.reportId) && !paymentCompleted;
  const billedToCustomer = request?.reportId?.payment?.billed_to === 'customer';
  const generationComplete = Boolean(
    request?.reportId?.excel_file_url ||
    request?.reportId?.pdf_file_url ||
    request?.reportId?.status === 'completed'
  );
  const canContinueGeneration = isOwner() && (paymentCompleted || billedToCustomer) && !generationComplete;
  const workflow = getDprWorkflowStatus(request, request?.reportId);
  const canReleaseClaim = request?.status === 'claimed' && isOwner() && canUnclaimRequest(request, request?.reportId);
  const claimDeadline = claimExpiresAt(request);
  const remainingMs = claimDeadline ? Math.max(0, claimDeadline.getTime() - nowTs) : 0;
  const remainingLabel = claimDeadline
    ? `${String(Math.floor(remainingMs / 60000)).padStart(1, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`
    : null;

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

  const applicantName = request.customerId?.name || dynamicName || data.name || data.fullname || data.applicantName || data.govt_builtin_name || 'N/A';
  const rawApplicantEmail = request.customerId?.email || dynamicEmail || data.email || data.applicantEmail || data.govt_builtin_email || '';
  const applicantEmail = rawApplicantEmail.endsWith('@phone.customer.finvois') ? '—' : (rawApplicantEmail || '—');
  const applicantPhone = request.customerId?.phone || dynamicPhone || data.phone || data.mobile || data.applicantPhone || data.govt_builtin_phone || 'N/A';

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

          {canReleaseClaim && (
            <button
              onClick={handleRelease}
              className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-semibold transition-colors shadow-sm"
            >
              <X size={16} /> Release Claim
            </button>
          )}
        </div>
      </div>

      {remainingLabel && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Clock size={22} className="shrink-0" />
            <div>
              <p className="text-sm font-bold">Claim timer: {remainingLabel}</p>
              <p className="text-xs mt-0.5">
                Generate the report within 15 minutes or this request returns to Open Requests.
              </p>
            </div>
          </div>
          <span className="text-2xl font-mono font-bold tabular-nums shrink-0">{remainingLabel}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Request Meta & Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">{request.formId?.name || 'Deleted Form'}</h1>
            <p className="text-sm text-gray-500">
              Department: <strong>{request.departmentId?.name === 'AP TEST' ? 'AP MSME' : request.departmentId?.name}</strong>
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${workflow.badgeClass}`}>
                {workflow.label}
              </span>
              {remainingLabel && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                  <Clock size={12} /> Auto-unclaim in {remainingLabel}
                </span>
              )}
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
              {isMsmeLikeRequest(request) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/60">
                  {MSME_HIGHLIGHT_IDS.map((fieldId) => {
                    const field = MSME_EXTRA_FIELDS.find((f) => f.id === fieldId);
                    const val = firstNonEmpty(request.submittedData, field?.aliases || [fieldId]);
                    return (
                      <div key={`highlight-${fieldId}`}>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1">
                          {field?.label || fieldId}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 break-all">
                          {formatSubmittedValue(val, fieldId)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {isMepmaRequest(request) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/60">
                  {MEPMA_HIGHLIGHT_IDS.map((fieldId) => {
                    const field = MEPMA_EXTRA_FIELDS.find((f) => f.id === fieldId);
                    const val = firstNonEmpty(request.submittedData, field?.aliases || [fieldId]);
                    return (
                      <div key={`mepma-highlight-${fieldId}`}>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1">
                          {field?.label || fieldId}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 break-all">
                          {formatSubmittedValue(val, fieldId)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {request.formId?.fields?.map(field => {
                const extra = (isMepmaRequest(request) ? MEPMA_EXTRA_FIELDS : MSME_EXTRA_FIELDS).find(
                  (item) => item.aliases?.includes(field.id) || item.id === field.id
                );
                const highlightIds = isMepmaRequest(request) ? MEPMA_HIGHLIGHT_IDS : MSME_HIGHLIGHT_IDS;
                if (extra && highlightIds.includes(extra.id)) return null;
                const val = extra
                  ? firstNonEmpty(request.submittedData, extra.aliases)
                  : request.submittedData?.[field.id];

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
                    <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">{formatSubmittedValue(val, extra?.id || field.id)}</span>
                  </div>
                );
              })}

              {isMsmeLikeRequest(request) && MSME_EXTRA_FIELDS.map((field) => {
                if (MSME_HIGHLIGHT_IDS.includes(field.id)) return null;
                const alreadyShown = (request.formId?.fields || []).some(
                  (f) => field.aliases.includes(f.id) || f.id === field.id
                );
                if (alreadyShown) return null;
                const val = firstNonEmpty(request.submittedData, field.aliases);
                if (!MSME_ALWAYS_SHOW_IDS.has(field.id) && (val === undefined || val === null || val === '')) {
                  return null;
                }
                return (
                  <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                    <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">{formatSubmittedValue(val, field.id)}</span>
                  </div>
                );
              })}

              {isMepmaRequest(request) && MEPMA_EXTRA_FIELDS.map((field) => {
                if (MEPMA_HIGHLIGHT_IDS.includes(field.id)) return null;
                const alreadyShown = (request.formId?.fields || []).some(
                  (f) => field.aliases.includes(f.id) || f.id === field.id
                );
                if (alreadyShown) return null;
                const val = firstNonEmpty(request.submittedData, field.aliases);
                if (!MEPMA_ALWAYS_SHOW_IDS.has(field.id) && (val === undefined || val === null || val === '')) {
                  return null;
                }
                return (
                  <div key={`mepma-${field.id}`} className="border-b border-gray-100 pb-3 last:border-0">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                    <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">{formatSubmittedValue(val, field.id)}</span>
                  </div>
                );
              })}

              {(isMsmeLikeRequest(request) || isMepmaRequest(request)) && (
                <div className="border-b border-gray-100 pb-3 last:border-0">
                  <span className="block text-xs font-semibold text-gray-500 mb-2">DPR Assets:</span>
                  {Array.isArray(request.submittedData?.dprAssets) && request.submittedData.dprAssets.length > 0 ? (
                  <div className="space-y-2">
                    {request.submittedData.dprAssets.map((asset, index) => (
                      <div key={`asset-${index}`} className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                        <p><span className="text-gray-500">Model:</span> {asset.assetModel || '—'}</p>
                        <p><span className="text-gray-500">Category:</span> {asset.assetCategory || '—'}</p>
                        <p><span className="text-gray-500">Amount:</span> {asset.amount || '—'}</p>
                        <p><span className="text-gray-500">Loan %:</span> {asset.loanPercentage || '—'}</p>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <RequestDocumentsPanel
            requestId={id}
            apiBase={`/govt-forms/requests/${id}`}
            status={request.status}
            currentUserId={user?._id}
            isCustomer={false}
          />

          <RequestChatPanel
            requestId={id}
            apiBase={`/govt-forms/requests/${id}`}
            status={request.status}
            currentUserId={user?._id}
          />
        </div>

        {/* Right column: Action panel, report generation & communications logs */}
        <div className="space-y-6">
          {/* Action validation & report generation */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Generate Report</h3>

            {remainingLabel && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                <Clock size={16} className="shrink-0" />
                <p className="text-sm font-semibold">
                  Auto-unclaim in <span className="font-mono tabular-nums">{remainingLabel}</span>
                </p>
              </div>
            )}

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
                {isReportApproved && paymentCompleted && (
                  <div className="pt-2 border-t border-purple-100">
                    <CsApprovedReportActions requestId={id} showDownload />
                  </div>
                )}
                {isOwner() && isPaymentPending && (
                  <div className="pt-3 border-t border-yellow-100 space-y-2">
                    <p className="text-xs text-yellow-800">
                      Amount due: ₹{Number(request.reportId?.payment?.amount || 0).toLocaleString('en-IN')}
                    </p>
                    {request.reportId?.payment?.payment_link_url && (
                      <button
                        type="button"
                        onClick={handleCopyPaymentLink}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-yellow-300 rounded-lg bg-white hover:bg-yellow-50"
                      >
                        <Copy size={14} /> Copy payment link
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={sendingPaymentRequest}
                      onClick={handleResendPaymentRequest}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60"
                    >
                      <Link2 size={14} /> {sendingPaymentRequest ? 'Sending...' : 'Send / resend payment request'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePayOnBehalf}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                    >
                      Pay on behalf
                    </button>
                  </div>
                )}
                {canContinueGeneration && (
                  <button
                    type="button"
                    onClick={handleContinueGeneration}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#7e22ce] hover:bg-[#6b21a8] rounded-lg"
                  >
                    Continue generation
                  </button>
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

          {/* Send Report through Email or Mobile */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Send Report</h3>

            {request.reportId && (!isReportApproved || !paymentCompleted) && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-start gap-2">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  {reportValidationStatus === 'rejected'
                    ? 'This report was rejected and cannot be sent. Generate a new report if needed.'
                    : !paymentCompleted
                    ? 'WhatsApp, email, and download are available after payment is completed.'
                    : 'Sending is available only after CA approval. Track the status above — this page refreshes automatically.'}
                </span>
              </div>
            )}

            {isReportApproved && paymentCompleted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-start gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>Report approved and paid. You can now send it to the applicant via email or WhatsApp.</span>
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
                          : !paymentCompleted
                          ? 'Payment must be completed before sending'
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
                          : !paymentCompleted
                          ? 'Payment must be completed before sending'
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

      {/* Payment modal — opened when CS clicks "Pay on behalf" */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        templateId={request?.reportId?.templateId || selectedTemplate}
        reportTitle={request?.reportId?.title || applicantName}
        initialSelections={null}
        onPaymentSuccess={handlePayModalSuccess}
        analysisOptions={null}
        assistedUserId={null}
        reportHelpRequestId={null}
        requestId={id}
        existingReportId={request?.reportId?._id || request?.reportId || null}
        lockPayer="customer_service"
      />
    </ClientLayout>
  );
};

export default CustomerServiceRequestScreen;
