import React from 'react';

/**
 * Invoice Component
 * Renders a professional invoice layout for PDF generation
 */
const Invoice = ({ report, payment }) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    if (currency === 'INR') {
      // Amount is already in rupees
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `${currency} ${amount}`;
  };

  return (
    <div className="invoice-container max-w-4xl mx-auto bg-white p-8 font-sans text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h1>
        <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* Company Info */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Finvois</h2>
        <p className="text-gray-600 mb-1">Professional Excel Report Generation Services</p>
        <p className="text-gray-600 mb-1">Email: support@finvois.com</p>
        <p className="text-gray-600">Website: www.finvois.com</p>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Number:</span>
              <span className="font-medium">INV-{payment?.razorpay_order_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{formatDate(payment?.paid_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-medium text-sm">{payment?.razorpay_payment_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium text-sm">{payment?.razorpay_order_id || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To</h3>
          <div className="space-y-2">
            <p className="font-medium text-gray-800">{report?.user_id?.name || 'Customer'}</p>
            <p className="text-gray-600">{report?.user_id?.email || 'N/A'}</p>
            <p className="text-gray-600">Report: {report?.title || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Service Details Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Rate</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3">
                Excel Report Generation Service<br />
                <span className="text-sm text-gray-600">Template: {report?.templateId || 'N/A'}</span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center">1</td>
              <td className="border border-gray-300 px-4 py-3 text-right">
                {formatCurrency(payment?.amount || 0, payment?.currency)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                {formatCurrency(payment?.amount || 0, payment?.currency)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan="3" className="border border-gray-300 px-4 py-3 text-right font-semibold">
                Total:
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">
                {formatCurrency(payment?.amount || 0, payment?.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              payment?.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : payment?.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {payment?.status === 'completed' ? 'PAID' :
               payment?.status === 'pending' ? 'PENDING' :
               payment?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          {payment?.paid_at && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-medium">{formatDate(payment.paid_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 text-center">
        <p className="text-gray-600 mb-2">Thank you for using Finvois services!</p>
        <p className="text-sm text-gray-500">For any queries, please contact support@finvois.com</p>
        <p className="text-xs text-gray-400 mt-4">
          This is a computer-generated invoice. No signature required.
        </p>
      </div>
    </div>
  );
};

export default Invoice;