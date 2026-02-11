import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportAPI, pricingAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const PaymentModal = ({
  isOpen,
  onClose,
  templateId,
  reportTitle,
  initialSelections,
  onPaymentSuccess,
  analysisOptions
}) => {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [selectedSheets, setSelectedSheets] = useState({});
  const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';

  useEffect(() => {
    if (isOpen && templateId) {
      fetchPricing();
    }
  }, [isOpen, templateId]);

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);
      const response = await pricingAPI.getTemplatePricing(templateId);
      const pricingData = response.data;
      setPricing(pricingData);

      const initialSelection = {};

      if (pricingData.analysis_sheets) {
        pricingData.analysis_sheets.forEach(sheet => {
          initialSelection[sheet.sheet_name] = initialSelections?.[sheet.sheet_name] ?? (sheet.required || false);
        });
      }

      if (pricingData.sheet_pricing) {
        pricingData.sheet_pricing.forEach(sheet => {
          if (initialSelections?.[sheet.sheet_name] !== undefined) {
            initialSelection[sheet.sheet_name] = initialSelections[sheet.sheet_name];
          } else if (initialSelection[sheet.sheet_name] === undefined) {
            initialSelection[sheet.sheet_name] = sheet.is_included;
          }
        });
      }

      setSelectedSheets(initialSelection);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      setPricing({ price_per_credit: 500, credits_required: 1, is_default: true });
    } finally {
      setLoadingPricing(false);
    }
  };

  const toggleSheet = (sheetName) => {
    setSelectedSheets(prev => ({ ...prev, [sheetName]: !prev[sheetName] }));
  };

  const calculateTotalPrice = () => {
    if (!pricing) return 500;
    let total = pricing.base_price || 0;

    // Add logic to sum prices based on selectedSheets (simplified for brevity, ensuring logic matches original)
    const sheetsToCheck = [...(pricing.analysis_sheets || []), ...(pricing.sheet_pricing || [])];
    const processedSheets = new Set();

    sheetsToCheck.forEach(sheet => {
      if (!processedSheets.has(sheet.sheet_name)) {
        if (selectedSheets[sheet.sheet_name] && !pricing.analysis_sheets?.find(as => as.sheet_name === sheet.sheet_name && processedSheets.has(as.sheet_name))) {
          total += sheet.price || 0;
        }
        processedSheets.add(sheet.sheet_name);
      }
    });

    // Re-implementing exact logic from original to ensure correctness
    let calcTotal = pricing.base_price || 0;
    if (pricing.analysis_sheets) {
      pricing.analysis_sheets.forEach(sheet => {
        if (selectedSheets[sheet.sheet_name]) calcTotal += sheet.price || 0;
      });
    }
    if (pricing.sheet_pricing) {
      pricing.sheet_pricing.forEach(sheet => {
        const isAnalysisSheet = pricing.analysis_sheets?.some(as => as.sheet_name === sheet.sheet_name);
        if (!isAnalysisSheet && selectedSheets[sheet.sheet_name]) calcTotal += sheet.price || 0;
      });
    }

    return calcTotal;
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const finalAmount = isBetaMode ? 0 : calculateTotalPrice();

      // Prepare sheets data (logic preserved from original)
      const selectedSheetsData = [];
      if (pricing?.analysis_sheets) {
        pricing.analysis_sheets.forEach(s => {
          if (selectedSheets[s.sheet_name]) selectedSheetsData.push({ sheet_name: s.sheet_name, display_name: s.display_name, price: s.price });
        });
      }
      if (pricing?.sheet_pricing) {
        pricing.sheet_pricing.forEach(s => {
          const isAnalysis = pricing.analysis_sheets?.some(as => as.sheet_name === s.sheet_name);
          if (!isAnalysis && selectedSheets[s.sheet_name]) selectedSheetsData.push({ sheet_name: s.sheet_name, display_name: s.display_name, price: s.price });
        });
      }

      if (isBetaMode) {
        const orderResponse = await reportAPI.createReportPaymentOrder(templateId, reportTitle || `Report - ${templateId}`, null, 0, selectedSheetsData, analysisOptions);
        const { report_id } = orderResponse.data;
        const verifyResponse = await reportAPI.verifyReportPayment(report_id, {});
        onPaymentSuccess({ report_id, amount: 0, simulated: true, isBeta: true, order_id: verifyResponse.data.order_id });
        onClose();
        return;
      }

      const orderResponse = await reportAPI.createReportPaymentOrder(templateId, reportTitle || `Report - ${templateId}`, null, finalAmount, selectedSheetsData, analysisOptions);
      const { report_id, amount, currency, razorpay_order_id, razorpay_key_id } = orderResponse.data;

      if (!razorpay_key_id || !razorpay_order_id) {
        onPaymentSuccess({ report_id, amount, simulated: true });
        onClose();
        return;
      }

      const options = {
        key: razorpay_key_id,
        amount: amount * 100,
        currency: currency,
        name: 'Finvois Reports',
        description: reportTitle,
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await reportAPI.verifyReportPayment(report_id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            onPaymentSuccess({ report_id, amount, payment_id: response.razorpay_payment_id, order_id: verifyResponse.data.order_id });
            onClose();
          } catch (error) {
            toast.error('Payment verification failed.');
          }
        },
        theme: { color: '#7C3AED' },
        modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); } }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Payment failed');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-white p-6 text-center relative flex-shrink-0 border-b border-gray-100">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
                {isBetaMode ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <CreditCard className="w-8 h-8 text-purple-600" />}
              </div>

              <h2 className="text-2xl font-bold font-manrope text-gray-900">{isBetaMode ? "Generate Free Report" : "Complete Report Payment"}</h2>
              <p className="text-gray-500 text-sm mt-1">{reportTitle || `Report #${templateId}`}</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {loadingPricing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 font-medium">Fetching best pricing...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {isBetaMode ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                      <div className="bg-green-100 p-2 rounded-full h-fit">
                        <ShieldCheck className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 text-sm">Beta Access Enabled</h4>
                        <p className="text-sm text-green-700 mt-1">You can generate this report for free. No credit card required.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-gray-700 font-medium text-sm">Base Price</span>
                      <span className="text-gray-900 font-bold">₹{pricing?.base_price || 0}</span>
                    </div>
                  )}

                  {/* Add-ons Section */}
                  {!isBetaMode && ((pricing?.analysis_sheets?.length > 0) || (pricing?.sheet_pricing?.length > 0)) && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Customize Your Report</h3>
                      <div className="space-y-2">
                        {/* Analysis Sheets */}
                        {pricing?.analysis_sheets?.filter(s => s.is_visible !== false).map((sheet, idx) => (
                          <label
                            key={`as-${idx}`}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedSheets[sheet.sheet_name]
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedSheets[sheet.sheet_name] || false}
                                onChange={() => toggleSheet(sheet.sheet_name)}
                                disabled={sheet.required}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-600"
                              />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{sheet.display_name || sheet.sheet_name}</p>
                                {sheet.required && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Required</span>}
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{sheet.price > 0 ? `+₹${sheet.price}` : 'Free'}</span>
                          </label>
                        ))}
                        {/* Sheet Pricing */}
                        {pricing?.sheet_pricing?.filter(s => {
                          if (s.is_visible === false) return false;
                          const isAnalysis = pricing.analysis_sheets?.some(as => as.sheet_name === s.sheet_name);
                          if (pricing.analysis_sheets?.length > 0 && (s.sheet_name.toLowerCase().includes('cover') || s.sheet_name.toLowerCase().includes('pla'))) return false;
                          return !isAnalysis;
                        }).map((sheet, idx) => (
                          <label
                            key={`sp-${idx}`}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedSheets[sheet.sheet_name]
                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedSheets[sheet.sheet_name] || false}
                                onChange={() => toggleSheet(sheet.sheet_name)}
                                disabled={!sheet.is_optional}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-600"
                              />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{sheet.display_name || sheet.sheet_name}</p>
                                {!sheet.is_optional && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Required</span>}
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{sheet.price > 0 ? `+₹${sheet.price}` : 'Free'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="text-3xl font-bold text-gray-900">
                  ₹{isBetaMode ? 0 : calculateTotalPrice()}
                  <span className="text-lg text-gray-400 font-medium">.00</span>
                </span>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || loadingPricing}
                className={`w-full py-3.5 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] ${isBetaMode
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                  : 'bg-gray-900 hover:bg-gray-800 shadow-gray-200'
                  } disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isBetaMode ? "Generate Report Now" : "Proceed to Payment"}
                  </>
                )}
              </button>

              {!isBetaMode && (
                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Payments secured by Razorpay </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
