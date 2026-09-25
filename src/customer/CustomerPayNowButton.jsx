import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import api, { apiErrorMessage } from '../api/apiClient';
import { reportAPI } from '../api/endpoints';

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

export default function CustomerPayNowButton({ request, onPaid, className = '' }) {
  const [loading, setLoading] = useState(false);
  const pending = isPendingPayment(request);
  const amount = Number(request?.reportId?.payment?.amount || 0);
  const reportId = request?.reportId?._id || request?.reportId;

  if (!pending) return null;

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
