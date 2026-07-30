import React, { useCallback, useEffect, useId, useState } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/api';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Shared profile security: set/change password + link Google.
 * Used by all non-admin profile pages.
 *
 * @param {object} props
 * @param {object} [props.user] - user/profile with hasPassword, google_id, email
 * @param {() => void} [props.onUpdated] - called after password or Google link succeeds
 * @param {'default'|'card'|'flush'} [props.variant]
 */
const ProfileSecuritySection = ({ user, onUpdated, variant = 'default' }) => {
  const reactId = useId();
  const googleBtnId = `googleLinkButton-${reactId.replace(/:/g, '')}`;

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [authState, setAuthState] = useState({
    hasPassword: Boolean(user?.hasPassword),
    google_id: user?.google_id || null,
    email: user?.email || ''
  });

  const refreshAuthFlags = useCallback(async () => {
    try {
      const res = await apiClient.get('/users/profile');
      const data = res.data?.data || res.data || {};
      setAuthState({
        hasPassword: Boolean(data.hasPassword),
        google_id: data.google_id || null,
        email: data.email || user?.email || ''
      });
    } catch {
      setAuthState((prev) => ({
        hasPassword: Boolean(user?.hasPassword ?? prev.hasPassword),
        google_id: user?.google_id ?? prev.google_id,
        email: user?.email || prev.email
      }));
    }
  }, [user?.email, user?.google_id, user?.hasPassword]);

  useEffect(() => {
    refreshAuthFlags();
  }, [refreshAuthFlags]);

  useEffect(() => {
    setAuthState((prev) => ({
      hasPassword: user?.hasPassword !== undefined ? Boolean(user.hasPassword) : prev.hasPassword,
      google_id: user?.google_id !== undefined ? user.google_id : prev.google_id,
      email: user?.email || prev.email
    }));
  }, [user?.hasPassword, user?.google_id, user?.email]);

  const notifyUpdated = useCallback(() => {
    if (typeof onUpdated === 'function') onUpdated();
  }, [onUpdated]);

  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (authState.hasPassword && !passwordForm.current_password) {
      toast.error('Current password is required');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const payload = { new_password: passwordForm.new_password };
      if (authState.hasPassword) {
        payload.current_password = passwordForm.current_password;
      }
      const res = await apiClient.patch('/users/password', payload);
      toast.success(res.data?.message || 'Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setAuthState((prev) => ({ ...prev, hasPassword: true }));
      await refreshAuthFlags();
      notifyUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleGoogleLinkCredentialResponse = useCallback(
    async (response) => {
      const idToken = response?.credential;
      if (!idToken) {
        toast.error('Google sign-in did not return a credential');
        return;
      }
      setLinkError(null);
      try {
        await apiClient.post('/users/link-google', { idToken });
        toast.success('Google account linked successfully!');
        setAuthState((prev) => ({ ...prev, google_id: prev.google_id || 'linked' }));
        await refreshAuthFlags();
        notifyUpdated();
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Google linking failed';
        setLinkError(msg);
        toast.error(msg);
      }
    },
    [notifyUpdated, refreshAuthFlags]
  );

  useEffect(() => {
    if (authState.google_id) return undefined;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || String(googleClientId).includes('your-google-client-id')) {
      return undefined;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id) return;
      const btn = document.getElementById(googleBtnId);
      if (!btn) return;
      btn.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLinkCredentialResponse
      });
      window.google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'medium',
        text: 'signup_with',
        width: 280
      });
    };

    renderGoogleButton();
    const script = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (script) {
      script.addEventListener('load', renderGoogleButton);
    }
    return () => {
      if (script) script.removeEventListener('load', renderGoogleButton);
    };
  }, [authState.google_id, googleBtnId, handleGoogleLinkCredentialResponse]);

  const shellClass =
    variant === 'flush'
      ? 'space-y-8'
      : variant === 'card'
        ? 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'
        : 'space-y-8';

  const sectionInner =
    variant === 'card' ? 'p-6 space-y-8' : 'space-y-8';

  return (
    <div className={shellClass}>
      {variant === 'card' && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} />
            Security Settings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage password and Google sign-in for this account
          </p>
        </div>
      )}

      <div className={sectionInner}>
        {variant !== 'card' && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 font-manrope">Security Settings</h3>
          </div>
        )}

        <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 space-y-4">
          <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-700" />
            {authState.hasPassword ? 'Change Password' : 'Set Account Password'}
          </h4>
          <p className="text-xs text-gray-500">
            {authState.hasPassword
              ? 'Enter your current password once, then your new password twice.'
              : 'Your account was created via Google and does not have a local password. Set a password below to enable email/password sign-in.'}
          </p>

          <div className="space-y-4 max-w-md pt-2">
            {authState.hasPassword && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))
                  }
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                }
                placeholder="Enter new password (min. 6 chars)"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                }
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={
                isSubmittingPassword ||
                !passwordForm.new_password ||
                !passwordForm.confirm_password ||
                (authState.hasPassword && !passwordForm.current_password)
              }
              className="bg-black text-white hover:bg-gray-800 text-xs font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isSubmittingPassword
                ? 'Saving...'
                : authState.hasPassword
                  ? 'Update Password'
                  : 'Set Password'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 space-y-4">
          <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            Google Authentication
          </h4>
          <p className="text-xs text-gray-500">
            {authState.google_id
              ? 'Your profile is linked to a Google account. You can sign in using Google.'
              : 'Link Google to sign in with the same email (Sign up with Google / Link Google).'}
          </p>

          {authState.google_id ? (
            <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-100 rounded-lg p-3 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Google account linked successfully ({authState.email || 'connected'})</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div id={googleBtnId} className="w-fit min-h-[40px]" />
              {linkError && <p className="text-xs text-red-600">{linkError}</p>}
              <p className="text-[11px] text-gray-400">
                Google account email must match your registered email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSecuritySection;
