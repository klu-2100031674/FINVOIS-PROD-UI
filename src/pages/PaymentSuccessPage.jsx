/**
 * Payment Success Page
 * Displayed after successful payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ReceiptRefundIcon,
} from '@heroicons/react/24/outline';
import api from '../api/apiClient';
import { useAuth } from '../hooks';
import { effectiveUserRole } from '../utils/normalizeUserRole';

const WIZARD_ROLES = ['user', 'company_user', 'company_admin', 'admin', 'agent', 'customer_service'];

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { order, credits, amount, paymentId } = location.state || {};
  const [openingReport, setOpeningReport] = useState(false);
  const query = new URLSearchParams(location.search);
  const reportId = query.get('reportId') || '';
  const templateId = query.get('templateId') || '';
  const linkStatus = query.get('razorpay_payment_link_status') || '';

  useEffect(() => {
    if (!reportId) return undefined;
    let cancelled = false;

    const openReport = async () => {
      setOpeningReport(true);
      if (linkStatus && linkStatus !== 'paid') {
        navigate('/payment-failure', { replace: true });
        return;
      }
      try {
        if (query.get('razorpay_signature')) {
          await api.post('/reports/payment-link-return', {
            reportId,
            razorpay_payment_id: query.get('razorpay_payment_id') || '',
            razorpay_payment_link_id: query.get('razorpay_payment_link_id') || '',
            razorpay_payment_link_reference_id: query.get('razorpay_payment_link_reference_id') || '',
            razorpay_payment_link_status: linkStatus || 'paid',
            razorpay_signature: query.get('razorpay_signature') || '',
          });
        }
      } catch {
        // The webhook may already have marked the payment. Opening the report still proceeds.
      }
      if (cancelled) return;
      const role = effectiveUserRole(user);
      if (templateId && WIZARD_ROLES.includes(role)) {
        const params = new URLSearchParams({ templateId, paidReportId: reportId });
        navigate(`/generate?${params.toString()}`, { replace: true });
        return;
      }
      navigate('/reports', { replace: true });
    };

    openReport();
    return () => {
      cancelled = true;
    };
  }, [reportId, templateId, linkStatus, navigate, user]);

  // Credit purchases have no report id. Send those visitors back to the dashboard.
  useEffect(() => {
    if (reportId) return undefined;
    if (!order && !credits) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [order, credits, navigate, reportId]);

  if (reportId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg w-full">
          <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment received</h1>
          <p className="text-gray-600">{openingReport ? 'Opening your report…' : 'Taking you to the report.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your credits have been added to your account.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ReceiptRefundIcon className="w-5 h-5" />
              Order Details
            </h3>
            <div className="space-y-3">
              {order?._id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium text-gray-900">{order._id}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment ID</span>
                  <span className="font-medium text-gray-900">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credits Purchased</span>
                <span className="font-medium text-gray-900">{credits || order?.credits || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-gray-900">₹{amount || order?.amount_paid || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Credits Added Banner */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-center gap-3">
              <DocumentTextIcon className="w-8 h-8" />
              <div>
                <div className="text-sm opacity-80">Credits Added</div>
                <div className="text-2xl font-bold">+{credits || order?.credits || 0}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Start Generating Reports
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              to="/order-history"
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              View Order History
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
