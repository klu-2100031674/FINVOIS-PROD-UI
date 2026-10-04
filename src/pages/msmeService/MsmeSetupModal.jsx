import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/api/endpoints';
import apiClient from '@/api/apiClient';
import { updateUser } from '@/store/slices/authSlice';

const DISMISS_KEY = 'msme_setup_dismissed';

export function clearMsmeSetupDismissed() {
  try {
    sessionStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const MsmeSetupModal = ({ user, onDismissed }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(String(user?.name || '').trim());
  const [phone, setPhone] = useState(digitsOnly(user?.phone || user?.mobile || ''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password]
  );
  const allMet = Object.values(strength).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const nameOk = String(name || '').trim().length >= 2;
  const phoneOk = /^\d{10}$/.test(phone);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    onDismissed?.();
  };

  const submit = async (event) => {
    event.preventDefault();
    const trimmedName = String(name || '').trim();
    const phoneDigits = digitsOnly(phone);
    if (trimmedName.length < 2) {
      toast.error('Please enter your name');
      return;
    }
    if (!/^\d{10}$/.test(phoneDigits)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (!allMet) {
      toast.error('Password does not meet all requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await authAPI.changePassword(password, {
        name: trimmedName,
        phone: phoneDigits,
      });
      // Persist name/phone via profile as well (ensures profile page stays in sync)
      try {
        await apiClient.put('/users/profile', {
          name: trimmedName,
          phone: phoneDigits,
        });
      } catch {
        /* change-password already wrote these; profile PUT is a safety net */
      }
      const savedName = result?.name || trimmedName;
      const savedPhone = result?.phone || phoneDigits;
      dispatch(
        updateUser({
          name: savedName,
          phone: savedPhone,
          mobile: savedPhone,
          must_change_password: false,
        })
      );
      clearMsmeSetupDismissed();
      toast.success('Profile saved');
      onDismissed?.();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="msme-setup-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id="msme-setup-title" className="text-lg font-semibold text-gray-900">
              Complete your profile
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your name, phone number, and a new password. You can do this later, but we will ask again until it is saved.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Do this later"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="Your full name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Phone number</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
              autoComplete="tel"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="10-digit mobile number"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">New password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <ul className="space-y-1 text-xs">
            {[
              [strength.length, 'At least 8 characters'],
              [strength.uppercase, 'One uppercase letter'],
              [strength.lowercase, 'One lowercase letter'],
              [strength.number, 'One number'],
            ].map(([met, text]) => (
              <li key={text} className={met ? 'text-emerald-700' : 'text-gray-400'}>
                {met ? '✓' : '○'} {text}
              </li>
            ))}
          </ul>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Confirm new password</span>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch ? (
              <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
            ) : null}
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Do this later
            </button>
            <button
              type="submit"
              disabled={loading || !nameOk || !phoneOk || !allMet || !passwordsMatch}
              className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MsmeSetupModal;
