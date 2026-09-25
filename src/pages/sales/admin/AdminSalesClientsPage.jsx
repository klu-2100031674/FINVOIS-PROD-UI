import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Search, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { AdminLayout } from '../../../components/layouts';
import SalesCrmSubNav from './SalesCrmSubNav';
import { adminGetAllClients, adminListManagers } from '../../../services/salesService';

const STAGES = ['', 'Available', 'Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted', 'Rejected'];

const STAGE_BADGE = {
  Available:   'bg-gray-100 text-gray-600',
  Assigned:    'bg-blue-100 text-blue-600',
  Contacted:   'bg-cyan-100 text-cyan-600',
  Interested:  'bg-green-100 text-green-600',
  'Follow-Up': 'bg-yellow-100 text-yellow-600',
  Negotiation: 'bg-orange-100 text-orange-600',
  Converted:   'bg-emerald-100 text-emerald-600',
  Rejected:    'bg-red-100 text-red-600',
};

const PRIORITY_BADGE = {
  High:   'bg-red-100 text-red-600',
  Medium: 'bg-yellow-100 text-yellow-600',
  Low:    'bg-green-100 text-green-600',
};

const inputCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none bg-white';

const AdminSalesClientsPage = () => {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [managers,   setManagers]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    stage: '', managerId: '', priority: '', city: '', page: 1,
  });

  const setF = (k, v) =>
    setFilters((f) => ({ ...f, [k]: v, page: k !== 'page' ? 1 : v }));

  useEffect(() => {
    adminListManagers()
      .then((res) => {
        const d = res.data?.data || res.data;
        setManagers(d?.managers || d || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.stage)     params.stage     = filters.stage;
    if (filters.managerId) params.managerId = filters.managerId;
    if (filters.priority)  params.priority  = filters.priority;
    if (filters.city)      params.city      = filters.city;

    adminGetAllClients(params)
      .then((res) => {
        const d = res.data?.data || res.data;
        setClients(d?.clients || d || []);
        if (d?.pagination) setPagination(d.pagination);
      })
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load clients'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SalesCrmSubNav />
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Clients</h1>
          <p className="text-muted-foreground mt-1">
            View and filter leads across all sales teams
            {pagination.total > 0 && (
              <span className="ml-1 text-gray-400">({pagination.total} total)</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 flex flex-wrap gap-3 items-center">
          <select
            value={filters.stage}
            onChange={(e) => setF('stage', e.target.value)}
            className={inputCls}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s || 'All Stages'}</option>
            ))}
          </select>

          {managers.length > 0 && (
            <select
              value={filters.managerId}
              onChange={(e) => setF('managerId', e.target.value)}
              className={inputCls}
            >
              <option value="">All Managers</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          )}

          <select
            value={filters.priority}
            onChange={(e) => setF('priority', e.target.value)}
            className={inputCls}
          >
            <option value="">All Priorities</option>
            {['High', 'Medium', 'Low'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Filter by city…"
              value={filters.city}
              onChange={(e) => setF('city', e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              Clients
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({clients.length} on this page)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce] mx-auto" />
                <p className="mt-3 text-muted-foreground text-sm">Loading clients…</p>
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No clients found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Customer', 'Phone', 'City', 'Stage', 'Priority', 'Assigned To', 'Uploaded By'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.customerName}</td>
                      <td className="px-6 py-4 text-gray-500">{c.phoneNumber}</td>
                      <td className="px-6 py-4 text-gray-400">{c.city || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_BADGE[c.stage] || 'bg-gray-100 text-gray-500'}`}>
                          {c.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[c.priority] || 'bg-gray-100 text-gray-500'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{c.assignedTo?.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">{c.uploadedBy?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {filters.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setF('page', filters.page - 1)}
                disabled={filters.page <= 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setF('page', filters.page + 1)}
                disabled={filters.page >= pagination.pages}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSalesClientsPage;
