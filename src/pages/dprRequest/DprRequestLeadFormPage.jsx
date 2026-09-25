/**
 * DPR Request Lead Submission Form
 *
 * Submission flow:
 *  1. Customer fills form → clicks Submit → form validated
 *  2. WhatsApp or email OTP verification
 *  3. POST /customer/dpr-request-form-register with OTP + files
 */
import { useState } from 'react';
import { Send, ChevronDown, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import apiClient, { apiErrorMessage } from '@/api/apiClient';
import LeadFormOtpVerify from '@/components/common/LeadFormOtpVerify';
import { mapDprRequestFormToSubmittedData, DPR_REQUEST_CUSTOM_ROUTE } from '@/constants/dprRequestSubmittedData';
import faqData from '../../data/FAQ.json';
import OptionalDocumentUpload from '@/components/common/OptionalDocumentUpload';
import {
  MSME_DPR_SCHEMES,
  MSME_DPR_GENDER_OPTIONS,
  MSME_DPR_LOAN_TYPE_OPTIONS,
  MSME_DPR_RURAL_URBAN_OPTIONS,
  MSME_DPR_ENTERPRISE_TYPE_OPTIONS,
  MSME_DPR_SECTOR_OPTIONS,
  MSME_DPR_ASSET_CATEGORIES,
} from '@/constants/msmeDprSchemes';
import {
  LANGUAGES,
  FORM_COPY,
  getOptionLabel,
  MSME_DPR_TEST_FORM_1,
  MSME_DPR_TEST_FORM_2,
} from '@/constants/msmeDprFormTranslations';
import {
  applyAssetTriangle,
  calculateAssetLoan,
  isAssetNumericField,
} from '@/utils/dprAssetLoanTriangle';

const LOAN_TERM_YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => String(i + 1));

const createEmptyAsset = () => ({
  assetModel: '',
  assetCategory: '',
  amount: '',
  loanPercentage: '',
  loanAmount: '',
});

function normalizeLoanTermYears(value) {
  const match = String(value || '').match(/\d+/);
  if (!match) return '';
  const years = parseInt(match[0], 10);
  if (!Number.isFinite(years) || years < 1 || years > 15) return '';
  return String(years);
}

const INITIAL_FORM = {
  applicantName: '',
  gender: '',
  mobileNumber: '',
  email: '',
  aadharNumber: '',
  panNumber: '',
  sector: '',
  natureOfBusiness: '',
  enterpriseType: '',
  yearOfRegistration: '',
  schemeAppliedUnder: '',
  loanType: '',
  ruralUrbanCategory: '',
  villageCity: '',
  mandal: '',
  district: '',
  description: '',
  hasOtherDprInfo: false,
  workingCapital: '',
  workingCapitalMargin: '',
  workingCapitalRateOfInterest: '',
  dprAssets: [createEmptyAsset()],
  loanTermPeriod: '',
  rateOfInterest: '',
  processingFee: '',
  moratoriumPeriod: '',
  loanAmount: '',
};

const labelClass =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm';
const selectClass = `${inputClass} appearance-none`;

function FormField({ label, required, optional, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && (
          <span className="text-gray-400 font-normal ml-1 lowercase text-[11px]">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}


const DprRequestLeadFormPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [language, setLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [testDataClickCount, setTestDataClickCount] = useState(0);

  // step: 'form' | 'verify' | 'done'
  const [step, setStep] = useState('form');
  const [pendingPayload, setPendingPayload] = useState(null);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const copy = {
    ...(FORM_COPY[language] || FORM_COPY.en),
    formTitle: 'DPR Request',
    microLabel: 'DPR Request Form',
  };

  const isWorkingCapitalOdLoan = form.loanType === 'Working capital or OD Loan';
  const isWorkingCapitalLoan =
    isWorkingCapitalOdLoan ||
    form.loanType === 'Term Loan and working capital loan';
  const isGoldLoan = form.loanType === 'Gold Loan';
  const showAssetAndLoanParams = Boolean(form.hasOtherDprInfo && form.loanType && !isWorkingCapitalOdLoan);

  const totalAssetLoan = (form.dprAssets || []).reduce(
    (sum, asset) => sum + calculateAssetLoan(asset),
    0
  );
  const workingCapitalNum = isWorkingCapitalLoan
    ? parseFloat(String(form.workingCapital || '').replace(/,/g, '')) || 0
    : 0;
  const totalCalculatedLoan = Math.round(totalAssetLoan + workingCapitalNum);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'enterpriseType' && value !== 'Existing Enterprises') {
        next.yearOfRegistration = '';
      }
      if (name === 'loanType') {
        if (!value) {
          next.hasOtherDprInfo = false;
          next.workingCapital = '';
          next.workingCapitalMargin = '';
          next.workingCapitalRateOfInterest = '';
        } else if (
          value !== 'Term Loan and working capital loan' &&
          value !== 'Working capital or OD Loan'
        ) {
          next.workingCapital = '';
          next.workingCapitalMargin = '';
          next.workingCapitalRateOfInterest = '';
        }
        if (value === 'Gold Loan') {
          next.schemeAppliedUnder = '';
          next.ruralUrbanCategory = '';
        }
        if (value === 'Working capital or OD Loan') {
          next.dprAssets = [createEmptyAsset()];
          next.loanTermPeriod = '';
          next.rateOfInterest = '';
          next.processingFee = '';
          next.moratoriumPeriod = '';
        }
      }
      return next;
    });
  };

  const handleAadharChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setForm((prev) => ({ ...prev, aadharNumber: value }));
  };

  const handlePanChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, panNumber: value }));
  };

  const handleDecimalChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleIntegerChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d+$/.test(value)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleOtherInfo = () => {
    if (!form.loanType) {
      setError(copy.selectLoanTypeFirst);
      return;
    }
    setError('');
    setForm((prev) => {
      const nextHasOther = !prev.hasOtherDprInfo;
      return {
        ...prev,
        hasOtherDprInfo: nextHasOther,
        dprAssets:
          nextHasOther && (!prev.dprAssets || prev.dprAssets.length === 0)
            ? [createEmptyAsset()]
            : prev.dprAssets,
      };
    });
  };

  const handleAssetChange = (index, field, value) => {
    if (isAssetNumericField(field) && value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    setForm((prev) => {
      const updatedAssets = [...prev.dprAssets];
      updatedAssets[index] = applyAssetTriangle(updatedAssets[index], field, value);
      return { ...prev, dprAssets: updatedAssets };
    });
  };

  const handleAddAssetRow = () => {
    setForm((prev) => ({
      ...prev,
      dprAssets: [...(prev.dprAssets || []), createEmptyAsset()],
    }));
  };

  const handleRemoveAssetRow = (index) => {
    setForm((prev) => {
      const filtered = prev.dprAssets.filter((_, i) => i !== index);
      return {
        ...prev,
        dprAssets: filtered.length > 0 ? filtered : [createEmptyAsset()],
      };
    });
  };

  const handleFillTestData = () => {
    if (testDataClickCount % 2 === 0) {
      // 1st click: Basic test data
      setForm({
        ...MSME_DPR_TEST_FORM_1,
        workingCapital: '',
        workingCapitalMargin: '',
        workingCapitalRateOfInterest: '',
        dprAssets: [createEmptyAsset()],
      });
    } else {
      // 2nd click: Extended test data with Asset Table and Loan parameters
      setForm({
        ...MSME_DPR_TEST_FORM_2,
        workingCapital: MSME_DPR_TEST_FORM_2.workingCapital || '',
        workingCapitalMargin: MSME_DPR_TEST_FORM_2.workingCapitalMargin || '',
        workingCapitalRateOfInterest: MSME_DPR_TEST_FORM_2.workingCapitalRateOfInterest || '',
        dprAssets: MSME_DPR_TEST_FORM_2.dprAssets.map((a) => ({ ...a })),
        moratoriumPeriod: MSME_DPR_TEST_FORM_2.moratoriumPeriod || '',
      });
    }
    setTestDataClickCount((prev) => prev + 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.applicantName.trim()) { setError('Name of Applicant is required'); return; }
    if (!form.mobileNumber.trim()) { setError('Mobile Number is required'); return; }
    if (!form.loanType) { setError('Loan Type is required'); return; }

    const digits = form.mobileNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid mobile number (at least 10 digits).');
      return;
    }
    const emailTrim = String(form.email || '').trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Enter a valid email address or leave it blank.');
      return;
    }

    const resolvedLoanAmount =
      totalCalculatedLoan > 0 ? String(totalCalculatedLoan) : form.loanAmount || '';

    const payload = mapDprRequestFormToSubmittedData({
      ...form,
      loanAmount: isWorkingCapitalOdLoan
        ? String(workingCapitalNum || form.workingCapital || resolvedLoanAmount || '')
        : resolvedLoanAmount,
      workingCapital: isWorkingCapitalLoan ? form.workingCapital : '',
      workingCapitalMargin: isWorkingCapitalLoan ? form.workingCapitalMargin : '',
      workingCapitalRateOfInterest: isWorkingCapitalLoan ? form.workingCapitalRateOfInterest : '',
      loanTermPeriod: isWorkingCapitalOdLoan ? '' : form.loanTermPeriod,
      rateOfInterest: isWorkingCapitalOdLoan ? '' : form.rateOfInterest,
      processingFee: isWorkingCapitalOdLoan ? '' : form.processingFee,
      moratoriumPeriod: isWorkingCapitalOdLoan ? '' : form.moratoriumPeriod,
      dprAssets: (form.hasOtherDprInfo && !isWorkingCapitalOdLoan && Array.isArray(form.dprAssets))
        ? form.dprAssets
        : [],
    });

    setPendingPayload(payload);
    setError('');
    setStep('verify');
  };

  const handleVerifiedSubmit = async ({ type, value, otp, email }) => {
    if (!pendingPayload) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...pendingPayload,
        govt_builtin_email: type === 'email' ? email : pendingPayload.govt_builtin_email || '',
      };
      const fd = new FormData();
      fd.append('customRoute', DPR_REQUEST_CUSTOM_ROUTE);
      fd.append('submittedData', JSON.stringify(payload));
      fd.append('otpType', type);
      fd.append('otpValue', value);
      fd.append('otp', otp);
      pendingAttachments.forEach((file) => fd.append('files', file));

      const res = await apiClient.post('/customer/dpr-request-form-register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setSubmittedRequestId(res.data.requestId || null);
        setSuccess(true);
        setStep('done');
      } else {
        setError(res.data?.error || res.data?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          'Submission failed. Please check your details and try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSuccess(false);
    setError('');
    setPendingAttachments([]);
    setTestDataClickCount(0);
    setStep('form');
    setSubmittedRequestId(null);
    setPendingPayload(null);
  };

  return (
    <div className="w-full px-2 md:px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Info Panel */}
        <div className="lg:col-span-3 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-['Manrope'] mb-3">
              What is a Detailed Project Report (DPR)
            </h3>
            <p className="text-sm text-gray-600 font-['Inter'] leading-relaxed">
              A Detailed Project Report (DPR) is a professional document that evaluates the technical, financial, and commercial feasibility of a business or project. It acts as a roadmap for implementation and funding.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 font-['Manrope'] mb-2">
              Who Needs a DPR
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 font-['Inter'] space-y-1">
              <li>Entrepreneurs and Startups</li>
              <li>MSMEs</li>
              <li>Banks and Financial Institutions</li>
              <li>Government Departments</li>
              <li>Investors and Funding Agencies</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 font-['Manrope'] mb-2">
              Why is it Required
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 font-['Inter'] space-y-1">
              <li>To obtain business loans</li>
              <li>To apply for government subsidies and schemes</li>
              <li>To assess project feasibility and profitability</li>
              <li>To support informed investment and business decisions</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 font-['Manrope'] mb-2">
              How Does it Help
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 font-['Inter'] space-y-1">
              <li>Improves loan approval prospects</li>
              <li>Demonstrates project viability</li>
              <li>Provides financial projections and risk analysis</li>
              <li>Builds confidence among lenders and investors</li>
            </ul>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="dpr-request-language" className="text-sm font-medium text-gray-600">
                {copy.languageLabel}
              </label>
              <select
                id="dpr-request-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            {step === 'form' && (
              <button
                type="button"
                onClick={handleFillTestData}
                title="Click once for basic test data, click again for extended asset & loan test data"
                className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {copy.fillTestData} {testDataClickCount > 0 ? `(${testDataClickCount % 2 === 0 ? 'Extended' : 'Basic'})` : ''}
              </button>
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
            {copy.microLabel}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{copy.formTitle}</h1>

          {step === 'verify' ? (
            <LeadFormOtpVerify
              applicantName={form.applicantName}
              mobileNumber={form.mobileNumber}
              initialEmail={form.email}
              copy={copy}
              submitting={submitting}
              error={error}
              onBack={() => {
                setError('');
                setStep('form');
              }}
              onVerifiedSubmit={handleVerifiedSubmit}
            />
          ) : step === 'done' ? (
            /* ── Success screen ── */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl text-green-600">
                ✓
              </div>
              <p className="text-green-600 font-medium text-lg mb-2">{copy.successTitle}</p>
              <p className="text-gray-500 mb-6">{copy.successBody}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  {copy.submitAnother}
                </button>
              </div>
            </div>
          ) : (
            /* ── Main form ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <FormField label={copy.loanType} required>
                <select
                  name="loanType"
                  value={form.loanType}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">{copy.selectLoanType}</option>
                  {MSME_DPR_LOAN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {getOptionLabel(language, 'loanType', opt)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={copy.applicantName} required>
                <input
                  type="text"
                  name="applicantName"
                  value={form.applicantName}
                  onChange={handleChange}
                  required
                  placeholder={copy.placeholderApplicantName}
                  className={inputClass}
                />
              </FormField>

              <FormField label={copy.gender} required>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">{copy.selectGender}</option>
                  {MSME_DPR_GENDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {getOptionLabel(language, 'gender', opt)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={copy.mobileNumber} required>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder={copy.placeholderMobile}
                  className={inputClass}
                />
              </FormField>

              <FormField label={copy.email || 'Email'} optional>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={copy.placeholderEmail || 'yourname@example.com'}
                  className={inputClass}
                />
              </FormField>

              {/* Optional Aadhaar & PAN under Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={copy.aadharNumber} optional>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={form.aadharNumber}
                    onChange={handleAadharChange}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={copy.placeholderAadhar}
                    className={inputClass}
                  />
                </FormField>

                <FormField label={copy.panNumber} optional>
                  <input
                    type="text"
                    name="panNumber"
                    value={form.panNumber}
                    onChange={handlePanChange}
                    maxLength={10}
                    placeholder={copy.placeholderPan}
                    className={`${inputClass} uppercase`}
                  />
                </FormField>
              </div>

              <FormField label={copy.sector} required>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">{copy.selectSector}</option>
                  {MSME_DPR_SECTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {getOptionLabel(language, 'sector', opt)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={copy.natureOfBusiness} required>
                <input
                  type="text"
                  name="natureOfBusiness"
                  value={form.natureOfBusiness}
                  onChange={handleChange}
                  required
                  placeholder={copy.placeholderNatureOfBusiness}
                  className={inputClass}
                />
              </FormField>

              <FormField label={copy.enterpriseType} required>
                <select
                  name="enterpriseType"
                  value={form.enterpriseType}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">{copy.selectEnterpriseType}</option>
                  {MSME_DPR_ENTERPRISE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {getOptionLabel(language, 'enterpriseType', opt)}
                    </option>
                  ))}
                </select>
              </FormField>

              {form.enterpriseType === 'Existing Enterprises' && (
                <FormField label={copy.yearOfRegistration} required>
                  <input
                    type="text"
                    name="yearOfRegistration"
                    value={form.yearOfRegistration}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    maxLength={4}
                    placeholder={copy.placeholderYearOfRegistration}
                    className={inputClass}
                  />
                </FormField>
              )}

              {!isGoldLoan && (
                <FormField label={copy.schemeAppliedUnder} required>
                  <select
                    name="schemeAppliedUnder"
                    value={form.schemeAppliedUnder}
                    onChange={handleChange}
                    required
                    className={selectClass}
                  >
                    <option value="">{copy.selectScheme}</option>
                    {MSME_DPR_SCHEMES.map((opt) => (
                      <option key={opt} value={opt}>
                        {getOptionLabel(language, 'scheme', opt)}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              {!isGoldLoan && (
                <FormField label={copy.ruralUrbanCategory} required>
                  <select
                    name="ruralUrbanCategory"
                    value={form.ruralUrbanCategory}
                    onChange={handleChange}
                    required
                    className={selectClass}
                  >
                    <option value="">{copy.selectCategory}</option>
                    {MSME_DPR_RURAL_URBAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {getOptionLabel(language, 'ruralUrban', opt)}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label={copy.villageCity} required>
                <input
                  type="text"
                  name="villageCity"
                  value={form.villageCity}
                  onChange={handleChange}
                  required
                  placeholder={copy.placeholderVillageCity}
                  className={inputClass}
                />
              </FormField>

              <FormField label={copy.mandal} required>
                <input
                  type="text"
                  name="mandal"
                  value={form.mandal}
                  onChange={handleChange}
                  required
                  placeholder={copy.placeholderMandal}
                  className={inputClass}
                />
              </FormField>

              <FormField label={copy.district} required>
                <input
                  type="text"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  required
                  placeholder={copy.placeholderDistrict}
                  className={inputClass}
                />
              </FormField>

              {/* Other Information required for preparing DPR */}
              <div
                className={`border rounded-2xl p-4 sm:p-5 transition-all space-y-4 ${
                  !form.loanType
                    ? 'border-gray-200 bg-gray-50/60 opacity-80 cursor-not-allowed'
                    : 'border-purple-200 bg-purple-50/40'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleToggleOtherInfo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleOtherInfo();
                    }
                  }}
                  className={`flex items-start gap-3 select-none ${
                    !form.loanType ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="text-purple-600 mt-0.5 shrink-0">
                    {form.hasOtherDprInfo ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {copy.otherInfoRequired}
                    </p>
                    <p className="text-xs mt-0.5">
                      {!form.loanType ? (
                        <span className="text-purple-600 font-medium">
                          {copy.selectLoanTypeFirst}
                        </span>
                      ) : isWorkingCapitalOdLoan ? (
                        <span className="text-gray-500">{copy.otherInfoWorkingCapitalOnly}</span>
                      ) : (
                        <span className="text-gray-500">{copy.otherInfoRequiredSub}</span>
                      )}
                    </p>
                  </div>
                </div>

                {form.hasOtherDprInfo && form.loanType && (
                  <div className="pt-3 border-t border-purple-200/80 space-y-4 animate-in fade-in duration-200">
                    {/* Working Capital question above table when working capital loan is selected */}
                    {isWorkingCapitalLoan && (
                      <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
                        <FormField label={copy.workingCapital} optional>
                          <input
                            type="text"
                            name="workingCapital"
                            value={form.workingCapital}
                            onChange={handleChange}
                            inputMode="numeric"
                            placeholder={copy.placeholderWorkingCapital}
                            className={inputClass}
                          />
                        </FormField>
                        <FormField label={copy.workingCapitalMargin} optional>
                          <input
                            type="text"
                            name="workingCapitalMargin"
                            value={form.workingCapitalMargin}
                            onChange={handleDecimalChange}
                            inputMode="decimal"
                            placeholder={copy.placeholderWorkingCapitalMargin}
                            className={inputClass}
                          />
                        </FormField>
                        <FormField label={copy.workingCapitalRateOfInterest} optional>
                          <input
                            type="text"
                            name="workingCapitalRateOfInterest"
                            value={form.workingCapitalRateOfInterest}
                            onChange={handleDecimalChange}
                            inputMode="decimal"
                            placeholder={copy.placeholderWorkingCapitalRateOfInterest}
                            className={inputClass}
                          />
                        </FormField>
                      </div>
                    )}

                    {showAssetAndLoanParams && (
                    <>
                    {/* Asset Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Assets Breakdown
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-semibold">
                              <th className="p-2.5 min-w-[130px]">{copy.assetModel}</th>
                              <th className="p-2.5 min-w-[160px]">{copy.assetCategory}</th>
                              <th className="p-2.5 min-w-[100px]">{copy.amount}</th>
                              <th className="p-2.5 min-w-[80px]">{copy.loanPercentage}</th>
                              <th className="p-2.5 min-w-[110px]">Loan Amount (₹)</th>
                              <th className="p-2.5 w-10 text-center" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {form.dprAssets?.map((asset, idx) => {
                              const rowLoanAmt = calculateAssetLoan(asset);
                              return (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={asset.assetModel}
                                      onChange={(e) =>
                                        handleAssetChange(idx, 'assetModel', e.target.value)
                                      }
                                      placeholder={copy.placeholderAssetModel}
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={asset.assetCategory}
                                      onChange={(e) =>
                                        handleAssetChange(idx, 'assetCategory', e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 outline-none"
                                    >
                                      <option value="">{copy.selectAssetCategory}</option>
                                      {MSME_DPR_ASSET_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                          {getOptionLabel(language, 'assetCategory', cat)}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={asset.amount}
                                      onChange={(e) =>
                                        handleAssetChange(idx, 'amount', e.target.value)
                                      }
                                      placeholder={copy.placeholderAmount}
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    {/* Highlight when amount is filled but loan % is blank */}
                                    {(() => {
                                      const amtFilled = parseFloat(String(asset.amount || '').replace(/,/g, '')) > 0;
                                      const pctMissing = amtFilled && !String(asset.loanPercentage || '').trim();
                                      return (
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={asset.loanPercentage}
                                            onChange={(e) =>
                                              handleAssetChange(idx, 'loanPercentage', e.target.value)
                                            }
                                            placeholder={copy.placeholderLoanPercentage}
                                            title={pctMissing ? 'Fill Loan % to auto-populate Cost of Project in the report' : undefined}
                                            className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none focus:bg-white focus:border-purple-500 ${
                                              pctMissing
                                                ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                                                : 'border-gray-200 bg-gray-50'
                                            }`}
                                          />
                                          {pctMissing && (
                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-amber-500 text-[9px] font-bold leading-none pointer-events-none">
                                              !
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={asset.loanAmount ?? (rowLoanAmt > 0 ? String(Math.round(rowLoanAmt)) : '')}
                                      onChange={(e) =>
                                        handleAssetChange(idx, 'loanAmount', e.target.value)
                                      }
                                      placeholder="0"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-purple-500 outline-none font-medium text-gray-700"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    {form.dprAssets.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAssetRow(idx)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                                        title={copy.removeRow}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddAssetRow}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {copy.addRow}
                      </button>

                      {/* Warning banner when any asset row has amount but missing loan % */}
                      {(form.dprAssets || []).some(
                        (a) =>
                          parseFloat(String(a.amount || '').replace(/,/g, '')) > 0 &&
                          !String(a.loanPercentage || '').trim()
                      ) && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                          <span className="font-bold shrink-0">⚠</span>
                          <span>
                            One or more asset rows have an amount but no Loan %. Fill in the Loan % for each
                            asset so <strong>Cost of Project</strong> can be auto-populated when the report
                            is generated.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Loan parameters below table */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <FormField label={copy.loanTermPeriod} optional>
                        <div className="flex items-center gap-2">
                          <select
                            name="loanTermPeriod"
                            value={normalizeLoanTermYears(form.loanTermPeriod)}
                            onChange={handleChange}
                            className={inputClass}
                          >
                            <option value="">{copy.selectLoanTermPeriod}</option>
                            {LOAN_TERM_YEAR_OPTIONS.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-600 whitespace-nowrap shrink-0">
                            {copy.yearsUnit}
                          </span>
                        </div>
                      </FormField>

                      <FormField label={copy.rateOfInterest} optional>
                        <input
                          type="text"
                          name="rateOfInterest"
                          value={form.rateOfInterest}
                          onChange={handleDecimalChange}
                          inputMode="decimal"
                          placeholder={copy.placeholderRateOfInterest}
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label={copy.processingFee} optional>
                        <input
                          type="text"
                          name="processingFee"
                          value={form.processingFee}
                          onChange={handleDecimalChange}
                          inputMode="decimal"
                          placeholder={copy.placeholderProcessingFee}
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label={copy.moratoriumPeriod} optional>
                        <input
                          type="text"
                          name="moratoriumPeriod"
                          value={form.moratoriumPeriod}
                          onChange={handleIntegerChange}
                          inputMode="numeric"
                          placeholder={copy.placeholderMoratoriumPeriod}
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label={copy.loanAmount}>
                        <div className="relative">
                          <input
                            type="text"
                            name="loanAmount"
                            value={
                              totalCalculatedLoan > 0
                                ? `₹${totalCalculatedLoan.toLocaleString('en-IN')}`
                                : form.loanAmount
                                  ? `₹${form.loanAmount}`
                                  : '₹0'
                            }
                            readOnly
                            disabled
                            className={`${inputClass} bg-gray-100 text-gray-800 font-semibold cursor-not-allowed border-gray-300 pr-24`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 select-none">
                            Auto Sum
                          </span>
                        </div>
                      </FormField>
                    </div>
                    </>
                    )}
                  </div>
                )}
              </div>

              <FormField label={copy.description}>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={copy.placeholderDescription}
                  className={`${inputClass} min-h-[100px] resize-y`}
                />
              </FormField>

              <OptionalDocumentUpload
                files={pendingAttachments}
                onChange={setPendingAttachments}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm"
              >
                <Send className="h-4 w-4" />
                {submitting ? copy.submitting : copy.submit}
              </button>

              <p className="text-center text-xs text-gray-400">{copy.disclaimer}</p>
            </form>
          )}
        </div>

        {/* Right Side FAQs */}
        <div className="lg:col-span-3 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 font-['Manrope'] mb-4">
            Frequently Asked Questions (FAQs)
          </h3>
          <div className="space-y-3">
            {faqData.faqs.slice(2, 22).map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800 font-['Manrope'] pr-2">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      activeFAQ === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    activeFAQ === idx ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-600 font-['Inter'] leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DprRequestLeadFormPage;
