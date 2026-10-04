import React, { useEffect, useMemo, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import CsQueueFiltersBar from './CsQueueFiltersBar';
import { awaitingActionKind } from '../../utils/dprWorkflowStatus';

const KIND_TABS = [
  { id: '', label: 'All' },
  { id: 'preparation', label: 'DPR preparation' },
  { id: 'payment', label: 'Awaiting payment' },
  { id: 'ca', label: 'Awaiting CA' },
  { id: 'rejected', label: 'Rejected' },
];

const AwaitingActionPage = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=in-progress');
      setRequests(res.data?.data || []);
    } catch {
      toast.error('Failed to load in-progress requests');
    } finally {
      setLoading(false);
    }
  };

  const kindFiltered = useMemo(() => {
    if (!kind) return filtered;
    return filtered.filter((req) => awaitingActionKind(req, req.reportId) === kind);
  }, [filtered, kind]);

  const kindCounts = useMemo(() => {
    const counts = { preparation: 0, payment: 0, ca: 0, rejected: 0 };
    for (const req of requests) {
      const k = awaitingActionKind(req, req.reportId);
      if (k && counts[k] !== undefined) counts[k] += 1;
    }
    return counts;
  }, [requests]);

  return (
    <ClientLayout wideContent>
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">In Progress</h1>
          <p className="text-gray-500 mt-1">
            Remaining work after claim/assign: DPR preparation, payment, CA approval, or rejected reports
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {KIND_TABS.map((tab) => {
            const count =
              tab.id === ''
                ? requests.length
                : kindCounts[tab.id] ?? 0;
            const active = kind === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => setKind(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span
                  className={`min-w-[1.25rem] rounded-full px-1.5 text-[11px] ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!loading && (
          <CsQueueFiltersBar
            requests={requests}
            onFilteredChange={setFiltered}
            showQueueStatus={false}
            showPaymentFilter={false}
            showCaStatusFilter={false}
          />
        )}

        <RequestsQueueTable
          requests={loading ? [] : kindFiltered}
          loading={loading}
          wideTable
          hideStaffOwner
          emptyMessage="No in-progress requests match your filters."
          statusMode="workflow"
        />
      </div>
    </ClientLayout>
  );
};

export default AwaitingActionPage;
