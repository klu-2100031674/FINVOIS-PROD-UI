import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks';
import FRCC1Form from '../components/forms/FRCC1Form';
import toast from 'react-hot-toast';
import { selectFormData, applyFormData, setFormData, clearGeneratedExcel } from '../store/slices/reportSlice';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ClientLayout from '../components/layouts/ClientLayout';

const FRCC1FormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const storedFormData = useSelector(selectFormData);
  const isEditMode = searchParams.get('mode') === 'edit';
  const reportId = searchParams.get('reportId');

  useEffect(() => {
    dispatch(clearGeneratedExcel());
  }, [isEditMode, reportId, storedFormData, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFormSubmit = async (formData) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      await dispatch(applyFormData({
        templateId: templateId || 'frcc1',
        formData
      })).unwrap();

      toast.success(isEditMode ? 'Report updated successfully!' : 'Form submitted successfully!');

      setTimeout(() => {
        navigate(`/stage1?templateId=${templateId || 'frcc1'}&reportId=${reportId || 'temp'}`);
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form');
      setIsProcessing(false);
    }
  };

  const handleFormDataChange = (rawFormData) => {
    dispatch(setFormData(rawFormData));
  };

  const handleBackToDashboard = () => {
    if (user?.role === 'agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', sans-serif; }
        body, input, select, textarea, button { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="py-2 sm:py-4">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Financial Report' : 'Create Financial Report'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEditMode
              ? 'Update your financial data and regenerate the report'
              : 'Fill in the financial data to generate your professional Excel report'}
          </p>
        </div>

        <FRCC1Form
          onSubmit={handleFormSubmit}
          testMode={false}
          initialData={isEditMode ? storedFormData : null}
          isEditMode={isEditMode}
          reportId={reportId}
          isProcessing={isProcessing}
          onFormDataChange={handleFormDataChange}
        />
      </div>
    </ClientLayout>
  );
};

export default FRCC1FormPage;
