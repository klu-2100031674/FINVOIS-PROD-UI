import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import { Search, SlidersHorizontal } from 'lucide-react';
import { WORKFLOW_KEYS } from '../../utils/dprWorkflowStatus';

const EMPTY_FILTERS = {
  search: '',
  workflowStatus: '',
  startDate: '',
  endDate: '',
};

const RequestHistoryPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    fetchRequests(appliedFilters);
  }, [appliedFilters]);

  const fetchRequests = async (activeFilters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ queue: 'completed' });
      if (activeFilters.search.trim()) params.set('search', activeFilters.search.trim());
      if (activeFilters.workflowStatus) params.set('workflowStatus', activeFilters.workflowStatus);
      if (activeFilters.startDate) params.set('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.set('endDate', activeFilters.endDate);
      const res = await api.get(`/govt-forms/requests?${params.toString()}`);
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load request history');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (event) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Request History</h1>
        <p className="text-gray-500 mt-1">Processed requests that have successfully generated reports</p>
      </div>

      <form
        onSubmit={handleApply}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 space-y-3"
      >
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search applicant, phone, email, or form name"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            />
          </div>
          <select
            value={filters.workflowStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, workflowStatus: e.target.value }))}
            className="w-full lg:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All report statuses</option>
            <option value={WORKFLOW_KEYS.ca_validation}>CA pending</option>
            <option value={WORKFLOW_KEYS.generated}>Approved</option>
            <option value={WORKFLOW_KEYS.rejected}>Rejected</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-semibold hover:bg-purple-800"
          >
            <SlidersHorizontal size={14} />
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Submitted from
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-normal text-gray-800"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Submitted to
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-normal text-gray-800"
            />
          </label>
        </div>
      </form>

      <RequestsQueueTable
        requests={requests}
        loading={loading}
        hideStaffOwner
        emptyMessage="No completed requests found in history."
        statusMode="workflow"
      />
    </ClientLayout>
  );
};

export default RequestHistoryPage;
