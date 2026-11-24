import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Download,
  Eye,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layouts';
import { adminGenieAPI } from '../../../api/genieAPI';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/**
 * Admin → Schemes → Activity report: how often each Finvois Genie scheme is
 * opened and asked about. Views come from the scheme page (/genie/:slug);
 * questions are chat messages answered by the RAG service; Xplore mentions are
 * all-schemes questions that named the scheme.
 */

const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const shiftDate = (ymd, days) => {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  d.setTime(d.getTime() + days * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
};
const PRESETS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtDay = (ymd) =>
  new Date(`${ymd}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const fmtWhen = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : '—';

const COLUMNS = [
  { key: 'name', label: 'Scheme', align: 'left' },
  { key: 'views', label: 'Views', hint: 'Times the scheme page was opened (repeat opens by the same browser within 30 min count once)' },
  { key: 'uniqueVisitors', label: 'Unique visitors', hint: 'Different browsers that opened the scheme' },
  { key: 'questions', label: 'Chat questions', hint: 'Questions asked in this scheme’s Genie chat' },
  { key: 'xploreMentions', label: 'Xplore mentions', hint: 'Questions in Xplore (all schemes) that named this scheme' },
  { key: 'interest', label: 'Total interest', hint: 'Views + chat questions + Xplore mentions' },
  { key: 'lastActivity', label: 'Last activity' },
];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Icon className="h-4 w-4 text-purple-700" /> {label}
      </div>
      <p className="mt-2 font-['Manrope'] text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function SourceBar({ sources }) {
  const total = sources.picker + sources.navbar + sources.direct;
  if (!total) return <span className="text-xs text-gray-400">—</span>;
  const parts = [
    { key: 'picker', label: 'Genie cards', value: sources.picker, color: 'bg-purple-600' },
    { key: 'navbar', label: 'Website menu', value: sources.navbar, color: 'bg-indigo-400' },
    { key: 'direct', label: 'Direct link', value: sources.direct, color: 'bg-gray-300' },
  ];
  return (
    <div className="min-w-[120px]" title={parts.map((p) => `${p.label}: ${p.value}`).join('\n')}>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
        {parts.map((p) => (p.value ? <div key={p.key} className={p.color} style={{ width: `${(p.value / total) * 100}%` }} /> : null))}
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        {parts.filter((p) => p.value).map((p) => `${p.label} ${p.value}`).join(' · ')}
      </p>
    </div>
  );
}

const withInterest = (row) => ({ ...row, interest: row.views + row.questions + row.xploreMentions });

export default function AdminGenieSchemeActivityPage() {
  const [range, setRange] = useState(() => ({ from: shiftDate(istToday(), -29), to: istToday() }));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ key: 'interest', dir: 'desc' });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await adminGenieAPI.activity(range));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const activePreset = PRESETS.find((p) => range.to === istToday() && range.from === shiftDate(istToday(), -(p.days - 1)));

  const rows = useMemo(() => {
    const list = (report?.schemes || []).map(withInterest);
    const { key, dir } = sort;
    const factor = dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (key === 'name') return factor * String(av).localeCompare(String(bv));
      if (key === 'lastActivity') return factor * ((av ? new Date(av).getTime() : 0) - (bv ? new Date(bv).getTime() : 0));
      return factor * ((av || 0) - (bv || 0)) || a.name.localeCompare(b.name);
    });
  }, [report, sort]);

  const xplore = report ? withInterest(report.xplore) : null;
  const topScheme = rows.length ? [...rows].sort((a, b) => b.interest - a.interest)[0] : null;
  const quietCount = rows.filter((r) => r.status === 'published' && r.interest === 0).length;

  const chartData = useMemo(() => {
    const daily = report?.daily || [];
    return {
      labels: daily.map((d) => fmtDay(d.date)),
      datasets: [
        {
          label: 'Views',
          data: daily.map((d) => d.views),
          borderColor: '#7e22ce',
          backgroundColor: 'rgba(126, 34, 206, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: daily.length > 45 ? 0 : 2,
        },
        {
          label: 'Chat questions',
          data: daily.map((d) => d.questions),
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.3,
          pointRadius: daily.length > 45 ? 0 : 2,
        },
      ],
    };
  }, [report]);

  const toggleSort = (key) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : key === 'name' ? 'asc' : 'desc' }));

  const setDate = (field, value) => {
    if (!value) return;
    setRange((prev) => {
      const next = { ...prev, [field]: value };
      if (next.from > next.to) {
        toast.error('"From" date must be on or before "To" date');
        return prev;
      }
      return next;
    });
  };

  const exportExcel = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const { default: ExcelJS } = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Scheme activity');
      ws.columns = [
        { header: 'Scheme', key: 'name', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Views', key: 'views', width: 10 },
        { header: 'Unique visitors', key: 'uniqueVisitors', width: 16 },
        { header: 'Chat questions', key: 'questions', width: 15 },
        { header: 'Xplore mentions', key: 'xploreMentions', width: 16 },
        { header: 'Total interest', key: 'interest', width: 14 },
        { header: 'Views from Genie cards', key: 'picker', width: 22 },
        { header: 'Views from website menu', key: 'navbar', width: 24 },
        { header: 'Views from direct link', key: 'direct', width: 22 },
        { header: 'Last activity (IST)', key: 'lastActivity', width: 22 },
      ];
      const toRow = (r) => ({
        ...r,
        ...r.viewsBySource,
        lastActivity: r.lastActivity ? fmtWhen(r.lastActivity) : '',
      });
      ws.addRow(toRow({ ...xplore, status: 'all schemes' }));
      rows.forEach((r) => ws.addRow(toRow(r)));
      ws.getRow(1).font = { bold: true };

      const daily = wb.addWorksheet('Daily');
      daily.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Views', key: 'views', width: 10 },
        { header: 'Chat questions', key: 'questions', width: 15 },
      ];
      report.daily.forEach((d) => daily.addRow(d));
      daily.getRow(1).font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheme-activity_${report.range.from}_to_${report.range.to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Could not export');
    } finally {
      setExporting(false);
    }
  };

  const hasActivity = !!report && (report.totals.views > 0 || report.totals.questions > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin/schemes" className="mb-2 flex w-fit items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Schemes
            </Link>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-700">
              <Sparkles className="h-3.5 w-3.5" /> Finvois Genie
            </p>
            <h1 className="font-['Manrope'] text-2xl font-bold text-gray-900">Scheme activity</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              How often each scheme is opened and asked about in Genie. Dates are in IST. Admin test-mode chats are not counted.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setRange({ from: shiftDate(istToday(), -(p.days - 1)), to: istToday() })}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${activePreset?.days === p.days ? 'bg-purple-700 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="text-xs font-medium text-gray-600">
              From
              <input type="date" value={range.from} max={range.to} onChange={(e) => setDate('from', e.target.value)} className="mt-0.5 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-600">
              To
              <input type="date" value={range.to} min={range.from} max={istToday()} onChange={(e) => setDate('to', e.target.value)} className="mt-0.5 block rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
            </label>
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={exportExcel} disabled={!report || exporting} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            <button type="button" onClick={load} className="ml-auto font-semibold hover:underline">Retry</button>
          </div>
        )}

        {loading && !report ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading activity…
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Eye} label="Scheme views" value={fmtNum(report.totals.views)} sub={`${fmtDay(report.range.from)} – ${fmtDay(report.range.to)}`} />
              <StatCard icon={Users} label="Unique visitors" value={fmtNum(report.totals.uniqueVisitors)} sub="Different browsers that used Genie" />
              <StatCard icon={MessageSquareText} label="Chat questions" value={fmtNum(report.totals.questions)} sub={`${fmtNum(xplore.questions)} of them in Xplore`} />
              <StatCard
                icon={BarChart3}
                label="Most interest"
                value={topScheme && topScheme.interest > 0 ? topScheme.name : '—'}
                sub={topScheme && topScheme.interest > 0 ? `${fmtNum(topScheme.interest)} views, questions & mentions` : 'No activity yet'}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Daily trend</h2>
              <div className="mt-3 h-64">
                {hasActivity ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
                      scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
                    <BarChart3 className="mb-2 h-8 w-8 text-gray-300" />
                    No scheme views or questions in this period.
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
                <h2 className="font-semibold text-gray-900">By scheme</h2>
                {quietCount > 0 && (
                  <p className="text-xs text-amber-700">
                    {quietCount} published {quietCount === 1 ? 'scheme has' : 'schemes have'} no activity in this period
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-semibold ${c.align === 'left' ? 'text-left' : 'text-right'}`} title={c.hint}>
                          <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-gray-800">
                            {c.label}
                            {sort.key === c.key && (sort.dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                          </button>
                        </th>
                      ))}
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Views from</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {xplore && (
                      <tr className="bg-purple-50/50">
                        <td className="min-w-[220px] px-4 py-3">
                          <p className="font-semibold text-purple-900">Xplore (all schemes)</p>
                          <p className="text-xs text-gray-500">Questions here are also credited to the schemes they name</p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(xplore.views)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(xplore.uniqueVisitors)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(xplore.questions)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtNum(xplore.views + xplore.questions)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">{fmtWhen(xplore.lastActivity)}</td>
                        <td className="px-4 py-3"><SourceBar sources={xplore.viewsBySource} /></td>
                      </tr>
                    )}
                    {rows.map((r) => (
                      <tr key={r.slug} className="hover:bg-gray-50">
                        <td className="min-w-[220px] px-4 py-3">
                          <p className="font-medium text-gray-900">{r.name}</p>
                          {r.status !== 'published' && (
                            <span className="text-xs font-medium capitalize text-gray-500">{r.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.views)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.uniqueVisitors)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.questions)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.xploreMentions)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtNum(r.interest)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">{fmtWhen(r.lastActivity)}</td>
                        <td className="px-4 py-3"><SourceBar sources={r.viewsBySource} /></td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-gray-500">
                          No schemes yet. <Link to="/admin/schemes" className="font-semibold text-purple-700 hover:underline">Create one</Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
