import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginLead, forgotLeadPassword } from '@/store/slices/leadAuthSlice';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const LeadLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.leadAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginLead({ email, password }));
    if (loginLead.fulfilled.match(result)) {
      const lead = result.payload.lead;
      if (lead?.passwordResetRequired) {
        navigate('/lead/reset-password', { state: { token: result.payload.token } });
      } else {
        navigate('/lead/dashboard');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const result = await dispatch(forgotLeadPassword({ email }));
    if (forgotLeadPassword.fulfilled.match(result)) {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7e22ce] shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Finvois</h1>
          <p className="text-sm text-gray-500 mt-1">Lead Partner Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {forgotMode ? (
            <>
              <div className="mb-6">
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Forgot password?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Reset link sent</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      Check your inbox at <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7e22ce] text-white py-2.5 rounded-lg hover:bg-[#6b21a8] disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
                <p className="text-sm text-gray-500 mt-1">Access your lead analytics dashboard</p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-sm text-[#7e22ce] hover:text-[#6b21a8] font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#7e22ce] text-white py-2.5 rounded-lg hover:bg-[#6b21a8] disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Finvois &copy; {new Date().getFullYear()} &mdash; Lead Partner Portal
        </p>
      </div>
    </div>
  );
};

export default LeadLoginPage;
