import { useState } from 'react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import apiClient, { apiErrorMessage } from '@/api/apiClient';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm';

/**
 * WhatsApp or email OTP gate used by MSME / MEPMA / DPR Request lead forms.
 */
export default function LeadFormOtpVerify({
  applicantName,
  mobileNumber,
  copy = {},
  submitting = false,
  error = '',
  onBack,
  onVerifiedSubmit,
}) {
  const [otpType, setOtpType] = useState('phone');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [localError, setLocalError] = useState('');

  const activeValue = otpType === 'email' ? email.trim() : String(mobileNumber || '').trim();
  const displayError = localError || error;

  const handleSendOtp = async () => {
    setLocalError('');
    if (otpType === 'email' && !email.includes('@')) {
      setLocalError(copy.emailRequired || 'Enter a valid email address.');
      return;
    }
    if (otpType === 'phone' && activeValue.replace(/\D/g, '').length < 10) {
      setLocalError(copy.phoneRequired || 'Enter a valid mobile number first.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await apiClient.post('/customer/send-otp', {
        type: otpType,
        value: activeValue,
      });
      if (res.data?.success) {
        setOtpSent(true);
        setOtpCode('');
      } else {
        setLocalError(res.data?.error || copy.sendOtpFailed || 'Failed to send OTP');
      }
    } catch (err) {
      setLocalError(apiErrorMessage(err, copy.sendOtpFailed || 'Failed to send OTP'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!otpCode.trim()) {
      setLocalError(copy.enterOtp || 'Enter the 6-digit OTP');
      return;
    }
    await onVerifiedSubmit({
      type: otpType,
      value: activeValue,
      otp: otpCode.trim(),
      email: otpType === 'email' ? email.trim() : '',
      name: applicantName,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {copy.verifyTitle || 'Verify to submit'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {copy.verifyBodyChannel ||
            'Choose WhatsApp or email. We will send a one-time code to that channel, then submit your request.'}
        </p>
      </div>

      {displayError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{displayError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setOtpType('phone');
            setOtpSent(false);
            setOtpCode('');
            setLocalError('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            otpType === 'phone'
              ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Phone size={16} className={otpType === 'phone' ? 'text-orange-500' : 'text-gray-400'} />
            {copy.verifyViaWhatsapp || 'WhatsApp OTP'}
          </div>
          <p className="text-xs text-gray-500 mt-1">{mobileNumber || '—'}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setOtpType('email');
            setOtpSent(false);
            setOtpCode('');
            setLocalError('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            otpType === 'email'
              ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Mail size={16} className={otpType === 'email' ? 'text-orange-500' : 'text-gray-400'} />
            {copy.verifyViaEmail || 'Email OTP'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {copy.emailHint || 'Code is sent to your email'}
          </p>
        </button>
      </div>

      {otpType === 'email' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {copy.emailAddress || 'Email address'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtpSent(false);
            }}
            placeholder={copy.placeholderEmail || 'yourname@example.com'}
            className={inputClass}
          />
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        {!otpSent ? (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            {sendingOtp
              ? copy.sendingOtp || 'Sending OTP...'
              : otpType === 'email'
                ? copy.sendOtpEmail || 'Send OTP via Email'
                : copy.sendOtp || 'Send OTP via WhatsApp'}
          </button>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              {copy.otpSentTo || 'Verification code sent to'}{' '}
              <span className="font-semibold text-gray-900">{activeValue}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={copy.enterOtp || 'Enter 6-digit OTP'}
              className={`${inputClass} tracking-[0.4em] text-center text-lg font-semibold`}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? copy.verifying || 'Verifying...' : copy.verifyAndSubmit || 'Verify & Submit'}
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full text-sm text-orange-600 hover:underline disabled:opacity-50"
            >
              {copy.resendOtp || 'Resend OTP'}
            </button>
          </>
        )}
      </form>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-500 hover:text-gray-800"
      >
        {copy.backToForm || 'Back to form'}
      </button>
    </div>
  );
}
