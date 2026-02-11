import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRCC5Form from '../components/forms/FRCC5Form';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRCC5FormPage = () => {
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
        templateId: 'frcc5',
        templateName: 'Format CC5'
      };

      await dispatch(applyFormData({ 
        templateId: 'frcc5', 
        formData: reportPayload 
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit CC5 form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRCC5Form onSubmit={handleFormSubmit} />
    </div>
  );
};

export default FRCC5FormPage;
