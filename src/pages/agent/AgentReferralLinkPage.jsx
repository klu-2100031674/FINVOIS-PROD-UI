import React, { useState, useEffect } from 'react';
import { LinkIcon, Copy, Share2, Users, DollarSign } from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AgentReferralLinkPage = () => {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referred_users: 0,
    total_earned: 0,
    available_balance: 0
  });

  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode (development)
    if (profileFetched) return;
    
    const fetchProfile = async () => {
      try {
        // Fetch profile data
        const profileResponse = await api.get('/users/profile');
        if (profileResponse.data.success && profileResponse.data.data) {
          const userData = {
            ...profileResponse.data.data,
            mobile: profileResponse.data.data.phone || profileResponse.data.data.mobile
          };
          updateUser(userData);
        }

        // Fetch agent stats for commission data
        const statsResponse = await api.get('/users/agent-stats');
        if (statsResponse.data.success && statsResponse.data.data) {
          setStats({
            referred_users: statsResponse.data.data.referred_users || 0,
            total_earned: statsResponse.data.data.total_earned || 0,
            available_balance: statsResponse.data.data.available_balance || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    setProfileFetched(true);
  }, [profileFetched]); // Remove updateUser from dependencies

  const referralUrl = user?.referral_code
    ? `${window.location.origin}/auth?ref=${user.referral_code}`
    : '';

  const handleCopyLink = async () => {
    if (!referralUrl) {
      toast.error('Referral code not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    if (!user?.referral_code) {
      toast.error('Referral code not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(user?.referral_code || '');
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Join me on Credit Analysis Pro! Use my referral code: ${user?.referral_code}\n\nSign up here: ${referralUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareOnEmail = () => {
    const subject = 'Join Credit Analysis Pro with my referral';
    const body = `Hi,\n\nI've been using Credit Analysis Pro for credit analysis and thought you might find it useful too.\n\nUse my referral code: ${user?.referral_code}\n\nSign up here: ${referralUrl}\n\nBest regards,\n${user?.name}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Referral Link</h1>
          <p className="text-gray-500 mt-1">Share your referral link to earn commissions</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : !user?.referral_code ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Referral Code Not Available</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your referral code is being generated. Please refresh the page or contact support if this persists.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Referral Code Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <LinkIcon size={24} />
                  <div>
                    <p className="text-white/80 text-sm">Your Referral Code</p>
                    <p className="text-2xl font-bold">{user?.referral_code}</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Copy size={16} />
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Referral Link */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-2">Referral Link</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="flex-1 bg-white/20 text-white placeholder-white/50 rounded px-3 py-2 text-sm"
                  />
                  <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="text-green-500" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Commission Structure</h3>
              <p className="text-gray-500 text-sm">Earn {user?.commission_rate || 10}% commission on every report purchased by your referrals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="text-blue-500 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">{stats.referred_users}</p>
              <p className="text-sm text-gray-500">Total Referrals</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="text-green-500 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">₹{stats.total_earned.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Earnings</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="text-purple-500 mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">₹{stats.available_balance.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Available Balance</p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Your Referral Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Share2 size={20} />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={shareOnEmail}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Share2 size={20} />
              <span>Share via Email</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How it works</h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• Share your referral link or code with potential users</li>
            <li>• When they sign up and purchase reports, you earn commission</li>
            <li>• Commission rate: {user?.commission_rate || 10}% of report value</li>
            <li>• Withdraw your earnings once they reach the minimum threshold</li>
          </ul>
        </div>
          </>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentReferralLinkPage;