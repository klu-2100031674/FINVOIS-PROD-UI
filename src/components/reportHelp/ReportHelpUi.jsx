import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, InboxIcon, PlusIcon } from '@heroicons/react/24/outline';

export const REPORT_HELP_FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  .report-help-root h1, .report-help-root h2, .report-help-root h3, .report-help-root h4 {
    font-family: 'Manrope', sans-serif;
  }
  .report-help-root input, .report-help-root select, .report-help-root textarea, .report-help-root button {
    font-family: 'Inter', sans-serif;
  }
`;

const accentMap = {
  purple: {
    hero: 'from-[#7e22ce] via-[#6b21a8] to-[#581c87]',
    link: 'text-purple-600 hover:text-[#6b21a8]',
    ring: 'focus:ring-purple-500 focus:border-purple-500',
    btn: 'bg-[#7e22ce] hover:bg-[#6b21a8] shadow-purple-200',
    spinner: 'border-[#7e22ce]',
    iconBg: 'bg-purple-100 text-purple-700',
  },
  green: {
    hero: 'from-emerald-600 via-emerald-700 to-teal-800',
    link: 'text-emerald-600 hover:text-emerald-800',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    spinner: 'border-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
};

export function useReportHelpAccent(variant = 'purple') {
  return accentMap[variant] || accentMap.purple;
}

export function ReportHelpFonts() {
  return <style>{REPORT_HELP_FONT_STYLE}</style>;
}

export function ReportHelpBackLink({ to, children, accent = 'purple', className = '' }) {
  const a = useReportHelpAccent(accent);
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-600 ${a.link} transition-colors mb-5 ${className}`}
    >
      <ArrowLeftIcon className="w-4 h-4 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}

export function ReportHelpPageHero({
  title,
  subtitle,
  accent = 'purple',
  action,
  compact = false,
}) {
  const a = useReportHelpAccent(accent);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.hero} text-white shadow-lg shadow-purple-900/10 ${
        compact ? 'px-6 py-6' : 'px-6 py-8 sm:px-8 sm:py-10'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Channel partner
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function ReportHelpPrimaryButton({
  children,
  accent = 'purple',
  className = '',
  ...props
}) {
  const a = useReportHelpAccent(accent);
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${a.btn} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ReportHelpLinkButton({ to, children, accent = 'purple', className = '' }) {
  const a = useReportHelpAccent(accent);
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${a.btn} ${className}`}
    >
      {children}
    </Link>
  );
}

export function ReportHelpSecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ReportHelpCard({ children, className = '', padding = 'p-6' }) {
  return (
    <div
      className={`bg-white border border-gray-200/80 rounded-2xl shadow-sm ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export function ReportHelpSection({ step, title, description, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        {step != null && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-[#7e22ce]"
            aria-hidden
          >
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className={step != null ? 'sm:pl-11' : ''}>{children}</div>
    </section>
  );
}

const fieldClass =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-0';

export function ReportHelpLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function ReportHelpInput({ accent = 'purple', className = '', ...props }) {
  const a = useReportHelpAccent(accent);
  return <input className={`${fieldClass} ${a.ring} ${className}`} {...props} />;
}

export function ReportHelpSelect({ accent = 'purple', className = '', children, ...props }) {
  const a = useReportHelpAccent(accent);
  return (
    <select className={`${fieldClass} ${a.ring} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function ReportHelpTextarea({ accent = 'purple', className = '', ...props }) {
  const a = useReportHelpAccent(accent);
  return <textarea className={`${fieldClass} ${a.ring} resize-y min-h-[120px] ${className}`} {...props} />;
}

export function ReportHelpLoading({ label = 'Loading…', accent = 'purple' }) {
  const a = useReportHelpAccent(accent);
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className={`h-11 w-11 animate-spin rounded-full border-2 ${a.spinner} border-t-transparent`}
        role="status"
        aria-label={label}
      />
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export function ReportHelpEmptyState({
  title = 'No requests yet',
  description = 'Submit a structured request and your channel partner will review it.',
  actionTo,
  actionLabel = 'New request',
  accent = 'purple',
}) {
  const a = useReportHelpAccent(accent);
  return (
    <ReportHelpCard className="text-center py-14 px-6">
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${a.iconBg}`}
      >
        <InboxIcon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionTo && (
        <ReportHelpLinkButton to={actionTo} accent={accent} className="mt-6">
          <PlusIcon className="w-4 h-4" />
          {actionLabel}
        </ReportHelpLinkButton>
      )}
    </ReportHelpCard>
  );
}

export function ReportHelpDetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReportHelpAlert({ variant = 'info', title, children }) {
  const styles = {
    info: 'bg-purple-50 border-purple-200 text-purple-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };
  return (
    <div className={`rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${styles[variant] || styles.info}`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      {children}
    </div>
  );
}

export function ReportHelpPageShell({ children, accent = 'purple', wide = false }) {
  return (
    <div className={`report-help-root mx-auto py-6 sm:py-8 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <ReportHelpFonts />
      {children}
    </div>
  );
}
