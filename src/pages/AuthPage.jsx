/**
 * Auth Page
 * Login and Registration Forms - Modern Design
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks';
import finvoisLogo from '../assets/finvois.png';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, logout, loading: authLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [isVmLoading, setIsVmLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [registerErrors, setRegisterErrors] = useState(null);
  const [registerStep, setRegisterStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    referral_code: '',
    village_city: '',
    mandal: '',
    district: '',
    state: '',
    designation: '',
    designation_other: '',
    organization_name: '',
  });

  // Check for referral code in URL parameters
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setRegisterData(prev => ({ ...prev, referral_code: refCode }));
      setActiveTab('register'); // Switch to register tab
    }
  }, [searchParams]);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    clearError();
    setApiError(null);
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    clearError();
    setApiError(null);
    setRegisterErrors(null);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setRegisterErrors(null);
    const name = (registerData.name || '').trim();
    const email = (registerData.email || '').trim();
    const phone = (registerData.phone || '').trim();
    if (!name) {
      const msg = 'Please enter your full name.';
      setRegisterErrors(msg); toast.error(msg); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Please enter a valid email address.';
      setRegisterErrors(msg); toast.error(msg); return;
    }
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(phone)) {
      const msg = 'Please enter a valid phone number (7-15 digits).';
      setRegisterErrors(msg); toast.error(msg); return;
    }
    setRegisterStep(2);
  };

  /**
   * Start Azure VM before login
   */
  async function startVm() {
    try {
      // Skip calling the Azure Function in development or when explicitly disabled
      if (import.meta.env.DEV === true || import.meta.env.VITE_SKIP_VM_START === 'true') {
        console.log('Skipping StartVm call in development or per VITE_SKIP_VM_START');
        return { status: 'running' };
      }

      const functionKey = import.meta.env.VITE_VM_FUNCTION_KEY;
      const res = await fetch(
        `https://vm-start-fn-afg5f0fpgpakcpe6.centralindia-01.azurewebsites.net/api/StartVm?code=${functionKey}`,
        { method: 'POST' }
      );

      const data = await res.json();
      console.log('Start VM Response:', data);
      return data; // { status: "starting" | "running" }
    } catch (err) {
      console.error('Failed to start VM:', err);
      throw err;
    }
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const ensureVmReady = async () => {
    const maxRetries = 12;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await startVm();
        if (response?.status === 'running') {
          return true;
        } else {
          console.log(`VM still starting (attempt ${attempt + 1}), waiting before retrying`);
          await delay(10000);
        }
      } catch (vmErr) {
        console.error('VM readiness check failed, retrying...', vmErr);
        await delay(10000);
      }
    }
    return false;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isVmLoading || authLoading) return;

    try {
      setApiError(null);
      setIsVmLoading(true);

      const vmReady = await ensureVmReady();
      if (!vmReady) {
        toast.error('Server is taking too long to start. Please try again in 1 minute.');
        setIsVmLoading(false);
        return;
      }

      setIsVmLoading(false);
      const result = await login(loginData);

      if (result && (result.success === false || result.status === 'error')) {
        const apiMsg = result.message || result?.data?.message || 'Login failed';
        toast.error(apiMsg);
        return;
      }

      setApiError(null);

      const userRole = result?.data?.user?.role || result?.role;
      const emailVerified = result?.data?.user?.email_verified;
      const isActive = result?.data?.user?.is_active;

      if (emailVerified === false) {
        toast.error('Please verify your email address before logging in.');
        logout();
        return;
      }

      if (isActive === false) {
        toast.error('Your account is disabled. Please contact support.');
        logout();
        return;
      }

      toast.success('Login successful!');

      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'agent') {
        navigate('/agent/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Login failed');
      setApiError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setRegisterErrors(null);

    // Basic client-side validation
    const email = (registerData.email || '').trim();
    const phone = (registerData.phone || '').trim();
    const password = registerData.password || '';
    const confirmPassword = registerData.confirmPassword || '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Please enter a valid email address.';
      setRegisterErrors(msg);
      toast.error(msg);
      return;
    }

    const phoneRegex = /^\+?\d{7,15}$/; // allows optional + and 7-15 digits
    if (!phoneRegex.test(phone)) {
      const msg = 'Please enter a valid phone number (7-15 digits).';
      setRegisterErrors(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setRegisterErrors(msg);
      toast.error(msg);
      return;
    }

    // Require minimum 8 characters, at least one letter and one number
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(password)) {
      const msg = 'Password must be at least 8 characters and include at least one letter and one number.';
      setRegisterErrors(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsVmLoading(true);
      const vmReady = await ensureVmReady();
      if (!vmReady) {
        toast.error('Server is taking too long to start. Please try again in 1 minute.');
        setIsVmLoading(false);
        return;
      }

      setIsVmLoading(false);
      await register(registerData);
      toast.success('Registration successful! Please check your email and verify your account before logging in.');
      setActiveTab('login');
      setRegisterStep(1);
      setRegisterData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        referral_code: '',
        village_city: '',
        mandal: '',
        district: '',
        state: '',
        designation: '',
        designation_other: '',
        organization_name: '',
      });
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Registration failed');
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col from-purple-100 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Transparent Blurry Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-lg border-b border-white/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:cursor-pointer">
            <img
              src={finvoisLogo}
              alt="Finvois Logo"
              className="h-10 w-auto"
            />

          </div>

          <div className="text-gray-700 text-sm font-['Inter']">
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setActiveTab('register'); setRegisterStep(1); }}
                  className="text-purple-600 font-semibold hover:text-purple-700"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-purple-600 font-semibold hover:text-purple-700"
                >
                  Log
                  in
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Animated Background Blobs */}
      <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob"></div>
      <div className="absolute top-[-300px] left-1/3 w-[500px] h-[700px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute top-[-400px] right-[-100px] w-[500px] h-[700px] bg-yellow-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-4000"></div>

      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-8">
        {/* Changed max-w-md to max-w-2xl for register form */}
        <div className={`w-full ${activeTab === 'register' ? 'max-w-3xl' : 'max-w-md'} items-center relative z-10 transition-all duration-300`}>
          {/* Mobile Logo */}


          <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-['Manrope']">
                {activeTab === 'login' ? 'Log in to your account' : 'Create your account'}
              </h2>
              <p className="text-gray-600 font-['Inter'] mt-2">
                {activeTab === 'login'
                  ? 'Welcome back! Please enter your details.'
                  : 'Get started with your free account today.'}
              </p>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                    />
                    <button type="button" onClick={() => setShowLoginPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showLoginPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2 rounded" />
                    <span className="text-gray-600 font-['Inter']">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-purple-600 hover:text-purple-700 font-['Inter']">
                    Forgot password?
                  </Link>
                </div>

                {(apiError || error) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-['Inter'] text-sm">
                    {typeof (apiError || error) === 'string'
                      ? (apiError || error)
                      : ((apiError || error).message || (apiError || error).error || 'Login failed')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading || isVmLoading}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Manrope']"
                >
                  {authLoading || isVmLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : 'Log In'}
                </button>
              </form>
            )}

            {/* Register Form - Two Step */}
            {activeTab === 'register' && (
              <form onSubmit={registerStep === 1 ? handleNextStep : handleRegister} className="space-y-4">

                {/* Step Indicator */}
                <div className="flex items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-['Manrope'] ${registerStep > 1 ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                      {registerStep > 1 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : '1'}
                    </div>
                    <span className="text-sm font-medium text-gray-800 font-['Inter']">Account Info</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 mx-4"></div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-['Manrope'] ${registerStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      2
                    </div>
                    <span className={`text-sm font-medium font-['Inter'] ${registerStep >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>Professional & Location</span>
                  </div>
                </div>

                {/* ── Step 1: Basic Info ── */}
                {registerStep === 1 && (
                  <>
                    {/* Name and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={registerData.name}
                          onChange={handleRegisterChange}
                          placeholder="Enter your full name"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          placeholder="Enter your email"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                    </div>

                    {/* Phone and Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={registerData.phone}
                          onChange={handleRegisterChange}
                          placeholder="Enter your phone number"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Role
                        </label>
                        <select
                          name="role"
                          value={registerData.role}
                          onChange={handleRegisterChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        >
                          <option value="user">Finvois user</option>
                          {/* <option value="agent">Finvois channel partner</option> */}
                        </select>
                      </div>
                    </div>

                    {/* Referral Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                        Referral Code (Optional)
                      </label>
                      <input
                        type="text"
                        name="referral_code"
                        value={registerData.referral_code}
                        onChange={handleRegisterChange}
                        placeholder="Enter referral code"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                      />
                    </div>
                  </>
                )}

                {/* ── Step 2: Professional, Location & Password ── */}
                {registerStep === 2 && (
                  <>
                    {/* Designation and Organization Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Designation
                        </label>
                        <select
                          name="designation"
                          value={registerData.designation}
                          onChange={handleRegisterChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter'] bg-white"
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
                        {registerData.designation === 'Others' && (
                          <input
                            type="text"
                            name="designation_other"
                            value={registerData.designation_other}
                            onChange={handleRegisterChange}
                            placeholder="Please specify your designation"
                            className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          name="organization_name"
                          value={registerData.organization_name}
                          onChange={handleRegisterChange}
                          placeholder="e.g. Finvois Solutions Pvt Ltd"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                    </div>

                    {/* Village/City and Mandal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Village / City
                        </label>
                        <input
                          type="text"
                          name="village_city"
                          value={registerData.village_city}
                          onChange={handleRegisterChange}
                          placeholder="Enter village or city"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Mandal
                        </label>
                        <input
                          type="text"
                          name="mandal"
                          value={registerData.mandal}
                          onChange={handleRegisterChange}
                          placeholder="Enter mandal"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                    </div>

                    {/* District and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          District
                        </label>
                        <input
                          type="text"
                          name="district"
                          value={registerData.district}
                          onChange={handleRegisterChange}
                          placeholder="Enter district"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={registerData.state}
                          onChange={handleRegisterChange}
                          placeholder="Enter state"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                        />
                      </div>
                    </div>

                    {/* Password and Confirm Password with eye icons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            placeholder="Create a password"
                            required
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                          />
                          <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            placeholder="Confirm your password"
                            required
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showConfirmPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(registerErrors || apiError || error) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-['Inter'] text-sm">
                    {typeof (registerErrors || apiError || error) === 'string'
                      ? (registerErrors || apiError || error)
                      : ((registerErrors || apiError || error).message || (registerErrors || apiError || error).error || 'Registration failed')}
                  </div>
                )}

                {registerStep === 1 ? (
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl font-['Manrope'] flex items-center justify-center gap-2"
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setRegisterStep(1); setRegisterErrors(null); }}
                      className="flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all font-['Manrope'] flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading || isVmLoading}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Manrope']"
                    >
                      {authLoading || isVmLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          <p className="text-center text-gray-600 text-sm mt-6 font-['Inter']">
            © 2026 Finvois. All rights reserved.
          </p>
        </div>
      </div>

      {/* Add animation styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      ` }} />
    </div>
  );
};

export default AuthPage;

