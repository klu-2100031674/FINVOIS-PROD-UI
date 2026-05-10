import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRCC4Form from '../components/forms/FRCC4Form';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';
import ClientLayout from '../components/layouts/ClientLayout';

const FRCC4FormPage = () => {
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
        templateId: 'frcc4',
        templateName: 'Format CC4'
      };

      await dispatch(applyFormData({ 
        templateId: 'frcc4', 
        formData: reportPayload 
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit CC4 form:', error);
      throw error;
    }
  };

  return (
    <ClientLayout>
      <div className="py-2 sm:py-4">
        <FRCC4Form onSubmit={handleFormSubmit} />
      </div>
    </ClientLayout>
  );
};

export default FRCC4FormPage;
