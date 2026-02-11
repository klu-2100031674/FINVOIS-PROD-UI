import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRTermLoanCCForm from '../components/forms/FRTermLoanCCForm';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRTermLoanCCFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing generated Excel data when entering the form
    dispatch(clearGeneratedExcel());
  }, [dispatch]);

  const handleFormSubmit = async (payload) => {
    try {
      const reportPayload = {
        ...payload,
        templateId: 'TERM_LOAN_CC',
        templateName: 'Term Loan + CC Loan'
      };

      await dispatch(applyFormData({
        templateId: 'TERM_LOAN_CC',
        formData: reportPayload
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit Term Loan + CC form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Term Loan + CC Loan</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details below to generate the Term Loan + CC Loan report.
          </p>
        </div>
        <FRTermLoanCCForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
};

export default FRTermLoanCCFormPage;
