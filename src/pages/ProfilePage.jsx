import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks';
import { fetchProfile, updateProfile, selectProfile, selectUserLoading, selectUserError } from '../store/slices/userSlice';
import { Button, Input, Loading } from '../components/common';
import toast from 'react-hot-toast';
import {
  User,
  Building2,
  Phone,
  MapPin,
  Camera,
  ArrowLeft,
  Save,
  Mail,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();

  const profile = useSelector(selectProfile);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    address: '',
    profile_logo: '',
    company_logo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    dispatch(fetchProfile());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    const dataSource = profile || user;
    if (dataSource) {
      setFormData({
        name: dataSource.name || '',
        company_name: dataSource.company_name || '',
        phone: dataSource.phone || '',
        address: dataSource.address || '',
        profile_logo: dataSource.profile_logo || '',
        company_logo: dataSource.company_logo || ''
      });
    }
  }, [user, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, [field]: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !profile) return <Loading fullScreen text="Loading profile..." />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 font-manrope">Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Sidebar - Profile Card */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4 group">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-100">
                  {formData.profile_logo ? (
                    <img src={formData.profile_logo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-6 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg hover:scale-105">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload('profile_logo')} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name || 'User Name'}</h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                  Free Plan
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                  Active
                </span>
              </div>
            </div>

            {/* Navigation Menu (Desktop) */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hidden lg:block">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'personal'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <User className="w-4 h-4" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'company'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Building2 className="w-4 h-4" />
                Company Details
              </button>
              <div className="h-px bg-gray-100 my-2" />
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed">
                <ShieldCheck className="w-4 h-4" />
                Security (Coming Soon)
              </button>
            </nav>
          </div>

          {/* Right Content - Forms */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <form onSubmit={handleSubmit}>

                {/* Personal Info Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? <Loading small white /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                        icon={User}
                        required
                      />
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 90142 21011"
                        icon={Phone}
                        type="tel"
                      />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={user?.email}
                            disabled
                            className="w-full pl-10 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email address cannot be changed</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Info Tab */}
                {activeTab === 'company' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? <Loading small white /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden">
                        {formData.company_logo ? (
                          <img src={formData.company_logo} alt="Company" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Company Logo</h4>
                        <p className="text-xs text-gray-500 mb-3">Recommended size: 400x400px</p>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                          <ArrowLeft className="w-3 h-3 rotate-90" />
                          Upload New Logo
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload('company_logo')} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <Input
                        label="Company Name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Finvois Solutions Pvt Ltd"
                        icon={Building2}
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Business Address</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter full business address"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile FAB Save Button */}
                <div className="fixed bottom-6 right-6 md:hidden">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loading small white /> : <Save className="w-6 h-6" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;