import { useEffect, useMemo, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronRight, Mail, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'completed', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const SOURCE_FILTERS = [
  { id: '', label: 'All sources' },
  { id: 'client-screening', label: 'Client screening' },
  { id: 'pmegp', label: 'PMEGP' },
  { id: 'cmep', label: 'CMEP' },
  { id: 'ap-idp', label: 'AP IDP' },
];

const SOURCE_LABELS = {
  'client-screening': 'Client screening',
  pmegp: 'PMEGP',
  cmep: 'CMEP',
  'ap-idp': 'AP IDP',
};

const displayStatus = (status) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'opened') return 'pending';
  if (s === 'completed') return 'approved';
  return s;
};

const statusBadge = (status) => {
  const s = displayStatus(status);
  const map = {
    pending: 'bg-slate-100 text-slate-700',
    accepted: 'bg-amber-50 text-amber-900',
    approved: 'bg-emerald-50 text-emerald-800',
    rejected: 'bg-rose-50 text-rose-800',
  };
  return map[s] || map.pending;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const GlanceCards = ({ summary }) => {
  const cards = [
    { key: 'pending', label: 'Pending', value: summary?.pending ?? '—', className: 'border-slate-200 bg-slate-50' },
    { key: 'accepted', label: 'Accepted', value: summary?.accepted ?? '—', className: 'border-amber-200 bg-amber-50' },
    { key: 'approved', label: 'Approved', value: summary?.approved ?? '—', className: 'border-emerald-200 bg-emerald-50' },
    { key: 'rejected', label: 'Rejected', value: summary?.rejected ?? '—', className: 'border-rose-200 bg-rose-50' },
    { key: 'stale48h', label: '48h+', value: summary?.stale48h ?? '—', className: 'border-orange-200 bg-orange-50' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.key} className={`rounded-xl border px-4 py-3 ${c.className}`}>
          <p className="text-[11px] uppercase tracking-wide text-gray-600">{c.label}</p>
          <p className="text-xl font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

const AdminClientScreeningRequestsPage = () => {
  const [status, setStatus] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [providers, setProviders] = useState([]);
  const [reassignEmail, setReassignEmail] = useState({});
  const [reassigningId, setReassigningId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [statusDraft, setStatusDraft] = useState({});
  const [statusSavingId, setStatusSavingId] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ all: '1' });
    if (status) params.set('status', status);
    if (sourceType) params.set('source_type', sourceType);
    if (appliedSearch.trim()) params.set('search', appliedSearch.trim());
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return `?${params.toString()}`;
  }, [status, sourceType, appliedSearch, startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes, providersRes] = await Promise.all([
        api.get(`/msme-service/leads${queryString}`),
        api.get('/msme-service/leads/summary?all=1'),
        api.get('/msme-service/providers'),
      ]);
      setRows(Array.isArray(listRes?.data?.data) ? listRes.data.data : []);
      setSummary(summaryRes?.data?.data || null);
      setProviders(Array.isArray(providersRes?.data?.data) ? providersRes.data.data : []);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to load screening requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [queryString]);

  const reassign = async (id) => {
    const email = String(reassignEmail[id] || '').trim();
    if (!email) {
      toast.error('Choose a provider to reassign');
      return;
    }
    setReassigningId(id);
    try {
      const res = await api.post(`/msme-service/leads/${id}/reassign`, { email });
      const updated = res?.data?.data;
      setRows((prev) => prev.map((row) => (row._id === id ? updated : row)));
      toast.success(`Reassigned to ${email}`);
      try {
        const summaryRes = await api.get('/msme-service/leads/summary?all=1');
        setSummary(summaryRes?.data?.data || null);
      } catch {
        /* glance refresh is best-effort */
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to reassign');
    } finally {
      setReassigningId('');
    }
  };

  const changeStatus = async (row) => {
    const next = String(statusDraft[row._id] || displayStatus(row.rollupStatus || row.myStatus));
    if (next === 'rejected') {
      const entered = window.prompt('Reason for rejecting this lead (required):');
      if (entered === null) return;
      const reason = String(entered).trim();
      if (!reason) {
        toast.error('A reject reason is required');
        return;
      }
      return applyStatus(row._id, next, reason);
    }
    return applyStatus(row._id, next);
  };

  const applyStatus = async (id, status, reason) => {
    setStatusSavingId(id);
    try {
      const res = await api.post(
        `/msme-service/leads/${id}/status`,
        reason ? { status, reason } : { status }
      );
      const updated = res?.data?.data;
      setRows((prev) => prev.map((row) => (row._id === id ? updated : row)));
      toast.success('Status updated');
      try {
        const summaryRes = await api.get('/msme-service/leads/summary?all=1');
        setSummary(summaryRes?.data?.data || null);
      } catch {
        /* glance refresh is best-effort */
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to change status');
    } finally {
      setStatusSavingId('');
    }
  };

  const activeEmails = (assignees) =>
    (assignees || [])
      .filter((a) => a.active !== false)
      .map((a) => a.email)
      .filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Screening Requests</h1>
            <p className="mt-1 text-sm text-gray-600 max-w-3xl">
              Track whether each MSME Service Provider accepted, approved, or rejected a lead. Open a row to reassign or change status.
            </p>
          </div>
          <Link
            to="/admin/client-screening/emails"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold shadow-sm shrink-0"
          >
            <Mail className="w-4 h-4" />
            Screening Emails
          </Link>
        </div>

        <GlanceCards summary={summary} />

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Search className="h-3.5 w-3.5" /> Name
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setAppliedSearch(search);
                }}
                placeholder="Search applicant name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Calendar className="h-3.5 w-3.5" /> From
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Calendar className="h-3.5 w-3.5" /> To
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setAppliedSearch(search)}
                className="flex-1 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch('');
                  setStartDate('');
                  setEndDate('');
                  setStatus('');
                  setSourceType('');
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id || 'all'}
                type="button"
                onClick={() => setStatus(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                  status === f.id ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={f.id || 'all-sources'}
                type="button"
                onClick={() => setSourceType(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                  sourceType === f.id ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No screening requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 px-2 py-3" aria-label="More details" />
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Applicant</th>
                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold">Source</th>
                    <th className="px-4 py-3 text-left font-semibold">Topic</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">MSME Service Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const isExpanded = expandedId === r._id;
                    const currentStatus = displayStatus(r.rollupStatus || r.myStatus);
                    return (
                      <Fragment key={r._id}>
                        <tr
                          className={
                            isExpanded
                              ? 'bg-purple-50/50'
                              : r.stale48h
                                ? 'bg-amber-50 hover:bg-amber-100/80'
                                : 'hover:bg-gray-50'
                          }
                        >
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedId(isExpanded ? '' : r._id);
                                setStatusDraft((prev) => ({
                                  ...prev,
                                  [r._id]: prev[r._id] || currentStatus,
                                }));
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-purple-100 hover:text-purple-800"
                              title={isExpanded ? 'Hide details' : 'More details'}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                              ) : (
                                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {formatDateTime(r.createdAt)}
                            {r.stale48h ? (
                              <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                                48h+
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.fullName || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.phone || '—'}</td>
                          <td className="px-4 py-3">
                            {r.sourceLabel || SOURCE_LABELS[r.sourceType] || r.sourceType || '—'}
                          </td>
                          <td className="px-4 py-3">{r.optionLabel || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                                r.rollupStatus || r.myStatus
                              )}`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {activeEmails(r.assignees).length
                              ? activeEmails(r.assignees).join(', ')
                              : '—'}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr key={`${r._id}-details`} className="bg-slate-50">
                            <td colSpan={8} className="px-4 py-4">
                              {currentStatus === 'pending' ||
                              String(r.status || '').toLowerCase() === 'opened' ? (
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                  <div className="flex-1 min-w-[16rem]">
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                      Change status
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={statusDraft[r._id] || currentStatus}
                                        onChange={(e) =>
                                          setStatusDraft((prev) => ({
                                            ...prev,
                                            [r._id]: e.target.value,
                                          }))
                                        }
                                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="completed">Approved</option>
                                        <option value="rejected">Rejected</option>
                                      </select>
                                      <button
                                        type="button"
                                        disabled={statusSavingId === r._id}
                                        onClick={() => changeStatus(r)}
                                        className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                      >
                                        Update
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-[16rem]">
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                      Reassign
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={reassignEmail[r._id] || ''}
                                        onChange={(e) =>
                                          setReassignEmail((prev) => ({
                                            ...prev,
                                            [r._id]: e.target.value,
                                          }))
                                        }
                                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                      >
                                        <option value="">Select provider</option>
                                        {providers.map((p) => (
                                          <option key={p.email} value={p.email}>
                                            {p.email}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        disabled={reassigningId === r._id}
                                        onClick={() => reassign(r._id)}
                                        className="rounded-lg bg-purple-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                                      >
                                        Reassign
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  Status and reassign actions are available only while the request is still pending.
                                  Current status:{' '}
                                  <span className="font-semibold capitalize">{currentStatus}</span>
                                </p>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminClientScreeningRequestsPage;
