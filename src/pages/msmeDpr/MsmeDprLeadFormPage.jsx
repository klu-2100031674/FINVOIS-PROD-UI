import { useState } from 'react';
import { Send } from 'lucide-react';
import apiClient from '@/api/apiClient';
import {
  MSME_DPR_SCHEMES,
  MSME_DPR_GENDER_OPTIONS,
  MSME_DPR_LOAN_TYPE_OPTIONS,
  MSME_DPR_RURAL_URBAN_OPTIONS,
} from '@/constants/msmeDprSchemes';
import {
  LANGUAGES,
  FORM_COPY,
  MSME_WEBSITE_URL,
  getOptionLabel,
  MSME_DPR_TEST_FORM,
} from '@/constants/msmeDprFormTranslations';

const INITIAL_FORM = {
  applicantName: '',
  gender: '',
  mobileNumber: '',
  natureOfBusiness: '',
  schemeAppliedUnder: '',
  loanType: '',
  ruralUrbanCategory: '',
  villageCity: '',
  mandal: '',
  district: '',
  description: '',
};

const labelClass =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm';
const selectClass = `${inputClass} appearance-none`;

function FormField({ label, required, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const MsmeDprLeadFormPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [language, setLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const copy = FORM_COPY[language] || FORM_COPY.en;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFillTestData = () => {
    setForm({ ...MSME_DPR_TEST_FORM });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiClient.post('/msme-dpr-leads/submit', form);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || copy.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSuccess(false);
    setError('');
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="msme-dpr-language" className="text-sm font-medium text-gray-600">
              {copy.languageLabel}
            </label>
            <select
              id="msme-dpr-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          {/* {!success && (
            <button
              type="button"
              onClick={handleFillTestData}
              className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {copy.fillTestData}
            </button>
          )} */}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
          {copy.microLabel}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{copy.formTitle}</h1>

        {success ? (
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
              <a
                href={MSME_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-colors"
              >
                {copy.redirectMsmeWebsite}
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
            )}

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

            <FormField label={copy.description} required>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder={copy.placeholderDescription}
                className={`${inputClass} min-h-[100px] resize-y`}
              />
            </FormField>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
              {submitting ? copy.submitting : copy.submit}
            </button>

            <p className="text-center text-xs text-gray-400">{copy.disclaimer}</p>
          </form>
        )}
      </div>
    </div>
  );
};

export default MsmeDprLeadFormPage;
