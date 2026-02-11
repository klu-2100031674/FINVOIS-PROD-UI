import React, { useEffect, useState } from 'react';
import { Users, Search, Copy, Mail, Phone, Calendar } from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AgentReferralsPage = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [referrals, searchTerm]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/my-referrals');
      setReferrals(response.data?.data?.users || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  };

  const filterReferrals = () => {
    if (!searchTerm) {
      setFilteredReferrals(referrals);
      return;
    }

    const filtered = referrals.filter(referral =>
      referral.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.mobile?.includes(searchTerm)
    );
    setFilteredReferrals(filtered);
  };

  const handleCopyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Referrals</h1>
        <p className="text-gray-500 mt-1">View and manage all users you've referred</p>
      </div>

      {/* Referral Code Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Share Your Referral</h3>
            <p className="text-white/80 text-sm mt-1">
              Earn commission for every user who signs up with your code
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-3">
            <button
              onClick={handleCopyReferralCode}
              className="flex items-center justify-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Copy size={18} className="mr-2" />
              Copy Code: {user?.referral_code}
            </button>
            <button
              onClick={handleCopyReferralLink}
              className="flex items-center justify-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Copy size={18} className="mr-2" />
              Copy Referral Link
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-800">{referrals.length}</p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {referrals.filter(r => r.is_active !== false).length}
              </p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {referrals.filter(r => {
                  const date = new Date(r.createdAt);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search referrals by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-4">
              {searchTerm ? 'No referrals found matching your search' : 'No referrals yet. Share your referral code to get started!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReferrals.map((referral) => (
              <div key={referral._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-lg">
                      {referral.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{referral.name || 'User'}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-sm text-gray-500">
                          <Mail size={14} className="mr-1" />
                          {referral.email}
                        </span>
                        {referral.mobile && (
                          <span className="flex items-center text-sm text-gray-500">
                            <Phone size={14} className="mr-1" />
                            {referral.mobile}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      referral.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {referral.status?.charAt(0).toUpperCase() + referral.status?.slice(1) || 'Active'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination placeholder */}
      {filteredReferrals.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredReferrals.length} referrals
          </p>
        </div>
      )}
    </AgentLayout>
  );
};

export default AgentReferralsPage;
