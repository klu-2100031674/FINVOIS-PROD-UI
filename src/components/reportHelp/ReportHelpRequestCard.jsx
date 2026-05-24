import React from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import ReportHelpStatusBadge from './ReportHelpStatusBadge';
import { REPORT_TYPE_OPTIONS } from '../../utils/reportHelpConstants';

const reportTypeLabel = (v) => REPORT_TYPE_OPTIONS.find((o) => o.value === v)?.label || v;

export default function ReportHelpRequestCard({
  request,
  to,
  accent = 'purple',
  subtitle,
  showEditHint = false,
}) {
  const hoverBorder = accent === 'green' ? 'hover:border-emerald-300' : 'hover:border-purple-300';
  const editColor = accent === 'green' ? 'text-emerald-600' : 'text-[#7e22ce]';

  return (
    <Link
      to={to}
      className={`group block bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md ${hoverBorder} transition-all duration-200`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0 flex-1">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 group-hover:bg-purple-50 group-hover:text-[#7e22ce] transition-colors">
            <BuildingOffice2Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{request.business_name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <DocumentTextIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{reportTypeLabel(request.report_type)}</span>
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
            )}
            {request.loan_amount && (
              <p className="mt-0.5 text-xs text-gray-400">Loan: {request.loan_amount}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ReportHelpStatusBadge status={request.status} />
          <ChevronRightIcon
            className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors hidden sm:block"
            aria-hidden
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <ClockIcon className="h-3.5 w-3.5" aria-hidden />
          {request.createdAt ? new Date(request.createdAt).toLocaleString() : ''}
        </p>
        {showEditHint && (
          <span className={`text-xs font-semibold ${editColor}`}>Edit documents →</span>
        )}
      </div>
    </Link>
  );
}
