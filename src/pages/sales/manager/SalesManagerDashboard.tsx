import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  CheckCircle2,
  CalendarClock,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { salesReportsAPI, salesFollowUpsAPI } from '../../../services/salesService';
import type { KpiStats, DailyConversion, SalesFollowUp } from '../../../types/sales.types';
import { format } from '../../../utils/salesUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function KpiCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function SalesManagerDashboard() {
  const [kpi, setKpi] = useState<KpiStats | null>(null);
  const [conversions, setConversions] = useState<DailyConversion[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<SalesFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      salesReportsAPI.kpi(),
      salesReportsAPI.dailyConversions(14),
      salesFollowUpsAPI.all({ dateFrom: new Date().toISOString().slice(0, 10), dateTo: new Date().toISOString().slice(0, 10) }),
    ])
      .then(([kpiRes, convRes, fuRes]) => {
        setKpi(kpiRes.data);
        setConversions(convRes.data);
        setTodayFollowUps(fuRes.data.data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const chartData: ChartData<'bar'> = {
    labels: conversions.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Contacted',
        data: conversions.map((d) => d.contacted),
        backgroundColor: 'rgba(139,92,246,0.4)',
        borderColor: 'rgba(139,92,246,0.8)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Converted',
        data: conversions.map((d) => d.converted),
        backgroundColor: 'rgba(16,185,129,0.5)',
        borderColor: 'rgba(16,185,129,0.8)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(15,15,25,0.95)',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
      },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Sales performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total Clients"
          value={kpi?.totalClients ?? 0}
          icon={<Users className="w-5 h-5 text-violet-300" />}
          accent="bg-violet-500/20"
        />
        <KpiCard
          label="Converted"
          value={kpi?.converted ?? 0}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-300" />}
          accent="bg-emerald-500/20"
        />
        <KpiCard
          label="Conversion Rate"
          value={`${(kpi?.conversionRate ?? 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5 text-blue-300" />}
          accent="bg-blue-500/20"
        />
        <KpiCard
          label="Active Executives"
          value={kpi?.activeExecutives ?? 0}
          icon={<Users className="w-5 h-5 text-orange-300" />}
          accent="bg-orange-500/20"
        />
        <KpiCard
          label="Pending Follow-Ups"
          value={kpi?.pendingFollowUps ?? 0}
          icon={<CalendarClock className="w-5 h-5 text-yellow-300" />}
          sub={`${kpi?.todayActivities ?? 0} activities today`}
          accent="bg-yellow-500/20"
        />
      </div>

      {/* Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-violet-400" />
          <h2 className="text-white font-semibold text-sm">Conversions — Last 14 Days</h2>
        </div>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Today Follow-Ups */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-yellow-400" />
          <h2 className="text-white font-semibold text-sm">Today's Follow-Ups</h2>
          <span className="ml-auto text-xs text-gray-500">{todayFollowUps.length} total</span>
        </div>
        {todayFollowUps.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No follow-ups scheduled today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left pb-2 font-medium">Client</th>
                  <th className="text-left pb-2 font-medium">Executive</th>
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayFollowUps.slice(0, 10).map((fu) => (
                  <tr key={fu.id}>
                    <td className="py-2.5 text-white">{fu.client.name}</td>
                    <td className="py-2.5 text-gray-400">{fu.executiveName}</td>
                    <td className="py-2.5 text-gray-400">
                      {format.time(fu.scheduledAt)}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        fu.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        fu.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {fu.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
