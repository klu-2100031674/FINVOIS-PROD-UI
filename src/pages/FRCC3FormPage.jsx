import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRCC3Form from '../components/forms/FRCC3Form';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRCC3FormPage = () => {
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
        templateId: 'frcc3',
        templateName: 'Format CC3'
      };

      await dispatch(applyFormData({ 
        templateId: 'frcc3', 
        formData: reportPayload 
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit CC3 form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRCC3Form onSubmit={handleFormSubmit} />
    </div>
  );
};

export default FRCC3FormPage;
