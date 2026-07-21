import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, selectProfile, selectUserLoading } from '../store/slices/userSlice';
import ClientLayout from '../components/layouts/ClientLayout';
import { User, Mail, Phone, Save, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerProfilePage = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectUserLoading);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSaving(true);
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto py-6 font-['Inter']">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-['Manrope'] mb-2">My Profile</h1>
          <p className="text-gray-600 text-sm">View and manage your personal account registration information.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Accent Header Banner */}
          <div className="h-28 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-end p-6">
            <div className="flex items-center gap-4 translate-y-8">
              <div className="w-18 h-18 rounded-full border-4 border-white bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-3xl flex items-center justify-center shadow-md">
                {formData.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="pt-2.5">
                <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">{formData.name || 'Customer'}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  Customer Account
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 pt-14 space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Email Field (Read-only for security) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none cursor-not-allowed text-sm font-medium"
                  disabled
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert size={12} /> Contact customer support to request email changes.
              </p>
            </div>

            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mobile Number (WhatsApp)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9999999999"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 text-sm font-['Manrope']"
              >
                <Save size={16} />
                {saving ? 'Saving changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ClientLayout>
  );
};

export default CustomerProfilePage;
