import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2, Upload, ChevronDown, Save } from 'lucide-react';
import { Button } from '../common';

export const MAX_PHOTOS = 8;
export const MAX_SITE_PHOTO_BYTES = 4 * 1024 * 1024;

/** Merge new site photo picks; skip files over 4MB. */
export function mergeSitePhotoFiles(prev, selectedFiles) {
  const accepted = [];
  let oversized = 0;
  for (const file of selectedFiles) {
    if (file.size > MAX_SITE_PHOTO_BYTES) oversized += 1;
    else accepted.push(file);
  }
  return {
    photos: [...prev, ...accepted].slice(0, MAX_PHOTOS),
    oversized
  };
}

/** Touch-friendly input sizing on mobile (avoids iOS zoom on focus). */
export const EXECUTIVE_INPUT_CLASS = 'text-base sm:text-sm min-h-[44px]';

const selectClassName =
  'w-full px-3 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent cursor-pointer text-gray-800 text-base sm:text-sm transition-all hover:border-gray-400 appearance-none';

const textareaClassName =
  'w-full px-3 py-2.5 min-h-[88px] text-base sm:text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent transition-all hover:border-gray-400 resize-y';

export function formatDdMmYyyy(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function convertToYyyyMmDd(ddMmYyyy) {
  if (!ddMmYyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddMmYyyy)) return ddMmYyyy;
  const parts = ddMmYyyy.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day.length === 2 && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return ddMmYyyy;
}

export function convertToDdMmYyyy(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(yyyyMmDd)) return yyyyMmDd;
  const parts = yyyyMmDd.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && day.length === 2) {
      return `${day}-${month}-${year}`;
    }
  }
  return yyyyMmDd;
}

export function ExecutiveFormShell({ title, subtitle, testDataButton, children }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-manrope">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {testDataButton}
      </div>
      {children}
    </div>
  );
}

export function ExecutiveFormCard({ onSubmit, children }) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm ring-1 ring-purple-100 overflow-hidden pb-24 md:pb-0"
    >
      {children}
    </form>
  );
}

export function ExecutiveFormBody({ children }) {
  return <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">{children}</div>;
}

export function FormSection({ title, children, className = '' }) {
  return (
    <section
      className={`bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 space-y-4 ${className}`}
    >
      <h2 className="text-sm font-semibold text-gray-800 pl-3 border-l-4 border-[#7e22ce]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FormFieldGrid({ children, cols = 2 }) {
  const colClass = cols === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';
  return <div className={`grid ${colClass} gap-3 sm:gap-4`}>{children}</div>;
}

export function FormTextarea({ label, name, value, onChange, rows = 3, required = false, readOnly = false, className = '', maxLength }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`${textareaClassName} ${readOnly ? 'bg-gray-50' : ''}`}
      />
    </div>
  );
}

export function SelectGroup({ label, name, options, value, onChange, required = false, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={selectClassName}
        >
          <option value="" disabled className="text-gray-400">
            Select option...
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-gray-800">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

/** Yes/No select without empty placeholder. */
export function YesNoSelect({ label, name, value, onChange, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select id={name} name={name} value={value} onChange={onChange} className={selectClassName}>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export function VerificationStatusSection({ form, onChange, onStatusPositiveChange }) {
  return (
    <FormSection title="Verification status">
      <FormFieldGrid>
        <div>
          <label htmlFor="verification_status" className="block text-sm font-medium text-gray-700 mb-1">
            Verification status
          </label>
          <select
            id="verification_status"
            name="verification_status"
            value={form.verification_status}
            onChange={onChange}
            className={selectClassName}
          >
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
          </select>
        </div>
        <div className="flex items-center min-h-[44px]">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.status_positive}
              onChange={onStatusPositiveChange}
              className="rounded text-[#7e22ce] focus:ring-[#7e22ce] w-5 h-5 border-gray-300"
            />
            <span className="text-sm font-semibold text-gray-700">Tick mark</span>
          </label>
        </div>
      </FormFieldGrid>
    </FormSection>
  );
}

export function FormLogosHeader({ caLogoUrl, sbiLogoUrl }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/80">
      <div className="flex items-center justify-start h-9 sm:h-12 w-20 sm:w-24 shrink-0">
        {caLogoUrl ? (
          <img src={caLogoUrl} alt="CA" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="h-full w-full bg-gray-200 rounded animate-pulse" />
        )}
      </div>
      <div className="flex-1 text-center px-1">
        <p className="text-[10px] sm:hidden font-bold text-purple-700 uppercase tracking-wide leading-tight">
          Due Diligence Form
        </p>
        <p className="hidden sm:block text-xs font-bold text-purple-700 uppercase tracking-wider">
          Due Diligence Verification Form
        </p>
      </div>
      <div className="flex items-center justify-end h-9 sm:h-12 w-20 sm:w-24 shrink-0">
        {sbiLogoUrl ? (
          <img src={sbiLogoUrl} alt="SBI" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="h-full w-full bg-gray-200 rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}

export function SitePhotosSection({ photos, onPhotosChange, onRemovePhoto }) {
  return (
    <FormSection title="Site Photos">
      <p className="text-xs text-gray-500 -mt-2">
        Up to {MAX_PHOTOS} images (first 2 on page 2, 3 &amp; 4 on page 3, 5 &amp; 6 on page 4, 7 &amp; 8 on page 5)
      </p>
      <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-white hover:bg-purple-50 hover:border-purple-300 transition-all active:bg-purple-50">
        <Upload className="w-8 h-8 text-purple-500 mb-2" />
        <span className="text-sm font-semibold text-gray-600 text-center px-4">
          {photos.length ? `${photos.length} file(s) selected` : 'Tap to upload or take photos'}
        </span>
        <span className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 4MB each</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onPhotosChange}
        />
      </label>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-2">
          {photos.map((file, idx) => (
            <div
              key={idx}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100"
            >
              <img src={URL.createObjectURL(file)} alt={`upload-${idx}`} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 bg-black/60 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                {idx + 1}
              </div>
              {onRemovePhoto && (
                <button
                  type="button"
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center bg-red-600/90 sm:bg-red-600 text-white sm:rounded-full sm:top-1 sm:right-1 sm:min-w-0 sm:min-h-0 sm:p-1.5 shadow transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove photo ${idx + 1}`}
                >
                  <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

export function DraftStatusBanner({ draftId, loadingDraft }) {
  if (loadingDraft) {
    return (
      <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 text-sm text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Loading draft…
      </div>
    );
  }
  if (!draftId) return null;
  return (
    <div className="mx-4 sm:mx-6 mt-4 text-sm text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
      Editing saved draft. Use <strong>Save draft</strong> to update your progress.
    </div>
  );
}

/** Desktop: inline actions. Mobile: fixed bottom bar with safe-area. */
export function StickyFormActions({
  generating,
  lastGenerated,
  onDownload,
  onSaveDraft,
  savingDraft = false,
  loadingDraft = false
}) {
  const canDownload = lastGenerated?.id && lastGenerated?.validationStatus === 'approved';
  const submittedPending =
    lastGenerated?.id && lastGenerated?.validationStatus !== 'approved';

  const secondaryActions = lastGenerated?.id ? (
    <>
      {canDownload && (
        <Button type="button" variant="secondary" onClick={() => onDownload(lastGenerated)} className="md:flex-none">
          <Download className="w-4 h-4 mr-2 inline" />
          Download PDF
        </Button>
      )}
      {submittedPending && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full md:w-auto">
          Submitted for admin approval. It will appear in My Reports once approved.
        </p>
      )}
      <Link
        to="/executive/reports"
        className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#7e22ce] hover:underline md:min-h-0"
      >
        View my reports
      </Link>
    </>
  ) : null;

  return (
    <>
      <div className="hidden md:flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={generating || loadingDraft}>
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Generating…
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2 inline" />
              Generate report
            </>
          )}
        </Button>
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            disabled={savingDraft || loadingDraft}
            onClick={onSaveDraft}
          >
            {savingDraft ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                Save draft
              </>
            )}
          </Button>
        )}
        <Link
          to="/executive/drafts"
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-[#7e22ce] hover:underline"
        >
          My drafts
        </Link>
        {secondaryActions}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto space-y-2">
          <Button type="submit" disabled={generating || loadingDraft} fullWidth size="lg">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Generating…
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2 inline" />
                Generate report
              </>
            )}
          </Button>
          {onSaveDraft && !lastGenerated?.id && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              disabled={savingDraft || loadingDraft}
              onClick={onSaveDraft}
            >
              {savingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save draft
                </>
              )}
            </Button>
          )}
          {lastGenerated?.id && (
            <div className="space-y-2">
              {submittedPending && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  Submitted for admin approval
                </p>
              )}
              <div className="flex gap-2">
                {canDownload && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onDownload(lastGenerated)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1 inline" />
                    Download
                  </Button>
                )}
                <Link
                  to="/executive/reports"
                  className={`inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-[#7e22ce] border border-[#7e22ce] rounded-lg ${
                    canDownload ? 'flex-1' : 'w-full'
                  }`}
                >
                  My Reports
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** @deprecated Use StickyFormActions */
export function FormActions(props) {
  return <StickyFormActions {...props} />;
}

/** Loads CA/SBI logos and merges profile defaults into form state. */
export function useExecutiveFormBootstrap({ getProfile, setForm, executiveAPI }) {
  const [caLogoUrl, setCaLogoUrl] = React.useState('');
  const [sbiLogoUrl, setSbiLogoUrl] = React.useState('');

  useEffect(() => {
    let caUrl = '';
    let sbiUrl = '';
    (async () => {
      try {
        caUrl = await executiveAPI.fetchLogoBlobUrl('ca');
        sbiUrl = await executiveAPI.fetchLogoBlobUrl('sbi');
        setCaLogoUrl(caUrl);
        setSbiLogoUrl(sbiUrl);

        const latestUser = await getProfile();
        if (latestUser) {
          setForm((prev) => ({
            ...prev,
            verified_by: latestUser.verified_by || prev.verified_by || 'M.Suresh Babu',
            supervised_by: latestUser.supervised_by || prev.supervised_by || 'MD.Khaja',
            firm_contact:
              latestUser.firm_contact ||
              prev.firm_contact ||
              '9014221011, 9491349091, 0866-6551011, 6464786',
            executive_name: latestUser.name || prev.executive_name || '',
            executive_mobile: latestUser.phone || prev.executive_mobile || ''
          }));
        }
      } catch (err) {
        console.error('Could not load form logos or profile', err);
      }
    })();
    return () => {
      if (caUrl) URL.revokeObjectURL(caUrl);
      if (sbiUrl) URL.revokeObjectURL(sbiUrl);
    };
  }, [getProfile, setForm, executiveAPI]);

  return { caLogoUrl, sbiLogoUrl };
}
