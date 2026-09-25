import { useState, useEffect } from 'react';
import { Users, UserCheck, Circle, TrendingUp, XCircle, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getManagerDashboard } from '../../../services/salesService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const KpiCard = ({ icon: Icon, label, value, color, iconCls = 'text-gray-600' }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className={iconCls} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
  </div>
);

const SalesManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getManagerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
        <AlertCircle size={18} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const conversionsByExec = data?.conversionsByExecutive || [];
  const todayFollowUps = data?.todayFollowUps || [];
  const overdueFollowUps = data?.overdueFollowUps || [];

  const chartData = {
    labels: conversionsByExec.map((e) => e.name || e.executiveName),
    datasets: [
      {
        label: 'Conversions',
        data: conversionsByExec.map((e) => e.conversions || e.count || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: 'rgba(0,0,0,0.6)',
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(0,0,0,0.5)', font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: {
        ticks: { color: 'rgba(0,0,0,0.5)', font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sales team overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Total Clients" value={kpis.total} color="bg-purple-100" iconCls="text-purple-700" />
        <KpiCard icon={UserCheck} label="In Progress" value={kpis.assigned} color="bg-blue-100" iconCls="text-blue-700" />
        <KpiCard icon={Circle} label="Available" value={kpis.available} color="bg-gray-100" iconCls="text-gray-600" />
        <KpiCard icon={TrendingUp} label="Converted" value={kpis.converted} color="bg-emerald-100" iconCls="text-emerald-700" />
        <KpiCard icon={XCircle} label="Rejected" value={kpis.rejected} color="bg-red-100" iconCls="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversions by Executive</h2>
          {conversionsByExec.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No conversion data yet</p>
          ) : (
            <div style={{ height: 240 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Today's Follow-Ups */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-purple-600" />
            Today&apos;s Follow-Ups
          </h2>
          {todayFollowUps.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No follow-ups today</p>
          ) : (
            <ul className="space-y-2.5 max-h-52 overflow-y-auto">
              {todayFollowUps.map((f) => (
                <li key={f._id} className="text-sm border-b border-gray-100 pb-2.5">
                  <p className="text-gray-800 font-medium truncate">
                    {f.clientId?.customerName || f.clientName}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {f.executiveId?.name || f.executiveName} · {f.purpose}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Overdue Follow-Ups */}
      {overdueFollowUps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertCircle size={15} />
            Overdue Follow-Ups ({overdueFollowUps.length})
          </h2>
          <ul className="space-y-2">
            {overdueFollowUps.map((f) => (
              <li key={f._id} className="flex items-start justify-between text-sm py-1.5 border-b border-red-100 last:border-0">
                <div>
                  <p className="text-gray-800 font-medium">{f.clientId?.customerName || f.clientName}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.executiveId?.name || f.executiveName} · {f.purpose}</p>
                </div>
                <span className="text-red-500 text-xs font-medium ml-4 flex-shrink-0">
                  {new Date(f.followUpDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SalesManagerDashboard;
