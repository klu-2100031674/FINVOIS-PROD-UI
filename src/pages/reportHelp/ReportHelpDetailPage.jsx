import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownTrayIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ClientLayout from '../../components/layouts/ClientLayout';
import ReportHelpStatusBadge from '../../components/reportHelp/ReportHelpStatusBadge';
import ReportHelpDocumentsEditor from '../../components/reportHelp/ReportHelpDocumentsEditor';
import ReportHelpUpdatesThread from '../../components/reportHelp/ReportHelpUpdatesThread';
import { reportHelpAPI } from '../../api/endpoints';
import {
  DOCUMENT_CHECKLIST_LABELS,
  REPORT_TYPE_OPTIONS,
  URGENCY_OPTIONS,
} from '../../utils/reportHelpConstants';
import { getReportHelpDocumentEditState } from '../../utils/reportHelpPermissions';
import useAuth from '../../hooks/useAuth';
import { getSupportPartyName, isReferredForReportHelp } from '../../utils/reportHelpNav';
import {
  ReportHelpAlert,
  ReportHelpBackLink,
  ReportHelpCard,
  ReportHelpDetailGrid,
  ReportHelpLoading,
  ReportHelpPageShell,
} from '../../components/reportHelp/ReportHelpUi';

const reportTypeLabel = (v) => REPORT_TYPE_OPTIONS.find((o) => o.value === v)?.label || v;
const urgencyLabel = (v) => URGENCY_OPTIONS.find((o) => o.value === v)?.label || v;

const reportValidationLabel = (status) => {
  const map = {
    pending_validation: 'Under validation for CA (typically up to 72 hours)',
    under_review: 'Under validation for CA',
    approved: 'Approved — you can download from My Reports',
    rejected: 'Rejected — contact support',
    pending_payment: 'Awaiting payment',
    draft: 'Draft',
  };
  return map[status] || status;
};

export default function ReportHelpDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await reportHelpAPI.getById(id);
      setRequest(res?.data || null);
    } catch {
      if (!silent) toast.error('Request not found');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
        <ReportHelpPageShell>
          <ReportHelpLoading label="Loading request…" />
        </ReportHelpPageShell>
      </ClientLayout>
    );
  }

  if (!request) {
    return (
      <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
        <ReportHelpPageShell>
          <ReportHelpCard className="text-center py-12">
            <p className="text-gray-500">Request not found.</p>
            <ReportHelpBackLink to="/report-help" className="justify-center mt-4">
              Back to all requests
            </ReportHelpBackLink>
          </ReportHelpCard>
        </ReportHelpPageShell>
      </ClientLayout>
    );
  }

  const checklist = request.document_request?.checklist || [];
  const isPlatform = request.routing === 'platform';
  const partner = !isPlatform ? request.agent_id : null;
  const supportName = getSupportPartyName(request);
  const referred = isReferredForReportHelp(user);
  const linkedReport = request.linked_report;
  const { canEditDocuments, canAddDocuments, maxFiles } = getReportHelpDocumentEditState(request, user);
  const handlerNoun = referred ? 'channel partner' : 'Finvois support';

  const detailItems = [
    { label: 'Contact name', value: request.contact_name },
    { label: 'Phone', value: request.contact_phone },
    { label: 'Loan amount', value: request.loan_amount },
    { label: 'Industry', value: request.industry },
    { label: 'Urgency', value: urgencyLabel(request.urgency_level) },
  ];
  detailItems.push({
    label: isPlatform ? 'Handled by' : 'Channel partner',
    value: partner
      ? `${partner.name}${partner.email ? ` · ${partner.email}` : ''}`
      : supportName,
  });

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <ReportHelpPageShell>
        <ReportHelpBackLink to="/report-help">All requests</ReportHelpBackLink>

        <ReportHelpCard className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7e22ce] mb-1">
                {reportTypeLabel(request.report_type)}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {request.business_name}
              </h1>
              {request.createdAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Submitted {new Date(request.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            <ReportHelpStatusBadge status={request.status} />
          </div>

          <ReportHelpDetailGrid items={detailItems} />

          {request.notes && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Notes
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {request.notes}
              </div>
            </div>
          )}

          {request.status === 'rejected' && request.rejection_reason && (
            <div className="mt-4">
              <ReportHelpAlert variant="danger" title="Request declined">
                {request.rejection_reason}
              </ReportHelpAlert>
            </div>
          )}
        </ReportHelpCard>

        {linkedReport && (
          <ReportHelpCard className="mb-6 border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-white">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#7e22ce]">
                <DocumentCheckIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Your report</h2>
                <p className="font-medium text-gray-800 mt-1">{linkedReport.title}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {reportValidationLabel(linkedReport.validation_status)}
                </p>
                {['pending_validation', 'under_review'].includes(linkedReport.validation_status) && (
                  <p className="text-sm text-purple-800 mt-2 leading-relaxed">
                    {supportName} submitted this report for CA validation. You will be notified when it is ready to download.
                  </p>
                )}
                {linkedReport.validation_status === 'approved' && (
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#7e22ce] hover:text-[#6b21a8]"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" aria-hidden />
                    Go to My Reports to download
                  </Link>
                )}
              </div>
            </div>
          </ReportHelpCard>
        )}

        {canEditDocuments && (
          <div className="mb-6">
            <ReportHelpAlert variant="info" title="Documents are editable">
              You can change, remove, or add files until {handlerNoun} accepts or rejects this request.
            </ReportHelpAlert>
          </div>
        )}

        {!canEditDocuments && (request.documents || []).length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Documents can no longer be changed because this request was already accepted or rejected.
          </p>
        )}

        <div className="mb-6">
          <ReportHelpDocumentsEditor
            requestId={id}
            documents={request.documents || []}
            canEditDocuments={canEditDocuments}
            canAddDocuments={canAddDocuments}
            maxFiles={maxFiles}
            onChanged={(updated) => {
              if (updated) {
                const flags = getReportHelpDocumentEditState(updated, user);
                setRequest({ ...updated, ...flags });
              } else {
                load({ silent: true });
              }
            }}
          />
        </div>

        {request.status === 'needs_documents' && (
          <ReportHelpCard className="mb-6 border-orange-200 bg-orange-50/30">
            <h2 className="text-lg font-semibold text-orange-900 mb-2">Documents requested</h2>
            {request.document_request?.message && (
              <p className="text-sm text-orange-800 mb-4 leading-relaxed">
                {request.document_request.message}
              </p>
            )}
            <p className="text-sm font-semibold text-orange-900 mb-3">Please upload:</p>
            <ul className="space-y-2">
              {checklist.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-3 text-sm text-orange-900 bg-white/60 rounded-lg px-3 py-2 border border-orange-100"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-orange-400" aria-hidden />
                  {DOCUMENT_CHECKLIST_LABELS[key] || key}
                </li>
              ))}
            </ul>
            {canEditDocuments && (
              <p className="text-xs text-orange-800 mt-4 pt-2 border-t border-orange-200/60">
                Use <strong>Change file</strong>, <strong>Remove</strong>, or <strong>Add more documents</strong> in the section above.
              </p>
            )}
          </ReportHelpCard>
        )}

        <ReportHelpUpdatesThread
          requestId={id}
          updates={request.updates || []}
          onPosted={load}
        />
      </ReportHelpPageShell>
    </ClientLayout>
  );
}
