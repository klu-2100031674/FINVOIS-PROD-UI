/**
 * Shared profile + report stats logic for platform admin and company admin profile UIs.
 */
import { useEffect, useState, useCallback } from 'react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export function useAdminTierProfile(user, refreshUser) {
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin-reports/stats');
      setStats(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    fetchStats();
  }, [user, fetchStats]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/users/profile', {
        name: profileData.name,
        phone: profileData.phone
      });
      toast.success('Profile updated successfully');
      if (refreshUser) refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    profileData,
    setProfileData,
    stats,
    handleProfileUpdate
  };
}
