import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  EMPTY_CS_QUEUE_FILTERS,
  filterCsQueueRequests,
  loadCsQueueFilters,
  saveCsQueueFilters,
  uniqueDepartmentsFromRequests,
} from './csQueueFilters';

/**
 * Shared CS queue filters with localStorage persistence.
 */
export default function CsQueueFiltersBar({
  requests = [],
  onFilteredChange,
  showQueueStatus = true,
}) {
  const [filters, setFilters] = useState(() => loadCsQueueFilters());

  const departments = useMemo(() => uniqueDepartmentsFromRequests(requests), [requests]);

  const filtered = useMemo(
    () => filterCsQueueRequests(requests, filters),
    [requests, filters]
  );

  useEffect(() => {
    saveCsQueueFilters(filters);
  }, [filters]);

  useEffect(() => {
    onFilteredChange?.(filtered);
  }, [filtered, onFilteredChange]);

  const setField = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ ...EMPTY_CS_QUEUE_FILTERS });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;
  const hasSearch = Boolean(String(filters.search || '').trim());

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
          <SlidersHorizontal size={16} className="text-purple-700" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {hasSearch ? (
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-sm font-semibold text-purple-800">
              {filtered.length} found
            </span>
          ) : (
            <span>
              Showing <strong className="text-gray-800">{filtered.length}</strong> of {requests.length}
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <label className="mb-3 block text-xs font-semibold text-gray-600">
        Search by name, number, or email
        <div className="relative mt-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filters.search || ''}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Type a name, mobile, or email"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </label>
      {hasSearch && (
        <p className="mb-3 text-sm text-gray-600">
          <strong className="text-gray-900">{filtered.length}</strong>
          {filtered.length === 1 ? ' request found' : ' requests found'}
          {' '}matching "{String(filters.search).trim()}"
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-semibold text-gray-600">
          Department
          <select
            value={filters.department}
            onChange={(e) => setField('department', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        {showQueueStatus && (
          <label className="block text-xs font-semibold text-gray-600">
            Claimed vs Open
            <select
              value={filters.queueStatus}
              onChange={(e) => setField('queueStatus', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="claimed">Claimed</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        )}

        <label className="block text-xs font-semibold text-gray-600">
          Payment
          <select
            value={filters.payment}
            onChange={(e) => setField('payment', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          CA status
          <select
            value={filters.caStatus}
            onChange={(e) => setField('caStatus', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All</option>
            <option value="none">No report yet</option>
            <option value="pending">CA Pending</option>
            <option value="under_review">Under CA</option>
            <option value="approved">Validated</option>
            <option value="rejected">Queried / Rejected</option>
          </select>
        </label>
      </div>
    </div>
  );
}
