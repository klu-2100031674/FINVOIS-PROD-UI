import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetLeadPassword } from '@/store/slices/leadAuthSlice';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const LeadResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  // Token comes from location.state (post-login flow) or URL ?token= (forgot password email link)
  const token = location.state?.token || new URLSearchParams(location.search).get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength — must match backend validation in leadController.js
  const strength = {
    length:    newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number:    /[0-9]/.test(newPassword),
  };
  const allMet = Object.values(strength).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!allMet) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    const result = await dispatch(resetLeadPassword({ token, newPassword }));

    if (resetLeadPassword.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/lead/dashboard'), 2000);
    } else {
      setError(result.payload || 'Failed to reset password');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">Invalid or expired reset link</p>
          <p className="text-sm text-gray-500 mb-6">Please log in again to get a new reset link.</p>
          <button
            onClick={() => navigate('/auth')}
            className="text-[#7e22ce] hover:text-[#6b21a8] font-medium text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-500 mt-1">Set your new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create a new password</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your account requires a password update before you can continue.
            </p>
          </div>

          {success ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Password updated successfully</p>
                <p className="text-sm text-green-700 mt-0.5">Redirecting to your dashboard...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength indicators — only shown once the user starts typing */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'length',    label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter' },
                      { key: 'lowercase', label: 'One lowercase letter' },
                      { key: 'number',    label: 'One number' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {strength[key]
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          : <AlertCircle  className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                        <span className={`text-xs ${strength[key] ? 'text-green-600' : 'text-gray-400'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7e22ce] text-white py-2.5 rounded-lg hover:bg-[#6b21a8] disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadResetPasswordPage;
