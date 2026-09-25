import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  Eye,
  Download,
  ArrowLeft,
  Search,
  Users,
  FileText,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts';
import apiClient, { apiErrorMessage } from '@/api/apiClient';
import { downloadUserReportFile } from '@/utils';
import toast from 'react-hot-toast';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CS';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function avatarTone(name = '') {
  const tones = [
    'from-purple-500 to-indigo-600',
    'from-violet-500 to-purple-700',
    'from-fuchsia-500 to-purple-600',
    'from-indigo-500 to-violet-600',
    'from-purple-600 to-slate-700',
  ];
  const code = String(name).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return tones[code % tones.length];
}

function deptChipClass(name = '') {
  const key = String(name).toLowerCase();
  if (key.includes('msme')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (key.includes('mepma') || key.includes('mempa')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (key.includes('dpr')) return 'bg-violet-100 text-violet-800 border-violet-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function statusMeta(status = '') {
  const key = String(status).toLowerCase();
  if (key === 'approved') return { label: 'Validated', className: 'bg-emerald-100 text-emerald-800' };
  if (key === 'rejected') return { label: 'Queried', className: 'bg-red-100 text-red-800' };
  if (key === 'under_review') return { label: 'Under CA', className: 'bg-blue-100 text-blue-800' };
  if (key === 'pending_validation') return { label: 'CA Pending', className: 'bg-amber-100 text-amber-800' };
  if (key === 'pending_payment' || key === 'draft') return { label: 'In progress', className: 'bg-gray-100 text-gray-700' };
  return { label: status ? status.replace(/_/g, ' ') : '—', className: 'bg-gray-100 text-gray-600' };
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 ${accent}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 text-white shadow-sm ${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const AdminCustomerSupportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [totals, setTotals] = useState({ staffCount: 0, reportCount: 0 });
  const [selected, setSelected] = useState(null);
  const [downloadingId, setDownloadingId] = useState('');
  const [search, setSearch] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/customer-support/stats');
      setAgents(res.data?.agents || []);
      setTotals(res.data?.totals || { staffCount: 0, reportCount: 0 });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load customer support stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleDownload = async (report, kind) => {
    if (!report?.reportId) return;
    try {
      setDownloadingId(`${report.reportId}-${kind}`);
      await downloadUserReportFile({ _id: report.reportId }, kind);
    } catch (err) {
      toast.error(apiErrorMessage(err, `Failed to download ${kind.toUpperCase()}`));
    } finally {
      setDownloadingId('');
    }
  };

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((agent) =>
      [agent.name, agent.email, ...Object.keys(agent.departments || {})]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [agents, search]);

  const rankById = useMemo(() => {
    const map = new Map();
    agents.forEach((agent, index) => map.set(String(agent.staffId), index + 1));
    return map;
  }, [agents]);

  return (
    <AdminLayout>
      <div className="min-h-full bg-gradient-to-b from-purple-50/80 via-white to-white">
        <div className="p-6 max-w-[1400px] mx-auto">
          {selected && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft size={15} />
                Back to staff
              </button>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="CS staff" value={totals.staffCount} icon={Users} accent="bg-purple-600" />
            <StatCard label="Reports generated" value={totals.reportCount} icon={FileText} accent="bg-violet-600" />
          </div>

          {selected ? (
            <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
              <div className="border-b border-purple-50 bg-gradient-to-r from-purple-50 to-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-md ${avatarTone(selected.name)}`}
                    >
                      {initials(selected.name)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            selected.isActive === false
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {selected.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500">
                        <Mail size={13} />
                        {selected.email || '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(selected.departments || {}).map(([name, count]) => (
                          <span
                            key={name}
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${deptChipClass(name)}`}
                          >
                            {name} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-purple-600 px-4 py-3 text-right text-white shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-purple-100">Reports</div>
                    <div className="text-2xl font-bold">{selected.reportCount}</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Report</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.reports || []).map((report) => {
                      const status = statusMeta(report.validationStatus);
                      return (
                        <tr key={String(report.reportId)} className="border-t border-gray-100 hover:bg-purple-50/40">
                          <td className="px-5 py-3.5 text-gray-600">{formatDate(report.createdAt)}</td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-gray-900">{report.customerName || '—'}</div>
                            {report.customerPhone && (
                              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                                <Phone size={11} />
                                {report.customerPhone}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${deptChipClass(report.department)}`}>
                              {report.department}
                            </span>
                          </td>
                          <td className="max-w-[240px] truncate px-5 py-3.5 text-gray-800">{report.title}</td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate('/admin/reports')}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={13} />
                                View
                              </button>
                              <button
                                type="button"
                                disabled={downloadingId === `${report.reportId}-pdf`}
                                onClick={() => handleDownload(report, 'pdf')}
                                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                              >
                                <Download size={13} />
                                PDF
                              </button>
                              <button
                                type="button"
                                disabled={downloadingId === `${report.reportId}-excel`}
                                onClick={() => handleDownload(report, 'excel')}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Download size={13} />
                                Excel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!(selected.reports || []).length && (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-gray-500">
                          <FileText className="mx-auto mb-2 h-8 w-8 text-purple-200" />
                          No reports linked to this staff member yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900">Staff directory</h2>
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff, email, or department…"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((key) => (
                    <div key={key} className="h-44 animate-pulse rounded-2xl border border-gray-100 bg-white" />
                  ))}
                </div>
              ) : filteredAgents.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAgents.map((agent) => (
                    <button
                      key={String(agent.staffId)}
                      type="button"
                      onClick={() => setSelected(agent)}
                      className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
                    >
                      <div className="absolute right-4 top-4 text-xs font-bold text-purple-200">
                        #{rankById.get(String(agent.staffId)) || '—'}
                      </div>
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white ${avatarTone(agent.name)}`}
                        >
                          {initials(agent.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-gray-900">{agent.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                agent.isActive === false
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {agent.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{agent.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Reports</p>
                          <p className="text-2xl font-bold text-purple-700">{agent.reportCount}</p>
                        </div>
                        <span className="inline-flex items-center rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 group-hover:bg-purple-600 group-hover:text-white">
                          View reports
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {Object.keys(agent.departments || {}).length ? (
                          Object.entries(agent.departments).map(([name, count]) => (
                            <span
                              key={name}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${deptChipClass(name)}`}
                            >
                              <Building2 size={10} />
                              {name} ({count})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No department reports yet</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-purple-200 bg-white py-16 text-center">
                  <Headphones className="mx-auto mb-3 h-10 w-10 text-purple-300" />
                  <p className="font-semibold text-gray-800">
                    {agents.length ? 'No staff match your search' : 'No customer support users found'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {agents.length ? 'Try another name, email, or department.' : 'Add a customer_service user to see them here.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomerSupportPage;
