/**
 * Auth Page
 * Login and Registration Forms - Modern Design
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks';
import { setLeadAuth } from '../store/slices/leadAuthSlice';
import { setAuthData } from '../store/slices/authSlice';
import api from '../api/apiClient';
import finvoisLogo from '../assets/finvois.png';
import toast from 'react-hot-toast';
import { Mail, Phone, Send, ShieldCheck, Key } from 'lucide-react';
import { normalizeRoleFromUser, normalizeUserRole } from '../utils/normalizeUserRole';
import { resolveSignupApprovalStatus } from '../utils/signupApproval';
import { getVmStartUrl } from '../utils/env';
import { shouldSkipVmOnLogin } from '../utils/tunnel';

const AuthPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { login, googleLogin, register, logout, loading: authLoading, error, clearError } = useAuth();
  // Portal: 'staff' (credentials + register) | 'customer-otp'
  const [portalMode, setPortalMode] = useState('staff');
  const [activeTab, setActiveTab] = useState('login');
  const [isVmLoading, setIsVmLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [registerErrors, setRegisterErrors] = useState(null);
  const [registerStep, setRegisterStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Customer OTP portal state
  const [otpType, setOtpType] = useState('email'); // 'email' | 'phone'
  const [otpValue, setOtpValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loadingGoogleCustomer, setLoadingGoogleCustomer] = useState(false);

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

  // Check for referral code / portal mode in URL parameters
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setRegisterData(prev => ({ ...prev, referral_code: refCode }));
      setPortalMode('staff');
      setActiveTab('register'); // Switch to register tab
    }
    const portal = searchParams.get('portal');
    if (portal === 'customer' || portal === 'customer-otp') {
      setPortalMode('customer-otp');
    }
  }, [searchParams]);

  const startOtpTimer = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCustomerGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setLoadingGoogleCustomer(true);
    try {
      const res = await api.post('/customer/google-auth', { idToken });
      if (res.data?.success && res.data?.data) {
        const { token, user } = res.data.data;
        dispatch(setAuthData({ token, user }));
        toast.success('Login successful! Welcome back.');
        navigate('/customer/dashboard', { replace: true });
      } else {
        toast.error(res.data?.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Google authentication failed';
      toast.error(errorMsg);
    } finally {
      setLoadingGoogleCustomer(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpValue) {
      toast.error(`${otpType === 'email' ? 'Email' : 'Phone number'} is required`);
      return;
    }
    setLoadingOtp(true);
    try {
      const res = await api.post('/customer/login-send-otp', {
        type: otpType,
        value: otpValue.trim(),
      });
      if (res.data.success) {
        setOtpSent(true);
        startOtpTimer();
        toast.success(`Verification OTP code sent to your ${otpType}`);
      } else {
        toast.error(res.data.error || 'Failed to send OTP');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error sending OTP';
      toast.error(errorMsg);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtpLogin = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setLoadingOtp(true);
    try {
      const res = await api.post('/customer/login-verify-otp', {
        type: otpType,
        value: otpValue.trim(),
        otp: otpCode.trim(),
      });
      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        dispatch(setAuthData({ token, user }));
        toast.success('Login successful! Welcome back.');
        navigate('/customer/dashboard', { replace: true });
      } else {
        toast.error(res.data.error || 'Invalid verification code');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Verification failed';
      toast.error(errorMsg);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    if (isVmLoading || authLoading) return;

    try {
      setApiError(null);
      setRegisterErrors(null);
      setIsVmLoading(true);

      if (!shouldSkipVmOnLogin()) {
        const vmReady = await ensureVmReady();
        if (!vmReady) {
          toast.error('Server is taking too long to start. Please try again in 1 minute.');
          return;
        }
      }

      const result = await googleLogin(idToken);
      
      const loggedInUser = result?.data?.user;
      const userRole = loggedInUser
        ? normalizeRoleFromUser(loggedInUser)
        : 'user';
      const emailVerified = loggedInUser?.email_verified;
      const isActive = loggedInUser?.is_active;
      const approvalStatus = resolveSignupApprovalStatus(loggedInUser);

      if (emailVerified === false) {
        toast.error('Please verify your email address before logging in.');
        logout();
        return;
      }

      if (approvalStatus === 'pending') {
        toast.error('Your account is pending admin approval.');
        logout();
        return;
      }

      if (approvalStatus === 'rejected') {
        toast.error('Your registration was not approved. Please contact support.');
        logout();
        return;
      }

      if (isActive === false) {
        toast.error('Your account is disabled. Please contact support.');
        logout();
        return;
      }

      toast.success('Login successful!');

      if (userRole === 'company_user') {
        navigate('/company/user/dashboard', { replace: true });
      } else if (userRole === 'company_admin') {
        navigate('/company/dashboard', { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'agent') {
        navigate('/agent/dashboard', { replace: true });
      } else if (userRole === 'msme_dpr_viewer') {
        navigate('/msme-dpr-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google login error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Google login failed');
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVmLoading(false);
    }
  };

  // Google Sign-In Initialization
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      /* global google */
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId || String(googleClientId).includes('your-google-client-id')) {
        console.error(
          '[Google Sign-In] VITE_GOOGLE_CLIENT_ID is missing or still a placeholder. ' +
            'Set it in Render (or your host) env and rebuild the UI. ' +
            'It must match GOOGLE_CLIENT_ID on FINVOIS-DEV-API.'
        );
        return;
      }
      if (window.google) {
        if (portalMode === 'customer-otp') {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCustomerGoogleCredentialResponse,
          });
          const btn = document.getElementById('googleSignInButtonLoginCustomer');
          if (btn) {
            btn.innerHTML = '';
            window.google.accounts.id.renderButton(btn, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
            });
          }
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        if (activeTab === 'login') {
          const btn = document.getElementById('googleSignInButtonLogin');
          if (btn) {
            btn.innerHTML = '';
            window.google.accounts.id.renderButton(btn, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
            });
          }
        } else if (activeTab === 'register' && registerStep === 1) {
          const btn = document.getElementById('googleSignInButtonRegister');
          if (btn) {
            btn.innerHTML = '';
            window.google.accounts.id.renderButton(btn, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signup_with',
            });
          }
        }
      }
    };

    // Initialize immediately if script is loaded
    initializeGoogleSignIn();

    // Re-initialize when the GIS script finishes loading (if it loaded late)
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initializeGoogleSignIn);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initializeGoogleSignIn);
      }
    };
  }, [activeTab, registerStep, portalMode, otpSent]);

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
    const functionKey = import.meta.env.VITE_VM_FUNCTION_KEY;
    const res = await fetch(
      `https://vm-start-fn-afg5f0fpgpakcpe6.centralindia-01.azurewebsites.net/api/StartVm?code=${functionKey}`,
      { method: 'POST' }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'StartVm request failed');
    }
    console.log('Start VM Response:', data);
    return data;
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
        console.log('VM is running');
        return true;
      } else {
        console.log(`VM still starting (attempt ${attempt + 1})`);
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

      if (!shouldSkipVmOnLogin()) {
        const vmReady = await ensureVmReady();
        if (!vmReady) {
          toast.error('Server is taking too long to start. Please try again in 1 minute.');
          return;
        }
      }

      // Single unified login call — backend handles all user types
      let result;
      try {
        result = await login(loginData);
      } catch (loginErr) {
        // 401 from backend (invalid credentials for all user types)
        const errorMsg = typeof loginErr === 'string' ? loginErr : (loginErr?.message || 'Invalid credentials');
        setApiError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Lead partner — backend returned userType: 'lead'
      if (result?.userType === 'lead') {
        const { token, lead } = result;
        dispatch(setLeadAuth({ token, lead }));
        toast.success('Login successful!');
        if (lead?.passwordResetRequired) {
          navigate('/reset-password', { state: { resetToken: token }, replace: true });
        } else {
          navigate('/lead/dashboard', { replace: true });
        }
        return;
      }

      // Platform user — route by role
      const loggedInUser = result?.data?.user || (result?.role ? { role: result.role } : null);
      const userRole = loggedInUser
        ? normalizeRoleFromUser(loggedInUser)
        : normalizeUserRole(result?.role);
      const emailVerified = result?.data?.user?.email_verified;
      const isActive = result?.data?.user?.is_active;
      const approvalStatus = resolveSignupApprovalStatus(result?.data?.user);

      if (emailVerified === false) {
        toast.error('Please verify your email address before logging in.');
        logout();
        return;
      }
      if (approvalStatus === 'pending') {
        toast.error('Your account is pending admin approval.');
        logout();
        return;
      }
      if (approvalStatus === 'rejected') {
        toast.error('Your registration was not approved. Please contact support.');
        logout();
        return;
      }
      if (isActive === false) {
        toast.error('Your account is disabled. Please contact support.');
        logout();
        return;
      }

      toast.success('Login successful!');

      if (userRole === 'company_user') {
        navigate('/company/user/dashboard', { replace: true });
      } else if (userRole === 'company_admin') {
        navigate('/company/dashboard', { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'agent') {
        navigate('/agent/dashboard', { replace: true });
      } else if (userRole === 'msme_dpr_viewer') {
        navigate('/msme-dpr-dashboard', { replace: true });
      } else if (userRole === 'department') {
        navigate('/department/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Login failed');
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVmLoading(false);
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
      toast.success(
        'Registration successful! Please verify your email. After verification, an admin will review your account before you can log in.'
      );
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
            {portalMode === 'staff' && (
              activeTab === 'login' ? (
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
              )
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
        <div className={`w-full ${portalMode === 'staff' && activeTab === 'register' ? 'max-w-3xl' : 'max-w-md'} items-center relative z-10 transition-all duration-300`}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">
            {/* Brand + portal selector */}
            <div className="flex flex-col items-center mb-6">
              <img src={finvoisLogo} alt="Finvois Logo" className="h-12 mb-3 object-contain" />
              <h1 className="text-xl font-bold text-gray-900 tracking-tight font-['Manrope']">Finvois Portal</h1>
              <p className="text-gray-500 text-sm mt-1 font-['Inter']">Select your access portal below</p>
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6 border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setPortalMode('staff');
                  setOtpSent(false);
                  setOtpValue('');
                  setOtpCode('');
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all font-['Inter'] ${
                  portalMode === 'staff'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Staff Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalMode('customer-otp');
                  setActiveTab('login');
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all font-['Inter'] ${
                  portalMode === 'customer-otp'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer OTP Portal
              </button>
            </div>

            {portalMode === 'staff' && (
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
            )}

            {/* Login Form */}
            {portalMode === 'staff' && activeTab === 'login' && (
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

                <p className="text-center text-sm text-gray-500 mt-4 font-['Inter']">
                  Sales team?{' '}
                  <Link to="/crm/login" className="text-violet-600 hover:text-violet-700 font-medium">
                    CRM Portal →
                  </Link>
                </p>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-['Inter']">Or continue with</span>
                  </div>
                </div>

                <div id="googleSignInButtonLogin" className="w-full flex justify-center"></div>
              </form>
            )}

            {/* Register Form - Two Step */}
            {portalMode === 'staff' && activeTab === 'register' && (
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

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500 font-['Inter']">Or sign up with</span>
                      </div>
                    </div>

                    <div id="googleSignInButtonRegister" className="w-full flex justify-center"></div>
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

            {/* Customer OTP Portal */}
            {portalMode === 'customer-otp' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">Customer OTP Login</h2>
                  <p className="text-gray-600 text-sm font-['Inter'] mt-1">
                    Sign in with email or WhatsApp OTP
                  </p>
                </div>

                {loadingGoogleCustomer && (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <p className="text-xs text-gray-500">Authenticating with Google...</p>
                  </div>
                )}

                <div className={loadingGoogleCustomer ? 'opacity-40 pointer-events-none' : ''}>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setOtpType('email'); setOtpValue(''); }}
                          className={`flex-1 py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all font-['Inter'] ${
                            otpType === 'email'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Mail size={14} /> Email OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOtpType('phone'); setOtpValue(''); }}
                          className={`flex-1 py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all font-['Inter'] ${
                            otpType === 'phone'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Phone size={14} /> WhatsApp OTP
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          {otpType === 'email' ? 'Registered Email Address' : 'WhatsApp Phone Number'}
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            {otpType === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                          </span>
                          <input
                            type={otpType === 'email' ? 'email' : 'tel'}
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value)}
                            placeholder={otpType === 'email' ? 'yourname@example.com' : 'e.g. +919999999999'}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingOtp}
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 font-['Manrope']"
                      >
                        <Send size={14} />
                        {loadingOtp ? 'Sending...' : 'Send Verification OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
                      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center">
                        <p className="text-sm text-gray-700 font-['Inter']">
                          We sent a verification code to <span className="text-purple-700 font-semibold">{otpValue}</span>.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(''); }}
                          className="text-xs text-purple-600 hover:text-purple-700 underline mt-2 font-medium"
                        >
                          Change email/phone number
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                          Enter 6-Digit OTP Code
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Key size={16} />
                          </span>
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="e.g. 123456"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingOtp}
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 font-['Manrope']"
                      >
                        <ShieldCheck size={16} />
                        {loadingOtp ? 'Verifying...' : 'Verify & Log In'}
                      </button>

                      <div className="text-center pt-1">
                        {countdown > 0 ? (
                          <span className="text-xs text-gray-500">Resend code in {countdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                          >
                            Resend Verification OTP
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {!otpSent && (
                    <>
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 bg-white text-gray-500 font-['Inter']">Or continue with</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-2 min-h-[56px]">
                        <div id="googleSignInButtonLoginCustomer" className="w-full flex justify-center"></div>
                        <p className="text-[11px] text-gray-500 text-center font-['Inter']">
                          Sign up or sign in securely with your Google Account.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
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

