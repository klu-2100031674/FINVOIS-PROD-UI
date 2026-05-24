import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import { companyAPI } from '../../api/endpoints';
import { useAuth } from '../../hooks';
import toast from 'react-hot-toast';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  bgColor = 'bg-purple-100',
  iconColor = 'text-[#7e22ce]',
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center group hover:shadow-lg transition-shadow duration-200 text-left ${
      onClick ? 'cursor-pointer' : 'cursor-default'
    }`}
  >
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
  </button>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
          <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-100' : activity.type === 'warning' ? 'bg-yellow-100' : 'bg-purple-100'}`}>
            {activity.type === 'success' ? (
              <CheckCircle className="text-green-500" size={16} />
            ) : activity.type === 'warning' ? (
              <Clock className="text-yellow-500" size={16} />
            ) : (
              <FileText className="text-purple-500" size={16} />
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
                <p className="text-sm font-medium text-gray-800">{withdrawal.agent_id?.name || 'Channel partner'}</p>
                <p className="text-xs text-gray-500">Rs.{withdrawal.amount}</p>
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

const CompanyAdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    myReports: 0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      let companyId = companyAPI.normalizeCompanyId(
        user?.companyId?._id ||
        user?.companyId?.id ||
        user?.company?._id ||
        user?.company_id ||
        user?.companyId
      );
      if (!companyId) {
        try {
          const companiesResponse = await companyAPI.getAllCompanies();
          const companies = companiesResponse?.data || [];
          const currentUserId = String(user?._id || user?.id || '');
          const matchedCompany = companies.find((company) => {
            const adminRef = company?.companyAdminId;
            const primaryId = typeof adminRef === 'object' ? adminRef?._id : adminRef;
            const fromArray = (Array.isArray(company?.companyAdminIds) ? company.companyAdminIds : []).map((ref) =>
              typeof ref === 'object' ? ref?._id : ref
            );
            const ids = [...fromArray.map(String), String(primaryId || '')].filter(Boolean);
            return ids.includes(currentUserId);
          });
          // For company_admin role, /company/all should return only their company.
          const fallbackCompany = matchedCompany || companies[0];
          if (!matchedCompany && fallbackCompany) {
            console.log('[CompanyAdminDashboard] fallback company resolution used first company item');
          }
          companyId = companyAPI.normalizeCompanyId(fallbackCompany?._id);
        } catch (error) {
          console.log('Could not resolve company from company list:', error);
        }
      }
      console.log('[CompanyAdminDashboard] resolved companyId:', companyId, 'userId:', user?._id);

      const analyticsResponse = companyId
        ? await companyAPI.getCompanyAnalytics(companyId)
        : { data: {} };
      const analytics = analyticsResponse?.data || {};
      console.log('[CompanyAdminDashboard] analytics payload:', analytics);
      const usersResponse = companyId
        ? await companyAPI.getCompanyUsers(companyId)
        : { data: [] };
      const usersPayload = usersResponse?.data;
      const users = Array.isArray(usersPayload)
        ? usersPayload
        : Array.isArray(usersPayload?.users)
          ? usersPayload.users
          : Array.isArray(usersResponse?.users)
            ? usersResponse.users
            : [];
      const fallbackAgentCount = users.filter((u) => String(u.role || '').toLowerCase() === 'agent').length;
      // Company admin should be counted under users.
      const fallbackUserCount = users.filter((u) => String(u.role || '').toLowerCase() !== 'agent').length;
      const totalAgents = Number(analytics?.totalAgents ?? fallbackAgentCount);
      const totalUsers = Number(analytics?.totalUsers ?? fallbackUserCount);
      console.log('[CompanyAdminDashboard] users length:', users.length, 'fallbackUsers:', fallbackUserCount, 'fallbackAgents:', fallbackAgentCount);
      console.log('[CompanyAdminDashboard] final counts:', { totalUsers, totalAgents, totalReports: Number(analytics?.totalReports ?? 0) });

      const reportsResponse = await api.get('/reports');
      const reports = reportsResponse.data?.data || [];
      const currentUserId = String(user?._id || user?.id || '');
      const myReports = reports.filter((report) => {
        const reportUser = report?.user_id;
        const reportUserId = typeof reportUser === 'object' ? reportUser?._id : reportUser;
        return String(reportUserId || '') === currentUserId;
      }).length;

      let totalRevenue = 0;
      try {
        const ordersResponse = await api.get('/orders');
        const orders = ordersResponse.data || [];
        totalRevenue = orders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + (o.amount_paid || 0), 0);
      } catch (e) {
        console.log('Could not fetch orders:', e);
      }

      let totalCommissions = 0;
      let paidCommissions = 0;
      let pendingCommissions = 0;
      try {
        const commissionsResponse = await api.get('/commissions');
        const commissions = commissionsResponse.data?.commissions || commissionsResponse.data || [];
        if (Array.isArray(commissions)) {
          totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
          paidCommissions = commissions
            .filter((c) => c.status === 'paid')
            .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
          pendingCommissions = commissions
            .filter((c) => c.status === 'accrued')
            .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        }
      } catch (e) {
        console.log('Could not fetch commissions:', e);
      }

      let completedWithdrawals = 0;
      let withdrawals = [];
      try {
        const withdrawalsResponse = await api.get('/withdrawals?status=pending');
        const withdrawalsData = withdrawalsResponse.data?.data;
        withdrawals = Array.isArray(withdrawalsData)
          ? withdrawalsData
          : (withdrawalsData?.withdrawals || []);
      } catch (error) {
        // Company admins are not allowed on withdrawals API in current backend ACL.
        // Keep dashboard stats rendering instead of failing whole page.
        console.log('Could not fetch pending withdrawals:', error);
      }

      try {
        const allWithdrawalsResponse = await api.get('/withdrawals');
        const allWithdrawals = allWithdrawalsResponse.data?.data?.withdrawals || allWithdrawalsResponse.data?.withdrawals || [];
        if (Array.isArray(allWithdrawals)) {
          completedWithdrawals = allWithdrawals
            .filter((w) => w.status === 'completed')
            .reduce((sum, w) => sum + (w.amount || 0), 0);
        }
      } catch (e) {
        console.log('Could not fetch all withdrawals:', e);
      }

      setStats({
        totalUsers,
        totalAgents,
        myReports,
        totalReports: Number(analytics?.totalReports ?? reports.length),
        totalRevenue,
        pendingWithdrawals: withdrawals.length,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        completedWithdrawals
      });

      setPendingWithdrawals(withdrawals);
      const activities = reports.slice(0, 5).map((report) => ({
        message: `Report generated: ${report.report_type || 'Report'}`,
        time: new Date(report.created_at || report.createdAt).toLocaleString(),
        type: report.status === 'completed' ? 'success' : 'info'
      }));
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRecentActivities([{ message: 'Dashboard initialized', time: 'Just now', type: 'info' }]);
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
      <div className="bg-gradient-to-r from-purple-50 to-purple-50 p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-3xl font-bold text-gray-900 font-['Manrope'] mb-2">
          Company Admin Dashboard
        </h2>
        <p className="text-gray-700 text-lg">Welcome back! Here&apos;s an overview of your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="up"
          trendValue="+12% this month"
          bgColor="bg-purple-100"
          iconColor="text-[#7e22ce]"
          onClick={() => navigate('/company/user')}
        />
        <StatCard title="Total channel partners" value={stats.totalAgents} icon={Users} trend="up" trendValue="+5% this month" bgColor="bg-purple-100" iconColor="text-purple-600" />
        <StatCard title="Total User Reports" value={stats.totalReports} icon={FileText} trend="up" trendValue="+18% this month" bgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard title="My Reports" value={stats.myReports} icon={FileText} trend="up" trendValue="Company admin reports" bgColor="bg-yellow-100" iconColor="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />
        <PendingWithdrawals withdrawals={pendingWithdrawals} onApprove={handleApproveWithdrawal} onReject={handleRejectWithdrawal} />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 font-['Manrope'] mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-[#7e22ce] font-['Manrope']">{stats.pendingWithdrawals}</p>
            <p className="text-sm text-gray-600">Pending Withdrawals</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600 font-['Manrope']">{stats.totalReports}</p>
            <p className="text-sm text-gray-600">Active Reports</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600 font-['Manrope']">{stats.totalAgents}</p>
            <p className="text-sm text-gray-600">Active channel partners</p>
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

export default CompanyAdminDashboardPage;
