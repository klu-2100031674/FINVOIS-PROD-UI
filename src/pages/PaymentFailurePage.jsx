/**
 * Payment Failure Page
 * Displayed when payment fails
 */

import { useLocation, Link } from 'react-router-dom';
import {
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const PaymentFailurePage = () => {
  const location = useLocation();
  const { error, orderId } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Failure Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Failure Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircleIcon className="w-12 h-12 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Don't worry, no money was deducted from your account.
          </p>

          {/* Error Details */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-medium text-red-800 mb-2">Error Details</h3>
              <p className="text-sm text-red-600">{error}</p>
              {orderId && (
                <p className="text-xs text-red-500 mt-2">Order ID: {orderId}</p>
              )}
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-3">Common Reasons</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                Insufficient funds in your account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                Card declined by issuing bank
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                Network connection issues
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                Payment timeout or session expired
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/buy-credits"
              className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Try Again
            </Link>
            <Link
              to="/dashboard"
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <HomeIcon className="w-5 h-5" />
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Need Help?</h4>
              <p className="text-sm text-gray-600">
                Contact our support team at{' '}
                <a href="mailto:support@careport.com" className="text-blue-600 hover:underline">
                  support@careport.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
