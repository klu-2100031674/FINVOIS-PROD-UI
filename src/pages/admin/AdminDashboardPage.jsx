import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgColor = 'bg-blue-100', iconColor = 'text-blue-600' }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center group hover:shadow-lg transition-shadow duration-200">
    <div className={`p-3 rounded-lg ${bgColor} group-hover:opacity-80 transition-colors duration-200`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div className="ml-4">
      <h3 className="text-3xl font-bold text-gray-900 font-['Manrope']">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
      {trend && (
        <div className={`flex items-center mt-1 text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  </div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
          <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-100' : activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            {activity.type === 'success' ? (
              <CheckCircle className="text-green-500" size={16} />
            ) : activity.type === 'warning' ? (
              <Clock className="text-yellow-500" size={16} />
            ) : (
              <FileText className="text-blue-500" size={16} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800">{activity.message}</p>
            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PendingWithdrawals = ({ withdrawals = [], onApprove, onReject }) => {
  const withdrawalsList = Array.isArray(withdrawals) ? withdrawals : [];
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4">Pending Withdrawals</h3>
      {withdrawalsList.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending withdrawals</p>
      ) : (
        <div className="space-y-3">
          {withdrawalsList.slice(0, 5).map((withdrawal) => (
          <div key={withdrawal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">{withdrawal.agent_id?.name || 'Agent'}</p>
              <p className="text-xs text-gray-500">₹{withdrawal.amount}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onApprove(withdrawal._id)}
                className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => onReject(withdrawal._id)}
                className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalReports: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    completedWithdrawals: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users count
      const usersResponse = await api.get('/users');
      const users = usersResponse.data?.data || [];
      const totalUsers = users.filter(u => u.role === 'user').length;
      const totalAgents = users.filter(u => u.role === 'agent').length;

      // Fetch reports count
      const reportsResponse = await api.get('/reports');
      const reports = reportsResponse.data?.data || [];

      // Fetch orders for revenue
      let totalRevenue = 0;
      try {
        const ordersResponse = await api.get('/orders');
        const orders = ordersResponse.data || [];
        totalRevenue = orders
          .filter(o => o.status === 'paid')
          .reduce((sum, o) => sum + (o.amount_paid || 0), 0);
      } catch (e) {
        console.log('Could not fetch orders:', e);
      }

      // Fetch commissions
      let totalCommissions = 0;
      let paidCommissions = 0;
      let pendingCommissions = 0;
      try {
        const commissionsResponse = await api.get('/commissions');
        const commissions = commissionsResponse.data?.commissions || commissionsResponse.data || [];
        if (Array.isArray(commissions)) {
          totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
          paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
          pendingCommissions = commissions.filter(c => c.status === 'accrued').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        }
      } catch (e) {
        console.log('Could not fetch commissions:', e);
      }

      // Fetch all withdrawals
      let completedWithdrawals = 0;
      const withdrawalsResponse = await api.get('/withdrawals?status=pending');
      const withdrawalsData = withdrawalsResponse.data?.data;
      const withdrawals = Array.isArray(withdrawalsData) 
        ? withdrawalsData 
        : (withdrawalsData?.withdrawals || []);

      try {
        const allWithdrawalsResponse = await api.get('/withdrawals');
        const allWithdrawals = allWithdrawalsResponse.data?.data?.withdrawals || allWithdrawalsResponse.data?.withdrawals || [];
        if (Array.isArray(allWithdrawals)) {
          completedWithdrawals = allWithdrawals
            .filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + (w.amount || 0), 0);
        }
      } catch (e) {
        console.log('Could not fetch all withdrawals:', e);
      }

      setStats({
        totalUsers,
        totalAgents,
        totalReports: reports.length,
        totalRevenue,
        pendingWithdrawals: withdrawals.length,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        completedWithdrawals
      });

      setPendingWithdrawals(withdrawals);

      // Generate recent activities from reports
      const activities = reports.slice(0, 5).map(report => ({
        message: `Report generated: ${report.report_type || 'Report'}`,
        time: new Date(report.created_at || report.createdAt).toLocaleString(),
        type: report.status === 'completed' ? 'success' : 'info'
      }));
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setRecentActivities([
        { message: 'Dashboard initialized', time: 'Just now', type: 'info' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      await api.patch(`/withdrawals/${withdrawalId}/status`, { status: 'approved' });
      toast.success('Withdrawal approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    try {
      await api.patch(`/withdrawals/${withdrawalId}/status`, { status: 'rejected' });
      toast.success('Withdrawal rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome Section - Matching main dashboard */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-3xl font-bold text-gray-900 font-['Manrope'] mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-700 text-lg">Welcome back! Here's an overview of your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="up"
          trendValue="+12% this month"
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Agents"
          value={stats.totalAgents}
          icon={Users}
          trend="up"
          trendValue="+5% this month"
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Reports Generated"
          value={stats.totalReports}
          icon={FileText}
          trend="up"
          trendValue="+18% this month"
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="+8% this month"
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Financial Overview Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-800 font-['Manrope']">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">From all orders</p>
          </div>
          
          {/* Total Commissions */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-700 font-medium mb-1">Total Commissions</p>
            <p className="text-2xl font-bold text-purple-800 font-['Manrope']">
              ₹{stats.totalCommissions.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-1">Agent earnings</p>
          </div>
          
          {/* Pending Commissions */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium mb-1">Pending Commissions</p>
            <p className="text-2xl font-bold text-yellow-800 font-['Manrope']">
              ₹{stats.pendingCommissions.toLocaleString()}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Awaiting withdrawal</p>
          </div>
          
          {/* Completed Withdrawals */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-1">Paid Withdrawals</p>
            <p className="text-2xl font-bold text-blue-800 font-['Manrope']">
              ₹{stats.completedWithdrawals.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">Total payouts</p>
          </div>
        </div>
        
        {/* Net Profit Bar */}
        <div className="mt-6 p-4 bg-gray-900 rounded-xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm text-gray-300">Net Profit (Revenue - Commissions)</p>
              <p className="text-3xl font-bold font-['Manrope']">
                ₹{(stats.totalRevenue - stats.totalCommissions).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Profit Margin</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.totalRevenue > 0 
                  ? ((stats.totalRevenue - stats.totalCommissions) / stats.totalRevenue * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />
        <PendingWithdrawals 
          withdrawals={pendingWithdrawals}
          onApprove={handleApproveWithdrawal}
          onReject={handleRejectWithdrawal}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 font-['Manrope']">{stats.pendingWithdrawals}</p>
            <p className="text-sm text-gray-600">Pending Withdrawals</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600 font-['Manrope']">{stats.totalReports}</p>
            <p className="text-sm text-gray-600">Active Reports</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600 font-['Manrope']">{stats.totalAgents}</p>
            <p className="text-sm text-gray-600">Active Agents</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600 font-['Manrope']">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
