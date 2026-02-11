/**
 * Buy Credits Page
 * Purchase report credits using Razorpay payment gateway
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCardIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { orderAPI, walletAPI } from '../api/endpoints';
import { useAuth } from '../hooks';

// Credit packages configuration
const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 499,
    originalPrice: 599,
    discount: 17,
    popular: false,
    features: [
      '5 Report Credits',
      'All Report Templates',
      'Excel & PDF Downloads',
      'Email Delivery',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 15,
    price: 1299,
    originalPrice: 1797,
    discount: 28,
    popular: true,
    features: [
      '15 Report Credits',
      'All Report Templates',
      'Priority Support',
      'AI-Enhanced Reports',
      'Bulk Generation',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 50,
    price: 3999,
    originalPrice: 5990,
    discount: 33,
    popular: false,
    features: [
      '50 Report Credits',
      'All Report Templates',
      'Dedicated Support',
      'AI-Enhanced Reports',
      'Custom Branding',
      'API Access',
    ],
  },
];

const BuyCreditsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Fetch wallet info
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await walletAPI.getMyWallet();
        setWallet(response.wallet || response);
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      toast.error('Please select a credit package');
      return;
    }

    setLoading(true);
    try {
      // Create order in backend
      const response = await orderAPI.createOrder({
        pack_type: 'report',
        credits: selectedPackage.credits,
        amount_paid: selectedPackage.price,
        currency: 'INR',
      });

      const { order, razorpay_order, key_id } = response;

      // If Razorpay is not configured (dev mode), simulate success
      if (!razorpay_order || !key_id) {
        toast.success('Order created! Payment gateway not configured in development mode.');
        navigate('/payment-success', { 
          state: { 
            order,
            credits: selectedPackage.credits,
            amount: selectedPackage.price 
          } 
        });
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: selectedPackage.price * 100, // in paise
        currency: 'INR',
        name: 'CA Report Platform',
        description: `${selectedPackage.name} - ${selectedPackage.credits} Report Credits`,
        order_id: razorpay_order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await orderAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Payment successful!');
            navigate('/payment-success', { 
              state: { 
                order: verifyResponse.order,
                credits: selectedPackage.credits,
                amount: selectedPackage.price,
                paymentId: response.razorpay_payment_id
              } 
            });
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
            navigate('/payment-failure', { 
              state: { 
                error: 'Payment verification failed',
                orderId: order._id 
              } 
            });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#1f2937',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        navigate('/payment-failure', { 
          state: { 
            error: response.error.description,
            orderId: order._id 
          } 
        });
      });
      razorpayInstance.open();
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(error?.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Current Credits:</span>
              <span className="font-bold text-gray-900">
                {walletLoading ? '...' : (wallet?.report_credits || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Buy Report Credits
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a credit package that fits your needs. All packages include access to
            all report templates with unlimited downloads.
          </p>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                selectedPackage?.id === pkg.id
                  ? 'border-gray-900 shadow-xl scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-medium px-4 py-1 rounded-full flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedPackage?.id === pkg.id && (
                <div className="absolute top-4 right-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              )}

              {/* Package Info */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">₹{pkg.price}</span>
                  <span className="text-lg text-gray-400 line-through">₹{pkg.originalPrice}</span>
                </div>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                  Save {pkg.discount}%
                </span>
              </div>

              {/* Credits Display */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                <span className="text-4xl font-bold text-gray-900">{pkg.credits}</span>
                <span className="text-gray-600 ml-2">Report Credits</span>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Button */}
        <div className="max-w-md mx-auto">
          <button
            onClick={handlePayment}
            disabled={!selectedPackage || loading}
            className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              !selectedPackage || loading
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                {selectedPackage
                  ? `Pay ₹${selectedPackage.price} for ${selectedPackage.credits} Credits`
                  : 'Select a Package to Continue'}
              </>
            )}
          </button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Secured by Razorpay • 256-bit SSL Encryption</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">10,000+</div>
              <div className="text-gray-600 text-sm">Reports Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600 text-sm">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-gray-600 text-sm">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyCreditsPage;
