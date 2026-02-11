import React, { useEffect, useState } from 'react';
import { 
  Users, 
  DollarSign, 
  FileText,
  TrendingUp,
  ArrowUpRight,
  Copy,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, bgColor = 'bg-purple-500' }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            <ArrowUpRight size={16} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`${bgColor} p-3 rounded-full`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

const ReferralCard = ({ referralCode, onCopy }) => (
  <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white">
    <h3 className="text-lg font-semibold mb-2">Your Referral Code</h3>
    <div className="flex items-center justify-between bg-white/20 rounded-lg p-4">
      <span className="text-2xl font-bold tracking-wider">{referralCode || 'N/A'}</span>
      <button
        onClick={onCopy}
        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        title="Copy referral code"
      >
        <Copy size={20} />
      </button>
    </div>
    <p className="text-sm text-white/80 mt-3">
      Share this code with users to earn commission on their purchases
    </p>
  </div>
);

const RecentReferrals = ({ referrals }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Referrals</h3>
    {referrals.length === 0 ? (
      <p className="text-gray-500 text-sm text-center py-4">No referrals yet. Share your referral code to get started!</p>
    ) : (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {referrals.slice(0, 10).map((referral, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                {referral.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{referral.name || 'User'}</p>
                <p className="text-xs text-gray-500">{referral.email}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PendingWithdrawals = ({ withdrawals }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Withdrawal Requests</h3>
    {withdrawals.length === 0 ? (
      <p className="text-gray-500 text-sm text-center py-4">No withdrawal requests yet</p>
    ) : (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {withdrawals.slice(0, 10).map((withdrawal) => (
          <div key={withdrawal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">₹{withdrawal.amount?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
              withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
              withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AgentDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    withdrawnAmount: 0
  });
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode (development)
    if (dataFetched) return;
    
    fetchDashboardData();
    setDataFetched(true);
    
    // Refresh data every 2 minutes only when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 120000);
    
    return () => clearInterval(interval);
  }, [dataFetched]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch referrals
      try {
        const referralsResponse = await api.get('/users/my-referrals');
        console.log('Referrals response:', referralsResponse.data);
        const referralsList = referralsResponse.data?.data?.users || [];
        console.log('Referrals list:', referralsList);
        setReferrals(referralsList);
        
        setStats(prev => ({
          ...prev,
          totalReferrals: referralsList.length
        }));
      } catch (error) {
        console.error('Error fetching referrals:', error);
      }

      // Fetch withdrawals
      try {
        const withdrawalsResponse = await api.get('/withdrawals');
        console.log('Withdrawals response:', withdrawalsResponse.data);
        const withdrawalsList = withdrawalsResponse.data?.data?.withdrawals || [];
        console.log('Withdrawals list:', withdrawalsList);
        setWithdrawals(withdrawalsList);
        
        const withdrawnAmount = withdrawalsList
          .filter(w => w.status === 'completed')
          .reduce((sum, w) => sum + (w.amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          withdrawnAmount
        }));
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      }

      // Fetch agent stats
      try {
        const statsResponse = await api.get('/users/agent-stats');
        const agentStats = statsResponse.data?.data || {};
        
        setStats({
          totalReferrals: agentStats.referred_users || 0,
          totalCommissions: agentStats.total_earned || 0,
          availableBalance: agentStats.available_balance || 0,
          pendingCommissions: agentStats.pending_withdrawal || 0,
          withdrawnAmount: agentStats.total_withdrawn || 0
        });
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleCopyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agent Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name || 'Agent'}! Here's your overview.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Referral Code Card */}
      <div className="mb-8">
        <ReferralCard 
          referralCode={user?.referral_code} 
          onCopy={handleCopyReferralCode}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals}
          icon={Users}
          trend="up"
          trendValue="+2 this week"
          bgColor="bg-purple-500"
        />
        <StatCard
          title="Total Commissions"
          value={`₹${stats.totalCommissions.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="+15% this month"
          bgColor="bg-green-500"
        />
        <StatCard
          title="Pending Balance"
          value={`₹${stats.pendingCommissions.toLocaleString()}`}
          icon={Clock}
          bgColor="bg-yellow-500"
        />
        <StatCard
          title="Total Withdrawn"
          value={`₹${stats.withdrawnAmount.toLocaleString()}`}
          icon={TrendingUp}
          bgColor="bg-blue-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentReferrals referrals={referrals} />
        <PendingWithdrawals withdrawals={withdrawals} />
      </div>

      {/* Commission Rate Info */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Commission Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{user?.commission_rate || 10}%</p>
            <p className="text-sm text-gray-600">Commission Rate</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">₹{stats.availableBalance.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Available Balance</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">₹{stats.totalCommissions.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Lifetime Earnings</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{stats.totalReferrals}</p>
            <p className="text-sm text-gray-600">Active Referrals</p>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboardPage;
