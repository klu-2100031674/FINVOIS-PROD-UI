import { Search } from 'lucide-react';
import { APPLICATION_STATUSES } from '@/constants/franchiseConstants';
import { FranchiseCategoryFilterSelect } from '@/components/franchise/FranchiseCategorySelect';

export function ApplicationFiltersBar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  franchiseFilter,
  onFranchiseChange,
  franchises = [],
  statusFilter,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasFilters,
  onClear,
  resultCount,
}) {
  return (
    <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm sticky top-0 z-10">
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, email, or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <FranchiseCategoryFilterSelect
            value={categoryFilter}
            onChange={onCategoryChange}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Franchise</label>
          <select
            value={franchiseFilter}
            onChange={(e) => onFranchiseChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          >
            <option value="">All franchises</option>
            {franchises.map((f) => (
              <option key={f._id} value={f._id}>
                {f.franchiseName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          />
        </div>
        <div className="flex items-end">
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="w-full px-3 py-2 text-sm text-[#7e22ce] border border-[#7e22ce] rounded-lg hover:bg-purple-50"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-3">
        {resultCount} application{resultCount !== 1 ? 's' : ''} found
      </p>
    </div>
  );
}
