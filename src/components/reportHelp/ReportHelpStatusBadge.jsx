import React from 'react';
import { STATUS_LABELS } from '../../utils/reportHelpConstants';

const dotColors = {
  pending: 'bg-amber-500',
  accepted: 'bg-emerald-500',
  rejected: 'bg-red-500',
  needs_documents: 'bg-orange-500',
  documents_submitted: 'bg-blue-500',
  in_progress: 'bg-indigo-500',
  submitted_for_validation: 'bg-purple-500',
  completed: 'bg-gray-500',
};

export default function ReportHelpStatusBadge({ status, size = 'default' }) {
  const meta = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  const dot = dotColors[status] || 'bg-gray-400';
  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ring-black/5 ${meta.color} ${sizeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
