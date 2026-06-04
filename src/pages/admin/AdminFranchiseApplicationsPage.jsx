import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';
import {
  fetchApplications,
  fetchFranchises,
  updateApplicationStatus,
} from '@/store/slices/franchiseSlice';
import { APPLICATION_STATUSES, formatCurrency } from '@/constants/franchiseConstants';
import { ApplicationFiltersBar } from '@/components/franchise/admin/ApplicationFiltersBar';
import { ApplicationStatusBadge } from '@/components/franchise/admin/ApplicationStatusBadge';

function ApplicationDetailPanel({ app }) {
  return (
    <div className="px-4 py-4 bg-gray-50 border-t text-sm text-gray-600 space-y-2">
      <p>
        <span className="font-medium text-gray-700">Location:</span>{' '}
        {[app.city, app.state].filter(Boolean).join(', ') || app.location || '—'}
      </p>
      <p>
        <span className="font-medium text-gray-700">Funding:</span> {app.fundingSource || '—'}
      </p>
      <p>
        <span className="font-medium text-gray-700">Space:</span>{' '}
        {app.hasSpaceAvailable ? 'Yes' : 'No'}
      </p>
      <p>
        <span className="font-medium text-gray-700">Timeline:</span>{' '}
        {app.expectedStartTimeline || '—'}
      </p>
      {app.whyInterested && (
        <p>
          <span className="font-medium text-gray-700">Why interested:</span> {app.whyInterested}
        </p>
      )}
      {app.message && (
        <p>
          <span className="font-medium text-gray-700">Message:</span> {app.message}
        </p>
      )}
      {app.resumeUrl && (
        <a
          href={app.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[#7e22ce] hover:underline"
        >
          View Resume
        </a>
      )}
    </div>
  );
}

function ApplicationMobileCard({ app, expanded, onToggle, onStatusChange }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{app.fullName}</h3>
            <ApplicationStatusBadge status={app.status} />
          </div>
          <p className="text-sm text-purple-700">{app.franchise?.franchiseName}</p>
          <p className="text-xs text-gray-500 mt-1">{app.email}</p>
        </div>
      </button>
      {expanded && (
        <>
          <ApplicationDetailPanel app={app} />
          <div className="px-4 pb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={app.status}
              onChange={(e) => onStatusChange(app._id, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

const AdminFranchiseApplicationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { applications, franchises } = useSelector((state) => state.franchise);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    dispatch(fetchFranchises({ includeInactive: true, limit: 500 }));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const filters = {};
    if (franchiseFilter) filters.franchiseId = franchiseFilter;
    if (statusFilter) filters.status = statusFilter;
    if (categoryFilter) filters.category = categoryFilter;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (searchDebounced) filters.search = searchDebounced;
    setApplicationsLoading(true);
    dispatch(fetchApplications(filters)).finally(() => setApplicationsLoading(false));
  }, [dispatch, franchiseFilter, statusFilter, categoryFilter, dateFrom, dateTo, searchDebounced]);

  const hasFilters =
    franchiseFilter || statusFilter || categoryFilter || dateFrom || dateTo || searchDebounced;

  const clearFilters = () => {
    setFranchiseFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setSearchDebounced('');
  };

  const handleStatusChange = async (applicationId, status) => {
    try {
      await dispatch(updateApplicationStatus({ id: applicationId, status })).unwrap();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const list = applications || [];
  const resultCount = list.length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/admin/franchises')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Franchise Applications</h1>
            <p className="text-gray-500 mt-1">Review and manage franchise interest submissions</p>
          </div>
        </div>

        <ApplicationFiltersBar
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          franchiseFilter={franchiseFilter}
          onFranchiseChange={setFranchiseFilter}
          franchises={franchises}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          hasFilters={hasFilters}
          onClear={clearFilters}
          resultCount={resultCount}
        />

        {applicationsLoading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white border rounded-xl">
            {hasFilters ? 'No applications match your filters.' : 'No applications found.'}
          </div>
        ) : (
          <>
            <div className="hidden lg:block bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 w-8" />
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Franchise</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((app) => {
                    const isOpen = expandedId === app._id;
                    return (
                      <Fragment key={app._id}>
                        <tr
                          className="border-b last:border-0 hover:bg-purple-50/30"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isOpen ? null : app._id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              aria-label={isOpen ? 'Collapse' : 'Expand'}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{app.fullName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {app.email}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {app.franchise?.franchiseName || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {app.phone}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {formatCurrency(app.availableBudget)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 min-w-[140px]">
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                className="px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#7e22ce]"
                              >
                                {APPLICATION_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${app._id}-detail`}>
                            <td colSpan={7} className="p-0">
                              <ApplicationDetailPanel app={app} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {list.map((app) => (
                <ApplicationMobileCard
                  key={app._id}
                  app={app}
                  expanded={expandedId === app._id}
                  onToggle={() => setExpandedId(expandedId === app._id ? null : app._id)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFranchiseApplicationsPage;
