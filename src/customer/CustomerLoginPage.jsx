import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks';
import { setAuthData } from '../store/slices/authSlice';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { Mail, Lock, Phone, MessageSquare, Send, ShieldCheck, Key } from 'lucide-react';
import finvoisLogo from '../assets/finvois.png';
import { dashboardHomePath } from '../utils/routePaths';
import { normalizeRoleFromUser } from '../utils/normalizeUserRole';

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();

  // Tabs: 'credentials' or 'customer-otp'
  const [activeTab, setActiveTab] = useState('credentials');
  
  // Credentials login state
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loadingCreds, setLoadingCreds] = useState(false);

  // OTP login state
  const [otpType, setOtpType] = useState('email'); // 'email' | 'phone'
  const [otpValue, setOtpValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Google login state
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const startTimer = () => {
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

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setLoadingGoogle(true);
    try {
      const res = await api.post('/customer/google-auth', {
        idToken,
      });

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
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'customer-otp') return;

    const initializeGoogleSignIn = () => {
      /* global google */
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId || String(googleClientId).includes('your-google-client-id')) {
        console.warn(
          '[Google Sign-In] VITE_GOOGLE_CLIENT_ID is missing or still a placeholder.'
        );
        return;
      }
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        const btn = document.getElementById('googleSignInButtonLoginCustomer');
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            width: 320,
          });
        }
      }
    };

    initializeGoogleSignIn();

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initializeGoogleSignIn);
    }

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.removeEventListener('load', initializeGoogleSignIn);
      }
    };
  }, [activeTab]);

  // Handle Credentials Login
  const handleCredsLogin = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoadingCreds(true);
    try {
      const result = await login(credentials);
      toast.success('Welcome back!');
      
      const loggedInUser = result?.data?.user;
      const userRole = normalizeRoleFromUser(loggedInUser);
      navigate(dashboardHomePath(loggedInUser || { role: userRole }), { replace: true });
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Invalid email or password');
      toast.error(errorMsg);
    } finally {
      setLoadingCreds(false);
    }
  };

  // Handle Send OTP
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
        value: otpValue.trim()
      });

      if (res.data.success) {
        setOtpSent(true);
        startTimer();
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

  // Handle Verify OTP & Login
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
        otp: otpCode.trim()
      });

      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        
        // Dispatch setAuthData to Redux store
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={finvoisLogo} alt="Finvois Logo" className="h-12 mb-3 object-contain" />
          <h1 className="text-xl font-bold text-white tracking-tight font-['Manrope']">Finvois Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Select your access portal below</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => { setActiveTab('credentials'); setOtpSent(false); setOtpValue(''); setOtpCode(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'credentials'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff Login
          </button>
          <button
            onClick={() => { setActiveTab('customer-otp'); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'customer-otp'
                ? 'bg-purple-900/80 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Customer OTP Portal
          </button>
        </div>

        {/* TAB 1: Credentials Login */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredsLogin} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/80 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-slate-700 outline-none transition-all focus:ring-1 focus:ring-slate-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-slate-700 outline-none transition-all focus:ring-1 focus:ring-slate-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingCreds}
              className="w-full py-3 bg-white text-slate-950 font-semibold rounded-xl text-sm hover:bg-slate-100 transition-all shadow-md disabled:opacity-50 mt-2 font-['Manrope']"
            >
              {loadingCreds ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB 2: Customer OTP Login */}
        {activeTab === 'customer-otp' && (
          <div className="space-y-4">
            {loadingGoogle && (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="text-xs text-slate-400">Authenticating with Google...</p>
              </div>
            )}

            <div className={loadingGoogle ? 'opacity-40 pointer-events-none' : ''}>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {/* Method selector */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setOtpType('email'); setOtpValue(''); }}
                        className={`flex-1 py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                          otpType === 'email'
                            ? 'border-purple-500/50 bg-purple-950/20 text-purple-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <Mail size={14} /> Email OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtpType('phone'); setOtpValue(''); }}
                        className={`flex-1 py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                          otpType === 'phone'
                            ? 'border-purple-500/50 bg-purple-950/20 text-purple-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <Phone size={14} /> WhatsApp OTP
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1">
                        {otpType === 'email' ? 'Registered Email Address' : 'WhatsApp Phone Number'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          {otpType === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                        </span>
                        <input
                          type={otpType === 'email' ? 'email' : 'tel'}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          placeholder={otpType === 'email' ? 'yourname@example.com' : 'e.g. +919999999999'}
                          className="w-full bg-slate-950/80 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 outline-none transition-all focus:ring-1 focus:ring-purple-500/50"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingOtp}
                      className="w-full py-3 bg-purple-800 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2 font-['Manrope']"
                    >
                      <Send size={14} />
                      {loadingOtp ? 'Sending...' : 'Send Verification OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
                    <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded-xl text-center">
                      <p className="text-xs text-slate-300">
                        We sent a verification code to <span className="text-purple-300 font-semibold">{otpValue}</span>.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline mt-2 font-medium"
                      >
                        Change email/phone number
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Key size={16} />
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full bg-slate-950/80 border border-slate-850 rounded-xl pl-10 pr-4 py-3 text-sm text-white tracking-widest text-center placeholder-slate-600 focus:border-purple-500/50 outline-none transition-all focus:ring-1 focus:ring-purple-500/50 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingOtp}
                      className="w-full py-3 bg-purple-800 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2 font-['Manrope']"
                    >
                      <ShieldCheck size={16} />
                      {loadingOtp ? 'Verifying...' : 'Verify & Log In'}
                    </button>

                    {/* Resend OTP button */}
                    <div className="text-center pt-2">
                      {countdown > 0 ? (
                        <span className="text-xs text-slate-500">Resend code in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          Resend Verification OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {!otpSent && (
                  <>
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">or</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-2 relative min-h-[56px]">
                      <div id="googleSignInButtonLoginCustomer" className="w-full flex justify-center"></div>
                      <p className="text-[10px] text-slate-500 text-center">
                        Sign up or sign in securely with your Google Account.
                      </p>
                    </div>
                  </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoginPage;
