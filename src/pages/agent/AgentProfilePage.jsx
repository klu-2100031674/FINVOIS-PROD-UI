import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Smartphone, 
  Save,
  Eye,
  EyeOff,
  Lock,
  Shield
} from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AgentProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch: '',
    upi_id: '',
    phone_pe_number: ''
  });

  const [upiDetails, setUpiDetails] = useState({
    upi_id: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [originalProfileData, setOriginalProfileData] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  const [originalBankDetails, setOriginalBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch: '',
    upi_id: '',
    phone_pe_number: ''
  });

  useEffect(() => {
    if (user) {
      const profileData = {
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
      };
      setProfileData(profileData);
      setOriginalProfileData(profileData);
      
      const bankDetails = {
        account_holder_name: '',
        account_number: '',
        bank_name: '',
        ifsc_code: '',
        branch: '',
        upi_id: '',
        phone_pe_number: '',
        ...(user.bank_details || {})
      };
      setBankDetails(bankDetails);
      setOriginalBankDetails(bankDetails);
      
      setUpiDetails(user.upi_details || {
        upi_id: ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleUpiChange = (e) => {
    const { name, value } = e.target;
    setUpiDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await api.put('/users/profile', profileData);
      
      // Fetch updated profile from server
      const profileResponse = await api.get('/users/profile');
      if (updateUser) {
        // Map phone to mobile for consistency
        const userData = profileResponse.data?.data || profileResponse.data;
        const mappedUserData = {
          ...userData,
          mobile: userData.phone || userData.mobile
        };
        updateUser(mappedUserData);
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
  };

  const handleSaveProfileChanges = async () => {
    await handleSaveProfile();
    setIsEditing(false);
  };

  const handleEditPayment = () => {
    setIsEditingPayment(true);
  };

  const handleCancelPaymentEdit = () => {
    setBankDetails(originalBankDetails);
    setIsEditingPayment(false);
  };

  const handleSavePaymentChanges = async () => {
    await handleSavePaymentDetails();
    setIsEditingPayment(false);
  };

  const handleSavePaymentDetails = async () => {
    try {
      setLoading(true);
      await api.put('/users/profile', {
        bank_details: bankDetails
      });
      
      // Fetch updated profile from server
      const profileResponse = await api.get('/users/profile');
      if (updateUser) {
        // Map phone to mobile for consistency
        const userData = profileResponse.data?.data || profileResponse.data;
        const mappedUserData = {
          ...userData,
          mobile: userData.phone || userData.mobile
        };
        updateUser(mappedUserData);
      }
      
      toast.success('Payment details updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.patch('/users/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payment', label: 'Payment Details', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <AgentLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and payment details</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Agent
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1) || 'Active'}
              </span>
              {user?.referral_code && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Code: {user.referral_code}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="mobile"
                      value={profileData.mobile}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate
                  </label>
                  <input
                    type="text"
                    value={`${user?.commission_rate || 10}%`}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                {!isEditing ? (
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <User size={18} className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfileChanges}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} className="mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2 text-purple-600" />
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={bankDetails.account_holder_name}
                      onChange={handleBankChange}
                      disabled={!isEditingPayment}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter account holder name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={bankDetails.account_number}
                      onChange={handleBankChange}
                      disabled={!isEditingPayment}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={bankDetails.bank_name}
                      onChange={handleBankChange}
                      disabled={!isEditingPayment}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={bankDetails.ifsc_code}
                      onChange={handleBankChange}
                      disabled={!isEditingPayment}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={bankDetails.branch}
                      onChange={handleBankChange}
                      disabled={!isEditingPayment}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>

              {/* UPI Details */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Smartphone size={20} className="mr-2 text-purple-600" />
                  UPI Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upi_id"
                    value={bankDetails.upi_id}
                    onChange={handleBankChange}
                    disabled={!isEditingPayment}
                    className={`w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="example@upi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PhonePe Number
                  </label>
                  <input
                    type="text"
                    name="phone_pe_number"
                    value={bankDetails.phone_pe_number}
                    onChange={handleBankChange}
                    disabled={!isEditingPayment}
                    className={`w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      !isEditingPayment ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="Enter PhonePe number"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                {!isEditingPayment ? (
                  <button
                    onClick={handleEditPayment}
                    className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <CreditCard size={18} className="mr-2" />
                    Edit Payment Details
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelPaymentEdit}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePaymentChanges}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} className="mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Lock size={20} className="mr-2 text-purple-600" />
                  Change Password
                </h3>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-start pt-4 border-t border-gray-200">
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                  className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Lock size={18} className="mr-2" />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentProfilePage;
