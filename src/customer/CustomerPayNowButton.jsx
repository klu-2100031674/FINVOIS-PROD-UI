import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Share2 } from 'lucide-react';
import api, { apiErrorMessage } from '../api/apiClient';
import { reportAPI } from '../api/endpoints';
import useAuth from '../hooks/useAuth';

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window.Razorpay === 'function') {
      resolve(true);
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(typeof window.Razorpay === 'function'), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.addEventListener('load', () => resolve(typeof window.Razorpay === 'function'), { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
    document.body.appendChild(script);
  });

function isPendingPayment(request) {
  const report = request?.reportId;
  if (!report) return false;
  return report?.payment?.status !== 'completed';
}

function findReferralPhone(request) {
  const submitted = request?.submittedData || {};
  const candidates = [
    submitted.referredByBankMobile,
    submitted.referredByMobile,
    submitted.referredByPhone,
    submitted.bankMobile,
    submitted.bankerMobile,
    submitted.referredBy,
    submitted.referred_by,
    submitted.referredByBank,
    request?.bankManagerId?.phone,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const digits = String(c).replace(/\D/g, '');
    if (digits.length >= 10) return digits.slice(-10);
  }
  return null;
}

export function ForwardToBankManagerButton({ request, onForwarded, className = '' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const pending = isPendingPayment(request);

  // Bank Managers do not forward to themselves
  if (user?.role === 'bank_manager') return null;
  if (!pending) return null;

  const existingPhone = findReferralPhone(request);
  const submitted = request?.submittedData || {};
  const isForwarded = Boolean(request?.isPaymentForwardedToBankManager || request?.paymentForwardedToBankManagerAt);
  const bankName = submitted.referredByBankName || 'Bank Manager';
  const branchName = submitted.referredByBranchName;
  const label = [bankName, branchName].filter(Boolean).join(' - ');

  const doForward = async (phoneToSend = null) => {
    setLoading(true);
    try {
      const payload = phoneToSend ? { bankMobile: phoneToSend } : {};
      const res = await api.post(`/customer/department-requests/${request._id}/forward-to-bank-manager`, payload);
      toast.success(res.data?.message || 'Payment link forwarded to Bank Manager');
      setShowPrompt(false);
      onForwarded?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to forward to Bank Manager'));
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (existingPhone) {
      doForward(existingPhone);
    } else {
      setShowPrompt(true);
    }
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    const digits = mobileInput.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    doForward(digits.slice(-10));
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ||
          `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-60 ${
            isForwarded
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`
        }
        title={
          isForwarded
            ? `Payment already forwarded to ${label}. Click to send WhatsApp reminder.`
            : `Forward payment request to ${label} via WhatsApp`
        }
      >
        <Share2 className="h-3.5 w-3.5" />
        {loading ? 'Sending...' : isForwarded ? 'Forwarded to Bank (Resend)' : 'Forward to Bank Manager'}
      </button>

      {showPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowPrompt(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 text-left animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-600" />
                Forward to Bank Manager
              </h3>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Enter the Bank Manager&apos;s 10-digit mobile number to send them the WhatsApp payment link and link this report to their portal:
            </p>
            <form onSubmit={handlePromptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Manager Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-gray-400 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mobileInput.length < 10}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 size={13} />
                  {loading ? 'Sending...' : 'Send Payment Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function CustomerPayNowButton({ request, onPaid, className = '' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const pending = isPendingPayment(request);
  const amount = Number(request?.reportId?.payment?.amount || 0);
  const reportId = request?.reportId?._id || request?.reportId;

  if (!pending) return null;

  // Rule #3: If bank manager, can only pay if forwarded to bank manager
  const isBankManager = user?.role === 'bank_manager';
  const isForwardedToManager = Boolean(
    request?.isPaymentForwardedToBankManager || request?.paymentForwardedToBankManagerAt
  );

  if (isBankManager && !isForwardedToManager) {
    return (
      <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
        Awaiting customer payment
      </span>
    );
  }

  const handlePay = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!reportId) return;
    setLoading(true);
    try {
      const payRes = await api.post(`/customer/department-requests/${request._id}/pay`, {});
      const data = payRes.data?.data || {};
      if (data.already_paid || data.payment_status === 'completed') {
        toast.success('Payment already completed');
        onPaid?.();
        return;
      }

      if (!data.razorpay_order_id || !data.razorpay_key_id) {
        toast.error(
          data.error ||
            'Payment is not ready. Razorpay did not return a checkout session. Ask support to check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
        );
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway is temporarily unavailable.');
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay_key_id,
        amount: (data.amount || amount) * 100,
        currency: data.currency || 'INR',
        name: 'Finvois Reports',
        description: request.reportId?.title || 'Report payment',
        order_id: data.razorpay_order_id,
        handler: async (response) => {
          try {
            await reportAPI.verifyReportPayment(reportId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful');
            onPaid?.();
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Payment verification failed'));
          }
        },
        theme: { color: '#7C3AED' },
      });
      rzp.open();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to start payment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60'
        }
      >
        <CreditCard className="h-3.5 w-3.5" />
        {loading ? 'Opening...' : `Pay now${amount ? ` ₹${amount.toLocaleString('en-IN')}` : ''}`}
      </button>
    </span>
  );
}
