import React, { useState, useEffect } from 'react';
import { XMarkIcon, BeakerIcon, ChartBarIcon, CalculatorIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { pricingAPI } from '../../api/endpoints';
import { Button, Loading } from '../common';
import toast from 'react-hot-toast';

/**
 * Analysis Sheets Modal for Term Loans
 * Collects user preferences for optional analysis sheets and extra data
 */
const AnalysisSheetsModal = ({
  isOpen,
  onClose,
  templateId,
  onConfirm
}) => {
  const [loading, setLoading] = useState(true);
  const [analysisSheets, setAnalysisSheets] = useState([]);
  const [selections, setSelections] = useState({});
  const [extraData, setExtraData] = useState({
    sensitivity: {
      sellingPriceDecrease: 10,
      directExpensesIncrease: 10
    },
    bep: {
      productManufactured: '',
      sellingPricePerUnit: '',
      sellingPriceGrowth: '',
      plantCapacity: ''
    }
  });

  useEffect(() => {
    if (isOpen && templateId) {
      fetchAnalysisConfig();
    }
  }, [isOpen, templateId]);

  const fetchAnalysisConfig = async () => {
    try {
      setLoading(true);
      const response = await pricingAPI.getTemplatePricing(templateId);
      const sheets = response.data.analysis_sheets || [];
      setAnalysisSheets(sheets);

      const initialSelections = {};
      sheets.forEach(sheet => {
        initialSelections[sheet.sheet_name] = sheet.required || false;
      });
      setSelections(initialSelections);
    } catch (error) {
      console.error('Failed to fetch analysis config:', error);
      toast.error('Failed to load analysis options');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (sheetName) => {
    const sheet = analysisSheets.find(s => s.sheet_name === sheetName);
    if (sheet?.required) return;

    setSelections(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  const handleExtraDataChange = (section, field, value) => {
    setExtraData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    // Validate BEP data if BEP is selected and not service sector
    if (templateId !== 'TERM_LOAN_SERVICE_WITHOUT_STOCK' && (selections['BEP analysis'] || selections['BEP'])) {
      const { productManufactured, sellingPricePerUnit, plantCapacity } = extraData.bep;
      if (!productManufactured || !sellingPricePerUnit || !plantCapacity) {
        toast.error('Please fill all BEP details to proceed');
        return;
      }
    }

    onConfirm({
      selectedSheets: Object.keys(selections).filter(name => selections[name]),
      allSelections: selections,
      extraData
    });
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
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-white p-6 flex items-center justify-between shadow-sm shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">
                    Additional Analysis
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Customize your report with deeper insights
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loading />
                  <p className="mt-4 text-gray-500 text-sm">Loading options...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Analysis Sheet Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisSheets
                      .filter(sheet => sheet.is_visible !== false)
                      .map((sheet) => {
                        const isSelected = selections[sheet.sheet_name];
                        return (
                          <motion.div
                            key={sheet.sheet_name}
                            whileHover={!sheet.required ? { y: -2 } : {}}
                            onClick={() => handleToggle(sheet.sheet_name)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected
                                ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-200 bg-white group-hover:border-purple-400'
                                }`}>
                                {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                              </div>
                              {sheet.amount_display && (
                                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                  {sheet.amount_display}
                                </span>
                              )}
                            </div>

                            <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {sheet.display_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {sheet.required ? 'Required for this report type' : 'Optional detailed analysis'}
                            </p>

                            {sheet.required && (
                              <span className="absolute top-4 right-4 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                REQUIRED
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>

                  <AnimatePresence>
                    {/* Sensitivity Analysis Form */}
                    {selections['Sensitivity Analysis'] && analysisSheets.find(s => s.sheet_name === 'Sensitivity Analysis')?.is_visible !== false && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                            <BeakerIcon className="w-4 h-4 text-purple-600" />
                            <h4 className="font-bold text-gray-900 text-sm">Sensitivity Parameters</h4>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Selling Price Decrease (%)</label>
                              <input
                                type="number"
                                value={extraData.sensitivity.sellingPriceDecrease}
                                onChange={(e) => handleExtraDataChange('sensitivity', 'sellingPriceDecrease', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                placeholder="e.g. 10"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Direct Expenses Increase (%)</label>
                              <input
                                type="number"
                                value={extraData.sensitivity.directExpensesIncrease}
                                onChange={(e) => handleExtraDataChange('sensitivity', 'directExpensesIncrease', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                placeholder="e.g. 10"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* BEP Analysis Form */}
                    {templateId !== 'TERM_LOAN_SERVICE_WITHOUT_STOCK' &&
                      ((selections['BEP analysis'] && analysisSheets.find(s => s.sheet_name === 'BEP analysis')?.is_visible !== false) ||
                        (selections['BEP'] && analysisSheets.find(s => s.sheet_name === 'BEP')?.is_visible !== false)) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                              <CalculatorIcon className="w-4 h-4 text-purple-600" />
                              <h4 className="font-bold text-gray-900 text-sm">Breakeven Point (BEP) Input</h4>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Product Unit Type</label>
                                <div className="relative">
                                  <select
                                    value={extraData.bep.productManufactured}
                                    onChange={(e) => handleExtraDataChange('bep', 'productManufactured', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none appearance-none transition-all cursor-pointer"
                                  >
                                    <option value="">Select Unit Type</option>
                                    <option value="Nos">Nos</option>
                                    <option value="Kgs">Kgs</option>
                                    <option value="Meters">Meters</option>
                                    <option value="Liters">Liters</option>
                                    <option value="Tons">Tons</option>
                                    <option value="Units">Units</option>
                                  </select>
                                  <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 rotate-90 pointer-events-none" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Selling Price per Unit (₹)</label>
                                <input
                                  type="number"
                                  value={extraData.bep.sellingPricePerUnit}
                                  onChange={(e) => handleExtraDataChange('bep', 'sellingPricePerUnit', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Selling Price Growth (%)</label>
                                <input
                                  type="number"
                                  value={extraData.bep.sellingPriceGrowth}
                                  onChange={(e) => handleExtraDataChange('bep', 'sellingPriceGrowth', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                  placeholder="5%"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Monthly Plant Capacity</label>
                                <input
                                  type="number"
                                  value={extraData.bep.plantCapacity}
                                  onChange={(e) => handleExtraDataChange('bep', 'plantCapacity', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                                  placeholder="Total units/month"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                disabled={loading}
              >
                Continue to Payment
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnalysisSheetsModal;
