import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import CsQueueFiltersBar from './CsQueueFiltersBar';

const AUTO_REFRESH_MS = 3 * 60 * 1000;

const OpenRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=open');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load open requests');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchRequests({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [fetchRequests]);

  return (
    <ClientLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Open Requests Queue</h1>
          <p className="text-gray-500 mt-1">
            Incoming public form submissions that are ready to be claimed or processed
          </p>
          <p className="text-xs text-gray-400 mt-1">Auto-refreshes every 3 minutes</p>
        </div>
        <button
          type="button"
          onClick={() => fetchRequests({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title="Refresh open requests"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {!loading && (
        <CsQueueFiltersBar
          requests={requests}
          onFilteredChange={setFiltered}
          showQueueStatus={false}
        />
      )}

      <RequestsQueueTable
        requests={loading ? [] : filtered}
        loading={loading}
        emptyMessage="No open requests match your filters."
      />
    </ClientLayout>
  );
};

export default OpenRequestsPage;
