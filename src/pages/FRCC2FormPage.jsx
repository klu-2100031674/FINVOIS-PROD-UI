import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks';
import { selectFormData, setFormData, clearGeneratedExcel } from '../store/slices/reportSlice';
import FRCC2Form from '../components/forms/FRCC2Form';
import toast from 'react-hot-toast';

const FRCC2FormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const templateId = searchParams.get('templateId') || 'frcc2';
  const reportId = searchParams.get('reportId') || null;
  const isEditMode = searchParams.get('mode') === 'edit';
  
  // Get stored form data for edit mode
  const storedFormData = useSelector(selectFormData);

  useEffect(() => {
    console.log('🔍 [FRCC2FormPage] Component mounted/updated');
    console.log('🔍 [FRCC2FormPage] isEditMode:', isEditMode);
    console.log('🔍 [FRCC2FormPage] reportId:', reportId);
    console.log('🔍 [FRCC2FormPage] storedFormData:', storedFormData);
    console.log('🔍 [FRCC2FormPage] storedFormData type:', typeof storedFormData);
    console.log('🔍 [FRCC2FormPage] storedFormData keys:', storedFormData ? Object.keys(storedFormData) : 'null');
    
    // Clear any existing generated Excel data when entering the form
    dispatch(clearGeneratedExcel());
  }, [isEditMode, reportId, storedFormData, dispatch]);

  const handleSubmit = (formSubmissionData) => {
    try {
      console.log('📝 [FRCC2FormPage] Submitting form data:', formSubmissionData);
      
      // Store in Redux
      dispatch(setFormData({
        templateId: templateId || 'frcc2',
        ...formSubmissionData
      }));

      // Navigate to next stage with template and report ID
      const nextUrl = `/stage1?templateId=${templateId || 'frcc2'}${reportId ? `&reportId=${reportId}` : ''}`;
      console.log('🚀 [FRCC2FormPage] Navigating to:', nextUrl);
      navigate(nextUrl);
      
      toast.success('Form data saved successfully!');
    } catch (error) {
      console.error('❌ [FRCC2FormPage] Form submission error:', error);
      toast.error('Error submitting form. Please try again.');
    }
  };

  const handleFormDataChange = (rawFormData) => {
    // Save raw form data to Redux for editing functionality
    console.log('💾 [FRCC2FormPage] Saving raw form data to Redux:', rawFormData);
    dispatch(setFormData({ 
      templateId: templateId || 'frcc2',
      formData: rawFormData 
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FRCC2Form 
        onSubmit={handleSubmit}
        templateId={templateId}
        initialData={isEditMode && storedFormData?.formData ? storedFormData.formData : null}
        isEditMode={isEditMode}
        reportId={reportId}
        isProcessing={isProcessing}
        onFormDataChange={handleFormDataChange}
      />
    </div>
  );
};

export default FRCC2FormPage;
