import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRCC6Form from '../components/forms/FRCC6Form';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRCC6FormPage = () => {
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
        templateId: 'frcc6',
        templateName: 'Format CC6'
      };

      await dispatch(applyFormData({ 
        templateId: 'frcc6', 
        formData: reportPayload 
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit CC6 form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRCC6Form onSubmit={handleFormSubmit} />
    </div>
  );
};

export default FRCC6FormPage;
