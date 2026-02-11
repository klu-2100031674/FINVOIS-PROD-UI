import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  Filter,
  FileText
} from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AgentCommissionsPage = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [filteredCommissions, setFilteredCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    totalEarned: 0,
    thisMonth: 0,
    pending: 0,
    paid: 0
  });

  useEffect(() => {
    fetchCommissions();
  }, []);

  useEffect(() => {
    filterCommissions();
  }, [commissions, dateFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      // Fetch commissions from API
      const response = await api.get('/commissions');
      const commissionsData = response.data?.commissions || [];
      const summaryData = response.data?.summary || { total: 0, accrued: 0, paid: 0 };

      setCommissions(commissionsData);

      // Calculate stats from real data
      const totalEarned = summaryData.total;
      const paid = summaryData.paid;
      const pending = summaryData.accrued;

      const thisMonth = commissionsData
        .filter(c => {
          const date = new Date(c.createdAt);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, c) => sum + c.commission_amount, 0);

      setStats({ totalEarned, thisMonth, pending, paid });

    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Failed to fetch commission data');
    } finally {
      setLoading(false);
    }
  };

  const filterCommissions = () => {
    if (dateFilter === 'all') {
      setFilteredCommissions(commissions);
      return;
    }

    const now = new Date();
    let startDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        setFilteredCommissions(commissions);
        return;
    }

    const filtered = commissions.filter(c => new Date(c.createdAt) >= startDate);
    setFilteredCommissions(filtered);
  };

  const handleExportCSV = () => {
    if (filteredCommissions.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Referral', 'Report Type', 'Report Amount', 'Commission Rate', 'Commission Amount', 'Status'];
    const rows = filteredCommissions.map(c => [
      new Date(c.createdAt).toLocaleDateString(),
      c.user_id?.name || 'N/A',
      c.order_id?.pack_type || 'N/A',
      `₹${c.order_id?.amount_paid || 0}`,
      `${c.rate_percent}%`,
      `₹${c.commission_amount}`,
      c.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Report exported successfully');
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Commissions</h1>
          <p className="text-gray-500 mt-1">Track your earnings from referrals</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download size={18} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.totalEarned.toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.thisMonth.toLocaleString()}</p>
            </div>
            <Calendar className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹{stats.pending.toLocaleString()}</p>
            </div>
            <TrendingUp className="text-yellow-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid Out</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.paid.toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Commission Rate Info */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-4 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Your Commission Rate</p>
            <p className="text-3xl font-bold">{user?.commission_rate || 10}%</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Per Report Purchase</p>
            <p className="text-lg">You earn {user?.commission_rate || 10}% of the report value</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <span className="text-gray-500 text-sm">
            Showing {filteredCommissions.length} of {commissions.length} records
          </span>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredCommissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-4">No commission records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{commission.user_id?.name}</p>
                        <p className="text-xs text-gray-500">{commission.user_id?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-sm text-gray-700">
                        <FileText size={14} className="mr-1 text-gray-400" />
                        {commission.order_id?.pack_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ₹{commission.order_id?.amount_paid?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ₹{commission.commission_amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({commission.rate_percent}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        commission.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentCommissionsPage;
