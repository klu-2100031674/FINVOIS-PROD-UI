/**
 * Channel partner pay-at-download: admin sets the amount at approval; the CP pays it
 * (Razorpay) the first time they download. ₹0 is recorded as paid by the API without checkout.
 */
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { reportAPI } from '../api/endpoints';

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window.Razorpay === 'function') return resolve(true);
    const script = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`) || document.createElement('script');
    script.addEventListener('load', () => resolve(typeof window.Razorpay === 'function'), { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
    if (!script.src) {
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  });

/** Unpaid channel partner report: admin must set the amount at approval; CP pays at download. */
export const needsCpAmount = (report) =>
  report?.payment?.collect_on_download === true && report?.payment?.status !== 'completed';

export const isValidAmount = (v) => String(v ?? '').trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;

/** Resolves true once the report is paid (or was already), false if the CP closed the checkout. */
export async function ensureCpDownloadPaid(report) {
  const res = await apiClient.post(`/reports/${report._id}/download-payment`, {});
  const data = res.data?.data || {};
  if (data.paid) {
    if (report.payment) report.payment.status = 'completed';
    return true;
  }

  if (!(await loadRazorpayScript())) throw new Error('Payment gateway is temporarily unavailable.');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: data.razorpay_key_id,
      amount: Math.round(data.amount * 100),
      currency: data.currency || 'INR',
      name: 'Finvois Reports',
      description: `${data.report_title || 'Report'} — ₹${Number(data.amount).toLocaleString('en-IN')}`,
      order_id: data.razorpay_order_id,
      handler: async (response) => {
        try {
          await reportAPI.verifyReportPayment(report._id, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          // later clicks in this session skip the payment call
          if (report.payment) report.payment.status = 'completed';
          toast.success('Payment successful. Downloading report...');
          resolve(true);
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => resolve(false) },
      theme: { color: '#7C3AED' },
    });
    rzp.open();
  });
}
