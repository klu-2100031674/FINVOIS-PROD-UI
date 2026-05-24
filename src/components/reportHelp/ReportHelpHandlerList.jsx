import React, { useEffect, useState } from 'react';
import ReportHelpRequestCard from './ReportHelpRequestCard';
import {
  ReportHelpEmptyState,
  ReportHelpLoading,
  ReportHelpPageHero,
  ReportHelpPageShell,
} from './ReportHelpUi';
import { reportHelpAPI } from '../../api/endpoints';
import { REPORT_TYPE_OPTIONS } from '../../utils/reportHelpConstants';
import toast from 'react-hot-toast';

const reportTypeLabel = (v) => REPORT_TYPE_OPTIONS.find((o) => o.value === v)?.label || v;

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'needs_documents', label: 'Awaiting docs' },
  { value: 'documents_submitted', label: 'Docs submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted_for_validation', label: 'With CA' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

function matchesStatusFilter(request, filter) {
  if (filter === 'all') return true;
  return request.status === filter;
}

export default function ReportHelpHandlerList({
  Layout,
  layoutProps = {},
  accent = 'green',
  listPath,
  detailPathPrefix,
  title,
  subtitle,
  emptyDescription,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    reportHelpAPI
      .list(params)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setRequests(list.filter((r) => matchesStatusFilter(r, filter)));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load requests');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const activeFilterClass =
    accent === 'green'
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
      : 'bg-[#7e22ce] text-white border-[#7e22ce] shadow-sm';

  return (
    <Layout {...layoutProps}>
      <ReportHelpPageShell wide accent={accent}>
        <ReportHelpPageHero accent={accent} title={title} subtitle={subtitle} />

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl border transition-all ${
                filter === f.value
                  ? activeFilterClass
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <ReportHelpLoading label="Loading requests…" accent={accent} />
          ) : requests.length === 0 ? (
            <ReportHelpEmptyState
              accent={accent}
              title="No requests in this view"
              description={emptyDescription}
            />
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => {
                const client = r.user_id;
                const subtitleLine = [
                  client?.name || client?.email,
                  reportTypeLabel(r.report_type),
                  r.urgency_level,
                  r.routing === 'platform' ? 'Platform' : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={r._id}>
                    <ReportHelpRequestCard
                      request={r}
                      to={`${detailPathPrefix}/${r._id}`}
                      accent={accent}
                      subtitle={subtitleLine}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ReportHelpPageShell>
    </Layout>
  );
}
