import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FRCC7Form from '../components/forms/FRCC7Form';
import { applyFormData, clearGeneratedExcel } from '../store/slices/reportSlice';

const FRCC7FormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearGeneratedExcel());
  }, [dispatch]);

  const handleFormSubmit = async (payload) => {
    try {
      const reportPayload = {
        ...payload,
        templateId: 'frcc7',
        templateName: 'Format CC7'
      };

      await dispatch(applyFormData({
        templateId: 'frcc7',
        formData: reportPayload
      })).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit CC7 form:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRCC7Form onSubmit={handleFormSubmit} />
    </div>
  );
};

export default FRCC7FormPage;
