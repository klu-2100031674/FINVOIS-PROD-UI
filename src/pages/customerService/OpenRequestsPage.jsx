import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
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
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchRequests = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=open');
      const nextRequests = res.data?.data || [];
      const availableIds = new Set(nextRequests.map((request) => request._id));
      setRequests(nextRequests);
      setSelectedRequestIds((current) => current.filter((id) => availableIds.has(id)));
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

  const toggleRequest = (requestId, checked) => {
    setSelectedRequestIds((current) => {
      const next = new Set(current);
      if (checked) next.add(requestId);
      else next.delete(requestId);
      return [...next];
    });
  };

  const toggleAll = (checked, visibleRequests) => {
    setSelectedRequestIds((current) => {
      const next = new Set(current);
      visibleRequests.forEach((request) => {
        if (checked) next.add(request._id);
        else next.delete(request._id);
      });
      return [...next];
    });
  };

  const removeDuplicates = async () => {
    const confirmed = window.confirm(
      'Delete extra open copies that share the same applicant name, phone, and form? The oldest row in each group is kept. This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await api.post('/govt-forms/requests/remove-duplicates');
      const deletedCount = res.data?.data?.deletedIds?.length || 0;
      setSelectedRequestIds([]);
      await fetchRequests({ silent: true });
      toast.success(
        deletedCount
          ? `${deletedCount} duplicate request(s) deleted`
          : 'No deletable duplicates were found'
      );
    } catch (error) {
      const status = error.response?.status;
      toast.error(
        error.response?.data?.error ||
          (status === 404
            ? 'Delete API is not on this backend. Restart the local Production API on port 3000.'
            : 'Failed to remove duplicate requests')
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedRequestIds.length) return;
    const confirmed = window.confirm(
      `Delete ${selectedRequestIds.length} selected open request(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      let deletedCount = 0;
      let skippedCount = 0;
      for (let index = 0; index < selectedRequestIds.length; index += 500) {
        const requestIds = selectedRequestIds.slice(index, index + 500);
        const res = await api.post('/govt-forms/requests/bulk-delete', { requestIds });
        deletedCount += res.data?.data?.deletedIds?.length || 0;
        skippedCount += res.data?.data?.skippedIds?.length || 0;
      }
      setSelectedRequestIds([]);
      await fetchRequests({ silent: true });
      toast.success(
        skippedCount
          ? `${deletedCount} deleted; ${skippedCount} protected or already changed`
          : `${deletedCount} request(s) deleted`
      );
    } catch (error) {
      const status = error.response?.status;
      toast.error(
        error.response?.data?.error ||
          (status === 404
            ? 'Delete API is not on this backend. Restart the local Production API on port 3000.'
            : 'Failed to delete selected requests')
      );
    } finally {
      setDeleting(false);
    }
  };

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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={removeDuplicates}
            disabled={deleting || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? 'Working…' : 'Remove duplicates'}
          </button>
          {selectedRequestIds.length > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting…' : `Delete selected (${selectedRequestIds.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchRequests({ silent: true })}
            disabled={loading || refreshing || deleting}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh open requests"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
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
        emptyMessage="No open requests match your search or filters."
        selectable
        selectedRequestIds={selectedRequestIds}
        onToggleRequest={toggleRequest}
        onToggleAll={toggleAll}
      />
    </ClientLayout>
  );
};

export default OpenRequestsPage;
