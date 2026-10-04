import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Check, MessageCircle, Phone, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/apiClient';
import MsmeServiceLayout from '@/components/layouts/MsmeServiceLayout';
import MsmeDecisionReasonModal from '@/pages/msmeService/MsmeDecisionReasonModal';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'completed', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
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
    accepted: 'bg-amber-50 text-amber-900 ring-1 ring-amber-100',
    approved: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
    rejected: 'bg-rose-50 text-rose-800 ring-1 ring-rose-100',
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

const indiaContactLinks = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  const e164 = local.length === 10 ? `91${local}` : digits.replace(/^0+/, '');
  return {
    tel: `tel:+${e164}`,
    wa: `https://wa.me/${e164}`,
  };
};

const GlanceCards = ({ summary }) => {
  const cards = [
    { key: 'pending', label: 'Pending', value: summary?.pending ?? '—', className: 'border-slate-100 bg-slate-50 text-slate-900' },
    { key: 'accepted', label: 'Accepted', value: summary?.accepted ?? '—', className: 'border-amber-100 bg-amber-50 text-amber-950' },
    { key: 'approved', label: 'Approved', value: summary?.approved ?? '—', className: 'border-emerald-100 bg-emerald-50 text-emerald-950' },
    { key: 'rejected', label: 'Rejected', value: summary?.rejected ?? '—', className: 'border-rose-100 bg-rose-50 text-rose-950' },
    { key: 'stale48h', label: '48h+', value: summary?.stale48h ?? '—', className: 'border-orange-100 bg-orange-50 text-orange-950' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.key} className={`rounded-2xl border px-4 py-3 ${c.className}`}>
          <p className="text-[11px] uppercase tracking-wide opacity-80">{c.label}</p>
          <p className="text-xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

const MsmeServiceRequestsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [decision, setDecision] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (appliedSearch.trim()) params.set('search', appliedSearch.trim());
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [status, appliedSearch, startDate, endDate]);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get(`/msme-service/leads${queryString}`),
        api.get('/msme-service/leads/summary'),
      ]);
      setRows(Array.isArray(listRes?.data?.data) ? listRes.data.data : []);
      setSummary(summaryRes?.data?.data || null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [queryString]);

  const syncUrl = (next) => {
    const params = {};
    if (next.status) params.status = next.status;
    if (next.search?.trim()) params.search = next.search.trim();
    if (next.startDate) params.start_date = next.startDate;
    if (next.endDate) params.end_date = next.endDate;
    setSearchParams(params);
  };

  const applySearch = () => {
    setAppliedSearch(search);
    syncUrl({ status, search, startDate, endDate });
  };

  const act = async (id, action, reason) => {
    setActingId(id);
    try {
      const res = await api.post(
        `/msme-service/leads/${id}/${action}`,
        reason ? { reason } : {}
      );
      const updated = res?.data?.data;
      setRows((prev) => prev.map((row) => (row._id === id ? updated : row)));
      setDecision(null);
      toast.success(
        action === 'accept'
          ? 'Accepted — phone is now visible'
          : action === 'reject'
            ? 'Request rejected'
            : 'Request approved'
      );
      try {
        const summaryRes = await api.get('/msme-service/leads/summary');
        setSummary(summaryRes?.data?.data || null);
      } catch {
        /* glance refresh is best-effort */
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || `Failed to ${action}`);
    } finally {
      setActingId('');
    }
  };

  return (
    <MsmeServiceLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Inbox</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Requests</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
              Accept a request to view the phone number. After accept you can call, WhatsApp, then mark it approved or rejected.
            </p>
          </div>
          <GlanceCards summary={summary} />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
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
                  if (e.key === 'Enter') applySearch();
                }}
                placeholder="Search applicant name"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Calendar className="h-3.5 w-3.5" /> From
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  syncUrl({ status, search: appliedSearch, startDate: e.target.value, endDate });
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Calendar className="h-3.5 w-3.5" /> To
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  syncUrl({ status, search: appliedSearch, startDate, endDate: e.target.value });
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applySearch}
                className="flex-1 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800"
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
                  setSearchParams(status ? { status } : {});
                }}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.id;
              return (
                <button
                  key={f.id || 'all'}
                  type="button"
                  onClick={() => syncUrl({ status: f.id, search: appliedSearch, startDate, endDate })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <p className="p-10 text-center text-gray-500">Loading requests…</p>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-gray-500">No requests match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/90 border-b border-gray-100">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Applicant</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Topic</th>
                    <th className="px-4 py-3 font-semibold">Nature of business</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r) => {
                    const busy = actingId === r._id;
                    const canAccept = ['pending', 'opened'].includes(r.myStatus);
                    const canDecideAfterAccept = r.myStatus === 'accepted';
                    const links = r.phoneVisible ? indiaContactLinks(r.phone) : null;
                    return (
                      <tr
                        key={r._id}
                        className={
                          r.stale48h
                            ? 'bg-amber-50/90 hover:bg-amber-100/80'
                            : 'hover:bg-purple-50/30'
                        }
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                          {formatDateTime(r.createdAt)}
                          {r.stale48h ? (
                            <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                              48h+
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-900">{r.fullName || '—'}</td>
                        <td className="px-4 py-4 text-gray-700">
                          {r.sourceLabel || SOURCE_LABELS[r.sourceType] || r.sourceType || '—'}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{r.optionLabel || '—'}</td>
                        <td className="px-4 py-4 text-gray-700">{r.natureOfBusiness || '—'}</td>
                        <td className="px-4 py-4">
                          {r.phoneVisible ? (
                            <span className="inline-flex flex-wrap items-center gap-2 font-medium text-gray-900 tracking-wide">
                              <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              {r.phone || '—'}
                              {links ? (
                                <>
                                  <a
                                    href={links.tel}
                                    className="text-xs font-semibold text-purple-700 hover:underline"
                                  >
                                    Call
                                  </a>
                                  <a
                                    href={links.wa}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    WhatsApp
                                  </a>
                                </>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Hidden until accepted</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(
                              r.myStatus
                            )}`}
                          >
                            {displayStatus(r.myStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {canAccept && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => act(r._id, 'accept')}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Accept
                              </button>
                            )}
                            {canDecideAfterAccept && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDecision({ id: r._id, mode: 'complete' })}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  Approved
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDecision({ id: r._id, mode: 'reject' })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Rejected
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {decision ? (
        <MsmeDecisionReasonModal
          mode={decision.mode === 'reject' ? 'reject' : 'complete'}
          submitting={actingId === decision.id}
          onCancel={() => setDecision(null)}
          onConfirm={(reason) => act(decision.id, decision.mode, reason)}
        />
      ) : null}
    </MsmeServiceLayout>
  );
};

export default MsmeServiceRequestsPage;
