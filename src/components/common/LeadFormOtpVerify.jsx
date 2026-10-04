import { useEffect, useState } from 'react';
import { Mail, Phone, ShieldCheck, Edit2, X, Check } from 'lucide-react';
import apiClient, { apiErrorMessage } from '@/api/apiClient';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm';

/**
 * WhatsApp or email OTP gate used by MSME / MEPMA / DPR Request lead forms.
 * One verified channel is enough. MSME no longer requires both OTPs.
 * Allows editing phone number and email directly while on the OTP step.
 */
export default function LeadFormOtpVerify({
  applicantName,
  mobileNumber,
  initialEmail = '',
  requireBoth = false,
  otpPurpose = 'form-verify',
  copy = {},
  submitting = false,
  error = '',
  onBack,
  onVerifiedSubmit,
}) {
  const [otpType, setOtpType] = useState('phone');
  const [bothPhase, setBothPhase] = useState('phone');
  const [phone, setPhone] = useState(String(mobileNumber || '').trim());
  const [email, setEmail] = useState(initialEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeType = requireBoth ? bothPhase : otpType;
  const activeValue = activeType === 'email' ? email.trim() : phone.trim();
  const displayError = localError || error;

  const handleSendOtpTo = async (typeToUse = activeType, valueToUse = activeValue) => {
    setLocalError('');
    const normValue = String(valueToUse || '').trim();
    if (typeToUse === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normValue)) {
      setLocalError(copy.emailRequired || 'Enter a valid email address.');
      return false;
    }
    if (typeToUse === 'phone' && normValue.replace(/\D/g, '').length < 10) {
      setLocalError(copy.phoneRequired || 'Enter a valid 10-digit mobile number.');
      return false;
    }
    setSendingOtp(true);
    try {
      const res = await apiClient.post('/customer/send-otp', {
        type: typeToUse,
        value: normValue,
        purpose: otpPurpose,
      });
      if (res.data?.success) {
        setOtpSent(true);
        setOtpCode('');
        return true;
      } else {
        setLocalError(res.data?.error || copy.sendOtpFailed || 'Failed to send OTP');
        return false;
      }
    } catch (err) {
      setLocalError(apiErrorMessage(err, copy.sendOtpFailed || 'Failed to send OTP'));
      return false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendOtp = () => handleSendOtpTo(activeType, activeValue);

  const handleSaveContactAndResend = async () => {
    const val = editValue.trim();
    if (activeType === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        setLocalError(copy.emailRequired || 'Enter a valid email address.');
        return;
      }
      setEmail(val);
      setIsEditingContact(false);
      await handleSendOtpTo('email', val);
    } else {
      if (val.replace(/\D/g, '').length < 10) {
        setLocalError(copy.phoneRequired || 'Enter a valid 10-digit mobile number.');
        return;
      }
      setPhone(val);
      setIsEditingContact(false);
      await handleSendOtpTo('phone', val);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!otpCode.trim()) {
      setLocalError(copy.enterOtp || 'Enter the 6-digit OTP');
      return;
    }

    if (requireBoth && bothPhase === 'phone') {
      setPhoneOtp(otpCode.trim());
      setBothPhase('email');
      setOtpSent(false);
      setOtpCode('');
      setIsEditingContact(false);
      return;
    }

    if (requireBoth) {
      await onVerifiedSubmit({
        phoneOtp,
        emailOtp: otpCode.trim(),
        email: email.trim(),
        phone: phone.trim(),
        name: applicantName,
      });
      return;
    }

    await onVerifiedSubmit({
      type: otpType,
      value: activeValue,
      otp: otpCode.trim(),
      email: email.trim(),
      phone: phone.trim(),
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
          {requireBoth
            ? (copy.verifyBodyBoth ||
              'Verify WhatsApp on your mobile, then verify email. Both codes are required to create your account and submit.')
            : (copy.verifyBodyChannel ||
              'Choose WhatsApp or email. We will send a one-time code to that channel, then submit your request.')}
        </p>
        {requireBoth && (
          <p className="text-xs font-semibold text-orange-700 mt-2">
            {bothPhase === 'phone'
              ? (copy.verifyStepWhatsapp || 'Step 1 of 2 — WhatsApp OTP')
              : (copy.verifyStepEmail || 'Step 2 of 2 — Email OTP')}
          </p>
        )}
      </div>

      {displayError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{displayError}</div>
      )}

      {!requireBoth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setOtpType('phone');
              setOtpSent(false);
              setOtpCode('');
              setLocalError('');
              setIsEditingContact(false);
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              otpType === 'phone'
                ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Phone size={16} className={otpType === 'phone' ? 'text-orange-500' : 'text-gray-400'} />
                {copy.verifyViaWhatsapp || 'WhatsApp OTP'}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{phone || '—'}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpType('email');
              setOtpSent(false);
              setOtpCode('');
              setLocalError('');
              setIsEditingContact(false);
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
              {email || copy.emailHint || 'Code is sent to your email'}
            </p>
          </button>
        </div>
      )}

      {requireBoth && bothPhase === 'phone' && (
        <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Phone size={16} className="text-orange-500" />
            {copy.verifyViaWhatsapp || 'WhatsApp OTP'}
          </div>
          <p className="text-xs text-gray-600 mt-1">{phone || '—'}</p>
        </div>
      )}

      {/* Inline edit contact box when editing is active */}
      {isEditingContact && (
        <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700">
              {activeType === 'email' ? 'Update Email Address' : 'Update WhatsApp Mobile Number'}
            </label>
            <button
              type="button"
              onClick={() => {
                setIsEditingContact(false);
                setEditValue('');
              }}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type={activeType === 'email' ? 'email' : 'tel'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={activeType === 'email' ? 'Enter email address' : 'Enter 10-digit mobile number'}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
              autoFocus
            />
            <button
              type="button"
              disabled={sendingOtp}
              onClick={handleSaveContactAndResend}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Check size={14} />
              {sendingOtp ? 'Sending...' : 'Update & Send OTP'}
            </button>
          </div>
        </div>
      )}

      {/* If email is active and not yet sent and not currently in edit mode, show email field */}
      {!isEditingContact && activeType === 'email' && !otpSent && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {copy.emailAddress || 'Email address'}
            </label>
          </div>
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
          <div className="space-y-2">
            {!isEditingContact && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 shadow-sm"
              >
                <ShieldCheck size={18} />
                {sendingOtp
                  ? copy.sendingOtp || 'Sending OTP...'
                  : activeType === 'email'
                    ? copy.sendOtpEmail || 'Send OTP via Email'
                    : copy.sendOtp || 'Send OTP via WhatsApp'}
              </button>
            )}
            {!isEditingContact && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingContact(true);
                    setEditValue(activeValue);
                    setLocalError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  <Edit2 size={13} />
                  {activeType === 'email' ? 'Change email address' : 'Change mobile number'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-1 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm text-gray-600">
                {copy.otpSentTo || 'OTP sent to'}:{' '}
                <span className="font-semibold text-gray-900">{activeValue}</span>
              </p>
              {!isEditingContact && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingContact(true);
                    setEditValue(activeValue);
                    setLocalError('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline ml-auto"
                >
                  <Edit2 size={12} />
                  {activeType === 'email' ? 'Edit Email' : 'Edit Number'}
                </button>
              )}
            </div>

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
              className="w-full px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 shadow-sm"
            >
              {submitting
                ? copy.verifying || 'Verifying...'
                : requireBoth && bothPhase === 'phone'
                  ? (copy.continueToEmailOtp || 'Continue to Email OTP')
                  : (copy.verifyAndSubmit || 'Verify & Submit')}
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

      {requireBoth && bothPhase === 'email' && (
        <button
          type="button"
          onClick={() => {
            setBothPhase('phone');
            setOtpSent(Boolean(phoneOtp));
            setOtpCode(phoneOtp);
            setLocalError('');
            setIsEditingContact(false);
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-800"
        >
          {copy.backToWhatsappOtp || 'Back to WhatsApp OTP'}
        </button>
      )}

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
