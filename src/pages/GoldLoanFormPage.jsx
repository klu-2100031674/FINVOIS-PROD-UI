import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectFormData, setFormData, clearGeneratedExcel } from '../store/slices/reportSlice';
import GoldLoanForm from '../components/forms/GoldLoanForm';
import toast from 'react-hot-toast';
import ClientLayout from '../components/layouts/ClientLayout';

const GoldLoanFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const templateId = searchParams.get('templateId') || 'GOLD_LOAN';
  const reportId = searchParams.get('reportId') || null;
  const isEditMode = searchParams.get('mode') === 'edit';

  const storedFormData = useSelector(selectFormData);

  useEffect(() => {
    dispatch(clearGeneratedExcel());
  }, [isEditMode, reportId, storedFormData, dispatch]);

  const handleSubmit = (formSubmissionData) => {
    try {
      dispatch(setFormData({
        templateId: templateId || 'GOLD_LOAN',
        ...formSubmissionData
      }));

      const nextUrl = `/stage1?templateId=${templateId || 'GOLD_LOAN'}${reportId ? `&reportId=${reportId}` : ''}`;
      navigate(nextUrl);

      toast.success('Form data saved successfully!');
    } catch (error) {
      console.error('❌ [GoldLoanFormPage] Form submission error:', error);
      toast.error('Error submitting form. Please try again.');
    }
  };

  const handleFormDataChange = (rawFormData) => {
    dispatch(setFormData({
      templateId: templateId || 'GOLD_LOAN',
      formData: rawFormData
    }));
  };

  return (
    <ClientLayout>
      <div className="py-2 sm:py-4">
        <GoldLoanForm
          onSubmit={handleSubmit}
          templateId={templateId}
          initialData={isEditMode && storedFormData?.formData ? storedFormData.formData : null}
          isEditMode={isEditMode}
          reportId={reportId}
          isProcessing={isProcessing}
          onFormDataChange={handleFormDataChange}
        />
      </div>
    </ClientLayout>
  );
};

export default GoldLoanFormPage;
