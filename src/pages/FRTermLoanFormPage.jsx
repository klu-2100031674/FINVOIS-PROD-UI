import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRTermLoanForm from '../components/forms/FRTermLoanForm';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRTermLoanFormPage = () => {
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
        templateId: 'TERM_LOAN_SERVICE_WITHOUT_STOCK',
        templateName: 'Term Loan (Service sector without stock)'
      };

      await dispatch(applyFormData({
        templateId: 'TERM_LOAN_SERVICE_WITHOUT_STOCK',
        formData: reportPayload
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit Term Loan form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRTermLoanForm onSubmit={handleFormSubmit} />
    </div>
  );
};

export default FRTermLoanFormPage;