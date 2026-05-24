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
  Save,
  Mail,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Gift,
  Handshake
} from 'lucide-react';
import ClientLayout from '../components/layouts/ClientLayout';
import { formatRoleForDisplay } from '../utils/roleDisplay';
import { companyAPI } from '../api/endpoints';

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
    company_logo: '',
    village_city: '',
    mandal: '',
    district: '',
    state: '',
    designation: '',
    designation_other: '',
    organization_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [companyBranding, setCompanyBranding] = useState({
    apLogoUrl: '',
    companyLogoUrl: ''
  });
  const dataSource = profile || user;
  const companyLogo1 =
    dataSource?.apLogoDisplayUrl ||
    dataSource?.apLogoUrl ||
    companyBranding.apLogoUrl ||
    '';
  const companyLogo2 =
    dataSource?.companyLogoDisplayUrl ||
    dataSource?.companyLogoUrl ||
    companyBranding.companyLogoUrl ||
    formData.company_logo ||
    '';
  const companyIdValue =
    dataSource?.companyId?._id ||
    dataSource?.companyId?.id ||
    dataSource?.companyId ||
    '';
  const displayRole = formatRoleForDisplay(dataSource?.role || 'user', dataSource);
  const freeCredits = Number(dataSource?.free_reports_count || 0);
  const referringAgent = dataSource?.referring_agent || null;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    dispatch(fetchProfile());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    if (dataSource) {
      setFormData({
        name: dataSource.name || '',
        company_name: dataSource.company_name || '',
        phone: dataSource.phone || '',
        address: dataSource.address || '',
        profile_logo: dataSource.profile_logo || '',
        company_logo: dataSource.company_logo || '',
        village_city: dataSource.village_city || '',
        mandal: dataSource.mandal || '',
        district: dataSource.district || '',
        state: dataSource.state || '',
        designation: dataSource.designation || '',
        designation_other: dataSource.designation_other || '',
        organization_name: dataSource.organization_name || ''
      });
    }
  }, [user, profile, dataSource]);

  useEffect(() => {
    const loadCompanyBranding = async () => {
      if (!companyIdValue) return;
      if (companyLogo1 && companyLogo2) return;
      try {
        const response = await companyAPI.getCompanyById(companyIdValue);
        const company = response?.data || {};
        setCompanyBranding({
          apLogoUrl: company.apLogoDisplayUrl || company.apLogoUrl || '',
          companyLogoUrl: company.companyLogoDisplayUrl || company.companyLogoUrl || ''
        });
      } catch (err) {
        // Keep UI graceful; logos can still render from profile fields when available.
        setCompanyBranding({ apLogoUrl: '', companyLogoUrl: '' });
      }
    };
    loadCompanyBranding();
  }, [companyIdValue, companyLogo1, companyLogo2]);

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

  if (loading && !profile) {
    return (
      <ClientLayout>
        <div className="flex justify-center py-24">
          <Loading text="Loading profile..." />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="py-4 sm:py-6">
        <h1 className="text-xl font-bold text-gray-900 font-manrope mb-6">Profile settings</h1>
        {freeCredits > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-purple-50 border border-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-purple-100">
                <Gift className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Free Credits Available</p>
                <p className="text-xl font-bold text-purple-800">{freeCredits}</p>
              </div>
            </div>
          </div>
        )}
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
                <label className="absolute bottom-0 right-0 p-2 bg-[#7e22ce] text-white rounded-full cursor-pointer hover:bg-[#6b21a8] transition-all shadow-lg hover:scale-105">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload('profile_logo')} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name || 'User Name'}</h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                  {displayRole}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                  Active
                </span>
              </div>
            </div>

            {referringAgent && (
              <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Handshake className="w-5 h-5 text-purple-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Your channel partner</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                    <p className="font-medium text-gray-800">{referringAgent.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <p className="font-medium text-gray-800 break-all">{referringAgent.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                    <p className="font-medium text-gray-800">
                      {referringAgent.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Menu (Desktop) */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 hidden lg:block">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'personal'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <User className="w-4 h-4" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'company'
                    ? 'bg-purple-50 text-purple-700'
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
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                          <select
                            name="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent transition-all bg-white appearance-none"
                          >
                            <option value="">Select Designation</option>
                            <option value="CA">CA (Chartered Accountant)</option>
                            <option value="Bank Manager">Bank Manager</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Industry Officer">Industry Officer</option>
                            <option value="DSA">DSA (Direct Selling Agent)</option>
                            <option value="Field Staff">Field Staff</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>
                        {formData.designation === 'Others' && (
                          <input
                            type="text"
                            name="designation_other"
                            value={formData.designation_other}
                            onChange={handleInputChange}
                            placeholder="Please specify your designation"
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent transition-all"
                          />
                        )}
                      </div>
                      <Input
                        label="Organization Name"
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Finvois Solutions Pvt Ltd"
                        icon={Building2}
                      />
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Location</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Village / City"
                          name="village_city"
                          value={formData.village_city}
                          onChange={handleInputChange}
                          placeholder="Enter village or city"
                          icon={MapPin}
                        />
                        <Input
                          label="Mandal"
                          name="mandal"
                          value={formData.mandal}
                          onChange={handleInputChange}
                          placeholder="Enter mandal"
                          icon={MapPin}
                        />
                        <Input
                          label="District"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="Enter district"
                          icon={MapPin}
                        />
                        <Input
                          label="State"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Enter state"
                          icon={MapPin}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Info Tab */}
                {activeTab === 'company' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <Input
                        label="Company ID"
                        name="company_id"
                        value={companyIdValue}
                        placeholder="Not available"
                        icon={Building2}
                        disabled
                      />
                      <Input
                        label="Company Name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Finvois Solutions Pvt Ltd"
                        icon={Building2}
                        disabled
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Logo 1</label>
                          <div className="h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {companyLogo1 ? (
                              <img src={companyLogo1} alt="Logo 1" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-sm text-gray-400">Logo 1 not available</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">Logo 2</label>
                          <div className="h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {companyLogo2 ? (
                              <img src={companyLogo2} alt="Logo 2" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-sm text-gray-400">Logo 2 not available</span>
                            )}
                          </div>
                        </div>
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
    </ClientLayout>
  );
};

export default ProfilePage;