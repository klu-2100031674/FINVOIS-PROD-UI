import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ClientLayout from '../../components/layouts/ClientLayout';
import ReportHelpRequestCard from '../../components/reportHelp/ReportHelpRequestCard';
import {
  ReportHelpEmptyState,
  ReportHelpLinkButton,
  ReportHelpLoading,
  ReportHelpPageHero,
  ReportHelpPageShell,
} from '../../components/reportHelp/ReportHelpUi';
import { reportHelpAPI } from '../../api/endpoints';
import { getReportHelpDocumentEditState } from '../../utils/reportHelpPermissions';
import useAuth from '../../hooks/useAuth';
import { getReportHelpListHero } from '../../utils/reportHelpNav';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const TERMINAL_STATUSES = new Set(['completed', 'rejected']);

function matchesFilter(request, filter) {
  if (filter === 'all') return true;
  if (filter === 'waiting') return !TERMINAL_STATUSES.has(request.status);
  return request.status === filter;
}

export default function ReportHelpListPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    reportHelpAPI.list()
      .then((res) => setRequests(res?.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => requests.filter((r) => matchesFilter(r, filter)),
    [requests, filter],
  );

  const emptyForFilter = !loading && requests.length > 0 && filtered.length === 0;
  const hero = getReportHelpListHero(user);

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <ReportHelpPageShell wide>
        <ReportHelpPageHero
          title={hero.title}
          subtitle={hero.subtitle}
          action={
            <ReportHelpLinkButton
              to="/generate/report-help/new"
              className="!bg-white !text-[#6b21a8] hover:!bg-purple-50 shadow-lg"
            >
              <PlusIcon className="w-4 h-4" />
              New request
            </ReportHelpLinkButton>
          }
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl border transition-all ${
                filter === f.value
                  ? 'bg-[#7e22ce] text-white border-[#7e22ce] shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <ReportHelpLoading label="Loading your requests…" />
          ) : requests.length === 0 ? (
            <ReportHelpEmptyState
              actionTo="/generate/report-help/new"
              actionLabel="Create your first request"
            />
          ) : emptyForFilter ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-10 text-center text-gray-500 text-sm">
              No requests match this filter.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r) => {
                const { canEditDocuments } = getReportHelpDocumentEditState(r, user);
                return (
                  <li key={r._id}>
                    <ReportHelpRequestCard
                      request={r}
                      to={`/report-help/${r._id}`}
                      showEditHint={canEditDocuments}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ReportHelpPageShell>
    </ClientLayout>
  );
}
