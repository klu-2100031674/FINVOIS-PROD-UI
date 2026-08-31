/**
 * Optional referral-code prompt shown once after Google signup / first login.
 * Closable — skip or close dismisses permanently via API.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import apiClient from '../../api/apiClient';

const GoogleReferralPromptModal = ({ isOpen, onClose, onApplied }) => {
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dismiss = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/users/apply-referral', { skip: true });
      onClose?.({ dismissed: true });
    } catch (err) {
      // Still close locally so the user is never stuck; flag may clear on next profile fetch
      console.warn('Failed to dismiss referral prompt:', err);
      onClose?.({ dismissed: true });
    } finally {
      setSubmitting(false);
    }
  };

  const apply = async (e) => {
    e?.preventDefault?.();
    const code = String(referralCode || '').trim();
    if (!code) {
      setError('Enter a referral code, or skip for now.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post('/users/apply-referral', { referral_code: code });
      toast.success(res.data?.message || 'Referral code applied');
      onApplied?.(res.data?.data || {});
      onClose?.({ applied: true, data: res.data?.data });
      setReferralCode('');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Could not apply referral code';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) dismiss();
      }}
      title="Have a referral code?"
      size="sm"
      closeButton
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={dismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={apply}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Apply code'}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-600 mb-4">
        If someone referred you to Finvois, you can add their referral ID now. This is optional —
        you can skip and won&apos;t be asked again.
      </p>
      <form onSubmit={apply}>
        <label htmlFor="google-referral-code" className="block text-sm font-medium text-gray-700 mb-2">
          Referral ID (optional)
        </label>
        <input
          id="google-referral-code"
          type="text"
          value={referralCode}
          onChange={(e) => {
            setReferralCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter referral code"
          disabled={submitting}
          autoFocus
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
};

export default GoogleReferralPromptModal;
