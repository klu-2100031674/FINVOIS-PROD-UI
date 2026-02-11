import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FinalWorkingsEditor from '../components/forms/FinalWorkingsEditor';
import { reportAPI } from '../api/api';

const FinalWorkingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [calculationData, setCalculationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get data from previous step (passed via navigation state)
  useEffect(() => {
    if (location.state?.calculationData) {
      setCalculationData(location.state.calculationData);
      setIsLoading(false);
    } else {
      // If no data passed, redirect back to previous step
      setError('No calculation data found. Please complete the previous steps.');
      setIsLoading(false);
    }
  }, [location.state]);

  const handleDataChange = (changes) => {
    // Handle real-time data changes if needed
    console.log('Data changed:', changes);
  };

  const handleProceed = (finalData) => {
    // Navigate back to Stage1Page to show the updated results
    console.log('Proceeding with final data:', finalData);
    
    navigate(`/stage1?reportId=${calculationData?.reportId || 'temp'}&templateId=${templateId}`, {
      state: { 
        finalData,
        calculationData 
      }
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial projections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Step 3: Review & Edit Final Projections
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review your financial projections and make final adjustments before generating the report.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center">
          <ol className="flex items-center space-x-5">
            <li className="flex items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                  <span className="text-white font-medium text-sm">1</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Form Data</span>
              </div>
            </li>
            <div className="flex-shrink-0 w-5 h-px bg-gray-300"></div>
            <li className="flex items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                  <span className="text-white font-medium text-sm">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Calculations</span>
              </div>
            </li>
            <div className="flex-shrink-0 w-5 h-px bg-gray-300"></div>
            <li className="flex items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                  <span className="text-white font-medium text-sm">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Final Review</span>
              </div>
            </li>
            <div className="flex-shrink-0 w-5 h-px bg-gray-300"></div>
            <li className="flex items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-300 rounded-full">
                  <span className="text-gray-500 font-medium text-sm">4</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Complete</span>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <FinalWorkingsEditor
          templateId={calculationData?.templateId || 'frcc1'}
          initialData={calculationData?.allSheetsData}
          onDataChange={handleDataChange}
          onProceed={handleProceed}
        />
      </div>
    </div>
  );
};

export default FinalWorkingsPage;