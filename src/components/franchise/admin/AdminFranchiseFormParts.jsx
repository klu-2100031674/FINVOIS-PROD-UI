import { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  TrendingUp,
  Handshake,
  ClipboardList,
  ImageIcon,
  Upload,
  Sparkles,
  CheckCircle2,
  Circle,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FranchiseLogo } from '@/components/franchise/FranchiseCardParts';
import { formatInvestmentRange } from '@/constants/franchiseConstants';

export const FORM_SECTION_META = [
  { key: 'basic', label: 'Basic', fullTitle: 'Basic Information', icon: Building2 },
  { key: 'investment', label: 'Investment', fullTitle: 'Investment Details', icon: TrendingUp },
  { key: 'space', label: 'Location', fullTitle: 'Space & Location', icon: MapPin },
  { key: 'performance', label: 'Performance', fullTitle: 'Business Performance', icon: BarChart3 },
  { key: 'support', label: 'Support', fullTitle: 'Brand Support', icon: Handshake },
  { key: 'requirements', label: 'Requirements', fullTitle: 'Franchisee Requirements', icon: ClipboardList },
  { key: 'publishing', label: 'Publishing', fullTitle: 'Publishing & Visibility', icon: Sparkles },
  { key: 'media', label: 'Media', fullTitle: 'Media Uploads', icon: ImageIcon },
];

export function computeFormProgress(formData, files) {
  const checks = [
    Boolean(formData.franchiseName?.trim() && formData.brandName?.trim() && formData.category),
    Boolean(formData.minInvestment || formData.maxInvestment),
    Boolean(formData.requiredAreaSqFt || formData.cityPreference || formData.state),
    Boolean(formData.existingOutlets || formData.avgMonthlyRevenue),
    (formData.supportProvided || []).length > 0,
    Boolean(formData.preferredExperience || formData.ownershipType || formData.experienceRequired),
    Boolean(formData.isActive || formData.isFeatured || Number(formData.displayOrder) > 0),
    Boolean(files.logo || files.banner || files.brochure),
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
}

export function FranchiseFormHeader({ isEdit, progress, onExpandAll, onCollapseAll, onFillTest }) {
  return (
    <div className="mb-6">
      <nav className="text-sm text-gray-500 mb-3 flex items-center gap-2 flex-wrap">
        <Link to="/admin/franchises" className="hover:text-[#7e22ce]">
          Franchises
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{isEdit ? 'Edit' : 'New listing'}</span>
      </nav>

      <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit franchise listing' : 'Create franchise listing'}
            </h1>
            <p className="text-gray-600 mt-1 max-w-xl">
              Fill in each section below. Required fields are marked with * — your listing goes live when
              marked active.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onExpandAll}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
            >
              Collapse all
            </button>
            {!isEdit && (
              <button
                type="button"
                onClick={onFillTest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-dashed border-amber-300 text-amber-900 bg-amber-50 rounded-lg hover:bg-amber-100"
              >
                Fill test data
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700">Form progress</span>
            <span className="text-[#7e22ce] font-semibold">
              {progress.done}/{progress.total} sections · {progress.percent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7e22ce] transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FranchiseFormMobileNav({ activeSection, onSelect, openSections }) {
  return (
    <div className="lg:hidden mb-4 -mx-1 overflow-x-auto pb-1">
      <div className="flex gap-2 px-1 min-w-max">
        {FORM_SECTION_META.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#7e22ce] text-white border-[#7e22ce]'
                  : openSections[s.key]
                    ? 'bg-purple-50 text-[#7e22ce] border-purple-200'
                    : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FranchiseFormSidebarNav({ activeSection, onSelect, openSections, formData, files }) {
  return (
    <div className="space-y-4">
      <nav className="sticky top-24 bg-white border rounded-xl p-3 shadow-sm space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-2 py-1 mb-1">
          Jump to section
        </p>
        {FORM_SECTION_META.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`w-full flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#7e22ce] text-white shadow-sm'
                  : openSections[s.key]
                    ? 'bg-purple-50 text-[#7e22ce]'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span className="flex-1 truncate">{s.label}</span>
              {openSections[s.key] ? (
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-purple-200' : 'text-green-500'}`} />
              ) : (
                <Circle className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-purple-200' : 'text-gray-300'}`} />
              )}
            </button>
          );
        })}
      </nav>

      <FranchiseListingPreview formData={formData} files={files} />
    </div>
  );
}

export function FranchiseListingPreview({ formData, files }) {
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (!files?.logo) {
      setLogoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(files.logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files?.logo]);

  const previewFranchise = {
    franchiseName: formData.franchiseName || 'Franchise name',
    category: formData.category || 'Category',
    shortDescription: formData.shortDescription || 'Short description will appear on listing cards.',
    minInvestment: formData.minInvestment,
    maxInvestment: formData.maxInvestment,
    logoUrl: logoPreview,
    isFeatured: formData.isFeatured,
  };

  return (
    <div className="hidden lg:block bg-white border rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Live preview</p>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-purple-100 to-purple-50" />
        <div className="p-3 -mt-6 relative">
          <FranchiseLogo franchise={previewFranchise} className="h-10 w-10 shadow border-2 border-white" loading="eager" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-1">
            {previewFranchise.franchiseName}
          </h3>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
            {previewFranchise.category}
          </span>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{previewFranchise.shortDescription}</p>
          <p className="text-xs font-medium text-gray-800 mt-2">
            {formatInvestmentRange(previewFranchise.minInvestment, previewFranchise.maxInvestment)}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Updates as you type in basic & investment fields.</p>
    </div>
  );
}

export function FranchiseSectionCard({ id, sectionKey, title, subtitle, icon: Icon, open, onToggle, children }) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow ${
        open ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${open ? 'bg-[#7e22ce] text-white' : 'bg-white border text-gray-500'}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-gray-400 text-lg leading-none pt-2">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-4 sm:p-5">{children}</div>}
    </section>
  );
}

export function FieldHint({ children }) {
  return <p className="text-xs text-gray-500 mt-1">{children}</p>;
}

export function FranchiseFileUpload({ label, hint, accept, multiple, file, files, onChange, currentUrl }) {
  const selected = multiple ? files : file;
  const hasFile = multiple ? files?.length > 0 : Boolean(file);

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 bg-gray-50/50 p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-800">{label}</label>
          {hint && <FieldHint>{hint}</FieldHint>}
        </div>
        {currentUrl && !hasFile && (
          <img src={currentUrl} alt="" className="h-12 w-12 object-cover rounded-lg border shrink-0" />
        )}
      </div>
      <label className="mt-3 flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-purple-50/50 hover:border-purple-200 transition-colors">
        <Upload className="h-5 w-5 text-[#7e22ce]" />
        <span className="text-sm text-gray-600">
          {hasFile ? 'Change file' : 'Click to upload'}
        </span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => onChange(e.target.files)}
        />
      </label>
      {hasFile && (
        <ul className="mt-2 space-y-1">
          {(multiple ? files : [file]).map((f, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-center gap-2 bg-white rounded px-2 py-1 border">
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SupportOptionPills({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected?.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`px-3 py-2 rounded-full text-sm border transition-colors ${
              active
                ? 'bg-[#7e22ce] text-white border-[#7e22ce]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function FranchiseFormFooter({ isEdit, saving, onCancel }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 border-t bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-500 hidden sm:block">
            {isEdit ? 'Save changes to update the public listing.' : 'Create to publish on the franchises page.'}
          </p>
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="franchise-admin-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] disabled:opacity-50 text-sm font-semibold shadow-sm min-w-[140px]"
            >
              {saving && <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save changes' : 'Create franchise'}
            </button>
          </div>
      </div>
    </div>
  );
}
