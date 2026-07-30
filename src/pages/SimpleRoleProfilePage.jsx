/**
 * Lightweight profile for department and msme_dpr_viewer roles.
 * Personal info + shared password / Google linking.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Save, LogOut, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks';
import { apiClient } from '../api/api';
import { ProfileSecuritySection } from '../components/common';
import { dashboardHomePath } from '../utils/routePaths';
import { formatRoleForDisplay } from '../utils/roleDisplay';
import finvoisLogo from '../assets/finvois.png';

const SimpleRoleProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [profileUser, setProfileUser] = useState(user);

  const homePath = dashboardHomePath(user);
  const roleLabel = formatRoleForDisplay(user?.role || 'user', user);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const data = res.data?.data || res.data || {};
        setProfileUser(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || data.mobile || '',
          email: data.email || ''
        });
      } catch {
        setFormData({
          name: user?.name || '',
          phone: user?.phone || user?.mobile || '',
          email: user?.email || ''
        });
        setProfileUser(user);
      }
    };
    load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put('/users/profile', {
        name: formData.name,
        phone: formData.phone
      });
      toast.success('Profile updated successfully');
      if (refreshUser) await refreshUser();
      const res = await apiClient.get('/users/profile');
      setProfileUser(res.data?.data || res.data || profileUser);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={finvoisLogo} alt="Finvois" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={homePath}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and sign-in options</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User size={20} />
              Personal Information
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <ProfileSecuritySection
          user={profileUser || user}
          onUpdated={refreshUser}
          variant="card"
        />
      </main>
    </div>
  );
};

export default SimpleRoleProfilePage;
