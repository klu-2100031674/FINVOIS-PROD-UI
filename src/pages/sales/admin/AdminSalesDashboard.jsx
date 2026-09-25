import { useState, useEffect } from 'react';
import {
  Users, UserCheck, Database, TrendingUp, XCircle,
  Calendar, AlertCircle, Activity, ArrowUpRight,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { AdminLayout } from '../../../components/layouts';
import SalesCrmSubNav from './SalesCrmSubNav';
import { adminGetDashboard } from '../../../services/salesService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ icon: Icon, label, value, sub, bgColor = 'bg-purple-100', iconColor = 'text-[#7e22ce]' }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const STAGE_COLORS_MAP = {
  Available:   '#6b7280',
  Assigned:    '#3b82f6',
  Contacted:   '#06b6d4',
  Interested:  '#22c55e',
  'Follow-Up': '#eab308',
  Negotiation: '#f97316',
  Converted:   '#10b981',
  Rejected:    '#ef4444',
};

const AdminSalesDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetDashboard()
      .then((res) => setData(res.data?.data || res.data))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce] mx-auto" />
            <p className="mt-3 text-muted-foreground text-sm">Loading dashboard…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  const kpis                = data?.kpis || {};
  const conversionsByManager = data?.conversionsByManager || [];
  const stageDistribution   = data?.stageDistribution || [];
  const todayFollowUps      = data?.todayFollowUps || [];
  const overdueFollowUps    = data?.overdueFollowUps || [];

  const barData = {
    labels: conversionsByManager.map((m) => m.name),
    datasets: [{
      label: 'Conversions',
      data: conversionsByManager.map((m) => m.conversions),
      backgroundColor: 'rgba(126,34,206,0.7)',
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
      y: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SalesCrmSubNav />
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales CRM Overview</h1>
          <p className="text-muted-foreground mt-1">Full visibility across all sales teams</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Total Managers"   value={kpis.totalManagers}   sub={`${kpis.activeManagers} active`}        bgColor="bg-purple-100" iconColor="text-[#7e22ce]" />
          <StatCard icon={UserCheck} label="Total Executives" value={kpis.totalExecutives}                                               bgColor="bg-blue-100"   iconColor="text-blue-600" />
          <StatCard icon={Database} label="Total Leads"       value={kpis.totalClients}    sub={`${kpis.availableClients} available`}    bgColor="bg-indigo-100" iconColor="text-indigo-600" />
          <StatCard icon={TrendingUp} label="Converted"       value={kpis.convertedClients}                                              bgColor="bg-green-100"  iconColor="text-green-600" />
          <StatCard icon={Activity} label="Assigned"          value={kpis.assignedClients}                                               bgColor="bg-cyan-100"   iconColor="text-cyan-600" />
          <StatCard icon={XCircle}  label="Rejected"          value={kpis.rejectedClients}                                               bgColor="bg-red-100"    iconColor="text-red-500" />
          <StatCard icon={Calendar} label="Pending Follow-Ups" value={kpis.pendingFollowUps} sub={`${kpis.todayCount} today`}            bgColor="bg-yellow-100" iconColor="text-yellow-600" />
        </div>

        {/* Stage distribution */}
        {stageDistribution.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Lead Stage Distribution</h2>
            <div className="flex flex-wrap gap-3">
              {stageDistribution.map((s) => (
                <div key={s._id} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STAGE_COLORS_MAP[s._id] || '#6b7280' }}
                  />
                  <span className="text-sm text-gray-600">{s._id}</span>
                  <span className="text-sm font-bold text-gray-900">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversions bar chart */}
        {conversionsByManager.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Conversions by Manager</h2>
            <Bar data={barData} options={barOptions} height={80} />
          </div>
        )}

        {/* Follow-up panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Today's Follow-Ups
              <span className="ml-2 text-sm font-normal text-gray-400">({todayFollowUps.length})</span>
            </h2>
            {todayFollowUps.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No follow-ups scheduled today</p>
            ) : (
              <ul className="space-y-2">
                {todayFollowUps.slice(0, 10).map((f) => (
                  <li key={f._id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.clientId?.customerName || '—'}</p>
                      <p className="text-xs text-gray-400">{f.executiveId?.name}</p>
                    </div>
                    <span className="text-xs text-yellow-600 font-medium">
                      {new Date(f.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Overdue Follow-Ups
              {overdueFollowUps.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  {overdueFollowUps.length}
                </span>
              )}
            </h2>
            {overdueFollowUps.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No overdue follow-ups</p>
            ) : (
              <ul className="space-y-2">
                {overdueFollowUps.slice(0, 10).map((f) => (
                  <li key={f._id} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.clientId?.customerName || '—'}</p>
                      <p className="text-xs text-gray-400">{f.executiveId?.name}</p>
                    </div>
                    <span className="text-xs text-red-500 font-medium">
                      {new Date(f.followUpDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSalesDashboard;
