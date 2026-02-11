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
  const { login, register, loading: authLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [isVmLoading, setIsVmLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [registerErrors, setRegisterErrors] = useState(null);

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

  /**
   * Start Azure VM before login
   */
  async function startVm() {
    try {
      // Use the function key from env or placeholder
      const functionKey = import.meta.env.VITE_VM_FUNCTION_KEY || "YOUR_FUNCTION_KEY";
      const res = await fetch(
        `https://vm-start-fn-afg5f0fpgpakcpe6.centralindia-01.azurewebsites.net/api/StartVm?code=${functionKey}`,
        { method: "POST" }
      );

      const data = await res.json();
      console.log("Start VM Response:", data);
      return data; // { status: "starting" | "running" }
    } catch (err) {
      console.error("Failed to start VM:", err);
      throw err;
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isVmLoading || authLoading) return;

    try {
      setApiError(null);
      setIsVmLoading(true);

      let isReady = false;
      let retries = 0;
      const maxRetries = 10;

      while (!isReady && retries < maxRetries) {
        try {
          const vmResponse = await startVm();

          if (vmResponse.status === 'running') {
            isReady = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 10000));
            retries++;
          }
        } catch (vmErr) {
          console.error('❌ Connection failed, retrying...', vmErr);
          await new Promise(resolve => setTimeout(resolve, 10000));
          retries++;
        }
      }


      if (!isReady) {
        toast.error('Server is taking too long to start. Please try again in 1 minute.');
        setIsVmLoading(false);
        return;
      }

      setIsVmLoading(false);
      console.log('✅ VM is running. Proceeding to login...');
      console.log('🔐 Attempting login with:', { email: loginData.email });
      const result = await login(loginData);
      console.log('✅ Login result:', result);

      // If API returned 200 but indicates failure, show its message
      if (result && (result.success === false || result.status === 'error')) {
        const apiMsg = result.message || result?.data?.message || 'Login failed';
        toast.error(apiMsg);
        return;
      }

      setApiError(null);
      toast.success('Login successful!');

      // Redirect based on user role
      const userRole = result?.data?.user?.role || result?.role;
      console.log('🔄 User role:', userRole);

      if (userRole === 'admin') {
        console.log('🔄 Redirecting to admin dashboard...');
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'agent') {
        console.log('🔄 Redirecting to agent dashboard...');
        navigate('/agent/dashboard', { replace: true });
      } else {
        console.log('🔄 Redirecting to user dashboard...');
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Login failed');
      // Show API error both as toast and inline
      setApiError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Clear previous errors
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
      await register(registerData);
      toast.success('Registration successful! Please check your email and verify your account before logging in.');
      setActiveTab('login');
      setRegisterData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        referral_code: '',
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
                  onClick={() => setActiveTab('register')}
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
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                  />
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

            {/* Register Form - Fields Side by Side */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name and Email - Side by Side */}
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

                {/* Phone and Role - Side by Side */}
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
                      <option value="user">User</option>
                      <option value="ca">CA Professional</option>
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

                {/* Password and Confirm Password - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Confirm your password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-['Inter']"
                    />
                  </div>
                </div>

                {(registerErrors || apiError || error) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-['Inter'] text-sm">
                    {typeof (registerErrors || apiError || error) === 'string'
                      ? (registerErrors || apiError || error)
                      : ((registerErrors || apiError || error).message || (registerErrors || apiError || error).error || 'Registration failed')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Manrope']"
                >
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-gray-600 text-sm mt-6 font-['Inter']">
            © 2024 Finvois. All rights reserved.
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

