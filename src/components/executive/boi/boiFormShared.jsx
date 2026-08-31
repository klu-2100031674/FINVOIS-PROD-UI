import React from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowRight,
  Loader2,
  FileDown,
  CheckCircle2,
  CircleDot,
  Circle,
} from 'lucide-react';
import { EXECUTIVE_INPUT_CLASS } from '../executiveFormShared';
import { Button } from '../../common';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const boiInputClass = cn(
  'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent',
  'text-gray-800 transition-all hover:border-gray-400',
  EXECUTIVE_INPUT_CLASS
);

export const boiSelectClass = cn(
  boiInputClass,
  'cursor-pointer appearance-none pr-10'
);

export const boiTextareaClass = cn(
  'w-full px-3 py-2.5 min-h-[88px] bg-white border border-gray-300 rounded-lg shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent',
  'text-gray-800 transition-all hover:border-gray-400 resize-y',
  EXECUTIVE_INPUT_CLASS
);

export function getModulePayload(caseData, applicantId, moduleKey) {
  const mod = caseData?.modules?.[applicantId]?.[moduleKey];
  return mod?.[moduleKey] ?? {};
}

export function BoiFormField({ label, required, error, className = '', children }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function BoiYesNoRadio({ name, value, onChange, className = '' }) {
  return (
    <div className={cn('flex flex-wrap gap-4 pt-1', className)}>
      {['yes', 'no'].map((opt) => (
        <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="text-[#7e22ce] focus:ring-[#7e22ce] w-4 h-4 border-gray-300"
          />
          <span className="text-sm text-gray-800 capitalize">{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function BoiTriRadio({ name, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 pt-1">
      {[
        { v: 'yes', l: 'Yes' },
        { v: 'no', l: 'No' },
        { v: 'na', l: 'Not Applicable' },
      ].map((opt) => (
        <label key={opt.v} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.v}
            checked={value === opt.v}
            onChange={() => onChange(opt.v)}
            className="text-[#7e22ce] focus:ring-[#7e22ce] w-4 h-4 border-gray-300"
          />
          <span className="text-sm text-gray-800">{opt.l}</span>
        </label>
      ))}
    </div>
  );
}

export function BoiTalliedRadio({ name, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 pt-1">
      {[
        { v: 'tallied', l: 'Tallied' },
        { v: 'not_tallied', l: 'Not Tallied' },
        { v: 'not_applicable', l: 'Not Applicable' },
      ].map((opt) => (
        <label key={opt.v} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.v}
            checked={value === opt.v}
            onChange={() => onChange(opt.v)}
            className="text-[#7e22ce] focus:ring-[#7e22ce] w-4 h-4 border-gray-300"
          />
          <span className="text-sm text-gray-800">{opt.l}</span>
        </label>
      ))}
    </div>
  );
}

export function BoiSelectField({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  error = false,
  className = '',
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(boiSelectClass, error && 'border-red-500')}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}

export function BoiSectionCard({
  icon: Icon,
  title,
  subtitle,
  tone = 'default',
  children,
  className = '',
}) {
  const warn = tone === 'warn';
  return (
    <section
      className={cn(
        'rounded-xl border p-4 sm:p-5',
        warn ? 'border-amber-400/60 bg-amber-50/50' : 'border-gray-200 bg-white',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div
            className={cn(
              'grid h-9 w-9 place-items-center rounded-lg shrink-0',
              warn ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-[#7e22ce]'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function BoiModuleHeader({ icon: Icon, title, subtitle, badge, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 border-b border-gray-200">
      {Icon && (
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-[#7e22ce] shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {(actions || badge) && (
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {actions}
          {badge}
        </div>
      )}
    </div>
  );
}

export function BoiApplicantBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
      {label}
    </span>
  );
}

export function BoiNotApplicablePanel({ title = 'Not Applicable', message, onBack }) {
  return (
    <div className="p-6 sm:p-10">
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">{message}</p>
        {onBack && (
          <Button type="button" variant="outline" className="mt-5" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

export function BoiModuleActionBar({
  onSaveDraft,
  onSaveReturn,
  onSaveContinue,
  busy = false,
  statusHint,
}) {
  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white sm:bg-gray-50/80 rounded-b-2xl">
      <p className="hidden sm:flex text-xs text-gray-500 items-center gap-2">
        {busy ? (
          <span className="inline-flex items-center gap-1.5 text-[#7e22ce]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </span>
        ) : (
          statusHint || 'Status updates only after a successful Save & Continue.'
        )}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-10 text-xs sm:text-sm px-2 sm:px-4 min-w-0"
          onClick={onSaveDraft}
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-10 text-xs sm:text-sm px-2 sm:px-4 min-w-0"
          onClick={onSaveReturn}
          disabled={busy}
        >
          Save &amp; Return
        </Button>
        <Button
          type="button"
          className="h-11 sm:h-10 text-xs sm:text-sm px-2 sm:px-4 min-w-0"
          onClick={onSaveContinue}
          disabled={busy}
        >
          Save &amp; Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function BoiModuleShell({ topBar, children }) {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {topBar}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-purple-50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * Sub-card wrapper used to chunk a long section (e.g. Employment, Property)
 * into a handful of smaller logical groups. Purely presentational — does not
 * rename or touch any field/state key.
 */
export function BoiSectionGroup({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5', className)}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
          {Icon && (
            <div className="grid h-7 w-7 place-items-center rounded-md bg-purple-100 text-[#7e22ce] shrink-0">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** Condensed step title + progress, shown only on small screens. */
export function BoiMobileStepHeader({ icon: Icon, title, stepIndex, stepCount }) {
  return (
    <div className="sm:hidden flex items-center gap-3 px-1">
      {Icon && (
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-100 text-[#7e22ce] shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[#7e22ce]">
          Step {stepIndex + 1} of {stepCount}
        </p>
        <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
      </div>
    </div>
  );
}

const APPLICANT_STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: CircleDot,
  not_started: Circle,
};

/**
 * Horizontal-scroll applicant switcher with larger touch targets and an
 * optional per-applicant completion badge. Presentational only — the caller
 * supplies the actual switch/add/remove handlers (no data-flow change).
 */
export function BoiApplicantTabsBar({
  applicants,
  activeApplicantId,
  onSwitch,
  onAdd,
  onRemove,
  canAdd = true,
  getStatus,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 snap-x snap-mandatory">
        {applicants.map((app) => {
          const isActive = activeApplicantId === app.id;
          const status = getStatus ? getStatus(app.id) : null;
          const StatusIcon = status ? APPLICANT_STATUS_ICON[status] : null;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onSwitch(app.id)}
              className={cn(
                'shrink-0 snap-start inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                isActive
                  ? 'bg-purple-100 text-[#7e22ce] border-b-2 border-[#7e22ce]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {StatusIcon && (
                <StatusIcon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    status === 'completed'
                      ? 'text-emerald-600'
                      : status === 'in_progress'
                        ? 'text-amber-500'
                        : 'text-gray-300'
                  )}
                />
              )}
              {app.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Fixed bottom navigation bar shown only on small screens (mobile), with
 * safe-area padding for devices with a home indicator. The full-width inline
 * action row is kept for tablet/desktop (rendered separately by the caller
 * with `hidden sm:flex`). Wraps the caller's existing handlers — no new
 * submit/save/navigation logic is introduced here.
 */
export function BoiStickyMobileNav({
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isFirstStep,
  isLastStep,
  savingDraft,
  busy,
}) {
  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-3 pt-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || busy}
          className="h-11 px-3 border-gray-300 bg-white text-gray-700 disabled:opacity-40 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={savingDraft || busy}
          className="h-11 flex-1 border-gray-300 bg-white text-gray-700 justify-center px-2 text-xs"
        >
          {savingDraft ? <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> : <Save className="h-4 w-4 mr-1.5" />}
          {savingDraft ? 'Saving…' : 'Save Draft'}
        </Button>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={savingDraft || busy}
            className="h-11 flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold justify-center px-2 text-xs"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-white mr-1.5" /> : <FileDown className="h-4 w-4 mr-1.5" />}
            {busy ? 'Submitting…' : 'Submit'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="h-11 flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold justify-center px-2 text-xs"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
